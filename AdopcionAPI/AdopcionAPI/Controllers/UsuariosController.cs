using Abstracciones.Interfaces.IUsuario;
using Abstracciones.Modelos;
using Microsoft.AspNetCore.Mvc;

namespace AdopcionAPI.Controllers
{
    //Implementando API Rest de Usuarios
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController: ControllerBase
    {

        private readonly IUsuarioFlujo _usuarioFlujo;

        public UsuariosController(IUsuarioFlujo usuarioFlujo)
        {
            _usuarioFlujo = usuarioFlujo;
        }

        [HttpGet]
        public async Task<IActionResult> Obtener() => Ok(await _usuarioFlujo.Obtener());

        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObtenerPorId(int id)
        {
            var usuario = await _usuarioFlujo.ObtenerPorId(id);
            return usuario is null ? NotFound() : Ok(usuario);
        }

        [HttpPost]
        public async Task<IActionResult> Agregar([FromBody] Usuario usuario)
        {
            var creado = await _usuarioFlujo.GuardarUsuario(usuario);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.IdUsuario }, creado);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Actualizar(int id, [FromBody] Usuario usuario
            )
        {
            var resultado = await _usuarioFlujo.ActualizarUsuario(usuario, id);
            return resultado ? NoContent() : NotFound();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var resultado = await _usuarioFlujo.EliminarUsuario(id);
            return resultado ? NoContent() : NotFound();
        }

    }
}
