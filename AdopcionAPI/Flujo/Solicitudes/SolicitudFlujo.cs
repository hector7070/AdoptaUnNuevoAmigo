using Abstracciones.Adoptantes;
using Abstracciones.Animales;
using Abstracciones.Comunes;
using Abstracciones.Excepciones;
using Abstracciones.Seguimientos;
using Abstracciones.Solicitudes;
using Abstracciones.Vacunas;
using Abstracciones.VisitasDomiciliarias;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Text;
using static Abstracciones.Solicitudes.SolicitudAdopcionDtos;

namespace Flujo.Solicitudes
{
    public class SolicitudFlujo : ISolicitudFlujo
    {
        // Máquina de estados: solo estas transiciones son válidas.
        private static readonly Dictionary<EstadoSolicitud, EstadoSolicitud[]> Transiciones = new()
        {
            [EstadoSolicitud.Enviada] = new[] { EstadoSolicitud.EnRevision, EstadoSolicitud.Rechazada, EstadoSolicitud.Cancelada },
            [EstadoSolicitud.EnRevision] = new[] { EstadoSolicitud.VisitaProgramada, EstadoSolicitud.Rechazada, EstadoSolicitud.Cancelada },
            [EstadoSolicitud.VisitaProgramada] = new[] { EstadoSolicitud.Aprobada, EstadoSolicitud.Rechazada, EstadoSolicitud.Cancelada },
            // Aprobada, Rechazada y Cancelada son estados finales.
        };

        private readonly ISolicitudDA _solicitudDA;
        private readonly IAnimalDA _animalDA;
        private readonly IAdoptanteDA _adoptanteDA;
        private readonly IVacunacionDA _vacunaDA;

        private readonly IVisitaDA _visitaDA;

        private readonly TimeProvider _reloj;
        private readonly ReglasAdopcionOpciones _reglas;

        public SolicitudFlujo(ISolicitudDA solicitudDA, IAnimalDA animalDA, IAdoptanteDA adoptanteDA,
            IVacunacionDA vacunaDA, IVisitaDA visitaDA, TimeProvider reloj, IOptions<ReglasAdopcionOpciones> reglas)
        {
            _solicitudDA = solicitudDA;
            _animalDA = animalDA;
            _adoptanteDA = adoptanteDA;
            _vacunaDA = vacunaDA;
            _visitaDA = visitaDA;
            _reloj = reloj;
            _reglas = reglas.Value;
        }

        public async Task<SolicitudDto> CrearAsync(SolicitudCrearDTO dto, CancellationToken ct)
        {
            var ahora = _reloj.GetUtcNow().UtcDateTime;

            var animal = await _animalDA.ObtenerPorIdAsync(dto.AnimalId, ct)
                ?? throw new NoEncontradoException("Animal", dto.AnimalId);
            var adoptante = await _adoptanteDA.ObtenerPorIdAsync(dto.AdoptanteId, ct)
                ?? throw new NoEncontradoException("Adoptante", dto.AdoptanteId);

            if (!animal.Activo) throw new ValidacionNegocioException("El animal está inactivo.");
            if (!adoptante.Activo) throw new ValidacionNegocioException("El adoptante está inactivo.");

            // REGLA 1: solo Disponibles reciben solicitudes; un EnProceso no admite otra activa.
            if (animal.Estado != EstadoAnimal.Disponible)
                throw new ConflictoException($"El animal no está disponible para adopción (estado actual: {animal.Estado}).");
            if (await _solicitudDA.ExisteActivaParaAnimalAsync(animal.IdAnimal, ct))
                throw new ConflictoException("El animal ya tiene una solicitud activa.");

            // REGLA 2: vacunas obligatorias al día.
            if (!await _vacunaDA.TieneVacunasObligatoriasAlDiaAsync(animal.IdAnimal, ahora, ct))
                throw new ValidacionNegocioException("El animal no tiene al día las vacunas obligatorias.");

            // REGLA 3: espera tras rechazo + tope de animales en seguimiento.
            await ValidarReglasAdoptanteAsync(adoptante.IdAdoptante, ahora, ct);

            var solicitud = new SolicitudAdopcion
            {
                AnimalId = animal.IdAnimal,
                AdoptanteId = adoptante.IdAdoptante,
                FechaSolicitud = ahora,
                Estado = EstadoSolicitud.Enviada
            };

            await _solicitudDA.AgregarAsync(solicitud, ct);   // inserta + animal => EnProceso (atómico)
            return await ObtenerAsync(solicitud.IdSolicitud, ct);
        }

        public async Task CambiarEstadoAsync(int id, EstadoSolicitud nuevo, CancellationToken ct)
        {
            var s = await _solicitudDA.ObtenerPorIdAsync(id, ct) ?? throw new NoEncontradoException("Solicitud", id);
            var ahora = _reloj.GetUtcNow().UtcDateTime;

            if (nuevo == EstadoSolicitud.VisitaProgramada)
                throw new ConflictoException("VisitaProgramada se alcanza programando una visita domiciliaria (POST /api/visitas).");

            if (!Transiciones.TryGetValue(s.Estado, out var permitidos) || !permitidos.Contains(nuevo))
                throw new ConflictoException($"No se puede pasar de {s.Estado} a {nuevo}.");

            IReadOnlyList<SeguimientoPostAdopcion>? seguimientos = null;

            if (nuevo == EstadoSolicitud.Aprobada)
            {
                // REGLA 4: la última visita resuelta debe ser favorable.
                if (await _visitaDA.UltimoResultadoAsync(id, ct) != ResultadoVisita.Favorable)
                    throw new ValidacionNegocioException("No se puede aprobar: se requiere una visita domiciliaria con resultado favorable.");

                // Re-validaciones 
                if (!await _vacunaDA.TieneVacunasObligatoriasAlDiaAsync(s.AnimalId, ahora, ct))
                    throw new ValidacionNegocioException("Las vacunas obligatorias del animal ya no están al día.");

                var enSeguimiento = await _solicitudDA.ContarAnimalesEnSeguimientoAsync(s.AdoptanteId, ct);
                if (enSeguimiento >= _reglas.MaxAnimalesEnSeguimiento)
                    throw new ValidacionNegocioException(
                        $"El adoptante ya tiene {enSeguimiento} animales en seguimiento (máximo {_reglas.MaxAnimalesEnSeguimiento}).");

                // REGLA 5: seguimientos de 30, 60 y 90 días desde la aprobación.
                seguimientos = Enum.GetValues<HitoSeguimiento>()
                    .Select(h => new SeguimientoPostAdopcion
                    {
                        Hito = h,
                        FechaProgramada = ahora.AddDays((int)h),
                        Estado = EstadoSeguimiento.Pendiente
                    }).ToList();
            }

            var estadoAnimal = nuevo switch
            {
                EstadoSolicitud.Aprobada => EstadoAnimal.EnSeguimiento,
                EstadoSolicitud.Rechazada or EstadoSolicitud.Cancelada => EstadoAnimal.Disponible,
                _ => EstadoAnimal.EnProceso
            };

            DateTime? resolucion = nuevo is EstadoSolicitud.Aprobada or EstadoSolicitud.Rechazada or EstadoSolicitud.Cancelada
                ? ahora : null;

            if (!await _solicitudDA.CambiarEstadoAsync(id, nuevo, estadoAnimal, resolucion, seguimientos, ct))
                throw new NoEncontradoException("Solicitud", id);
        }

        private async Task ValidarReglasAdoptanteAsync(int adoptanteId, DateTime ahora, CancellationToken ct)
        {
            var ultimoRechazo = await _solicitudDA.UltimoRechazoAsync(adoptanteId, ct);
            if (ultimoRechazo is { } fecha)
            {
                var puedeAplicarDesde = fecha.AddDays(_reglas.DiasEsperaTrasRechazo);
                if (ahora < puedeAplicarDesde)
                    throw new ValidacionNegocioException(
                        $"El adoptante fue rechazado y debe esperar hasta el {puedeAplicarDesde:yyyy-MM-dd} para volver a aplicar.");
            }

            var enSeguimiento = await _solicitudDA.ContarAnimalesEnSeguimientoAsync(adoptanteId, ct);
            if (enSeguimiento >= _reglas.MaxAnimalesEnSeguimiento)
                throw new ValidacionNegocioException(
                    $"El adoptante ya tiene {enSeguimiento} animales en seguimiento (máximo {_reglas.MaxAnimalesEnSeguimiento}).");
        }

        public async Task<ResultadoPaginado<SolicitudDto>> ListarAsync(SolicitudFiltro filtro, CancellationToken ct)
        {
            var pagina = await _solicitudDA.BuscarAsync(filtro, ct);
            return new ResultadoPaginado<SolicitudDto>
            {
                Items = pagina.Items.Select(SolicitudMapeador.ADto).ToList(),
                Total = pagina.Total,
                Pagina = pagina.Pagina,
                Tamano = pagina.Tamano
            };
        }

        public async Task<SolicitudDto> ObtenerAsync(int id, CancellationToken ct)
        {
            var s = await _solicitudDA.ObtenerPorIdAsync(id, ct) ?? throw new NoEncontradoException("Solicitud", id);
            return SolicitudMapeador.ADto(s);
        }
    }
}
