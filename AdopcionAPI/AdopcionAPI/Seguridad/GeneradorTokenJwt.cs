using System.Security.Claims;
using System.Text;
using Abstracciones.Modelos;
using Abstracciones.Usuarios;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace AdopcionAPI.Seguridad
{
    public class OpcionesJwt
    {
        public string Emisor { get; set; } = "AdoptaUnNuevoAmigo";
        public string Audiencia { get; set; } = "AdoptaUnNuevoAmigo.Clientes";
        public int Minutos { get; set; } = 60;
        public string Clave { get; set; } = string.Empty;
    }

    public class GeneradorTokenJwt : IGeneradorToken
    {
        private readonly OpcionesJwt _opciones;

        public GeneradorTokenJwt(IOptions<OpcionesJwt> opciones) => _opciones = opciones.Value;

        public (string Token, DateTime ExpiraEnUtc) Generar(Usuario usuario)
        {
            if (_opciones.Clave.Length < 32)
                throw new InvalidOperationException(
                    "Falta Jwt:Clave (mínimo 32 caracteres). Use User Secrets en desarrollo o la variable Jwt__Clave en Azure.");

            var expira = DateTime.UtcNow.AddMinutes(_opciones.Minutos);

            var descriptor = new SecurityTokenDescriptor
            {
                Issuer = _opciones.Emisor,
                Audience = _opciones.Audiencia,
                Expires = expira,
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                    new Claim(ClaimTypes.Name, usuario.Nombre),
                    new Claim(ClaimTypes.Email, usuario.Correo),
                    new Claim(ClaimTypes.Role, usuario.Rol.ToString())
                }),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opciones.Clave)),
                    SecurityAlgorithms.HmacSha256)
            };

            return (new JsonWebTokenHandler().CreateToken(descriptor), expira);
        }
    }
}
