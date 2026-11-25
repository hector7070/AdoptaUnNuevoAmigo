using System.Security.Claims;
using InertiaCore;
using Microsoft.AspNetCore.Antiforgery;

namespace AdopcionWeb.Middleware;

public class CompartirSesion
{
    private readonly RequestDelegate _siguiente;
    private readonly IAntiforgery _antiforgery;

    public CompartirSesion(RequestDelegate siguiente, IAntiforgery antiforgery)
    {
        _siguiente = siguiente;
        _antiforgery = antiforgery;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        if (contexto.User.Identity?.IsAuthenticated == true)
        {
            var tokens = _antiforgery.GetAndStoreTokens(contexto);

            Inertia.Share(new Dictionary<string, object?>
            {
                ["auth"] = new
                {
                    autenticado = true,
                    nombre = contexto.User.Identity.Name,
                    correo = contexto.User.FindFirstValue(ClaimTypes.Email),
                    rol = contexto.User.FindFirstValue(ClaimTypes.Role)
                },
                ["csrfToken"] = tokens.RequestToken
            });
        }
        else
        {
            Inertia.Share(new Dictionary<string, object?>
            {
                ["auth"] = new { autenticado = false, nombre = (string?)null, correo = (string?)null, rol = (string?)null },
                ["csrfToken"] = _antiforgery.GetAndStoreTokens(contexto).RequestToken
            });
        }

        await _siguiente(contexto);
    }
}
