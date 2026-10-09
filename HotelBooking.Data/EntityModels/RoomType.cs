namespace HotelBooking.Data.EntityModels;

public class RoomType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. Deluxe, Suite
    public string Description { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public int MaxGuests { get; set; }
    public string Amenities { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
