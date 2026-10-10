namespace HotelBooking.Data.EntityModels;

/// <summary>Booking request sent by a guest without an account (public form).</summary>
public class BookingRequest
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    /// <summary>"room", "activity" or "dining".</summary>
    public string Kind { get; set; } = string.Empty;
    /// <summary>Free-text preference: dates, activity/table choice, party size, extras.</summary>
    public string Preferences { get; set; } = string.Empty;
    /// <summary>"New", "Handled".</summary>
    public string Status { get; set; } = "New";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
