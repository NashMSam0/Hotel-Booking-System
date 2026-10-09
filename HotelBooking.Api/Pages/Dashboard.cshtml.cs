using HotelBooking.Data.DbContexts;
using HotelBooking.Data.EntityModels;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Api.Pages;

public class DashboardModel : PageModel
{
    private readonly HotelDbContext _db;
    public DashboardModel(HotelDbContext db) => _db = db;

    public int RoomCount { get; private set; }
    public int ActivityCount { get; private set; }
    public int TableCount { get; private set; }
    public int UpcomingRoomNights { get; private set; }
    public List<RoomBooking> RecentRooms { get; private set; } = new();
    public List<ActivityBooking> RecentActivities { get; private set; } = new();
    public List<DiningBooking> RecentDining { get; private set; } = new();
    public List<MonthRevenue> RevenueByMonth { get; private set; } = new();
    public double CurrentOccupancyRate { get; private set; }
    public List<TopActivity> TopActivities { get; private set; } = new();
    public List<Payment> RecentPayments { get; private set; } = new();

    public record MonthRevenue(string Month, decimal Amount);
    public record TopActivity(string Name, int Bookings, decimal Revenue);

    public async Task OnGetAsync()
    {
        RoomCount = await _db.Rooms.CountAsync(r => r.IsActive);
        ActivityCount = await _db.Activities.CountAsync(a => a.IsActive);
        TableCount = await _db.RestaurantTables.CountAsync(t => t.IsActive);
        UpcomingRoomNights = await _db.RoomBookings.CountAsync(b =>
            b.Status != BookingStatus.Cancelled && b.CheckOut >= DateTime.UtcNow);

        RecentRooms = await _db.RoomBookings.Include(b => b.Room)
            .OrderByDescending(b => b.CreatedAt).Take(10).ToListAsync();
        RecentActivities = await _db.ActivityBookings.Include(b => b.Activity)
            .OrderByDescending(b => b.CreatedAt).Take(10).ToListAsync();
        RecentDining = await _db.DiningBookings.Include(b => b.Table)
            .OrderByDescending(b => b.CreatedAt).Take(10).ToListAsync();

        // Reports: last 6 months revenue (rooms by check-in month + activities by slot month)
        var now = DateTime.UtcNow;
        for (var i = 5; i >= 0; i--)
        {
            var start = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
            var end = start.AddMonths(1);
            var rooms = await _db.RoomBookings
                .Where(b => b.Status != BookingStatus.Cancelled && b.CheckIn >= start && b.CheckIn < end)
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;
            var acts = await _db.ActivityBookings
                .Where(b => b.Status != BookingStatus.Cancelled && b.SlotStart >= start && b.SlotStart < end)
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;
            RevenueByMonth.Add(new MonthRevenue(start.ToString("yyyy-MM"), rooms + acts));
        }

        // Occupancy: booked room-nights this month / available room-nights
        var mStart = new DateTime(now.Year, now.Month, 1);
        var mEnd = mStart.AddMonths(1);
        var monthBookings = await _db.RoomBookings
            .Where(b => b.Status != BookingStatus.Cancelled && b.CheckIn < mEnd && mStart < b.CheckOut)
            .ToListAsync();
        var bookedNights = monthBookings.Sum(b =>
            ((b.CheckOut < mEnd ? b.CheckOut : mEnd) - (b.CheckIn > mStart ? b.CheckIn : mStart)).Days);
        var availNights = RoomCount * DateTime.DaysInMonth(now.Year, now.Month);
        CurrentOccupancyRate = availNights == 0 ? 0 : Math.Round(100.0 * bookedNights / availNights, 1);

        var tops = await _db.ActivityBookings
            .Where(b => b.Status != BookingStatus.Cancelled)
            .GroupBy(b => b.ActivityId)
            .Select(g => new { ActivityId = g.Key, Bookings = g.Count(), Revenue = g.Sum(b => b.TotalPrice) })
            .OrderByDescending(x => x.Bookings).Take(5).ToListAsync();
        var names = await _db.Activities.ToDictionaryAsync(a => a.Id, a => a.Name);
        TopActivities = tops.Select(t => new TopActivity(
            names.TryGetValue(t.ActivityId, out var n) ? n : $"#{t.ActivityId}", t.Bookings, t.Revenue)).ToList();

        RecentPayments = await _db.Payments.OrderByDescending(p => p.PaidAt).Take(10).ToListAsync();
    }
}
