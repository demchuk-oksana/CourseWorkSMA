using API.DatabaseContexts;
using API.Models;
using API.Repositories.Interfaces;

namespace API.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ArtifactsDbContext _context;
    public UserRepository(ArtifactsDbContext context) => _context = context;

    public User? GetByUsername(string username) =>
        _context.Set<User>().FirstOrDefault(u => u.Username == username);

    public void Register(User user)
    {
        _context.Set<User>().Add(user);
        _context.SaveChanges();
    }

    public void UpdateRefreshToken(User user, string refreshTokenHash, DateTime expiry)
    {
        user.RefreshTokenHash = refreshTokenHash;
        user.RefreshTokenExpiry = expiry;
        _context.SaveChanges();
    }
}