using System.Text.Json.Serialization;
using AdopcionWeb.Clients;
using AdopcionWeb.Middleware;
using InertiaCore.Extensions;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Vite.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllersWithViews()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddInertia(options =>
{
    options.RootView = "~/Views/App.cshtml";
});

// ---------- Sesión del MVC: la cookie guarda los claims y, dentro, el token del API ----------
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.LoginPath = "/Cuenta/Ingresar";
        o.AccessDeniedPath = "/Cuenta/Denegado";
        o.ExpireTimeSpan = TimeSpan.FromMinutes(60);
        o.SlidingExpiration = false;
        o.Cookie.HttpOnly = true;
    });

// El catálogo público no exige sesión, así que NO se pone una política global.
builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<TokenApiHandler>();

builder.Services.AddViteServices(options =>
{
    options.Server.PackageDirectory = "React";
    options.Server.AutoRun = true;
    options.Server.UseReactRefresh = true;
    options.Server.Port = 5173;
});

var apiBaseUrl = builder.Configuration["ApiBaseUrl"] ?? "http://localhost:5136/";
builder.Services.AddHttpClient<EspeciesApiClient>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
});
builder.Services.AddHttpClient<CatalogoApiClient>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
});
builder.Services.AddHttpClient<AnimalesApiClient>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
});
builder.Services.AddHttpClient<SolicitudesApiClient>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
}).AddHttpMessageHandler<TokenApiHandler>();
builder.Services.AddHttpClient<VoluntarioApiClient>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
}).AddHttpMessageHandler<TokenApiHandler>();
builder.Services.AddHttpClient<AdminSolicitudesApiClient>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
}).AddHttpMessageHandler<TokenApiHandler>();
builder.Services.AddHttpClient<AdminPanelApiClient>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
}).AddHttpMessageHandler<TokenApiHandler>();

// Cliente del login: NO lleva el handler, todavía no hay token.
builder.Services.AddHttpClient<ICuentaApi, CuentaApi>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseViteDevelopmentServer(true);
}
else
{
    app.UseExceptionHandler("/Home/Error");
}

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseInertia();
app.UseMiddleware<CompartirSesion>();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
