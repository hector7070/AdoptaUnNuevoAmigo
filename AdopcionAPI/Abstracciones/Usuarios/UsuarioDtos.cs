using System.ComponentModel.DataAnnotations;
using Abstracciones.Modelos;

namespace Abstracciones.Usuarios
{
    public class LoginDto
    {
        [Required(ErrorMessage = "El correo es obligatorio.")]
        [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
        [StringLength(150)]
        public string Correo { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        public string Password { get; set; } = string.Empty;
    }

    public record SesionDto(string Token, DateTime ExpiraEnUtc, string Nombre, string Correo, string Rol);

    public record UsuarioDto(int Id, string Nombre, string Correo, string NombreUsuario, string Rol);

    public class UsuarioCrearDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El apellido paterno es obligatorio.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "El apellido paterno debe tener entre 2 y 100 caracteres.")]
        public string ApellidoPaterno { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ApellidoMaterno { get; set; }

        [Required(ErrorMessage = "El correo es obligatorio.")]
        [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
        [StringLength(150)]
        public string Correo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "El nombre de usuario debe tener entre 3 y 50 caracteres.")]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
        public string Password { get; set; } = string.Empty;

        [EnumDataType(typeof(RolUsuario), ErrorMessage = "El rol indicado no es válido.")]
        public RolUsuario Rol { get; set; } = RolUsuario.Voluntario;

        public bool Activo { get; set; } = true;
    }

    public class UsuarioCambiarRolDto
    {
        [EnumDataType(typeof(RolUsuario), ErrorMessage = "El rol indicado no es válido.")]
        public RolUsuario Rol { get; set; }
    }
}
