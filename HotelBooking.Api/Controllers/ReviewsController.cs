using HotelBooking.Data.DbContexts;
using HotelBooking.Data.EntityModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Api.Controllers;

public record CreateReviewRequest(
    string Kind, string? Target, string? BookingReference,
    string GuestName, int Rating, string Comment);

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private static readonly string[] Kinds = ["stay", "room", "activity", "dining"];
    private readonly HotelDbContext _db;
    public ReviewsController(HotelDbContext db) => _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List([FromQuery] string? kind, [FromQuery] int take = 50) =>
        Ok(await _db.Reviews
            .Where(r => r.Approved && (kind == null || r.Kind == kind))
            .OrderByDescending(r => r.CreatedAt).Take(Math.Min(take, 100)).ToListAsync());

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateReviewRequest req)
    {
        var kind = req.Kind.Trim().ToLowerInvariant();
        if (!Kinds.Contains(kind)) return BadRequest("Kind must be stay, room, activity or dining.");
        if (string.IsNullOrWhiteSpace(req.GuestName)) return BadRequest("Name is required.");
        if (req.Rating is < 1 or > 5) return BadRequest("Rating must be 1–5.");
        if (string.IsNullOrWhiteSpace(req.Comment)) return BadRequest("Comment is required.");
        if (!string.IsNullOrWhiteSpace(req.BookingReference) && !await BookingExistsAsync(kind, req.BookingReference.Trim()))
            return BadRequest("Booking reference not found.");

        var r = new Review
        {
            Kind = kind, Target = req.Target?.Trim(), BookingReference = req.BookingReference?.Trim(),
            GuestName = req.GuestName.Trim(), Rating = req.Rating, Comment = req.Comment.Trim()
        };
        _db.Reviews.Add(r);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(List), new { id = r.Id }, r);
    }

    [HttpPost("{id:int}/moderate")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Moderate(int id, [FromBody] ModerateRequest req)
    {
        var r = await _db.Reviews.FindAsync(id);
        if (r is null) return NotFound();
        r.Approved = req.Approved;
        await _db.SaveChangesAsync();
        return Ok(r);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await _db.Reviews.FindAsync(id);
        if (r is null) return NotFound();
        _db.Reviews.Remove(r);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> BookingExistsAsync(string kind, string reference) => kind switch
    {
        "room" => await _db.RoomBookings.AnyAsync(b => b.Reference == reference),
        "activity" => await _db.ActivityBookings.AnyAsync(b => b.Reference == reference),
        "dining" => await _db.DiningBookings.AnyAsync(b => b.Reference == reference),
        _ => await _db.RoomBookings.AnyAsync(b => b.Reference == reference)
            || await _db.ActivityBookings.AnyAsync(b => b.Reference == reference)
            || await _db.DiningBookings.AnyAsync(b => b.Reference == reference),
    };
}

public record ModerateRequest(bool Approved);
