using System.Security.Claims;
using Abstracciones.Usuarios;
using AdopcionWeb.Clients;
using InertiaCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdopcionWeb.Controllers;

[AllowAnonymous]
public class CuentaController : Controller
{
    private readonly ICuentaApi _cuenta;

    public CuentaController(ICuentaApi cuenta) => _cuenta = cuenta;

    [HttpGet]
    public IActionResult Ingresar(string? returnUrl) =>
        Inertia.Render("Auth/LoginPage", new { returnUrl, correo = (string?)null, error = (string?)null });

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Ingresar(LoginDto datos, string? returnUrl, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return Inertia.Render("Auth/LoginPage", new
            {
                returnUrl,
                correo = datos.Correo,
                error = (string?)"Escriba un correo válido y su contraseña."
            });

        try
        {
            var sesion = await _cuenta.IniciarSesionAsync(datos, ct);

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, sesion.Nombre),
                new(ClaimTypes.Email, sesion.Correo),
                new(ClaimTypes.Role, sesion.Rol),
                new("api_token", sesion.Token)
            };
            var identidad = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identidad),
                new AuthenticationProperties { ExpiresUtc = sesion.ExpiraEnUtc, IsPersistent = false });

            return Url.IsLocalUrl(returnUrl) ? Redirect(returnUrl!) : RedirectToAction("Index", "Home");
        }
        catch (ApiCuentaException ex) when (ex.Codigo == 401)
        {
            return Inertia.Render("Auth/LoginPage", new
            {
                returnUrl,
                correo = datos.Correo,
                error = (string?)"Correo o contraseña incorrectos."
            });
        }
        catch (HttpRequestException)
        {
            return Inertia.Render("Auth/LoginPage", new
            {
                returnUrl,
                correo = datos.Correo,
                error = (string?)"No se pudo conectar con el servicio. Intente de nuevo."
            });
        }
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Salir()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction("Index", "Home");
    }

    public IActionResult Denegado() => Inertia.Render("Auth/Denegado");
}
