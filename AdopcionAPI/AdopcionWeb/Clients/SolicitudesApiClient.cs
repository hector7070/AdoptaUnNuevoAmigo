using Abstracciones.Comunes;
using AdopcionWeb.Models;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using static Abstracciones.Adoptantes.AdoptanteDtos;
using static Abstracciones.Solicitudes.SolicitudAdopcionDtos;
using static Abstracciones.TiposViviendas.TipoViviendaDtos;

namespace AdopcionWeb.Clients;

public class SolicitudesApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly HttpClient _http;

    public SolicitudesApiClient(HttpClient http) => _http = http;

    public async Task<IReadOnlyList<TipoViviendaDto>> ListarTiposViviendasAsync(CancellationToken ct = default)
    {
        const int max = ParametrosPaginacion.TamanoMaximo;
        var list = await _http.GetFromJsonAsync<List<TipoViviendaDto>>(
            $"api/TiposViviendasControllercs?tamano={max}", JsonOptions, ct);
        return (list ?? []).Where(t => t.Activo).ToList();
    }

    public async Task<(bool Ok, SolicitudDto? Solicitud, string? Error)> EnviarSolicitudAsync(
        SolicitudFormularioInput input, CancellationToken ct = default)
    {
        var identificacion = input.Identificacion.Trim();

        // 1. Reuse existing adopter by Identificacion if already registered.
        int adoptanteId = 0;
        var existentes = await _http.GetFromJsonAsync<List<AdoptanteDto>>(
            $"api/adoptantes?q={Uri.EscapeDataString(identificacion)}&tamano={ParametrosPaginacion.TamanoMaximo}",
            JsonOptions, ct);

        var existente = existentes?.FirstOrDefault(a =>
            string.Equals(a.Identificacion, identificacion, StringComparison.OrdinalIgnoreCase));

        if (existente is not null)
        {
            adoptanteId = existente.IdAdoptante;
        }
        else
        {
            var contacto = $"{input.Correo.Trim()} | {input.Telefono.Trim()}";
            if (contacto.Length > 150) contacto = contacto[..150];

            var mascotas = string.IsNullOrWhiteSpace(input.OtrasMascotas)
                ? "Ninguna"
                : input.OtrasMascotas.Trim();
            var hogar = input.DescripcionHogar.Trim();
            var detalleHogar = string.IsNullOrEmpty(hogar)
                ? mascotas
                : $"{mascotas} | Hogar: {hogar}";
            if (detalleHogar.Length > 500) detalleHogar = detalleHogar[..500];

            var nuevoAdoptante = new AdoptanteCrearDTO
            {
                Identificacion = identificacion,
                Nombre = input.Nombre.Trim(),
                Contacto = contacto,
                TipoViviendaId = input.TipoViviendaId,
                OtrasMascotas = detalleHogar,
                Activo = true,
                FechaRegistro = DateTime.UtcNow
            };

            var respAdoptante = await _http.PostAsJsonAsync("api/adoptantes", nuevoAdoptante, JsonOptions, ct);
            if (!respAdoptante.IsSuccessStatusCode)
            {
                var err = await LeerErrorAsync(respAdoptante, "No se pudo registrar los datos del adoptante.", ct);
                return (false, null, err);
            }

            var creado = await respAdoptante.Content.ReadFromJsonAsync<AdoptanteDto>(JsonOptions, ct);
            if (creado is null)
                return (false, null, "No se recibió respuesta válida al registrar el adoptante.");

            adoptanteId = creado.IdAdoptante;
        }

        // 2. Create the adoption request (RN-01, RN-02, RN-03 validated by API).
        var solicitudDto = new SolicitudCrearDTO
        {
            AnimalId = input.AnimalId,
            AdoptanteId = adoptanteId
        };

        var respSolicitud = await _http.PostAsJsonAsync("api/solicitudes", solicitudDto, JsonOptions, ct);
        if (!respSolicitud.IsSuccessStatusCode)
        {
            var err = await LeerErrorAsync(respSolicitud, "No se pudo registrar la solicitud de adopción.", ct);
            return (false, null, err);
        }

        var solicitudCreada = await respSolicitud.Content.ReadFromJsonAsync<SolicitudDto>(JsonOptions, ct);
        return (true, solicitudCreada, null);
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
