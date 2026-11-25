using Abstracciones.Modelos;
using Abstracciones.Usuarios;

namespace Flujo.Usuarios
{
    internal static class UsuarioMapeador
    {
        public static UsuarioDto ADto(Usuario u) =>
            new(u.IdUsuario, $"{u.Nombre} {u.ApellidoPaterno}".Trim(), u.Correo, u.NombreUsuario, u.Rol.ToString());
    }
}
