namespace HotelBooking.Data.EntityModels;

public class Room
{
    public int Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public int RoomTypeId { get; set; }
    public RoomType RoomType { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public ICollection<RoomBooking> Bookings { get; set; } = new List<RoomBooking>();
}
