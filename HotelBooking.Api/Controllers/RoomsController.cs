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
public class RoomsController : ControllerBase
{
    private readonly HotelDbContext _db;
    public RoomsController(HotelDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Rooms.Include(r => r.RoomType)
            .Where(r => r.IsActive)
            .Select(r => new RoomDto(r.Id, r.RoomNumber, r.Floor, r.RoomType.Name, r.RoomType.PricePerNight, r.RoomType.MaxGuests, r.IsActive, r.RoomType.ImageUrl))
            .ToListAsync());

    [HttpGet("room-types")]
    public async Task<IActionResult> GetTypes() => Ok(await _db.RoomTypes.ToListAsync());

    [HttpGet("available")]
    public async Task<IActionResult> Available([FromQuery] DateTime checkIn, [FromQuery] DateTime checkOut, [FromQuery] int guests = 1)
    {
        if (checkIn.Date >= checkOut.Date) return BadRequest("CheckOut must be after CheckIn.");
        var bookedRoomIds = await _db.RoomBookings
            .Where(b => b.Status != BookingStatus.Cancelled && b.CheckIn < checkOut && checkIn < b.CheckOut)
            .Select(b => b.RoomId).ToListAsync();
        var rooms = await _db.Rooms.Include(r => r.RoomType)
            .Where(r => r.IsActive && !bookedRoomIds.Contains(r.Id) && r.RoomType.MaxGuests >= guests)
            .Select(r => new RoomDto(r.Id, r.RoomNumber, r.Floor, r.RoomType.Name, r.RoomType.PricePerNight, r.RoomType.MaxGuests, r.IsActive, r.RoomType.ImageUrl))
            .ToListAsync();
        return Ok(rooms);
    }

    /// <summary>Month view: per-day free rooms (respecting guest count) + lowest price.</summary>
    [HttpGet("calendar")]
    public async Task<IActionResult> Calendar([FromQuery] int year, [FromQuery] int month, [FromQuery] int guests = 1)
    {
        if (month is < 1 or > 12) return BadRequest("Invalid month.");
        var start = new DateTime(year, month, 1);
        var end = start.AddMonths(1);
        var rooms = await _db.Rooms.Include(r => r.RoomType)
            .Where(r => r.IsActive && r.RoomType.MaxGuests >= guests).ToListAsync();
        var bookings = await _db.RoomBookings
            .Where(b => b.Status != BookingStatus.Cancelled && b.CheckIn < end && start < b.CheckOut)
            .Select(b => new { b.RoomId, b.CheckIn, b.CheckOut }).ToListAsync();
        var days = new List<object>();
        for (var d = start; d < end; d = d.AddDays(1))
        {
            var next = d.AddDays(1);
            var busy = bookings.Where(b => b.CheckIn < next && d < b.CheckOut).Select(b => b.RoomId).ToHashSet();
            var free = rooms.Where(r => !busy.Contains(r.Id)).ToList();
            days.Add(new
            {
                date = d.ToString("yyyy-MM-dd"),
                free = free.Count,
                total = rooms.Count,
                fromPrice = free.Count == 0 ? (decimal?)null : free.Min(r => r.RoomType.PricePerNight)
            });
        }
        return Ok(days);
    }

    [HttpPost("room-types")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateType([FromBody] CreateRoomTypeRequest req)
    {
        var t = new RoomType { Name = req.Name, Description = req.Description, PricePerNight = req.PricePerNight, MaxGuests = req.MaxGuests, Amenities = req.Amenities };
        _db.RoomTypes.Add(t);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTypes), new { id = t.Id }, t);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateRoomRequest req)
    {
        if (await _db.Rooms.AnyAsync(r => r.RoomNumber == req.RoomNumber))
            return BadRequest("Room number already exists.");
        var room = new Room { RoomNumber = req.RoomNumber, Floor = req.Floor, RoomTypeId = req.RoomTypeId };
        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = room.Id }, room);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var room = await _db.Rooms.FindAsync(id);
        if (room is null) return NotFound();
        room.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(room);
    }
}

[ApiController]
[Route("api/room-bookings")]
public class RoomBookingsController : ControllerBase
{
    private readonly HotelDbContext _db;
    private readonly IEmailSender _email;
    private readonly ILogger<RoomBookingsController> _log;
    public RoomBookingsController(HotelDbContext db, IEmailSender email, ILogger<RoomBookingsController> log)
    {
        _db = db;
        _email = email;
        _log = log;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> Mine() =>
        Ok(await _db.RoomBookings.Include(b => b.Room).ThenInclude(r => r.RoomType)
            .Where(b => b.UserId == CurrentUserId)
            .OrderByDescending(b => b.CreatedAt).ToListAsync());

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> All() =>
        Ok(await _db.RoomBookings.Include(b => b.Room).ThenInclude(r => r.RoomType)
            .OrderByDescending(b => b.CreatedAt).Take(200).ToListAsync());

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Book([FromBody] CreateRoomBookingRequest req)
    {
        if (req.CheckIn.Date >= req.CheckOut.Date) return BadRequest("CheckOut must be after CheckIn.");
        if (req.CheckIn.Date < DateTime.UtcNow.Date) return BadRequest("CheckIn cannot be in the past.");

        var room = await _db.Rooms.Include(r => r.RoomType).FirstOrDefaultAsync(r => r.Id == req.RoomId && r.IsActive);
        if (room is null) return NotFound("Room not found.");
        if (req.Guests > room.RoomType.MaxGuests) return BadRequest($"Room max guests is {room.RoomType.MaxGuests}.");

        // Serializable transaction: the overlap re-check + insert are atomic,
        // so two simultaneous requests for the last room cannot both succeed.
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var clash = await _db.RoomBookings.AnyAsync(b =>
            b.RoomId == req.RoomId && b.Status != BookingStatus.Cancelled &&
            b.CheckIn < req.CheckOut && req.CheckIn < b.CheckOut);
        if (clash) return Conflict("Room already booked for those dates.");

        var booking = new RoomBooking
        {
            RoomId = req.RoomId, UserId = CurrentUserId,
            GuestName = req.GuestName, Email = req.Email, Phone = req.Phone,
            CheckIn = req.CheckIn, CheckOut = req.CheckOut, Guests = req.Guests,
            TotalPrice = BookingCalculator.RoomTotal(room.RoomType.PricePerNight, req.CheckIn, req.CheckOut),
            Status = BookingStatus.Confirmed,
            Reference = await NewRoomReferenceAsync()
        };
        _db.RoomBookings.Add(booking);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        await TryEmailAsync(() => _email.SendAsync(BookingEmails.RoomConfirmation(booking, room.RoomNumber)));
        return CreatedAtAction(nameof(Mine), new { id = booking.Id }, booking);
    }

    private async Task<string> NewRoomReferenceAsync()
    {
        for (var i = 0; i < 5; i++)
        {
            var r = PaymentService.NewBookingReference();
            if (!await _db.RoomBookings.AnyAsync(b => b.Reference == r)) return r;
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
        var b = await _db.RoomBookings.FindAsync(id);
        if (b is null) return NotFound();
        if (!User.IsInRole("Admin") && !User.IsInRole("Staff") && b.UserId != CurrentUserId)
            return Forbid();
        b.Status = BookingStatus.Cancelled;
        await _db.SaveChangesAsync();
        await TryEmailAsync(() => _email.SendAsync(
            BookingEmails.Cancellation(b.Email, b.GuestName, b.Reference, $"room {b.CheckIn:yyyy-MM-dd} → {b.CheckOut:yyyy-MM-dd}")));
        return Ok(b);
    }
}
