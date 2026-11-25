using Abstracciones.Usuarios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdopcionAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly IAutenticacionFlujo _flujo;

        public AuthController(IAutenticacionFlujo flujo) => _flujo = flujo;

        [HttpPost("login")]
        [ProducesResponseType<SesionDto>(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<SesionDto>> Login(LoginDto dto, CancellationToken ct) =>
            Ok(await _flujo.IniciarSesionAsync(dto, ct));
    }
}
