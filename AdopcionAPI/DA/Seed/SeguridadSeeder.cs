using Abstracciones.Modelos;
using Abstracciones.Usuarios;
using DA.Contexto.UsuarioContexto;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DA.Seed
{
    public static class SeguridadSeeder
    {
        private const string ClavePorDefecto = "Adopta2026!";

        public static async Task SeedAsync(IServiceProvider services, string? claveInicial, CancellationToken ct = default)
        {
            using var scope = services.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<UsuarioContexto>();

            if (ctx.Database.IsRelational())
                await ctx.Database.MigrateAsync(ct);

            var clave = string.IsNullOrWhiteSpace(claveInicial) || claveInicial.Length < 8
                ? ClavePorDefecto
                : claveInicial;

            var pendientes = new[]
            {
                Nuevo("Josué", "Sosa", "admin@adopta.cr", "admin", RolUsuario.Administrador, clave),
                Nuevo("María", "Solano", "coordinador@adopta.cr", "coordinador", RolUsuario.Coordinador, clave),
                Nuevo("Diego", "Ramírez", "veterinario@adopta.cr", "veterinario", RolUsuario.Veterinario, clave),
                Nuevo("Laura", "Campos", "voluntario@adopta.cr", "voluntario", RolUsuario.Voluntario, clave)
            };

            var existentes = await ctx.Usuarios.Select(u => u.Correo).ToListAsync(ct);
            var nuevos = pendientes.Where(u => !existentes.Contains(u.Correo)).ToList();

            if (nuevos.Count == 0)
            {
                Console.WriteLine("La base ya tiene todos los usuarios de la semilla. No se agregó ninguno.");
                return;
            }

            ctx.Usuarios.AddRange(nuevos);
            await ctx.SaveChangesAsync(ct);
            Console.WriteLine($"Usuarios creados: {string.Join(", ", nuevos.Select(u => $"{u.Correo} ({u.Rol})"))}.");
        }

        private static Usuario Nuevo(string nombre, string apellido, string correo, string nombreUsuario,
            RolUsuario rol, string clave) => new()
        {
            Nombre = nombre,
            ApellidoPaterno = apellido,
            Correo = correo,
            NombreUsuario = nombreUsuario,
            ContraseniaHash = HasherPassword.Hashear(clave),
            Rol = rol,
            Activo = true
        };
    }
}
