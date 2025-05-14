using API.Models;

namespace API.Repositories.Interfaces;

public interface IUserRepository
{
    User? GetByUsername(string username);
    void Register(User user);
    void UpdateRefreshToken(User user, string refreshTokenHash, DateTime expiry);
}