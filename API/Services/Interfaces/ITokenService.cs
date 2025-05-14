using API.Models;

namespace API.Services.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    (string Token, DateTime Expiry) GenerateRefreshToken();
}
