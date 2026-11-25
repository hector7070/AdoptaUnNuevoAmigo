using Abstracciones.Seguimientos;
using Abstracciones.Solicitudes;
using Abstracciones.Usuarios;
using AdopcionWeb.Clients;
using InertiaCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using static Abstracciones.Adoptantes.AdoptanteDtos;
using static Abstracciones.Animales.AnimalDtos;
using static Abstracciones.Consultas.ConsultaDtos;
using static Abstracciones.Especies.IEspecieDtos;
using static Abstracciones.Razas.RazaDtos;
using static Abstracciones.Seguimientos.SeguimientoDtos;
using static Abstracciones.Solicitudes.SolicitudAdopcionDtos;
using static Abstracciones.TiposVacunas.TipoVacunaDtos;
using static Abstracciones.Vacunas.VacunacionDtos;
using static Abstracciones.Veterinarias.VeterinariaDtos;

namespace AdopcionWeb.Controllers;

public class AnimalFormInput
{
    public string Nombre { get; set; } = string.Empty;
    public int RazaId { get; set; }
    public string FechaNacimiento { get; set; } = string.Empty;
    public string Sexo { get; set; } = "Macho";
    public string Tamanio { get; set; } = "Mediano";
    public string Esterilizado { get; set; } = "Sí";
    public bool Activo { get; set; } = true;
    public string? FotoUrl { get; set; }
    public string? Descripcion { get; set; }
}

public class VacunaFormInput
{
    public int AnimalId { get; set; }
    public int TipoVacunaId { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string ProximaDosis { get; set; } = string.Empty;
}

public class ConsultaFormInput
{
    public int AnimalId { get; set; }
    public int VeterinariaId { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string Diagnostico { get; set; } = string.Empty;
    public string Tratamiento { get; set; } = string.Empty;
}

public class UsuarioFormInput
{
    public string Nombre { get; set; } = string.Empty;
    public string ApellidoPaterno { get; set; } = string.Empty;
    public string? ApellidoMaterno { get; set; }
    public string Correo { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Rol { get; set; } = "Voluntario";
}

public class UsuarioRolFormInput
{
    public string Rol { get; set; } = string.Empty;
}

[Route("admin")]
public class AdminPanelController : Controller
{
    private readonly AdminPanelApiClient _api;

    public AdminPanelController(AdminPanelApiClient api) => _api = api;

    // ==================== INVENTARIO (CU-03, CU-04, HU-02) ====================

    [Authorize(Roles = "Administrador,Coordinador")]
    [HttpGet("inventario")]
    public Task<IActionResult> Inventario(CancellationToken ct) =>
        RenderInventarioAsync(null, null, ct);

    [Authorize(Roles = "Administrador,Coordinador")]
    [HttpPost("inventario")]
    public async Task<IActionResult> CrearAnimal([FromBody] AnimalFormInput input, CancellationToken ct)
    {
        if (!DateTime.TryParse(input.FechaNacimiento, out var fechaNac))
            return await RenderInventarioAsync(null, "Ingrese una fecha de nacimiento válida.", ct);

        var dto = new AnimalCrearDTO
        {
            Nombre = input.Nombre.Trim(),
            RazaId = input.RazaId,
            FechaNacimiento = DateTime.SpecifyKind(fechaNac, DateTimeKind.Utc),
            Sexo = input.Sexo,
            Tamanio = input.Tamanio,
            Esterilizado = input.Esterilizado,
            Activo = input.Activo,
            FotoUrl = string.IsNullOrWhiteSpace(input.FotoUrl) ? null : input.FotoUrl.Trim(),
            Descripcion = string.IsNullOrWhiteSpace(input.Descripcion) ? null : input.Descripcion.Trim()
        };

        var (ok, error) = await _api.CrearAnimalAsync(dto, ct);
        return await RenderInventarioAsync(
            ok ? $"Animal '{dto.Nombre}' registrado en el inventario!" : null,
            ok ? null : error,
            ct);
    }

    [Authorize(Roles = "Administrador,Coordinador")]
    [HttpPost("inventario/{id:int:min(1)}/editar")]
    public async Task<IActionResult> EditarAnimal(int id, [FromBody] AnimalFormInput input, CancellationToken ct)
    {
        if (!DateTime.TryParse(input.FechaNacimiento, out var fechaNac))
            return await RenderInventarioAsync(null, "Ingrese una fecha de nacimiento válida.", ct);

        var dto = new AnimalActualizarDTO
        {
            Nombre = input.Nombre.Trim(),
            RazaId = input.RazaId,
            FechaNacimiento = DateTime.SpecifyKind(fechaNac, DateTimeKind.Utc),
            Sexo = input.Sexo,
            Tamanio = input.Tamanio,
            Esterilizado = input.Esterilizado,
            Activo = input.Activo,
            FotoUrl = string.IsNullOrWhiteSpace(input.FotoUrl) ? null : input.FotoUrl.Trim(),
            Descripcion = string.IsNullOrWhiteSpace(input.Descripcion) ? null : input.Descripcion.Trim()
        };

        var (ok, error) = await _api.ActualizarAnimalAsync(id, dto, ct);
        return await RenderInventarioAsync(
            ok ? $"Ficha de '{dto.Nombre}' actualizada con éxito!" : null,
            ok ? null : error,
            ct);
    }

    [Authorize(Roles = "Administrador,Coordinador")]
    [HttpPost("inventario/{id:int:min(1)}/desactivar")]
    public async Task<IActionResult> DesactivarAnimal(int id, CancellationToken ct)
    {
        var (ok, error) = await _api.DesactivarAnimalAsync(id, ct);
        return await RenderInventarioAsync(
            ok ? $"Animal #{id} desactivado del catálogo." : null,
            ok ? null : error,
            ct);
    }

    private async Task<IActionResult> RenderInventarioAsync(
        string? flashSuccess, string? flashError, CancellationToken ct)
    {
        try
        {
            var datos = await _api.ObtenerInventarioAsync(ct);
            return Inertia.Render("Admin/InventarioPage", new
            {
                animales = datos.Animales,
                razas = datos.Razas,
                especies = datos.Especies,
                alertasCount = datos.AlertasCount,
                flashSuccess,
                flashError,
                apiError = (string?)null
            });
        }
        catch (Exception ex)
        {
            return Inertia.Render("Admin/InventarioPage", new
            {
                animales = Array.Empty<AnimalDto>(),
                razas = Array.Empty<RazaDto>(),
                especies = Array.Empty<EspecieDto>(),
                alertasCount = 0,
                flashSuccess,
                flashError,
                apiError = ex.Message
            });
        }
    }

    // ==================== HISTORIAL MÉDICO (CU-11, CU-12, CU-15, HU-09, HU-10, HU-14) ====================

    [Authorize(Roles = "Administrador,Coordinador,Veterinario")]
    [HttpGet("historial-medico")]
    public Task<IActionResult> HistorialMedico([FromQuery] int? animalId, CancellationToken ct) =>
        RenderHistorialAsync(animalId, null, null, ct);

    [Authorize(Roles = "Administrador,Coordinador,Veterinario")]
    [HttpPost("historial-medico/vacunas")]
    public async Task<IActionResult> RegistrarVacuna([FromBody] VacunaFormInput input, CancellationToken ct)
    {
        if (!DateTime.TryParse(input.Fecha, out var fecha))
            return await RenderHistorialAsync(input.AnimalId, null, "Seleccione una fecha de aplicación válida.", ct);

        if (!DateTime.TryParse(input.ProximaDosis, out var proxima))
            proxima = fecha.AddYears(1);

        var dto = new VacunacionCrearDTO
        {
            AnimalId = input.AnimalId,
            TipoVacunaId = input.TipoVacunaId,
            Fecha = DateTime.SpecifyKind(fecha, DateTimeKind.Utc),
            ProximaDosis = DateTime.SpecifyKind(proxima, DateTimeKind.Utc)
        };

        var (ok, error) = await _api.RegistrarVacunaAsync(dto, ct);
        return await RenderHistorialAsync(
            input.AnimalId,
            ok ? "Vacuna registrada correctamente en el carnet!" : null,
            ok ? null : error,
            ct);
    }

    [Authorize(Roles = "Administrador,Coordinador,Veterinario")]
    [HttpPost("historial-medico/consultas")]
    public async Task<IActionResult> RegistrarConsulta([FromBody] ConsultaFormInput input, CancellationToken ct)
    {
        if (!DateTime.TryParse(input.Fecha, out var fecha))
            return await RenderHistorialAsync(input.AnimalId, null, "Seleccione una fecha de consulta válida.", ct);

        var dto = new ConsultaCrearDTO
        {
            AnimalId = input.AnimalId,
            VeterinariaId = input.VeterinariaId,
            Fecha = DateTime.SpecifyKind(fecha, DateTimeKind.Utc),
            Diagnostico = input.Diagnostico.Trim(),
            Tratamiento = input.Tratamiento.Trim()
        };

        var (ok, error) = await _api.RegistrarConsultaAsync(dto, ct);
        return await RenderHistorialAsync(
            input.AnimalId,
            ok ? "Consulta veterinaria registrada en el historial!" : null,
            ok ? null : error,
            ct);
    }

    private async Task<IActionResult> RenderHistorialAsync(
        int? animalId, string? flashSuccess, string? flashError, CancellationToken ct)
    {
        try
        {
            var datos = await _api.ObtenerHistorialMedicoAsync(ct);
            return Inertia.Render("Admin/HistorialMedicoPage", new
            {
                selectedAnimalId = animalId,
                animales = datos.Animales,
                razas = datos.Razas,
                vacunaciones = datos.Vacunaciones,
                tiposVacunas = datos.TiposVacunas,
                consultas = datos.Consultas,
                veterinarias = datos.Veterinarias,
                solicitudes = datos.Solicitudes,
                seguimientos = datos.Seguimientos,
                alertasCount = datos.AlertasCount,
                flashSuccess,
                flashError,
                apiError = (string?)null
            });
        }
        catch (Exception ex)
        {
            return Inertia.Render("Admin/HistorialMedicoPage", new
            {
                selectedAnimalId = animalId,
                animales = Array.Empty<AnimalDto>(),
                razas = Array.Empty<RazaDto>(),
                vacunaciones = Array.Empty<VacunacionDto>(),
                tiposVacunas = Array.Empty<TipoVacunaDto>(),
                consultas = Array.Empty<ConsultaDto>(),
                veterinarias = Array.Empty<VeterinariaDto>(),
                solicitudes = Array.Empty<SolicitudDto>(),
                seguimientos = Array.Empty<SeguimientoDto>(),
                alertasCount = 0,
                flashSuccess,
                flashError,
                apiError = ex.Message
            });
        }
    }

    // ==================== ALERTAS (CU-14, HU-13, RN-06) ====================

    [Authorize(Roles = "Administrador,Coordinador,Veterinario")]
    [HttpGet("alertas")]
    public async Task<IActionResult> Alertas(CancellationToken ct)
    {
        try
        {
            var datos = await _api.ObtenerAlertasAsync(ct);
            return Inertia.Render("Admin/AlertasPage", new
            {
                alertas = datos.Alertas,
                seguimientos = datos.Seguimientos,
                solicitudes = datos.Solicitudes,
                animales = datos.Animales,
                adoptantes = datos.Adoptantes,
                vacunaciones = datos.Vacunaciones,
                tiposVacunas = datos.TiposVacunas,
                alertasCount = datos.Alertas.Count,
                apiError = (string?)null
            });
        }
        catch (Exception ex)
        {
            return Inertia.Render("Admin/AlertasPage", new
            {
                alertas = Array.Empty<AlertaDto>(),
                seguimientos = Array.Empty<SeguimientoDto>(),
                solicitudes = Array.Empty<SolicitudDto>(),
                animales = Array.Empty<AnimalDto>(),
                adoptantes = Array.Empty<AdoptanteDto>(),
                vacunaciones = Array.Empty<VacunacionDto>(),
                tiposVacunas = Array.Empty<TipoVacunaDto>(),
                alertasCount = 0,
                apiError = ex.Message
            });
        }
    }

    // ==================== USUARIOS (CU-02 — Administrador) ====================

    [Authorize(Roles = "Administrador")]
    [HttpGet("usuarios")]
    public Task<IActionResult> Usuarios(CancellationToken ct) =>
        RenderUsuariosAsync(null, null, ct);

    [Authorize(Roles = "Administrador")]
    [HttpPost("usuarios")]
    public async Task<IActionResult> CrearUsuario([FromBody] UsuarioFormInput input, CancellationToken ct)
    {
        if (!Enum.TryParse<RolUsuario>(input.Rol, ignoreCase: true, out var rol))
            return await RenderUsuariosAsync(null, "Seleccione un rol válido.", ct);

        var dto = new UsuarioCrearDto
        {
            Nombre = input.Nombre.Trim(),
            ApellidoPaterno = input.ApellidoPaterno.Trim(),
            ApellidoMaterno = string.IsNullOrWhiteSpace(input.ApellidoMaterno) ? null : input.ApellidoMaterno.Trim(),
            Correo = input.Correo.Trim(),
            NombreUsuario = input.NombreUsuario.Trim(),
            Password = input.Password,
            Rol = rol,
            Activo = true
        };

        var (ok, error) = await _api.CrearUsuarioAsync(dto, ct);
        return await RenderUsuariosAsync(
            ok ? $"Usuario '{dto.Correo}' creado con rol {rol}!" : null,
            ok ? null : error,
            ct);
    }

    [Authorize(Roles = "Administrador")]
    [HttpPost("usuarios/{id:int:min(1)}/rol")]
    public async Task<IActionResult> CambiarRolUsuario(int id, [FromBody] UsuarioRolFormInput input, CancellationToken ct)
    {
        if (!Enum.TryParse<RolUsuario>(input.Rol, ignoreCase: true, out var rol))
            return await RenderUsuariosAsync(null, "Seleccione un rol válido.", ct);

        var (ok, error) = await _api.CambiarRolUsuarioAsync(id, rol, ct);
        return await RenderUsuariosAsync(
            ok ? $"Rol del usuario #{id} actualizado a {rol}!" : null,
            ok ? null : error,
            ct);
    }

    private async Task<IActionResult> RenderUsuariosAsync(
        string? flashSuccess, string? flashError, CancellationToken ct)
    {
        try
        {
            var (usuarios, alertasCount) = await _api.ObtenerUsuariosAsync(ct);
            return Inertia.Render("Admin/UsuariosPage", new
            {
                usuarios,
                alertasCount,
                flashSuccess,
                flashError,
                apiError = (string?)null
            });
        }
        catch (Exception ex)
        {
            return Inertia.Render("Admin/UsuariosPage", new
            {
                usuarios = Array.Empty<UsuarioDto>(),
                alertasCount = 0,
                flashSuccess,
                flashError,
                apiError = ex.Message
            });
        }
    }

    // ==================== REPORTES CSV (CU-16, HU-15) ====================

    [Authorize(Roles = "Administrador,Coordinador")]
    [HttpGet("reportes")]
    public async Task<IActionResult> Reportes(CancellationToken ct)
    {
        try
        {
            var datos = await _api.ObtenerReportesAsync(ct);
            return Inertia.Render("Admin/ReportesPage", new
            {
                solicitudes = datos.Solicitudes,
                animales = datos.Animales,
                adoptantes = datos.Adoptantes,
                seguimientos = datos.Seguimientos,
                vacunaciones = datos.Vacunaciones,
                tiposVacunas = datos.TiposVacunas,
                alertasCount = datos.Alertas.Count,
                apiError = (string?)null
            });
        }
        catch (Exception ex)
        {
            return Inertia.Render("Admin/ReportesPage", new
            {
                solicitudes = Array.Empty<SolicitudDto>(),
                animales = Array.Empty<AnimalDto>(),
                adoptantes = Array.Empty<AdoptanteDto>(),
                seguimientos = Array.Empty<SeguimientoDto>(),
                vacunaciones = Array.Empty<VacunacionDto>(),
                tiposVacunas = Array.Empty<TipoVacunaDto>(),
                alertasCount = 0,
                apiError = ex.Message
            });
        }
    }

    [Authorize(Roles = "Administrador,Coordinador")]
    [HttpGet("reportes/csv/adopciones")]
    public async Task<IActionResult> DescargarAdopcionesCsv(
        [FromQuery] DateTime? desde, [FromQuery] DateTime? hasta, CancellationToken ct)
    {
        var datos = await _api.ObtenerReportesAsync(ct);
        var q = datos.Solicitudes.Where(s => s.Estado == EstadoSolicitud.Aprobada);
        if (desde.HasValue) q = q.Where(s => (s.FechaResolucion ?? s.FechaSolicitud) >= desde.Value);
        if (hasta.HasValue) q = q.Where(s => (s.FechaResolucion ?? s.FechaSolicitud) <= hasta.Value.AddDays(1));

        var sb = new StringBuilder();
        sb.AppendLine("IdSolicitud,Mascota,Adoptante,FechaSolicitud,FechaAprobacion,Estado");
        foreach (var s in q.OrderByDescending(x => x.FechaResolucion ?? x.FechaSolicitud))
        {
            sb.AppendLine(string.Join(",",
                s.IdSolicitud,
                Csv(s.AnimalNombre),
                Csv(s.AdoptanteNombre),
                s.FechaSolicitud.ToString("yyyy-MM-dd"),
                s.FechaResolucion?.ToString("yyyy-MM-dd") ?? "",
                s.Estado));
        }
        return CsvFile(sb.ToString(), "reporte-adopciones.csv");
    }

    [Authorize(Roles = "Administrador,Coordinador")]
    [HttpGet("reportes/csv/seguimientos-vencidos")]
    public async Task<IActionResult> DescargarSeguimientosVencidosCsv(CancellationToken ct)
    {
        var datos = await _api.ObtenerReportesAsync(ct);
        var ahora = DateTime.UtcNow;
        var vencidos = datos.Seguimientos.Where(s =>
            s.Estado == EstadoSeguimiento.Vencido ||
            (s.Estado == EstadoSeguimiento.Pendiente && s.FechaProgramada < ahora));

        var sb = new StringBuilder();
        sb.AppendLine("IdSeguimiento,SolicitudId,Mascota,Adoptante,HitoDias,FechaProgramada,DiasAtraso,Estado");
        foreach (var s in vencidos.OrderBy(x => x.FechaProgramada))
        {
            var diasAtraso = Math.Max(0, (int)(ahora - s.FechaProgramada).TotalDays);
            sb.AppendLine(string.Join(",",
                s.IdSeguimiento,
                s.SolicitudId,
                Csv(s.AnimalNombre),
                Csv(s.AdoptanteNombre),
                (int)s.Hito,
                s.FechaProgramada.ToString("yyyy-MM-dd"),
                diasAtraso,
                s.Estado));
        }
        return CsvFile(sb.ToString(), "reporte-seguimientos-vencidos.csv");
    }

    [Authorize(Roles = "Administrador,Coordinador")]
    [HttpGet("reportes/csv/vacunas-proximas")]
    public async Task<IActionResult> DescargarVacunasProximasCsv([FromQuery] int dias = 30, CancellationToken ct = default)
    {
        var datos = await _api.ObtenerReportesAsync(ct);
        var limite = DateTime.UtcNow.AddDays(Math.Clamp(dias, 1, 365));
        var proximas = datos.Vacunaciones
            .Where(v => v.ProximaDosis.HasValue && v.ProximaDosis.Value <= limite)
            .OrderBy(v => v.ProximaDosis);

        var sb = new StringBuilder();
        sb.AppendLine("IdVacunacion,Mascota,Vacuna,FechaAplicacion,ProximaDosis,DiasRestantes");
        foreach (var v in proximas)
        {
            var restantes = (int)(v.ProximaDosis!.Value - DateTime.UtcNow).TotalDays;
            sb.AppendLine(string.Join(",",
                v.IdVacunacion,
                Csv(v.AnimalNombre),
                Csv(v.TipoVacunaNombre),
                v.Fecha.ToString("yyyy-MM-dd"),
                v.ProximaDosis.Value.ToString("yyyy-MM-dd"),
                restantes));
        }
        return CsvFile(sb.ToString(), "reporte-vacunas-proximas.csv");
    }

    [Authorize(Roles = "Administrador,Coordinador")]
    [HttpGet("reportes/csv/permanencia-refugio")]
    public async Task<IActionResult> DescargarPermanenciaCsv(CancellationToken ct)
    {
        var datos = await _api.ObtenerReportesAsync(ct);
        var aprobadas = datos.Solicitudes
            .Where(s => s.Estado == EstadoSolicitud.Aprobada && s.FechaResolucion.HasValue)
            .ToList();

        var sb = new StringBuilder();
        sb.AppendLine("IdSolicitud,Mascota,Adoptante,FechaSolicitud,FechaResolucion,DiasEnProceso");
        foreach (var s in aprobadas.OrderByDescending(x => x.FechaResolucion))
        {
            var diasProceso = Math.Max(0, (int)(s.FechaResolucion!.Value - s.FechaSolicitud).TotalDays);
            sb.AppendLine(string.Join(",",
                s.IdSolicitud,
                Csv(s.AnimalNombre),
                Csv(s.AdoptanteNombre),
                s.FechaSolicitud.ToString("yyyy-MM-dd"),
                s.FechaResolucion.Value.ToString("yyyy-MM-dd"),
                diasProceso));
        }
        return CsvFile(sb.ToString(), "reporte-permanencia-refugio.csv");
    }

    private FileContentResult CsvFile(string content, string fileName)
    {
        // UTF-8 with BOM so Excel displays Spanish accents properly
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(content)).ToArray();
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }

    private static string Csv(string? value)
    {
        var v = value ?? "";
        return $"\"{v.Replace("\"", "\"\"")}\"";
    }
}
