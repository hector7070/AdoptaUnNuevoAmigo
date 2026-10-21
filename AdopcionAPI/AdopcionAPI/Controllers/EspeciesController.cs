using Abstracciones.Interfaces;
using Abstracciones.Modelos;
using DA.Contexto;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AdopcionAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EspeciesController : ControllerBase
    {
        private readonly IEspecieFlujo _especieFlujo;

        public EspeciesController(IEspecieFlujo especieFlujo) => _especieFlujo = especieFlujo;

        [HttpGet]
        public async Task<IActionResult> Obtener() => Ok(await _especieFlujo.Obtener());

        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObtenerPorId(int id)
        {
            var especie = await _especieFlujo.ObtenerPorId(id);
            return especie is null ? NotFound() : Ok(especie);
        }

        [HttpPost]
        public async Task<IActionResult> Agregar([FromBody] Especie especie)
        {
            var creado = await _especieFlujo.Agregar(especie);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.IdEspecie }, creado);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Actualizar(int id, [FromBody] Especie datos)
        {
            var resultado = await _especieFlujo.Actualizar(id, datos);
            return resultado ? NoContent() : NotFound();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var resultado = await _especieFlujo.Eliminar(id);
            return resultado ? NoContent() : NotFound();
        }
    }
}