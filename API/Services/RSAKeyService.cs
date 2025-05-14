using System.Security.Cryptography;

namespace API.Services;

public class RSAKeyService
{
    public RSA LoadPrivateKey()
    {
        // Load or generate keys. In prod, use persisted file/certificate store.
        var rsa = RSA.Create();
        rsa.ImportFromPem(File.ReadAllText("Keys/private.pem"));
        return rsa;
    }

    public RSA LoadPublicKey()
    {
        var rsa = RSA.Create();
        rsa.ImportFromPem(File.ReadAllText("Keys/public.pem"));
        return rsa;
    }
}
