namespace HotelBooking.Core;

public static class BookingCalculator
{
    public static decimal RoomTotal(decimal pricePerNight, DateTime checkIn, DateTime checkOut)
    {
        var nights = Math.Max(1, (checkOut.Date - checkIn.Date).Days);
        return pricePerNight * nights;
    }

    public static bool Overlaps(DateTime aStart, DateTime aEnd, DateTime bStart, DateTime bEnd)
        => aStart < bEnd && bStart < aEnd;

    public static TimeSpan DefaultTimeForMeal(int mealType) => mealType == 0
        ? new TimeSpan(12, 30, 0)   // Lunch
        : new TimeSpan(19, 30, 0);  // Dinner
}
