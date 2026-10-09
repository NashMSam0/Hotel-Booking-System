using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using HotelBooking.Data.EntityModels;

namespace HotelBooking.Data.DbContexts;

public class HotelDbContext : IdentityDbContext<ApplicationUser>
{
    public HotelDbContext(DbContextOptions<HotelDbContext> options) : base(options) { }

    public DbSet<RoomType> RoomTypes => Set<RoomType>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomBooking> RoomBookings => Set<RoomBooking>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<ActivityBooking> ActivityBookings => Set<ActivityBooking>();
    public DbSet<RestaurantTable> RestaurantTables => Set<RestaurantTable>();
    public DbSet<DiningBooking> DiningBookings => Set<DiningBooking>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<Room>()
            .HasOne(r => r.RoomType).WithMany(t => t.Rooms)
            .HasForeignKey(r => r.RoomTypeId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Room>().HasIndex(r => r.RoomNumber).IsUnique();

        b.Entity<RoomBooking>()
            .HasOne(x => x.Room).WithMany(r => r.Bookings)
            .HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<RoomBooking>()
            .HasOne(x => x.User).WithMany(u => u.RoomBookings)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<RoomBooking>().Property(x => x.TotalPrice).HasPrecision(18, 2);
        b.Entity<RoomBooking>().Property(x => x.AmountPaid).HasPrecision(18, 2);
        b.Entity<RoomBooking>().Property(x => x.Reference).HasMaxLength(16);
        b.Entity<RoomBooking>().HasIndex(x => x.Reference).IsUnique();

        b.Entity<RoomType>().Property(x => x.PricePerNight).HasPrecision(18, 2);

        b.Entity<Activity>().Property(x => x.PricePerPerson).HasPrecision(18, 2);
        b.Entity<ActivityBooking>()
            .HasOne(x => x.Activity).WithMany(a => a.Bookings)
            .HasForeignKey(x => x.ActivityId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<ActivityBooking>()
            .HasOne(x => x.User).WithMany(u => u.ActivityBookings)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<ActivityBooking>().Property(x => x.TotalPrice).HasPrecision(18, 2);
        b.Entity<ActivityBooking>().Property(x => x.AmountPaid).HasPrecision(18, 2);
        b.Entity<ActivityBooking>().Property(x => x.Reference).HasMaxLength(16);
        b.Entity<ActivityBooking>().HasIndex(x => x.Reference).IsUnique();

        b.Entity<RestaurantTable>().HasIndex(t => t.TableNumber).IsUnique();
        b.Entity<DiningBooking>()
            .HasOne(x => x.Table).WithMany(t => t.Bookings)
            .HasForeignKey(x => x.TableId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<DiningBooking>()
            .HasOne(x => x.User).WithMany(u => u.DiningBookings)
            .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<DiningBooking>().Property(x => x.Reference).HasMaxLength(16);
        b.Entity<DiningBooking>().HasIndex(x => x.Reference).IsUnique();

        b.Entity<Payment>().Property(x => x.Amount).HasPrecision(18, 2);
        b.Entity<Payment>().Property(x => x.Reference).HasMaxLength(16);
        b.Entity<Payment>().HasIndex(x => x.Reference).IsUnique();

        // Seed catalog
        b.Entity<RoomType>().HasData(
            new RoomType { Id = 1, Name = "Standard", Description = "Cozy room, queen bed", PricePerNight = 80, MaxGuests = 2, Amenities = "WiFi, TV, AC", ImageUrl = "/images/room-standard.jpg" },
            new RoomType { Id = 2, Name = "Deluxe", Description = "King bed + balcony", PricePerNight = 140, MaxGuests = 3, Amenities = "WiFi, TV, AC, Balcony, Minibar", ImageUrl = "/images/room-deluxe.jpg" },
            new RoomType { Id = 3, Name = "Suite", Description = "Living room + jacuzzi", PricePerNight = 250, MaxGuests = 4, Amenities = "WiFi, TV, Jacuzzi, Lounge", ImageUrl = "/images/room-suite.jpg" }
        );
        b.Entity<Room>().HasData(
            new Room { Id = 1, RoomNumber = "101", Floor = 1, RoomTypeId = 1 },
            new Room { Id = 2, RoomNumber = "102", Floor = 1, RoomTypeId = 1 },
            new Room { Id = 3, RoomNumber = "201", Floor = 2, RoomTypeId = 2 },
            new Room { Id = 4, RoomNumber = "202", Floor = 2, RoomTypeId = 2 },
            new Room { Id = 5, RoomNumber = "301", Floor = 3, RoomTypeId = 3 }
        );
        b.Entity<Activity>().HasData(
            new Activity { Id = 1, Name = "Victoria Falls Guided Walk", Description = "Guided rainforest walk to the main viewpoints", Location = "Falls rainforest gate", PricePerPerson = 35, Capacity = 15, DurationMinutes = 180, ImageUrl = "/images/fallsdeal.jpg" },
            new Activity { Id = 2, Name = "Zambezi Sunset Cruise", Description = "Evening boat cruise with drinks and game viewing", Location = "Zambezi jetty", PricePerPerson = 55, Capacity = 40, DurationMinutes = 150, ImageUrl = "/images/act-cruise.jpg" },
            new Activity { Id = 3, Name = "Hwange Game Drive", Description = "Open-vehicle safari among elephant herds", Location = "Hwange Main Camp", PricePerPerson = 90, Capacity = 6, DurationMinutes = 300, ImageUrl = "/images/safarideal.jpg" },
            new Activity { Id = 4, Name = "Bridge Bungee Jump", Description = "111m jump off the Victoria Falls Bridge", Location = "Falls Bridge", PricePerPerson = 160, Capacity = 4, DurationMinutes = 120, ImageUrl = "/images/act-bungy.jpg" },
            new Activity { Id = 5, Name = "Great Zimbabwe Tour", Description = "Guided tour of the medieval walled city", Location = "Masvingo gate", PricePerPerson = 30, Capacity = 20, DurationMinutes = 240, ImageUrl = "/images/greatzim.jpg" }
        );
        b.Entity<RestaurantTable>().HasData(
            new RestaurantTable { Id = 1, TableNumber = "T1", Seats = 2, Location = "Indoor" },
            new RestaurantTable { Id = 2, TableNumber = "T2", Seats = 2, Location = "Terrace" },
            new RestaurantTable { Id = 3, TableNumber = "T3", Seats = 4, Location = "Indoor" },
            new RestaurantTable { Id = 4, TableNumber = "T4", Seats = 4, Location = "Terrace" },
            new RestaurantTable { Id = 5, TableNumber = "T5", Seats = 6, Location = "Private" },
            new RestaurantTable { Id = 6, TableNumber = "T6", Seats = 8, Location = "Private" }
        );
    }
}
