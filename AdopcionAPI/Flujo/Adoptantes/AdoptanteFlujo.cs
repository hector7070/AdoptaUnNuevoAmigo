using Abstracciones.Adoptantes;
using Abstracciones.Comunes;
using Abstracciones.Excepciones;
using Abstracciones.TiposViviendas;
using static Abstracciones.Adoptantes.AdoptanteDtos;

namespace Flujo.Adoptantes
{
    public class AdoptanteFlujo : IAdoptanteFlujo
    {
        private readonly IAdoptanteDA _adoptanteDA;
        private readonly ITipoViviendaDA _tipoViviendaDA;
        private readonly TimeProvider _reloj;

        public AdoptanteFlujo(IAdoptanteDA adoptanteDA, ITipoViviendaDA tipoViviendaDA, TimeProvider reloj)
        {
            _adoptanteDA = adoptanteDA;
            _tipoViviendaDA = tipoViviendaDA;
            _reloj = reloj;
        }

        public async Task ActualizarAsync(int id, AdoptanteDtos.AdoptanteActualizarDTO dto, CancellationToken ct)
        {
            if (await _tipoViviendaDA.ObtenerPorIdAsync(dto.TipoViviendaId, ct) is null)
                throw new ValidacionNegocioException($"El tipo de vivienda {dto.TipoViviendaId} no existe.");

            _ = await _adoptanteDA.ObtenerPorIdAsync(id, ct) ?? throw new NoEncontradoException("Adoptante", id);

            var actualizado = await _adoptanteDA.ActualizarAsync(new Adoptante
            {
                IdAdoptante = id,
                Identificacion = dto.Identificacion.Trim(),
                Nombre = dto.Nombre.Trim(),
                Contacto = dto.Contacto.Trim(),
                OtrasMascotas = dto.OtrasMascotas.Trim(),
                TipoViviendaId = dto.TipoViviendaId,
                Activo = dto.Activo,
                FechaRegistro = dto.FechaRegistro,
            }, ct);

            if (!actualizado) throw new NoEncontradoException("Adoptante", id);
        }

        public async Task<AdoptanteDtos.AdoptanteDto> CrearAsync(AdoptanteDtos.AdoptanteCrearDTO dto, CancellationToken ct)
        {
            if (await _tipoViviendaDA.ObtenerPorIdAsync(dto.TipoViviendaId, ct) is null)
                throw new ValidacionNegocioException($"El tipo de vivienda {dto.TipoViviendaId} no existe.");

            var ahora = _reloj.GetUtcNow().UtcDateTime;

            var adoptante = new Adoptante
            {
                Identificacion = dto.Identificacion.Trim(),
                Nombre = dto.Nombre.Trim(),
                Contacto = dto.Contacto.Trim(),
                OtrasMascotas = dto.OtrasMascotas.Trim(),
                TipoViviendaId = dto.TipoViviendaId,
                Activo = dto.Activo,
                FechaRegistro = ahora
            };

            await _adoptanteDA.AgregarAsync(adoptante, ct);
            return await ObtenerAsync(adoptante.IdAdoptante, ct);
        }

        public async Task EliminarAsync(int id, CancellationToken ct)
        {
            _ = await _adoptanteDA.ObtenerPorIdAsync(id, ct) ?? throw new NoEncontradoException("Adoptante", id);

            if (!await _adoptanteDA.EliminarAsync(id, ct))
                throw new NoEncontradoException("Adoptante", id);
        }

        public async Task<ResultadoPaginado<AdoptanteDtos.AdoptanteDto>> ListarAsync(AdoptanteDtos.AdoptanteFiltro filtro, CancellationToken ct)
        {
            var pagina = await _adoptanteDA.BuscarAsync(filtro, ct);
            return new ResultadoPaginado<AdoptanteDto>
            {
                Items = pagina.Items.Select(AdoptanteMapeador.ADto).ToList(),
                Total = pagina.Total,
                Pagina = pagina.Pagina,
                Tamano = pagina.Tamano
            };
        }

        public async Task<AdoptanteDtos.AdoptanteDto> ObtenerAsync(int id, CancellationToken ct)
        {
            var adoptante = await _adoptanteDA.ObtenerPorIdAsync(id, ct) ?? throw new NoEncontradoException("Adoptante", id);
            return AdoptanteMapeador.ADto(adoptante);
        }
    }

}
