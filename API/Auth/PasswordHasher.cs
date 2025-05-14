using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace API.Auth;

public static class PasswordHasher
{
    public static string GenerateSalt() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));

    public static string HashPassword(string password, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        return Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: password,
            salt: saltBytes,
            prf: KeyDerivationPrf.HMACSHA512,
            iterationCount: 10000,
            numBytesRequested: 32));
    }

    public static bool Verify(string password, string salt, string hash) =>
        HashPassword(password, salt) == hash;
}
