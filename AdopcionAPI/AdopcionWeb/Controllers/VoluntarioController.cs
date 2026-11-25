using Abstracciones.VisitasDomiciliarias;
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

public class VisitaAccionInput
{
    public bool Favorable { get; set; }
    public string? Observaciones { get; set; }
}

public class SeguimientoAccionInput
{
    public bool Favorable { get; set; }
    public string? Observaciones { get; set; }
}

[Authorize(Roles = "Voluntario,Administrador")]
[Route("voluntario")]
public class VoluntarioController : Controller
{
    private readonly VoluntarioApiClient _voluntarioApi;

    public VoluntarioController(VoluntarioApiClient voluntarioApi) => _voluntarioApi = voluntarioApi;

    [HttpGet("")]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        return await RenderPanelAsync(null, null, ct);
    }

    [HttpPost("visitas/{id:int:min(1)}/resultado")]
    public async Task<IActionResult> RegistrarVisita(
        int id,
        [FromBody] VisitaAccionInput input,
        CancellationToken ct)
    {
        var resultado = input.Favorable ? ResultadoVisita.Favorable : ResultadoVisita.Desfavorable;
        var (ok, error) = await _voluntarioApi.RegistrarResultadoVisitaAsync(
            id, resultado, input.Observaciones, ct);

        return await RenderPanelAsync(
            ok ? "Resultado de la visita registrado con éxito!" : null,
            ok ? null : error,
            ct);
    }

    [HttpPost("seguimientos/{id:int:min(1)}/resultado")]
    public async Task<IActionResult> RegistrarSeguimiento(
        int id,
        [FromBody] SeguimientoAccionInput input,
        CancellationToken ct)
    {
        var (ok, error) = await _voluntarioApi.RegistrarResultadoSeguimientoAsync(
            id, input.Favorable, input.Observaciones, ct);

        return await RenderPanelAsync(
            ok ? "Resultado del seguimiento registrado con éxito!" : null,
            ok ? null : error,
            ct);
    }

    private async Task<IActionResult> RenderPanelAsync(
        string? flashSuccess,
        string? flashError,
        CancellationToken ct)
    {
        try
        {
            var datos = await _voluntarioApi.ObtenerPanelAsync(ct);

            return Inertia.Render("Volunteer/VolunteerPage", new
            {
                voluntarioNombre = datos.Visitas.FirstOrDefault()?.VoluntarioNombre ?? "Voluntario",
                visitas = datos.Visitas,
                seguimientos = datos.Seguimientos,
                solicitudes = datos.Solicitudes,
                animales = datos.Animales,
                adoptantes = datos.Adoptantes,
                vacunaciones = datos.Vacunaciones,
                flashSuccess,
                flashError,
                apiError = (string?)null
            });
        }
        catch (Exception ex)
        {
            return Inertia.Render("Volunteer/VolunteerPage", new
            {
                voluntarioNombre = "Voluntario",
                visitas = Array.Empty<VisitaDto>(),
                seguimientos = Array.Empty<SeguimientoDto>(),
                solicitudes = Array.Empty<SolicitudDto>(),
                animales = Array.Empty<AnimalDto>(),
                adoptantes = Array.Empty<AdoptanteDto>(),
                vacunaciones = Array.Empty<VacunacionDto>(),
                flashSuccess,
                flashError,
                apiError = ex.Message
            });
        }
    }
}
