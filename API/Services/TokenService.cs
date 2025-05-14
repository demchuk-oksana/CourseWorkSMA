using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using API.Models;
using API.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;

namespace API.Services;

public class TokenService : ITokenService
{
    private readonly RSA _privateKey;
    private readonly IConfiguration _config;

    public TokenService(RSA privateKey, IConfiguration config)
    {
        _privateKey = privateKey;
        _config = config;
    }

    public string GenerateAccessToken(User user)
    {
        var handler = new JwtSecurityTokenHandler();

        var key = new RsaSecurityKey(_privateKey);
        var creds = new SigningCredentials(key, SecurityAlgorithms.RsaSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: "ArtifactRepo",
            audience: "ArtifactRepoClient",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return handler.WriteToken(token);
    }

    public (string Token, DateTime Expiry) GenerateRefreshToken()
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToBase64String(tokenBytes);
        return (token, DateTime.UtcNow.AddDays(7));
    }
}
