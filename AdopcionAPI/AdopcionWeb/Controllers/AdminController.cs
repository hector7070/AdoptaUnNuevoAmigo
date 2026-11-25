using Abstracciones.Solicitudes;
using AdopcionWeb.Clients;
using InertiaCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Abstracciones.Adoptantes.AdoptanteDtos;
using static Abstracciones.Animales.AnimalDtos;
using static Abstracciones.Seguimientos.SeguimientoDtos;
using static Abstracciones.Solicitudes.SolicitudAdopcionDtos;
using static Abstracciones.Vacunas.VacunacionDtos;
using static Abstracciones.VisitasDomiciliarias.VisitaDtos;

namespace AdopcionWeb.Controllers;

public class CambiarEstadoSolicitudInput
{
    public string Estado { get; set; } = string.Empty;
}

public class ProgramarVisitaInput
{
    public int VoluntarioId { get; set; }
    public string Fecha { get; set; } = string.Empty;
}

[Authorize(Roles = "Administrador,Coordinador")]
[Route("admin")]
public class AdminController : Controller
{
    private readonly AdminSolicitudesApiClient _solicitudesApi;

    public AdminController(AdminSolicitudesApiClient solicitudesApi) => _solicitudesApi = solicitudesApi;

    [HttpGet("")]
    public IActionResult Index() => Redirect("/admin/solicitudes");

    [HttpGet("solicitudes")]
    public async Task<IActionResult> Solicitudes(CancellationToken ct)
    {
        return await RenderSolicitudesAsync(null, null, ct);
    }

    [HttpPost("solicitudes/{id:int:min(1)}/estado")]
    public async Task<IActionResult> CambiarEstado(
        int id,
        [FromBody] CambiarEstadoSolicitudInput input,
        CancellationToken ct)
    {
        if (!Enum.TryParse<EstadoSolicitud>(input.Estado, ignoreCase: true, out var estado))
        {
            return await RenderSolicitudesAsync(null, "El estado seleccionado no es válido.", ct);
        }

        var (ok, error) = await _solicitudesApi.CambiarEstadoAsync(id, estado, ct);
        return await RenderSolicitudesAsync(
            ok ? $"Solicitud #{id} actualizada a {estado}!" : null,
            ok ? null : error,
            ct);
    }

    [HttpPost("solicitudes/{id:int:min(1)}/visita")]
    public async Task<IActionResult> ProgramarVisita(
        int id,
        [FromBody] ProgramarVisitaInput input,
        CancellationToken ct)
    {
        if (input.VoluntarioId < 1)
            return await RenderSolicitudesAsync(null, "Seleccione un voluntario para la visita.", ct);

        if (!DateTime.TryParse(input.Fecha, out var fechaLocal))
            return await RenderSolicitudesAsync(null, "Seleccione una fecha y hora válida.", ct);

        var fechaUtc = DateTime.SpecifyKind(fechaLocal, DateTimeKind.Local).ToUniversalTime();
        var (ok, error) = await _solicitudesApi.ProgramarVisitaAsync(id, input.VoluntarioId, fechaUtc, ct);

        return await RenderSolicitudesAsync(
            ok ? $"Visita domiciliaria programada para la solicitud #{id}!" : null,
            ok ? null : error,
            ct);
    }

    private async Task<IActionResult> RenderSolicitudesAsync(
        string? flashSuccess,
        string? flashError,
        CancellationToken ct)
    {
        try
        {
            var datos = await _solicitudesApi.ObtenerBandejaAsync(ct);

            var voluntarios = datos.Visitas
                .GroupBy(v => v.VoluntarioId)
                .Select(g => new
                {
                    idVoluntario = g.Key,
                    nombre = g.First().VoluntarioNombre ?? $"Voluntario #{g.Key}"
                })
                .OrderBy(v => v.nombre)
                .ToList();

            return Inertia.Render("Admin/SolicitudesPage", new
            {
                solicitudes = datos.Solicitudes,
                animales = datos.Animales,
                adoptantes = datos.Adoptantes,
                visitas = datos.Visitas,
                vacunaciones = datos.Vacunaciones,
                voluntarios,
                alertasCount = datos.Alertas.Count,
                flashSuccess,
                flashError,
                apiError = (string?)null
            });
        }
        catch (Exception ex)
        {
            return Inertia.Render("Admin/SolicitudesPage", new
            {
                solicitudes = Array.Empty<SolicitudDto>(),
                animales = Array.Empty<AnimalDto>(),
                adoptantes = Array.Empty<AdoptanteDto>(),
                visitas = Array.Empty<VisitaDto>(),
                vacunaciones = Array.Empty<VacunacionDto>(),
                voluntarios = Array.Empty<object>(),
                alertasCount = 0,
                flashSuccess,
                flashError,
                apiError = ex.Message
            });
        }
    }
}
