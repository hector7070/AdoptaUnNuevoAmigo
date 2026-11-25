using Abstracciones.Usuarios;
using DA.Usuarios;
using Microsoft.Extensions.DependencyInjection;

namespace DA
{
    public static class RegistroSeguridadDA
    {
        public static IServiceCollection AddSeguridadDatos(this IServiceCollection servicios)
        {
            servicios.AddScoped<IUsuarioDA, UsuarioDA>();
            return servicios;
        }
    }
}
