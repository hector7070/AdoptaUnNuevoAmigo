using Abstracciones.Excepciones;
using Abstracciones.Modelos;
using Abstracciones.Usuarios;

namespace Flujo.Usuarios
{
    public class UsuarioFlujo : IUsuarioFlujo
    {
        private readonly IUsuarioDA _usuarioDA;

        public UsuarioFlujo(IUsuarioDA usuarioDA) => _usuarioDA = usuarioDA;

        public async Task<List<UsuarioDto>> ListarAsync(CancellationToken ct)
        {
            var usuarios = await _usuarioDA.ListarAsync(ct);
            return usuarios.Select(UsuarioMapeador.ADto).ToList();
        }

        public async Task<UsuarioDto> CrearAsync(UsuarioCrearDto dto, CancellationToken ct)
        {
            var correo = dto.Correo.Trim().ToLowerInvariant();

            if (await _usuarioDA.ExisteCorreoAsync(correo, ct))
                throw new ConflictoException($"Ya existe un usuario con el correo '{correo}'.");

            var usuario = new Usuario
            {
                Nombre = dto.Nombre.Trim(),
                ApellidoPaterno = dto.ApellidoPaterno.Trim(),
                ApellidoMaterno = string.IsNullOrWhiteSpace(dto.ApellidoMaterno) ? null : dto.ApellidoMaterno.Trim(),
                Correo = correo,
                NombreUsuario = dto.NombreUsuario.Trim(),
                ContraseniaHash = HasherPassword.Hashear(dto.Password),
                Rol = dto.Rol,
                Activo = dto.Activo
            };

            await _usuarioDA.AgregarAsync(usuario, ct);
            return UsuarioMapeador.ADto(usuario);
        }
    }
}
