using System.Net;
using System.Net.Mail;
using HotelBooking.Core;
using HotelBooking.Data.EntityModels;
using Microsoft.Extensions.Options;

namespace HotelBooking.Api.Services;

public record EmailMessage(string To, string Subject, string Body);

public interface IEmailSender
{
    Task SendAsync(EmailMessage msg, CancellationToken ct = default);
}

public class EmailOptions
{
    public string From { get; set; } = "bookings@kudzisbookings.co.zw";
    /// <summary>"File" (dev: writes .eml files) or "Smtp".</summary>
    public string Method { get; set; } = "File";
    public string FilePath { get; set; } = "App_Data/emails";
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = "";
    public string SmtpPass { get; set; } = "";
    public bool EnableSsl { get; set; } = true;
}

/// <summary>Dev fallback: writes emails as .eml files so confirmations are verifiable without SMTP credentials.</summary>
public class FileEmailSender : IEmailSender
{
    private readonly EmailOptions _opt;
    private readonly ILogger<FileEmailSender> _log;
    public FileEmailSender(IOptions<EmailOptions> opt, ILogger<FileEmailSender> log)
    {
        _opt = opt.Value;
        _log = log;
    }

    public async Task SendAsync(EmailMessage msg, CancellationToken ct = default)
    {
        Directory.CreateDirectory(_opt.FilePath);
        var file = Path.Combine(_opt.FilePath,
            $"{DateTime.UtcNow:yyyyMMdd-HHmmss-fff}_{msg.To.Replace('@', '_').Replace('.', '_')}.eml");
        await File.WriteAllTextAsync(file,
            $"From: {_opt.From}\nTo: {msg.To}\nSubject: {msg.Subject}\nDate: {DateTime.UtcNow:R}\n\n{msg.Body}", ct);
        _log.LogInformation("Email to {To} written to {File}", msg.To, file);
    }
}

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _opt;
    public SmtpEmailSender(IOptions<EmailOptions> opt) => _opt = opt.Value;

    public async Task SendAsync(EmailMessage msg, CancellationToken ct = default)
    {
        using var client = new SmtpClient(_opt.SmtpHost, _opt.SmtpPort)
        {
            Credentials = new NetworkCredential(_opt.SmtpUser, _opt.SmtpPass),
            EnableSsl = _opt.EnableSsl
        };
        await client.SendMailAsync(new MailMessage(_opt.From, msg.To, msg.Subject, msg.Body));
    }
}

public static class BookingEmails
{
    public static EmailMessage RoomConfirmation(RoomBooking b, string roomNo) => new(b.Email,
        $"Booking confirmed {b.Reference} — Kudzis Bookings",
        $"Dear {b.GuestName},\n\nYour room booking is confirmed.\nReference: {b.Reference}\nRoom: {roomNo}\nCheck-in: {b.CheckIn:yyyy-MM-dd}\nCheck-out: {b.CheckOut:yyyy-MM-dd}\nGuests: {b.Guests}\nTotal: ${b.TotalPrice}\nDeposit due (20%): ${PaymentService.DepositFor(b.TotalPrice)}\n\nPay via EcoCash, PayNow or card from My Bookings. See you soon!\n— Kudzis Bookings");

    public static EmailMessage ActivityConfirmation(ActivityBooking b, string name) => new(b.Email,
        $"Booking confirmed {b.Reference} — Kudzis Bookings",
        $"Dear {b.GuestName},\n\nYour activity booking is confirmed.\nReference: {b.Reference}\nActivity: {name}\nSlot: {b.SlotStart:yyyy-MM-dd HH:mm}\nParticipants: {b.Participants}\nTotal: ${b.TotalPrice}\nDeposit due (20%): ${PaymentService.DepositFor(b.TotalPrice)}\n\n— Kudzis Bookings");

    public static EmailMessage DiningConfirmation(DiningBooking b) => new(b.Email,
        $"Table booked {b.Reference} — Kudzis Bookings",
        $"Dear {b.GuestName},\n\nYour table is booked.\nReference: {b.Reference}\nDate: {b.BookingDate:yyyy-MM-dd}\nMeal: {b.MealType} at {b.BookingTime}\nParty: {b.PartySize}\n\n— Kudzis Bookings");

    public static EmailMessage Cancellation(string to, string name, string reference, string what) => new(to,
        $"Booking cancelled {reference} — Kudzis Bookings",
        $"Dear {name},\n\nYour booking {reference} ({what}) has been cancelled.\nIf you already paid a deposit it will be refunded.\n\n— Kudzis Bookings");

    public static EmailMessage PaymentReceipt(string to, string name, string bookingRef, string payRef, decimal amount, decimal balance) => new(to,
        $"Payment received {payRef} — Kudzis Bookings",
        $"Dear {name},\n\nWe received ${amount} ({payRef}) against booking {bookingRef}.\nRemaining balance: ${balance}\n\n— Kudzis Bookings");
}
