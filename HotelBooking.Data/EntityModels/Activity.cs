namespace HotelBooking.Data.EntityModels;

public class Activity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. Spa, Pool, Safari
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal PricePerPerson { get; set; }
    public int Capacity { get; set; } // max participants per slot
    public int DurationMinutes { get; set; } = 60;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<ActivityBooking> Bookings { get; set; } = new List<ActivityBooking>();
}
