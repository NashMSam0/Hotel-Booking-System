using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelBooking.Api.Controllers;

/// <summary>Public, non-secret site settings the frontend needs at runtime.</summary>
[ApiController]
[Route("api/site")]
public class SiteController : ControllerBase
{
    private readonly IConfiguration _config;
    public SiteController(IConfiguration config) => _config = config;

    [HttpGet("config")]
    [AllowAnonymous]
    public IActionResult Config() => Ok(new
    {
        businessName = "Kudzis Bookings",
        whatsappNumber = _config.GetValue<string>("Whatsapp:BusinessNumber") ?? "",
        whatsappEnabled = _config.GetValue("Whatsapp:Enabled", true),
        supportEmail = _config.GetValue<string>("Email:From") ?? ""
    });
}
