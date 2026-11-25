using System.Net.Http.Json;
using static Abstracciones.Especies.IEspecieDtos;

namespace AdopcionWeb.Clients;

public class EspeciesApiClient
{
    private readonly HttpClient _http;

    public EspeciesApiClient(HttpClient http) => _http = http;

    public async Task<IReadOnlyList<EspecieDto>> ListarAsync(CancellationToken ct = default)
    {
        return await _http.GetFromJsonAsync<List<EspecieDto>>("api/especies", OpcionesJsonApi.Valor, ct)
            ?? [];
    }
}
