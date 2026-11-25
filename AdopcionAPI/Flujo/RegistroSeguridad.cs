using Abstracciones.Usuarios;
using Flujo.Usuarios;
using Microsoft.Extensions.DependencyInjection;

namespace Flujo
{
    public static class RegistroSeguridad
    {
        public static IServiceCollection AddSeguridadFlujo(this IServiceCollection servicios)
        {
            servicios.AddScoped<IAutenticacionFlujo, AutenticacionFlujo>();
            servicios.AddScoped<IUsuarioFlujo, UsuarioFlujo>();
            return servicios;
        }
    }
}
