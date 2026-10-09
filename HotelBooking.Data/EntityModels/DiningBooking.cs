namespace HotelBooking.Data.EntityModels;

public class DiningBooking
{
    public int Id { get; set; }
    public int? TableId { get; set; }
    public RestaurantTable? Table { get; set; }
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }
    public DateTime BookingDate { get; set; } // date part is what matters
    public MealType MealType { get; set; }
    public TimeSpan BookingTime { get; set; } // e.g. 12:30 or 19:30
    public int PartySize { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? SpecialRequests { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public string Reference { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
