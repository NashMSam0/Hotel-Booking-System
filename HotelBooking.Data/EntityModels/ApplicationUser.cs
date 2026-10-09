using Microsoft.AspNetCore.Identity;

namespace HotelBooking.Data.EntityModels;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public ICollection<RoomBooking> RoomBookings { get; set; } = new List<RoomBooking>();
    public ICollection<ActivityBooking> ActivityBookings { get; set; } = new List<ActivityBooking>();
    public ICollection<DiningBooking> DiningBookings { get; set; } = new List<DiningBooking>();
}
