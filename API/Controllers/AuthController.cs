using API.Auth;
using API.DTOs;
using API.Models;
using API.Repositories.Interfaces;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly ITokenService _tokenService;

    public AuthController(IUserRepository userRepo, ITokenService tokenService)
    {
        _userRepo = userRepo;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterDto dto)
    {
        if (_userRepo.GetByUsername(dto.Username) != null)
            return BadRequest("Username already exists.");

        var salt = PasswordHasher.GenerateSalt();
        var hash = PasswordHasher.HashPassword(dto.Password, salt);

        var user = new User
        {
            Username = dto.Username,
            Salt = salt,
            PasswordHash = hash,
            RefreshTokenHash = ""
        };

        _userRepo.Register(user);
        return Ok("Registered.");
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto dto)
    {
        var user = _userRepo.GetByUsername(dto.Username);
        if (user == null || !PasswordHasher.Verify(dto.Password, user.Salt, user.PasswordHash))
            return Unauthorized();

        var accessToken = _tokenService.GenerateAccessToken(user);
        var (refreshToken, expiry) = _tokenService.GenerateRefreshToken();
        var refreshTokenHash = PasswordHasher.HashPassword(refreshToken, user.Salt);

        _userRepo.UpdateRefreshToken(user, refreshTokenHash, expiry);

        return Ok(new { accessToken, refreshToken });
    }

    [HttpPost("refresh")]
    public IActionResult Refresh([FromBody] RefreshDto dto)
    {
        var user = _userRepo.GetByUsername(dto.Username);
        if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            return Unauthorized();

        var refreshHash = PasswordHasher.HashPassword(dto.RefreshToken, user.Salt);
        if (refreshHash != user.RefreshTokenHash)
            return Unauthorized();

        var accessToken = _tokenService.GenerateAccessToken(user);
        var (newRefreshToken, expiry) = _tokenService.GenerateRefreshToken();
        var newRefreshHash = PasswordHasher.HashPassword(newRefreshToken, user.Salt);

        _userRepo.UpdateRefreshToken(user, newRefreshHash, expiry);

        return Ok(new { accessToken, refreshToken = newRefreshToken });
    }
}
