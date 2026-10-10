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
public class DiningController : ControllerBase
{
    private readonly HotelDbContext _db;
    private readonly IEmailSender _email;
    private readonly ILogger<DiningController> _log;
    public DiningController(HotelDbContext db, IEmailSender email, ILogger<DiningController> log)
    {
        _db = db;
        _email = email;
        _log = log;
    }
    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

    [HttpGet("tables")]
    public async Task<IActionResult> Tables() =>
        Ok(await _db.RestaurantTables.Where(t => t.IsActive).ToListAsync());

    [HttpPost("tables")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateTable([FromBody] CreateTableRequest req)
    {
        if (await _db.RestaurantTables.AnyAsync(t => t.TableNumber == req.TableNumber))
            return BadRequest("Table number already exists.");
        var t = new RestaurantTable { TableNumber = req.TableNumber, Seats = req.Seats, Location = req.Location };
        _db.RestaurantTables.Add(t);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Tables), new { id = t.Id }, t);
    }

    [HttpDelete("tables/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeactivateTable(int id)
    {
        var t = await _db.RestaurantTables.FindAsync(id);
        if (t is null) return NotFound();
        t.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(t);
    }

    [HttpGet("available")]
    public async Task<IActionResult> Available([FromQuery] DateTime date, [FromQuery] int mealType, [FromQuery] int partySize)
    {
        var day = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var bookedTableIds = await _db.DiningBookings
            .Where(b => b.BookingDate.Date == day && (int)b.MealType == mealType && b.Status != BookingStatus.Cancelled && b.TableId != null)
            .Select(b => b.TableId!.Value).ToListAsync();
        var tables = await _db.RestaurantTables
            .Where(t => t.IsActive && !bookedTableIds.Contains(t.Id) && t.Seats >= partySize)
            .ToListAsync();
        return Ok(tables);
    }

    [HttpGet("bookings/mine")]
    [Authorize]
    public async Task<IActionResult> Mine() =>
        Ok(await _db.DiningBookings.Include(b => b.Table)
            .Where(b => b.UserId == CurrentUserId).OrderByDescending(b => b.CreatedAt).ToListAsync());

    [HttpGet("bookings")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> All() =>
        Ok(await _db.DiningBookings.Include(b => b.Table)
            .OrderByDescending(b => b.CreatedAt).Take(200).ToListAsync());

    [HttpPost("bookings")]
    [Authorize]
    public async Task<IActionResult> Book([FromBody] CreateDiningBookingRequest req)
    {
        if (req.BookingDate.Date < DateTime.UtcNow.Date) return BadRequest("Date cannot be in the past.");
        if (req.PartySize < 1) return BadRequest("Party size must be >= 1.");
        if (req.MealType is not 0 and not 1) return BadRequest("MealType must be 0=Lunch or 1=Dinner.");

        RestaurantTable? table = null;
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        if (req.TableId.HasValue)
        {
            table = await _db.RestaurantTables.FindAsync(req.TableId.Value);
            if (table is null || !table.IsActive) return NotFound("Table not found.");
            if (table.Seats < req.PartySize) return BadRequest($"Table only seats {table.Seats}.");
            var clash = await _db.DiningBookings.AnyAsync(b =>
                b.TableId == req.TableId && b.BookingDate.Date == req.BookingDate.Date &&
                (int)b.MealType == req.MealType && b.Status != BookingStatus.Cancelled);
            if (clash) return Conflict("Table already booked for that meal.");
        }

        var booking = new DiningBooking
        {
            TableId = req.TableId, UserId = CurrentUserId,
            BookingDate = req.BookingDate.Date, MealType = (MealType)req.MealType,
            BookingTime = req.BookingTime ?? BookingCalculator.DefaultTimeForMeal(req.MealType),
            PartySize = req.PartySize, GuestName = req.GuestName, Email = req.Email,
            Phone = req.Phone, SpecialRequests = req.SpecialRequests,
            Status = BookingStatus.Confirmed,
            Reference = await NewDiningReferenceAsync()
        };
        _db.DiningBookings.Add(booking);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        await TryEmailAsync(() => _email.SendAsync(BookingEmails.DiningConfirmation(booking)));
        return CreatedAtAction(nameof(Mine), new { id = booking.Id }, booking);
    }

    private async Task<string> NewDiningReferenceAsync()
    {
        for (var i = 0; i < 5; i++)
        {
            var r = PaymentService.NewBookingReference();
            if (!await _db.DiningBookings.AnyAsync(b => b.Reference == r)) return r;
        }
        return "KZ-" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
    }

    private async Task TryEmailAsync(Func<Task> send)
    {
        try { await send(); }
        catch (Exception ex) { _log.LogWarning(ex, "Confirmation email failed (booking still valid)"); }
    }

    [HttpPost("bookings/{id:int}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(int id)
    {
        var b = await _db.DiningBookings.FindAsync(id);
        if (b is null) return NotFound();
        if (!User.IsInRole("Admin") && !User.IsInRole("Staff") && b.UserId != CurrentUserId) return Forbid();
        b.Status = BookingStatus.Cancelled;
        await _db.SaveChangesAsync();
        await TryEmailAsync(() => _email.SendAsync(
            BookingEmails.Cancellation(b.Email, b.GuestName, b.Reference, $"{b.MealType} on {b.BookingDate:yyyy-MM-dd}")));
        return Ok(b);
    }
}
