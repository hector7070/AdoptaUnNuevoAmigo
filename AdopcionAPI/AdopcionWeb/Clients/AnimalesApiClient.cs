using Abstracciones.Comunes;
using System.Net;
using System.Net.Http.Json;
using static Abstracciones.Animales.AnimalDtos;
using static Abstracciones.Consultas.ConsultaDtos;
using static Abstracciones.Vacunas.VacunacionDtos;

namespace AdopcionWeb.Clients;

public record AnimalDetalleDatos(
    AnimalDto Animal,
    IReadOnlyList<VacunacionDto> Vacunaciones,
    IReadOnlyList<ConsultaDto> Consultas);

public class AnimalesApiClient
{
    private readonly HttpClient _http;

    public AnimalesApiClient(HttpClient http) => _http = http;

    public async Task<AnimalDetalleDatos?> ObtenerDetalleAsync(int id, CancellationToken ct = default)
    {
        var resp = await _http.GetAsync($"api/animales/{id}", ct);
        if (resp.StatusCode == HttpStatusCode.NotFound)
            return null;

        resp.EnsureSuccessStatusCode();
        var animal = await resp.Content.ReadFromJsonAsync<AnimalDto>(OpcionesJsonApi.Valor, ct);
        if (animal is null)
            return null;

        const int max = ParametrosPaginacion.TamanoMaximo;

        var vacunasTask = _http.GetFromJsonAsync<List<VacunacionDto>>(
            $"api/vacunaciones?animalId={id}&tamano={max}", OpcionesJsonApi.Valor, ct);
        var consultasTask = _http.GetFromJsonAsync<List<ConsultaDto>>(
            $"api/consultas?animalId={id}&tamano={max}", OpcionesJsonApi.Valor, ct);

        await Task.WhenAll(vacunasTask, consultasTask);

        return new AnimalDetalleDatos(
            animal,
            vacunasTask.Result ?? [],
            consultasTask.Result ?? []);
    }
}
