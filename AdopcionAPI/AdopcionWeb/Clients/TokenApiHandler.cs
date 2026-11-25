using System.Net.Http.Headers;

namespace AdopcionWeb.Clients;

public class TokenApiHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _contexto;

    public TokenApiHandler(IHttpContextAccessor contexto) => _contexto = contexto;

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage peticion, CancellationToken ct)
    {
        var token = _contexto.HttpContext?.User.FindFirst("api_token")?.Value;

        if (!string.IsNullOrEmpty(token))
            peticion.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        return base.SendAsync(peticion, ct);
    }
}
