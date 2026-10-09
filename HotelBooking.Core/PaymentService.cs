using System.Security.Cryptography;

namespace HotelBooking.Core;

/// <summary>Booking + payment helpers shared by the API.</summary>
public static class PaymentService
{
    /// <summary>20% deposit, rounded to 2 decimals.</summary>
    public static decimal DepositFor(decimal total) => Math.Round(total * 0.20m, 2);

    private const string Alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars

    /// <summary>e.g. KZ-7Q2X9M. Uniqueness is enforced by a unique DB index + retry.</summary>
    public static string NewBookingReference()
    {
        var chars = new char[6];
        for (var i = 0; i < chars.Length; i++)
            chars[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        return "KZ-" + new string(chars);
    }

    public static string NewPaymentReference() => "PAY-" + NewBookingReference()[3..];
}
