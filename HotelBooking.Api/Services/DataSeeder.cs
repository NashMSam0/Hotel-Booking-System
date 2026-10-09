using HotelBooking.Data.EntityModels;
using Microsoft.AspNetCore.Identity;

namespace HotelBooking.Api.Services;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var r in new[] { "Admin", "Staff", "Guest" })
            if (!await roles.RoleExistsAsync(r))
                await roles.CreateAsync(new IdentityRole(r));

        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        const string adminEmail = "admin@hotel.local";
        var admin = await users.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new ApplicationUser { UserName = adminEmail, Email = adminEmail, FullName = "Hotel Admin", EmailConfirmed = true };
            await users.CreateAsync(admin, "Admin123!");
            await users.AddToRoleAsync(admin, "Admin");
        }
    }
}
