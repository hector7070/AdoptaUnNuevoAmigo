using System.Net.Http.Json;
using Abstracciones.Usuarios;

namespace AdopcionWeb.Clients;

public interface ICuentaApi
{
    Task<SesionDto> IniciarSesionAsync(LoginDto datos, CancellationToken ct = default);
}

public class CuentaApi : ICuentaApi
{
    private readonly HttpClient _http;

    public CuentaApi(HttpClient http) => _http = http;

    public async Task<SesionDto> IniciarSesionAsync(LoginDto datos, CancellationToken ct = default)
    {
        using var respuesta = await _http.PostAsJsonAsync("api/auth/login",
            new { correo = datos.Correo, password = datos.Password }, ct);

        if (!respuesta.IsSuccessStatusCode)
        {
            var problema = await respuesta.Content.ReadFromJsonAsync<ProblemaApi>(ct);
            throw new ApiCuentaException((int)respuesta.StatusCode,
                problema?.Detail ?? "No se pudo iniciar sesión.");
        }

        return (await respuesta.Content.ReadFromJsonAsync<SesionDto>(ct))!;
    }

    private sealed class ProblemaApi
    {
        public string? Title { get; set; }
        public string? Detail { get; set; }
    }
}

public class ApiCuentaException : Exception
{
    public int Codigo { get; }

    public ApiCuentaException(int codigo, string mensaje) : base(mensaje) => Codigo = codigo;
}
