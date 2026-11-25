using Abstracciones.Comunes;
using Abstracciones.VisitasDomiciliarias;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using static Abstracciones.Adoptantes.AdoptanteDtos;
using static Abstracciones.Animales.AnimalDtos;
using static Abstracciones.Seguimientos.SeguimientoDtos;
using static Abstracciones.Solicitudes.SolicitudAdopcionDtos;
using static Abstracciones.Vacunas.VacunacionDtos;
using static Abstracciones.VisitasDomiciliarias.VisitaDtos;

namespace AdopcionWeb.Clients;

public record VoluntarioPanelDatos(
    IReadOnlyList<VisitaDto> Visitas,
    IReadOnlyList<SeguimientoDto> Seguimientos,
    IReadOnlyList<SolicitudDto> Solicitudes,
    IReadOnlyList<AnimalDto> Animales,
    IReadOnlyList<AdoptanteDto> Adoptantes,
    IReadOnlyList<VacunacionDto> Vacunaciones);

public class VoluntarioApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly HttpClient _http;

    public VoluntarioApiClient(HttpClient http) => _http = http;

    public async Task<VoluntarioPanelDatos> ObtenerPanelAsync(CancellationToken ct = default)
    {
        const int max = ParametrosPaginacion.TamanoMaximo;

        var visitasTask = _http.GetFromJsonAsync<List<VisitaDto>>($"api/visitas?tamano={max}", JsonOptions, ct);
        var seguimientosTask = _http.GetFromJsonAsync<List<SeguimientoDto>>($"api/seguimientos?tamano={max}", JsonOptions, ct);
        var solicitudesTask = _http.GetFromJsonAsync<List<SolicitudDto>>($"api/solicitudes?tamano={max}", JsonOptions, ct);
        var animalesTask = _http.GetFromJsonAsync<List<AnimalDto>>($"api/animales?tamano={max}", JsonOptions, ct);
        var adoptantesTask = _http.GetFromJsonAsync<List<AdoptanteDto>>($"api/adoptantes?tamano={max}", JsonOptions, ct);
        var vacunasTask = _http.GetFromJsonAsync<List<VacunacionDto>>($"api/vacunaciones?tamano={max}", JsonOptions, ct);

        await Task.WhenAll(visitasTask, seguimientosTask, solicitudesTask, animalesTask, adoptantesTask, vacunasTask);

        return new VoluntarioPanelDatos(
            visitasTask.Result ?? [],
            seguimientosTask.Result ?? [],
            solicitudesTask.Result ?? [],
            animalesTask.Result ?? [],
            adoptantesTask.Result ?? [],
            vacunasTask.Result ?? []);
    }

    public async Task<(bool Ok, string? Error)> RegistrarResultadoVisitaAsync(
        int visitaId, ResultadoVisita resultado, string? observaciones, CancellationToken ct = default)
    {
        var dto = new VisitaResultadoDTO
        {
            Resultado = resultado,
            Observaciones = observaciones
        };

        var resp = await _http.PatchAsJsonAsync($"api/visitas/{visitaId}/resultado", dto, JsonOptions, ct);
        if (resp.IsSuccessStatusCode)
            return (true, null);

        return (false, await LeerErrorAsync(resp, "No se pudo registrar el resultado de la visita.", ct));
    }

    public async Task<(bool Ok, string? Error)> RegistrarResultadoSeguimientoAsync(
        int seguimientoId, bool favorable, string? observaciones, CancellationToken ct = default)
    {
        var dto = new SeguimientoResultadoDTO
        {
            Favorable = favorable,
            Observaciones = observaciones
        };

        var resp = await _http.PatchAsJsonAsync($"api/seguimientos/{seguimientoId}/resultado", dto, JsonOptions, ct);
        if (resp.IsSuccessStatusCode)
            return (true, null);

        return (false, await LeerErrorAsync(resp, "No se pudo registrar el resultado del seguimiento.", ct));
    }

    private static async Task<string> LeerErrorAsync(HttpResponseMessage resp, string fallback, CancellationToken ct)
    {
        try
        {
            var validation = await resp.Content.ReadFromJsonAsync<ValidationProblemDetails>(JsonOptions, ct);
            if (validation?.Errors is { Count: > 0 })
            {
                var first = validation.Errors.Values.SelectMany(v => v).FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(first))
                    return first;
            }
            if (!string.IsNullOrWhiteSpace(validation?.Detail))
                return validation.Detail;
            if (!string.IsNullOrWhiteSpace(validation?.Title))
                return validation.Title;
        }
        catch
        {
            // Fall back to status-based message
        }

        return $"{fallback} (HTTP {(int)resp.StatusCode})";
    }
}
