using Abstracciones.Usuarios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdopcionAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioFlujo _flujo;

        public UsuariosController(IUsuarioFlujo flujo) => _flujo = flujo;

        [HttpGet]
        [ProducesResponseType<List<UsuarioDto>>(StatusCodes.Status200OK)]
        public async Task<ActionResult<List<UsuarioDto>>> Listar(CancellationToken ct) =>
            Ok(await _flujo.ListarAsync(ct));

        [HttpPost]
        [Authorize(Roles = nameof(RolUsuario.Administrador))]
        [ProducesResponseType<UsuarioDto>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<UsuarioDto>> Crear(UsuarioCrearDto dto, CancellationToken ct)
        {
            var creado = await _flujo.CrearAsync(dto, ct);
            return CreatedAtAction(nameof(Listar), null, creado);
        }

        [HttpPatch("{id:int:min(1)}/rol")]
        [Authorize(Roles = nameof(RolUsuario.Administrador))]
        [ProducesResponseType<UsuarioDto>(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
        [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<UsuarioDto>> CambiarRol(int id, UsuarioCambiarRolDto dto, CancellationToken ct) =>
            Ok(await _flujo.CambiarRolAsync(id, dto.Rol, ct));
    }
}
