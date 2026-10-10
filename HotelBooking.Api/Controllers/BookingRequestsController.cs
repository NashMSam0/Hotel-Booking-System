using HotelBooking.Api.Services;
using HotelBooking.Data.DbContexts;
using HotelBooking.Data.EntityModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Api.Controllers;

public record CreateBookingRequestRequest(
    string Name, string Email, string Phone, string Kind, string Preferences);

[ApiController]
[Route("api/booking-requests")]
public class BookingRequestsController : ControllerBase
{
    private readonly HotelDbContext _db;
    private readonly IEmailSender _email;
    private readonly ILogger<BookingRequestsController> _log;
    private readonly IConfiguration _config;
    public BookingRequestsController(HotelDbContext db, IEmailSender email,
        ILogger<BookingRequestsController> log, IConfiguration config)
    {
        _db = db;
        _email = email;
        _log = log;
        _config = config;
    }

    /// <summary>Public: guests without an account ask staff to arrange a booking.</summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequestRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Name is required.");
        if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@')) return BadRequest("Valid email is required.");
        var kind = req.Kind.Trim().ToLowerInvariant();
        if (kind is not ("room" or "activity" or "dining")) return BadRequest("Kind must be room, activity or dining.");
        if (string.IsNullOrWhiteSpace(req.Preferences)) return BadRequest("Tell us your preferences (dates, party size, extras).");

        var r = new BookingRequest
        {
            Name = req.Name.Trim(), Email = req.Email.Trim(), Phone = req.Phone.Trim(),
            Kind = kind, Preferences = req.Preferences.Trim()
        };
        _db.BookingRequests.Add(r);
        await _db.SaveChangesAsync();

        // Notify the internal inbox (best effort — the request is stored regardless).
        try
        {
            var inbox = _config.GetValue<string>("Email:Inbox") ?? "bookings@kudzisbookings.co.zw";
            await _email.SendAsync(new EmailMessage(inbox,
                $"New {kind} booking request from {r.Name}",
                $"Name: {r.Name}\nEmail: {r.Email}\nPhone: {r.Phone}\nKind: {r.Kind}\nPreferences:\n{r.Preferences}\n\nReceived (UTC): {r.CreatedAt:yyyy-MM-dd HH:mm}"));
            await _email.SendAsync(new EmailMessage(r.Email,
                "We received your booking request — Kudzis Bookings",
                $"Dear {r.Name},\n\nThanks! Our team will arrange your {kind} booking and reply shortly.\nYour preferences:\n{r.Preferences}\n\n— Kudzis Bookings"));
        }
        catch (Exception ex) { _log.LogWarning(ex, "Booking-request emails failed"); }

        return CreatedAtAction(nameof(GetById), new { id = r.Id }, new { r.Id, message = "Request received. Our team will contact you shortly." });
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _db.BookingRequests.FindAsync(id);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> All([FromQuery] string? status) =>
        Ok(await _db.BookingRequests
            .Where(r => status == null || r.Status == status)
            .OrderByDescending(r => r.CreatedAt).Take(200).ToListAsync());

    [HttpPost("{id:int}/handle")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> MarkHandled(int id)
    {
        var r = await _db.BookingRequests.FindAsync(id);
        if (r is null) return NotFound();
        r.Status = "Handled";
        await _db.SaveChangesAsync();
        return Ok(r);
    }
}
