using HotelBooking.Data.DbContexts;
using HotelBooking.Data.EntityModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Staff")]
public class ReportsController : ControllerBase
{
    private readonly HotelDbContext _db;
    public ReportsController(HotelDbContext db) => _db = db;

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var now = DateTime.UtcNow;
        var months = Enumerable.Range(0, 6)
            .Select(i => DateTime.SpecifyKind(new DateTime(now.Year, now.Month, 1), DateTimeKind.Utc).AddMonths(-i))
            .Reverse().ToList();

        var roomRevenue = new List<object>();
        var occupancy = new List<object>();
        var activeRooms = await _db.Rooms.CountAsync(r => r.IsActive);
        foreach (var m in months)
        {
            var start = m;
            var end = m.AddMonths(1);
            var bookings = await _db.RoomBookings
                .Where(b => b.Status != BookingStatus.Cancelled && b.CheckIn < end && start < b.CheckOut)
                .ToListAsync();
            var rev = bookings.Where(b => b.CheckIn >= start && b.CheckIn < end).Sum(b => b.TotalPrice);
            var nights = bookings.Sum(b =>
                ((b.CheckOut < end ? b.CheckOut : end) - (b.CheckIn > start ? b.CheckIn : start)).Days);
            var avail = activeRooms * DateTime.DaysInMonth(m.Year, m.Month);
            roomRevenue.Add(new { month = m.ToString("yyyy-MM"), revenue = rev });
            occupancy.Add(new
            {
                month = m.ToString("yyyy-MM"),
                bookedNights = nights,
                availableNights = avail,
                rate = avail == 0 ? 0 : Math.Round(100.0 * nights / avail, 1)
            });
        }

        var actRev = new List<object>();
        foreach (var m in months)
        {
            var start = m;
            var end = m.AddMonths(1);
            var rev = await _db.ActivityBookings
                .Where(b => b.Status != BookingStatus.Cancelled && b.SlotStart >= start && b.SlotStart < end)
                .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;
            actRev.Add(new { month = m.ToString("yyyy-MM"), revenue = rev });
        }

        var topActivities = await _db.ActivityBookings
            .Where(b => b.Status != BookingStatus.Cancelled)
            .GroupBy(b => b.ActivityId)
            .Select(g => new { ActivityId = g.Key, Bookings = g.Count(), Revenue = g.Sum(b => b.TotalPrice) })
            .OrderByDescending(x => x.Bookings).Take(5).ToListAsync();
        var actNames = await _db.Activities.ToDictionaryAsync(a => a.Id, a => a.Name);

        return Ok(new
        {
            roomRevenueByMonth = roomRevenue,
            activityRevenueByMonth = actRev,
            occupancyByMonth = occupancy,
            counts = new
            {
                roomsTotal = await _db.RoomBookings.CountAsync(),
                roomsUpcoming = await _db.RoomBookings.CountAsync(b => b.Status != BookingStatus.Cancelled && b.CheckOut >= now),
                roomsCancelled = await _db.RoomBookings.CountAsync(b => b.Status == BookingStatus.Cancelled),
                activitiesTotal = await _db.ActivityBookings.CountAsync(),
                activitiesUpcoming = await _db.ActivityBookings.CountAsync(b => b.Status != BookingStatus.Cancelled && b.SlotStart >= now),
                diningTotal = await _db.DiningBookings.CountAsync(),
                diningUpcoming = await _db.DiningBookings.CountAsync(b => b.Status != BookingStatus.Cancelled && b.BookingDate >= now.Date),
                paidTotal = await _db.Payments.SumAsync(p => (decimal?)p.Amount) ?? 0
            },
            topActivities = topActivities.Select(t => new
            {
                name = actNames.TryGetValue(t.ActivityId, out var n) ? n : $"#{t.ActivityId}",
                bookings = t.Bookings,
                revenue = t.Revenue
            }),
            recentPayments = await _db.Payments.OrderByDescending(p => p.PaidAt).Take(10).ToListAsync()
        });
    }
}
