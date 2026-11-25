using AdopcionWeb.Clients;
using AdopcionWeb.Models;
using InertiaCore;
using Microsoft.AspNetCore.Mvc;
using static Abstracciones.TiposViviendas.TipoViviendaDtos;
using static Abstracciones.Vacunas.VacunacionDtos;

namespace AdopcionWeb.Controllers;

public class SolicitudesController : Controller
{
    private readonly AnimalesApiClient _animalesApi;
    private readonly SolicitudesApiClient _solicitudesApi;

    public SolicitudesController(AnimalesApiClient animalesApi, SolicitudesApiClient solicitudesApi)
    {
        _animalesApi = animalesApi;
        _solicitudesApi = solicitudesApi;
    }

    [HttpGet("/Adopcion/Solicitar/{animalId:int:min(1)}")]
    public async Task<IActionResult> Solicitar(int animalId, CancellationToken ct)
    {
        return await RenderFormularioAsync(animalId, null, null, ct);
    }

    [HttpPost("/Adopcion/Solicitar/{animalId:int:min(1)}")]
    public async Task<IActionResult> Enviar(
        int animalId,
        [FromBody] SolicitudFormularioInput input,
        CancellationToken ct)
    {
        input.AnimalId = animalId;

        if (!input.AceptaVisita)
        {
            return await RenderFormularioAsync(
                animalId,
                null,
                "Debe aceptar la visita domiciliaria previa para continuar.",
                ct);
        }

        var (ok, solicitud, error) = await _solicitudesApi.EnviarSolicitudAsync(input, ct);
        return await RenderFormularioAsync(animalId, ok ? solicitud : null, ok ? null : error, ct);
    }

    private async Task<IActionResult> RenderFormularioAsync(
        int animalId,
        object? solicitudCreada,
        string? formError,
        CancellationToken ct)
    {
        try
        {
            var detalleTask = _animalesApi.ObtenerDetalleAsync(animalId, ct);
            var viviendasTask = _solicitudesApi.ListarTiposViviendasAsync(ct);

            await Task.WhenAll(detalleTask, viviendasTask);

            var detalle = detalleTask.Result;
            if (detalle is null)
                return RedirectToAction("Index", "Home");

            return Inertia.Render("Adoptions/AdoptionRequestPage", new
            {
                animal = detalle.Animal,
                vacunaciones = detalle.Vacunaciones,
                tiposViviendas = viviendasTask.Result,
                solicitudCreada,
                formError,
                apiError = (string?)null
            });
        }
        catch (Exception ex)
        {
            return Inertia.Render("Adoptions/AdoptionRequestPage", new
            {
                animal = (object?)null,
                vacunaciones = Array.Empty<VacunacionDto>(),
                tiposViviendas = Array.Empty<TipoViviendaDto>(),
                solicitudCreada = (object?)null,
                formError,
                apiError = ex.Message
            });
        }
    }
}
