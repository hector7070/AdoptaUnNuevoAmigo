using Abstracciones.Usuarios;

namespace Flujo.Usuarios
{
    public class AutenticacionFlujo : IAutenticacionFlujo
    {
        private readonly IUsuarioDA _usuarios;
        private readonly IGeneradorToken _generador;

        public AutenticacionFlujo(IUsuarioDA usuarios, IGeneradorToken generador)
        {
            _usuarios = usuarios;
            _generador = generador;
        }

        public async Task<SesionDto> IniciarSesionAsync(LoginDto dto, CancellationToken ct)
        {
            var correo = dto.Correo.Trim().ToLowerInvariant();
            var usuario = await _usuarios.ObtenerPorCorreoAsync(correo, ct)
                ?? throw new CredencialesInvalidasException();

            if (!usuario.Activo || !HasherPassword.Verificar(dto.Password, usuario.ContraseniaHash))
                throw new CredencialesInvalidasException();

            var (token, expira) = _generador.Generar(usuario);
            return new SesionDto(token, expira, usuario.Nombre, usuario.Correo, usuario.Rol.ToString());
        }
    }
}
