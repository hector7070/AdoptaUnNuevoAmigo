using Abstracciones.Comunes;
using Abstracciones.Solicitudes;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using static Abstracciones.Adoptantes.AdoptanteDtos;
using static Abstracciones.Animales.AnimalDtos;
using static Abstracciones.Seguimientos.SeguimientoDtos;
using static Abstracciones.Solicitudes.SolicitudAdopcionDtos;
using static Abstracciones.Vacunas.VacunacionDtos;
using static Abstracciones.VisitasDomiciliarias.VisitaDtos;

namespace AdopcionWeb.Clients;

public record AdminSolicitudesDatos(
    IReadOnlyList<SolicitudDto> Solicitudes,
    IReadOnlyList<AnimalDto> Animales,
    IReadOnlyList<AdoptanteDto> Adoptantes,
    IReadOnlyList<VisitaDto> Visitas,
    IReadOnlyList<VacunacionDto> Vacunaciones,
    IReadOnlyList<AlertaDto> Alertas);

public class AdminSolicitudesApiClient
{
    private readonly HttpClient _http;

    public AdminSolicitudesApiClient(HttpClient http) => _http = http;

    public async Task<AdminSolicitudesDatos> ObtenerBandejaAsync(CancellationToken ct = default)
    {
        const int max = ParametrosPaginacion.TamanoMaximo;

        var solicitudesTask = _http.GetFromJsonAsync<List<SolicitudDto>>($"api/solicitudes?tamano={max}", OpcionesJsonApi.Valor, ct);
        var animalesTask = _http.GetFromJsonAsync<List<AnimalDto>>($"api/animales?tamano={max}", OpcionesJsonApi.Valor, ct);
        var adoptantesTask = _http.GetFromJsonAsync<List<AdoptanteDto>>($"api/adoptantes?tamano={max}", OpcionesJsonApi.Valor, ct);
        var visitasTask = _http.GetFromJsonAsync<List<VisitaDto>>($"api/visitas?tamano={max}", OpcionesJsonApi.Valor, ct);
        var vacunasTask = _http.GetFromJsonAsync<List<VacunacionDto>>($"api/vacunaciones?tamano={max}", OpcionesJsonApi.Valor, ct);
        var alertasTask = _http.GetFromJsonAsync<List<AlertaDto>>("api/seguimientos/alertas", OpcionesJsonApi.Valor, ct);

        await Task.WhenAll(solicitudesTask, animalesTask, adoptantesTask, visitasTask, vacunasTask, alertasTask);

        return new AdminSolicitudesDatos(
            solicitudesTask.Result ?? [],
            animalesTask.Result ?? [],
            adoptantesTask.Result ?? [],
            visitasTask.Result ?? [],
            vacunasTask.Result ?? [],
            alertasTask.Result ?? []);
    }

    public async Task<(bool Ok, string? Error)> CambiarEstadoAsync(
        int solicitudId, EstadoSolicitud nuevoEstado, CancellationToken ct = default)
    {
        var dto = new SolicitudCambiarEstadoDTO { Estado = nuevoEstado };
        var resp = await _http.PatchAsJsonAsync(
            $"api/solicitudes/{solicitudId}/estado", dto, OpcionesJsonApi.Valor, ct);

        if (resp.IsSuccessStatusCode)
            return (true, null);

        return (false, await LeerErrorAsync(resp, "No se pudo actualizar el estado de la solicitud.", ct));
    }

    public async Task<(bool Ok, string? Error)> ProgramarVisitaAsync(
        int solicitudId, int voluntarioId, DateTime fechaUtc, CancellationToken ct = default)
    {
        var dto = new VisitaCrearDTO
        {
            SolicitudId = solicitudId,
            VoluntarioId = voluntarioId,
            Fecha = fechaUtc
        };

        var resp = await _http.PostAsJsonAsync("api/visitas", dto, OpcionesJsonApi.Valor, ct);
        if (resp.IsSuccessStatusCode)
            return (true, null);

        return (false, await LeerErrorAsync(resp, "No se pudo programar la visita domiciliaria.", ct));
    }

    private static async Task<string> LeerErrorAsync(HttpResponseMessage resp, string fallback, CancellationToken ct)
    {
        try
        {
            var validation = await resp.Content.ReadFromJsonAsync<ValidationProblemDetails>(OpcionesJsonApi.Valor, ct);
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
            // Fall back to status code message
        }

        return $"{fallback} (HTTP {(int)resp.StatusCode})";
    }
}
