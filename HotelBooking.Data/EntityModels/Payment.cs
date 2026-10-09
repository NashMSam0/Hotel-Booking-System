namespace HotelBooking.Data.EntityModels;

/// <summary>A recorded payment against a room, activity or dining booking.</summary>
public class Payment
{
    public int Id { get; set; }
    /// <summary>"room", "activity" or "dining".</summary>
    public string BookingKind { get; set; } = string.Empty;
    public int BookingId { get; set; }
    /// <summary>Payment's own reference (receipt number).</summary>
    public string Reference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Method { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
}
