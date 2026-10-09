using HotelBooking.Api.DTOs;
using HotelBooking.Api.Services;
using HotelBooking.Data.EntityModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HotelBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly JwtTokenService _jwt;

    public AuthController(UserManager<ApplicationUser> users, JwtTokenService jwt)
    {
        _users = users;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var existing = await _users.FindByEmailAsync(req.Email);
        if (existing is not null) return BadRequest("Email already registered.");

        var user = new ApplicationUser
        {
            UserName = req.Email, Email = req.Email,
            FullName = req.FullName, PhoneNumber = req.PhoneNumber,
            EmailConfirmed = true
        };
        var result = await _users.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));

        await _users.AddToRoleAsync(user, "Guest");
        var roles = await _users.GetRolesAsync(user);
        var (token, exp) = _jwt.CreateToken(user, roles);
        return Ok(new AuthResponse(token, user.Email!, user.FullName, roles, exp));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _users.FindByEmailAsync(req.Email);
        if (user is null) return Unauthorized("Invalid credentials.");
        if (!await _users.CheckPasswordAsync(user, req.Password))
            return Unauthorized("Invalid credentials.");

        var roles = await _users.GetRolesAsync(user);
        var (token, exp) = _jwt.CreateToken(user, roles);
        return Ok(new AuthResponse(token, user.Email!, user.FullName, roles, exp));
    }
}
