using System.ComponentModel.DataAnnotations;

namespace HotelBooking.Api.DTOs;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required] string FullName,
    string? PhoneNumber);

public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);

public record AuthResponse(string Token, string Email, string FullName, IList<string> Roles, DateTime ExpiresAt);

public record CreateRoomTypeRequest(string Name, string Description, decimal PricePerNight, int MaxGuests, string Amenities);
public record CreateRoomRequest(string RoomNumber, int Floor, int RoomTypeId);
public record RoomDto(int Id, string RoomNumber, int Floor, string RoomType, decimal PricePerNight, int MaxGuests, bool IsActive, string? RoomTypeImage);
public record CreateRoomBookingRequest(
    int RoomId, DateTime CheckIn, DateTime CheckOut, int Guests,
    string GuestName, string Email, string Phone);

public record CreateActivityRequest(string Name, string Description, string Location, decimal PricePerPerson, int Capacity, int DurationMinutes, string? ImageUrl);
public record CreateActivityBookingRequest(int ActivityId, DateTime SlotStart, int Participants, string GuestName, string Email, string Phone);

public record CreateTableRequest(string TableNumber, int Seats, string Location);
public record CreateDiningBookingRequest(
    DateTime BookingDate, int MealType, TimeSpan? BookingTime,
    int PartySize, int? TableId, string GuestName, string Email, string Phone, string? SpecialRequests);

public record AvailabilityQuery(DateTime CheckIn, DateTime CheckOut, int Guests = 1);
