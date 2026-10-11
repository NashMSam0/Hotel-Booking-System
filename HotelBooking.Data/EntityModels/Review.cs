namespace HotelBooking.Data.EntityModels;

/// <summary>Guest review. Approved reviews show publicly.</summary>
public class Review
{
    public int Id { get; set; }
    /// <summary>"stay", "room", "activity" or "dining".</summary>
    public string Kind { get; set; } = string.Empty;
    /// <summary>Free-text target, e.g. activity name or room type.</summary>
    public string? Target { get; set; }
    /// <summary>Optional booking reference, validated when supplied.</summary>
    public string? BookingReference { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public bool Approved { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
