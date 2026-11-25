using Abstracciones.Excepciones;
using Abstracciones.Modelos;

namespace Abstracciones.Usuarios
{
    public interface IUsuarioDA
    {
        Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken ct);
        Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken ct);
        Task<bool> ExisteCorreoAsync(string correo, CancellationToken ct);
        Task<Usuario> AgregarAsync(Usuario usuario, CancellationToken ct);
        Task<bool> GuardarCambiosAsync(Usuario usuario, CancellationToken ct);
        Task<List<Usuario>> ListarAsync(CancellationToken ct);
    }

    public interface IGeneradorToken
    {
        (string Token, DateTime ExpiraEnUtc) Generar(Usuario usuario);
    }

    public interface IAutenticacionFlujo
    {
        Task<SesionDto> IniciarSesionAsync(LoginDto dto, CancellationToken ct);
    }

    public interface IUsuarioFlujo
    {
        Task<List<UsuarioDto>> ListarAsync(CancellationToken ct);
        Task<UsuarioDto> CrearAsync(UsuarioCrearDto dto, CancellationToken ct);
        Task<UsuarioDto> CambiarRolAsync(int id, RolUsuario rol, CancellationToken ct);
    }
}

namespace Abstracciones.Usuarios
{
    public class CredencialesInvalidasException : ExcepcionDeNegocio
    {
        public CredencialesInvalidasException() : base("Correo o contraseña incorrectos.") { }
    }
}
