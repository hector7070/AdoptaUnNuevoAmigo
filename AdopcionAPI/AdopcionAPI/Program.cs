using System.Text.Json.Serialization;
using Abstracciones.Comunes;
using Abstracciones.Seguimientos;
using Abstracciones.Solicitudes;
using Abstracciones.Usuarios;
using AdopcionAPI.Errores;
using AdopcionAPI.Seguridad;
using DA;
using DA.Seed;
using Flujo;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services
    .AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Errores estándar (RFC 9457, application/problem+json) y manejador global de excepciones de negocio.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ManejadorExcepcionesGlobal>();

// Registro modular de dependencias en capas y patrón Options
builder.Services.Configure<ReglasAdopcionOpciones>(builder.Configuration.GetSection("ReglasAdopcion"));
builder.Services.Configure<SeguimientoOpciones>(builder.Configuration.GetSection(SeguimientoOpciones.Seccion));
builder.Services.AddDatos(builder.Configuration);
builder.Services.AddSeguridadDatos();
builder.Services.AddFlujo();
builder.Services.AddSeguridadFlujo();

// ---------- Seguridad: JWT y roles ----------
builder.Services.Configure<OpcionesJwt>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IGeneradorToken, GeneradorTokenJwt>();

var jwt = builder.Configuration.GetSection("Jwt").Get<OpcionesJwt>() ?? new OpcionesJwt();

// Interruptor Seguridad:Exigir. En false el API queda abierto y solo se protege lo marcado con [Authorize].
var exigirSeguridad = builder.Configuration.GetValue<bool>("Seguridad:Exigir");

if (exigirSeguridad && jwt.Clave.Length < 32)
    throw new InvalidOperationException("Seguridad:Exigir está activo pero falta Jwt:Clave (mínimo 32 caracteres).");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,           ValidIssuer = jwt.Emisor,
        ValidateAudience = true,         ValidAudience = jwt.Audiencia,
        ValidateLifetime = true,         ClockSkew = TimeSpan.FromMinutes(1),
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = jwt.Clave.Length >= 32
            ? new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwt.Clave))
            : null,
        RoleClaimType = System.Security.Claims.ClaimTypes.Role,
        NameClaimType = System.Security.Claims.ClaimTypes.Name
    });

builder.Services.AddAuthorization(o =>
{
    if (exigirSeguridad)
        o.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
});

var app = builder.Build();

// ---------- Migración automática ----------
// Controlada por Base:MigrarAlIniciar (true por defecto en desarrollo; configurable por variable de entorno en Azure).
// Va ANTES del comando --seed para garantizar que las tablas existan.
if (app.Configuration.GetValue<bool>("Base:MigrarAlIniciar"))
{
    try
    {
        await app.Services.AplicarMigracionesAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogCritical(ex, "Falló la migración automática al iniciar. Revise la cadena de conexión.");
    }
}

// ---------- Comando de semilla: dotnet run --project AdopcionAPI -- --seed ----------
if (args.Contains("--seed"))
{
    await AdopcionSeeder.SeedAsync(app.Services);
    await SeguridadSeeder.SeedAsync(app.Services, app.Configuration["Semilla:ClaveInicial"]);
    return;
}

app.UseExceptionHandler();
app.UseStatusCodePages();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    await AdopcionSeeder.SeedAsync(app.Services);
    await SeguridadSeeder.SeedAsync(app.Services, app.Configuration["Semilla:ClaveInicial"]);
}

// Documentación (OpenAPI + Scalar): siempre en Development; en Azure/Producción solo si Documentacion__Habilitar = true.
if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Documentacion:Habilitar"))
{
    app.MapOpenApi().AllowAnonymous();
    app.MapScalarApiReference().AllowAnonymous();
}

// Endpoint de salud (200 si la base contesta, 503 si no)
app.MapGet("/salud", async (ISaludBaseDatos salud, CancellationToken ct) =>
        await salud.EstaDisponibleAsync(ct)
            ? Results.Ok(new { estado = "ok", baseDeDatos = "disponible" })
            : Results.Json(new { estado = "degradado", baseDeDatos = "no disponible" },
                statusCode: StatusCodes.Status503ServiceUnavailable))
    .WithTags("Operación")
    .AllowAnonymous();

app.UseAuthentication();   // ¿quién eres? (lee el token)
app.UseAuthorization();    // ¿puedes entrar? (revisa roles). SIEMPRE después de UseAuthentication.

app.MapControllers();

app.Run();

public partial class Program { }
