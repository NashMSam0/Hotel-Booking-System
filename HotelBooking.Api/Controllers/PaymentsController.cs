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

public record InitiatePaymentRequest(string Kind, int BookingId);
public record ConfirmPaymentRequest(string Kind, int BookingId, string Method, decimal Amount);

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly HotelDbContext _db;
    private readonly IEmailSender _email;
    private readonly ILogger<PaymentsController> _log;
    public PaymentsController(HotelDbContext db, IEmailSender email, ILogger<PaymentsController> log)
    {
        _db = db;
        _email = email;
        _log = log;
    }

    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
    private bool IsStaff => User.IsInRole("Admin") || User.IsInRole("Staff");

    private static string NormKind(string kind) => kind.Trim().ToLowerInvariant();

    /// <summary>How much is due on a priced booking (rooms + activities; dining is free).</summary>
    [HttpPost("initiate")]
    [Authorize]
    public async Task<IActionResult> Initiate([FromBody] InitiatePaymentRequest req)
    {
        var kind = NormKind(req.Kind);
        var (total, paid, email, name, reference) = await LoadPricedAsync(kind, req.BookingId);
        if (total is null) return NotFound("Priced booking not found (dining is free).");
        if (!IsStaff && await OwnerOfAsync(kind, req.BookingId) != CurrentUserId) return Forbid();
        var balance = total.Value - paid;
        return Ok(new
        {
            bookingReference = reference,
            total = total.Value,
            paid,
            balance,
            depositDue = Math.Min(PaymentService.DepositFor(total.Value), balance),
            methods = new[] { "EcoCash", "PayNow", "Card", "Mock" }
        });
    }

    [HttpPost("confirm")]
    [Authorize]
    public async Task<IActionResult> Confirm([FromBody] ConfirmPaymentRequest req)
    {
        var kind = NormKind(req.Kind);
        if (req.Amount <= 0) return BadRequest("Amount must be positive.");
        if (string.IsNullOrWhiteSpace(req.Method)) return BadRequest("Method is required.");

        if (kind == "room")
        {
            var b = await _db.RoomBookings.FindAsync(req.BookingId);
            if (b is null) return NotFound("Booking not found.");
            if (!IsStaff && b.UserId != CurrentUserId) return Forbid();
            if (b.Status == BookingStatus.Cancelled) return BadRequest("Booking is cancelled.");
            var (ok, body) = await ApplyAsync(kind, b.Id, b.Email, b.GuestName, b.Reference, b.TotalPrice,
                () => b.AmountPaid, v => b.AmountPaid = v,
                () => b.PaymentStatus, v => b.PaymentStatus = v, req.Method, req.Amount);
            return ok ? Ok(body) : BadRequest(body);
        }
        if (kind == "activity")
        {
            var b = await _db.ActivityBookings.FindAsync(req.BookingId);
            if (b is null) return NotFound("Booking not found.");
            if (!IsStaff && b.UserId != CurrentUserId) return Forbid();
            if (b.Status == BookingStatus.Cancelled) return BadRequest("Booking is cancelled.");
            var (ok, body) = await ApplyAsync(kind, b.Id, b.Email, b.GuestName, b.Reference, b.TotalPrice,
                () => b.AmountPaid, v => b.AmountPaid = v,
                () => b.PaymentStatus, v => b.PaymentStatus = v, req.Method, req.Amount);
            return ok ? Ok(body) : BadRequest(body);
        }
        return BadRequest("Kind must be 'room' or 'activity' (dining is free).");
    }

    private async Task<(bool Ok, object Body)> ApplyAsync(string kind, int bookingId, string email, string name,
        string bookingRef, decimal total, Func<decimal> getPaid, Action<decimal> setPaid,
        Func<PaymentStatus> getStatus, Action<PaymentStatus> setStatus, string method, decimal amount)
    {
        var balance = total - getPaid();
        if (amount > balance) return (false, new { error = $"Amount exceeds balance of ${balance}." });
        var payRef = await NewPayReferenceAsync();
        _db.Payments.Add(new Payment
        {
            BookingKind = kind, BookingId = bookingId, Reference = payRef,
            Amount = amount, Method = method
        });
        setPaid(getPaid() + amount);
        setStatus(getPaid() >= total ? PaymentStatus.Paid : PaymentStatus.DepositPaid);
        await _db.SaveChangesAsync();
        try { await _email.SendAsync(BookingEmails.PaymentReceipt(email, name, bookingRef, payRef, amount, total - getPaid())); }
        catch (Exception ex) { _log.LogWarning(ex, "Payment receipt email failed"); }
        return (true, new { paymentReference = payRef, paid = getPaid(), balance = total - getPaid(), status = getStatus().ToString() });
    }

    private async Task<string> NewPayReferenceAsync()
    {
        for (var i = 0; i < 5; i++)
        {
            var r = PaymentService.NewPaymentReference();
            if (!await _db.Payments.AnyAsync(p => p.Reference == r)) return r;
        }
        return "PAY-" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
    }

    private async Task<(decimal? Total, decimal Paid, string Email, string Name, string Ref)> LoadPricedAsync(string kind, int id)
    {
        if (kind == "room")
        {
            var b = await _db.RoomBookings.FindAsync(id);
            return b is null ? (null, 0, "", "", "") : (b.TotalPrice, b.AmountPaid, b.Email, b.GuestName, b.Reference);
        }
        if (kind == "activity")
        {
            var b = await _db.ActivityBookings.FindAsync(id);
            return b is null ? (null, 0, "", "", "") : (b.TotalPrice, b.AmountPaid, b.Email, b.GuestName, b.Reference);
        }
        return (null, 0, "", "", "");
    }

    private async Task<string?> OwnerOfAsync(string kind, int id)
    {
        if (kind == "room") return (await _db.RoomBookings.FindAsync(id))?.UserId;
        if (kind == "activity") return (await _db.ActivityBookings.FindAsync(id))?.UserId;
        return null;
    }
}
