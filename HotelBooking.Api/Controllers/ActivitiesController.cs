using System.Data;
using System.Security.Claims;
using HotelBooking.Api.DTOs;
using HotelBooking.Api.Services;
using HotelBooking.Core;
using HotelBooking.Data.DbContexts;
using HotelBooking.Data.EntityModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly HotelDbContext _db;
    public ActivitiesController(HotelDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Activities.Where(a => a.IsActive).ToListAsync());

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateActivityRequest req)
    {
        var a = new Activity
        {
            Name = req.Name, Description = req.Description, Location = req.Location,
            PricePerPerson = req.PricePerPerson, Capacity = req.Capacity,
            DurationMinutes = req.DurationMinutes, ImageUrl = req.ImageUrl
        };
        _db.Activities.Add(a);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = a.Id }, a);
    }

    [HttpGet("{id:int}/availability")]
    public async Task<IActionResult> Availability(int id, [FromQuery] DateTime slot)
    {
        var activity = await _db.Activities.FindAsync(id);
        if (activity is null) return NotFound();
        var booked = await _db.ActivityBookings
            .Where(b => b.ActivityId == id && b.SlotStart == slot && b.Status != BookingStatus.Cancelled)
            .SumAsync(b => (int?)b.Participants) ?? 0;
        return Ok(new { activityId = id, slot, capacity = activity.Capacity, booked, remaining = activity.Capacity - booked });
    }

    /// <summary>Day view: standard slots (09:00, 12:00, 15:00) merged with any custom booked slots.</summary>
    [HttpGet("{id:int}/slots")]
    public async Task<IActionResult> DaySlots(int id, [FromQuery] DateTime date)
    {
        var activity = await _db.Activities.FindAsync(id);
        if (activity is null) return NotFound();
        var day = date.Date;
        var booked = await _db.ActivityBookings
            .Where(b => b.ActivityId == id && b.SlotStart >= day && b.SlotStart < day.AddDays(1) && b.Status != BookingStatus.Cancelled)
            .GroupBy(b => b.SlotStart)
            .Select(g => new { Slot = g.Key, Booked = g.Sum(b => b.Participants) })
            .ToListAsync();
        var bySlot = booked.ToDictionary(x => x.Slot, x => x.Booked);
        var standards = new[] { new TimeSpan(9, 0, 0), new TimeSpan(12, 0, 0), new TimeSpan(15, 0, 0) };
        var slots = standards.Select(t => day + t)
            .Concat(bySlot.Keys)
            .Distinct().OrderBy(s => s)
            .Select(s => new
            {
                slot = s,
                capacity = activity.Capacity,
                booked = bySlot.TryGetValue(s, out var n) ? n : 0,
                remaining = activity.Capacity - (bySlot.TryGetValue(s, out var m) ? m : 0)
            });
        return Ok(slots);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var a = await _db.Activities.FindAsync(id);
        if (a is null) return NotFound();
        a.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(a);
    }
}

[ApiController]
[Route("api/activity-bookings")]
public class ActivityBookingsController : ControllerBase
{
    private readonly HotelDbContext _db;
    private readonly IEmailSender _email;
    private readonly ILogger<ActivityBookingsController> _log;
    public ActivityBookingsController(HotelDbContext db, IEmailSender email, ILogger<ActivityBookingsController> log)
    {
        _db = db;
        _email = email;
        _log = log;
    }
    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> Mine() =>
        Ok(await _db.ActivityBookings.Include(b => b.Activity)
            .Where(b => b.UserId == CurrentUserId).OrderByDescending(b => b.CreatedAt).ToListAsync());

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> All() =>
        Ok(await _db.ActivityBookings.Include(b => b.Activity)
            .OrderByDescending(b => b.CreatedAt).Take(200).ToListAsync());

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Book([FromBody] CreateActivityBookingRequest req)
    {
        if (req.Participants < 1) return BadRequest("Participants must be >= 1.");
        if (req.SlotStart < DateTime.UtcNow) return BadRequest("Slot cannot be in the past.");
        var activity = await _db.Activities.FindAsync(req.ActivityId);
        if (activity is null || !activity.IsActive) return NotFound("Activity not found.");

        // Serializable transaction: capacity re-check + insert are atomic.
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var booked = await _db.ActivityBookings
            .Where(b => b.ActivityId == req.ActivityId && b.SlotStart == req.SlotStart && b.Status != BookingStatus.Cancelled)
            .SumAsync(b => (int?)b.Participants) ?? 0;
        if (booked + req.Participants > activity.Capacity)
            return Conflict($"Only {activity.Capacity - booked} spots left for this slot.");

        var booking = new ActivityBooking
        {
            ActivityId = req.ActivityId, UserId = CurrentUserId, SlotStart = req.SlotStart,
            Participants = req.Participants, GuestName = req.GuestName, Email = req.Email, Phone = req.Phone,
            TotalPrice = activity.PricePerPerson * req.Participants, Status = BookingStatus.Confirmed,
            Reference = await NewActivityReferenceAsync()
        };
        _db.ActivityBookings.Add(booking);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        await TryEmailAsync(() => _email.SendAsync(BookingEmails.ActivityConfirmation(booking, activity.Name)));
        return CreatedAtAction(nameof(Mine), new { id = booking.Id }, booking);
    }

    private async Task<string> NewActivityReferenceAsync()
    {
        for (var i = 0; i < 5; i++)
        {
            var r = PaymentService.NewBookingReference();
            if (!await _db.ActivityBookings.AnyAsync(b => b.Reference == r)) return r;
        }
        return "KZ-" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
    }

    private async Task TryEmailAsync(Func<Task> send)
    {
        try { await send(); }
        catch (Exception ex) { _log.LogWarning(ex, "Confirmation email failed (booking still valid)"); }
    }

    [HttpPost("{id:int}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(int id)
    {
        var b = await _db.ActivityBookings.FindAsync(id);
        if (b is null) return NotFound();
        if (!User.IsInRole("Admin") && !User.IsInRole("Staff") && b.UserId != CurrentUserId) return Forbid();
        b.Status = BookingStatus.Cancelled;
        await _db.SaveChangesAsync();
        await TryEmailAsync(() => _email.SendAsync(
            BookingEmails.Cancellation(b.Email, b.GuestName, b.Reference, $"activity slot {b.SlotStart:yyyy-MM-dd HH:mm}")));
        return Ok(b);
    }
}
