namespace HotelBooking.Data.EntityModels;

public enum BookingStatus
{
    Pending = 0,
    Confirmed = 1,
    Cancelled = 2
}

public enum MealType
{
    Lunch = 0,
    Dinner = 1
}

public enum PaymentStatus
{
    Unpaid = 0,
    DepositPaid = 1,
    Paid = 2,
    Refunded = 3
}
