using Abstracciones.Modelos;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Abstracciones.Usuarios
{
    public static class HasherPassword
    {
        private const int Iteraciones = 210_000;

        private static readonly PasswordHasher<Usuario> Hasher = new(
            Options.Create(new PasswordHasherOptions { IterationCount = Iteraciones }));

        public static string Hashear(string password)
        {
            return Hasher.HashPassword(new Usuario(), password);
        }

        public static bool Verificar(string password, string almacenado)
        {
            if (string.IsNullOrWhiteSpace(almacenado)) return false;

            var resultado = Hasher.VerifyHashedPassword(new Usuario(), almacenado, password);
            return resultado is PasswordVerificationResult.Success
                or PasswordVerificationResult.SuccessRehashNeeded;
        }
    }
}
