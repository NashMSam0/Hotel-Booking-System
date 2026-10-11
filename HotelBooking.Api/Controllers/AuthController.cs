using HotelBooking.Api.DTOs;
using HotelBooking.Api.Services;
using HotelBooking.Data.EntityModels;
using Microsoft.AspNetCore.Authorization;
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

    public record CreateStaffRequest(string Email, string Password, string FullName, string Role);
    public record ChangeRoleRequest(string Role);

    /// <summary>Admins create Staff/Admin accounts (not self-service).</summary>
    [HttpPost("staff")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest req)
    {
        if (req.Role is not ("Staff" or "Admin")) return BadRequest("Role must be Staff or Admin.");
        if (await _users.FindByEmailAsync(req.Email) is not null) return BadRequest("Email already registered.");
        var user = new ApplicationUser
        {
            UserName = req.Email, Email = req.Email,
            FullName = req.FullName, EmailConfirmed = true
        };
        var result = await _users.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));
        await _users.AddToRoleAsync(user, req.Role);
        return CreatedAtAction(nameof(ListUsers), new { id = user.Id },
            new { user.Id, user.Email, user.FullName, Roles = new[] { req.Role } });
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ListUsers()
    {
        var users = _users.Users.ToList();
        var result = new List<object>();
        foreach (var u in users)
            result.Add(new { u.Id, u.Email, u.FullName, Roles = await _users.GetRolesAsync(u) });
        return Ok(result);
    }

    [HttpPost("users/{id}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ChangeRole(string id, [FromBody] ChangeRoleRequest req)
    {
        if (req.Role is not ("Guest" or "Staff" or "Admin")) return BadRequest("Role must be Guest, Staff or Admin.");
        var user = await _users.FindByIdAsync(id);
        if (user is null) return NotFound();
        var current = await _users.GetRolesAsync(user);
        await _users.RemoveFromRolesAsync(user, current);
        await _users.AddToRoleAsync(user, req.Role);
        return Ok(new { user.Id, user.Email, Roles = new[] { req.Role } });
    }
}
