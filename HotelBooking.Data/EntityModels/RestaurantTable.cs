namespace HotelBooking.Data.EntityModels;

public class RestaurantTable
{
    public int Id { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public int Seats { get; set; }
    public string Location { get; set; } = string.Empty; // Indoor, Terrace, etc.
    public bool IsActive { get; set; } = true;
    public ICollection<DiningBooking> Bookings { get; set; } = new List<DiningBooking>();
}
