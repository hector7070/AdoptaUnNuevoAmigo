using Abstracciones.Comunes;
using System.Net.Http.Json;
using static Abstracciones.Animales.AnimalDtos;
using static Abstracciones.Especies.IEspecieDtos;
using static Abstracciones.Razas.RazaDtos;
using static Abstracciones.Vacunas.VacunacionDtos;

namespace AdopcionWeb.Clients;

public record CatalogoDatos(
    IReadOnlyList<AnimalDto> Animales,
    IReadOnlyList<EspecieDto> Especies,
    IReadOnlyList<RazaDto> Razas,
    IReadOnlyList<VacunacionDto> Vacunaciones);

public class CatalogoApiClient
{
    private readonly HttpClient _http;

    public CatalogoApiClient(HttpClient http) => _http = http;

    public async Task<CatalogoDatos> ObtenerCatalogoAsync(CancellationToken ct = default)
    {
        const int max = ParametrosPaginacion.TamanoMaximo;

        var animalesTask = _http.GetFromJsonAsync<List<AnimalDto>>($"api/animales?tamano={max}", OpcionesJsonApi.Valor, ct);
        var especiesTask = _http.GetFromJsonAsync<List<EspecieDto>>($"api/especies?tamano={max}", OpcionesJsonApi.Valor, ct);
        var razasTask = _http.GetFromJsonAsync<List<RazaDto>>($"api/razas?tamano={max}", OpcionesJsonApi.Valor, ct);
        var vacunasTask = _http.GetFromJsonAsync<List<VacunacionDto>>($"api/vacunaciones?tamano={max}", OpcionesJsonApi.Valor, ct);

        await Task.WhenAll(animalesTask, especiesTask, razasTask, vacunasTask);

        return new CatalogoDatos(
            animalesTask.Result ?? [],
            especiesTask.Result ?? [],
            razasTask.Result ?? [],
            vacunasTask.Result ?? []);
    }
}
