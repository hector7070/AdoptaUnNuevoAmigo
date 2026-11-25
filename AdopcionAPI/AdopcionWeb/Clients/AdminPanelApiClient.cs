using Abstracciones.Comunes;
using Abstracciones.Usuarios;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using static Abstracciones.Adoptantes.AdoptanteDtos;
using static Abstracciones.Animales.AnimalDtos;
using static Abstracciones.Consultas.ConsultaDtos;
using static Abstracciones.Especies.IEspecieDtos;
using static Abstracciones.Razas.RazaDtos;
using static Abstracciones.Seguimientos.SeguimientoDtos;
using static Abstracciones.Solicitudes.SolicitudAdopcionDtos;
using static Abstracciones.TiposVacunas.TipoVacunaDtos;
using static Abstracciones.Vacunas.VacunacionDtos;
using static Abstracciones.Veterinarias.VeterinariaDtos;

namespace AdopcionWeb.Clients;

public record InventarioDatos(
    IReadOnlyList<AnimalDto> Animales,
    IReadOnlyList<RazaDto> Razas,
    IReadOnlyList<EspecieDto> Especies,
    int AlertasCount);

public record HistorialMedicoDatos(
    IReadOnlyList<AnimalDto> Animales,
    IReadOnlyList<RazaDto> Razas,
    IReadOnlyList<VacunacionDto> Vacunaciones,
    IReadOnlyList<TipoVacunaDto> TiposVacunas,
    IReadOnlyList<ConsultaDto> Consultas,
    IReadOnlyList<VeterinariaDto> Veterinarias,
    IReadOnlyList<SolicitudDto> Solicitudes,
    IReadOnlyList<SeguimientoDto> Seguimientos,
    int AlertasCount);

public record AlertasPanelDatos(
    IReadOnlyList<AlertaDto> Alertas,
    IReadOnlyList<SeguimientoDto> Seguimientos,
    IReadOnlyList<SolicitudDto> Solicitudes,
    IReadOnlyList<AnimalDto> Animales,
    IReadOnlyList<AdoptanteDto> Adoptantes,
    IReadOnlyList<VacunacionDto> Vacunaciones,
    IReadOnlyList<TipoVacunaDto> TiposVacunas);

public record ReportesPanelDatos(
    IReadOnlyList<SolicitudDto> Solicitudes,
    IReadOnlyList<AnimalDto> Animales,
    IReadOnlyList<AdoptanteDto> Adoptantes,
    IReadOnlyList<SeguimientoDto> Seguimientos,
    IReadOnlyList<VacunacionDto> Vacunaciones,
    IReadOnlyList<TipoVacunaDto> TiposVacunas,
    IReadOnlyList<AlertaDto> Alertas);

public class AdminPanelApiClient
{
    private readonly HttpClient _http;

    public AdminPanelApiClient(HttpClient http) => _http = http;

    public async Task<InventarioDatos> ObtenerInventarioAsync(CancellationToken ct = default)
    {
        const int max = ParametrosPaginacion.TamanoMaximo;
        var animalesTask = _http.GetFromJsonAsync<List<AnimalDto>>($"api/animales?tamano={max}", OpcionesJsonApi.Valor, ct);
        var razasTask = _http.GetFromJsonAsync<List<RazaDto>>($"api/razas?tamano={max}", OpcionesJsonApi.Valor, ct);
        var especiesTask = _http.GetFromJsonAsync<List<EspecieDto>>($"api/especies?tamano={max}", OpcionesJsonApi.Valor, ct);
        var alertasTask = _http.GetFromJsonAsync<List<AlertaDto>>("api/seguimientos/alertas", OpcionesJsonApi.Valor, ct);

        await Task.WhenAll(animalesTask, razasTask, especiesTask, alertasTask);

        return new InventarioDatos(
            animalesTask.Result ?? [],
            razasTask.Result ?? [],
            especiesTask.Result ?? [],
            alertasTask.Result?.Count ?? 0);
    }

    public async Task<(bool Ok, string? Error)> CrearAnimalAsync(AnimalCrearDTO dto, CancellationToken ct = default)
    {
        var resp = await _http.PostAsJsonAsync("api/animales", dto, OpcionesJsonApi.Valor, ct);
        return resp.IsSuccessStatusCode
            ? (true, null)
            : (false, await LeerErrorAsync(resp, "No se pudo registrar el animal.", ct));
    }

    public async Task<(bool Ok, string? Error)> ActualizarAnimalAsync(int id, AnimalActualizarDTO dto, CancellationToken ct = default)
    {
        var resp = await _http.PutAsJsonAsync($"api/animales/{id}", dto, OpcionesJsonApi.Valor, ct);
        return resp.IsSuccessStatusCode
            ? (true, null)
            : (false, await LeerErrorAsync(resp, "No se pudo actualizar la ficha del animal.", ct));
    }

    public async Task<(bool Ok, string? Error)> DesactivarAnimalAsync(int id, CancellationToken ct = default)
    {
        var resp = await _http.DeleteAsync($"api/animales/{id}", ct);
        return resp.IsSuccessStatusCode
            ? (true, null)
            : (false, await LeerErrorAsync(resp, "No se pudo desactivar el animal.", ct));
    }

    public async Task<HistorialMedicoDatos> ObtenerHistorialMedicoAsync(CancellationToken ct = default)
    {
        const int max = ParametrosPaginacion.TamanoMaximo;
        var animalesTask = _http.GetFromJsonAsync<List<AnimalDto>>($"api/animales?tamano={max}", OpcionesJsonApi.Valor, ct);
        var razasTask = _http.GetFromJsonAsync<List<RazaDto>>($"api/razas?tamano={max}", OpcionesJsonApi.Valor, ct);
        var vacunasTask = _http.GetFromJsonAsync<List<VacunacionDto>>($"api/vacunaciones?tamano={max}", OpcionesJsonApi.Valor, ct);
        var tiposVacunaTask = _http.GetFromJsonAsync<List<TipoVacunaDto>>($"api/tiposvacunas?tamano={max}", OpcionesJsonApi.Valor, ct);
        var consultasTask = _http.GetFromJsonAsync<List<ConsultaDto>>($"api/consultas?tamano={max}", OpcionesJsonApi.Valor, ct);
        var vetsTask = _http.GetFromJsonAsync<List<VeterinariaDto>>($"api/veterinarias?tamano={max}", OpcionesJsonApi.Valor, ct);
        var solTask = _http.GetFromJsonAsync<List<SolicitudDto>>($"api/solicitudes?tamano={max}", OpcionesJsonApi.Valor, ct);
        var segTask = _http.GetFromJsonAsync<List<SeguimientoDto>>($"api/seguimientos?tamano={max}", OpcionesJsonApi.Valor, ct);
        var alertasTask = _http.GetFromJsonAsync<List<AlertaDto>>("api/seguimientos/alertas", OpcionesJsonApi.Valor, ct);

        await Task.WhenAll(animalesTask, razasTask, vacunasTask, tiposVacunaTask, consultasTask, vetsTask, solTask, segTask, alertasTask);

        return new HistorialMedicoDatos(
            animalesTask.Result ?? [],
            razasTask.Result ?? [],
            vacunasTask.Result ?? [],
            tiposVacunaTask.Result ?? [],
            consultasTask.Result ?? [],
            vetsTask.Result ?? [],
            solTask.Result ?? [],
            segTask.Result ?? [],
            alertasTask.Result?.Count ?? 0);
    }

    public async Task<(bool Ok, string? Error)> RegistrarVacunaAsync(VacunacionCrearDTO dto, CancellationToken ct = default)
    {
        var resp = await _http.PostAsJsonAsync("api/vacunaciones", dto, OpcionesJsonApi.Valor, ct);
        return resp.IsSuccessStatusCode
            ? (true, null)
            : (false, await LeerErrorAsync(resp, "No se pudo registrar la vacuna.", ct));
    }

    public async Task<(bool Ok, string? Error)> RegistrarConsultaAsync(ConsultaCrearDTO dto, CancellationToken ct = default)
    {
        var resp = await _http.PostAsJsonAsync("api/consultas", dto, OpcionesJsonApi.Valor, ct);
        return resp.IsSuccessStatusCode
            ? (true, null)
            : (false, await LeerErrorAsync(resp, "No se pudo registrar la consulta veterinaria.", ct));
    }

    public async Task<AlertasPanelDatos> ObtenerAlertasAsync(CancellationToken ct = default)
    {
        const int max = ParametrosPaginacion.TamanoMaximo;
        var alertasTask = _http.GetFromJsonAsync<List<AlertaDto>>("api/seguimientos/alertas", OpcionesJsonApi.Valor, ct);
        var segTask = _http.GetFromJsonAsync<List<SeguimientoDto>>($"api/seguimientos?tamano={max}", OpcionesJsonApi.Valor, ct);
        var solTask = _http.GetFromJsonAsync<List<SolicitudDto>>($"api/solicitudes?tamano={max}", OpcionesJsonApi.Valor, ct);
        var animalesTask = _http.GetFromJsonAsync<List<AnimalDto>>($"api/animales?tamano={max}", OpcionesJsonApi.Valor, ct);
        var adoptantesTask = _http.GetFromJsonAsync<List<AdoptanteDto>>($"api/adoptantes?tamano={max}", OpcionesJsonApi.Valor, ct);
        var vacunasTask = _http.GetFromJsonAsync<List<VacunacionDto>>($"api/vacunaciones?tamano={max}", OpcionesJsonApi.Valor, ct);
        var tiposVacunaTask = _http.GetFromJsonAsync<List<TipoVacunaDto>>($"api/tiposvacunas?tamano={max}", OpcionesJsonApi.Valor, ct);

        await Task.WhenAll(alertasTask, segTask, solTask, animalesTask, adoptantesTask, vacunasTask, tiposVacunaTask);

        return new AlertasPanelDatos(
            alertasTask.Result ?? [],
            segTask.Result ?? [],
            solTask.Result ?? [],
            animalesTask.Result ?? [],
            adoptantesTask.Result ?? [],
            vacunasTask.Result ?? [],
            tiposVacunaTask.Result ?? []);
    }

    public async Task<(IReadOnlyList<UsuarioDto> Usuarios, int AlertasCount)> ObtenerUsuariosAsync(CancellationToken ct = default)
    {
        var usuariosTask = _http.GetFromJsonAsync<List<UsuarioDto>>("api/usuarios", OpcionesJsonApi.Valor, ct);
        var alertasTask = _http.GetFromJsonAsync<List<AlertaDto>>("api/seguimientos/alertas", OpcionesJsonApi.Valor, ct);

        await Task.WhenAll(usuariosTask, alertasTask);
        return (usuariosTask.Result ?? [], alertasTask.Result?.Count ?? 0);
    }

    public async Task<(bool Ok, string? Error)> CrearUsuarioAsync(UsuarioCrearDto dto, CancellationToken ct = default)
    {
        var resp = await _http.PostAsJsonAsync("api/usuarios", dto, OpcionesJsonApi.Valor, ct);
        return resp.IsSuccessStatusCode
            ? (true, null)
            : (false, await LeerErrorAsync(resp, "No se pudo crear el usuario.", ct));
    }

    public async Task<(bool Ok, string? Error)> CambiarRolUsuarioAsync(int id, RolUsuario rol, CancellationToken ct = default)
    {
        var resp = await _http.PatchAsJsonAsync($"api/usuarios/{id}/rol", new UsuarioCambiarRolDto { Rol = rol }, OpcionesJsonApi.Valor, ct);
        return resp.IsSuccessStatusCode
            ? (true, null)
            : (false, await LeerErrorAsync(resp, "No se pudo actualizar el rol del usuario.", ct));
    }

    public async Task<ReportesPanelDatos> ObtenerReportesAsync(CancellationToken ct = default)
    {
        const int max = ParametrosPaginacion.TamanoMaximo;
        var solTask = _http.GetFromJsonAsync<List<SolicitudDto>>($"api/solicitudes?tamano={max}", OpcionesJsonApi.Valor, ct);
        var animalesTask = _http.GetFromJsonAsync<List<AnimalDto>>($"api/animales?tamano={max}", OpcionesJsonApi.Valor, ct);
        var adoptantesTask = _http.GetFromJsonAsync<List<AdoptanteDto>>($"api/adoptantes?tamano={max}", OpcionesJsonApi.Valor, ct);
        var segTask = _http.GetFromJsonAsync<List<SeguimientoDto>>($"api/seguimientos?tamano={max}", OpcionesJsonApi.Valor, ct);
        var vacunasTask = _http.GetFromJsonAsync<List<VacunacionDto>>($"api/vacunaciones?tamano={max}", OpcionesJsonApi.Valor, ct);
        var tiposVacunaTask = _http.GetFromJsonAsync<List<TipoVacunaDto>>($"api/tiposvacunas?tamano={max}", OpcionesJsonApi.Valor, ct);
        var alertasTask = _http.GetFromJsonAsync<List<AlertaDto>>("api/seguimientos/alertas", OpcionesJsonApi.Valor, ct);

        await Task.WhenAll(solTask, animalesTask, adoptantesTask, segTask, vacunasTask, tiposVacunaTask, alertasTask);

        return new ReportesPanelDatos(
            solTask.Result ?? [],
            animalesTask.Result ?? [],
            adoptantesTask.Result ?? [],
            segTask.Result ?? [],
            vacunasTask.Result ?? [],
            tiposVacunaTask.Result ?? [],
            alertasTask.Result ?? []);
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
