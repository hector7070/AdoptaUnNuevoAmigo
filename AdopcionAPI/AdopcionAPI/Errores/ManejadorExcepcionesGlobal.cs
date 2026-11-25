using Abstracciones.Excepciones;
using Abstracciones.Usuarios;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AdopcionAPI.Errores;

/// <summary>
/// Único lugar donde las excepciones de negocio se convierten en respuestas HTTP estándar RFC 9457.
/// La capa Flujo no conoce tipos HTTP ni códigos de estado: lanza excepciones de negocio;
/// aquí se traducen a ProblemDetails (application/problem+json).
/// - NoEncontrado / EntidadNoEncontrada -> 404
/// - ReglaDeNegocio / ValidacionNegocio -> 400
/// - Conflicto / ConflictoConcurrencia -> 409
/// - Errores no controlados -> 500
/// </summary>
public class ManejadorExcepcionesGlobal : IExceptionHandler
{
    private readonly IProblemDetailsService _problemas;
    private readonly ILogger<ManejadorExcepcionesGlobal> _logger;

    public ManejadorExcepcionesGlobal(IProblemDetailsService problemas, ILogger<ManejadorExcepcionesGlobal> logger)
    {
        _problemas = problemas;
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext contexto, Exception excepcion, CancellationToken ct)
    {
        var (estado, titulo) = excepcion switch
        {
            EntidadNoEncontradaException or NoEncontradoException => (StatusCodes.Status404NotFound, "Recurso no encontrado"),
            ConflictoConcurrenciaException or ConflictoException => (StatusCodes.Status409Conflict, "Conflicto con el estado actual"),
            CredencialesInvalidasException => (StatusCodes.Status401Unauthorized, "Credenciales inválidas"),
            ReglaDeNegocioException or ValidacionNegocioException => (StatusCodes.Status400BadRequest, "Regla de negocio no cumplida"),
            _ => (0, string.Empty)
        };

        // Excepción no controlada: se registra en el log y se devuelve false para que el middleware estándar responda 500 genérico.
        if (estado == 0)
        {
            _logger.LogError(excepcion, "Error no controlado en {Metodo} {Ruta}", contexto.Request.Method, contexto.Request.Path);
            return false;
        }

        contexto.Response.StatusCode = estado;
        return await _problemas.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = contexto,
            Exception = excepcion,
            ProblemDetails = new ProblemDetails
            {
                Status = estado,
                Title = titulo,
                Detail = excepcion.Message,
                Instance = $"{contexto.Request.Method} {contexto.Request.Path}"
            }
        });
    }
}
