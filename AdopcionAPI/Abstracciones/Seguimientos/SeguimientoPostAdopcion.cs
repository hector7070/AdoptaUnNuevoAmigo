using Abstracciones.Solicitudes;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Abstracciones.Seguimientos
{

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum HitoSeguimiento { Dias30 = 30, Dias60 = 60, Dias90 = 90 }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EstadoSeguimiento { Pendiente, Favorable, Desfavorable, Vencido, Omitido }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum TipoEventoAdopcion { AdopcionDefinitiva, AdopcionFallida }

    public class SeguimientoPostAdopcion
    {

        public int IdSeguimiento { get; set; }
        public int SolicitudId { get; set; }
        public HitoSeguimiento Hito { get; set; }
        public DateTime FechaProgramada { get; set; }
        public DateTime? FechaRealizada { get; set; }
        public EstadoSeguimiento Estado { get; set; } = EstadoSeguimiento.Pendiente;
        public string? Observaciones { get; set; }

        public SolicitudAdopcion Solicitud { get; set; } = null!;

    }

    public class AlertaSeguimiento
    {
        public int IdAlerta { get; set; }
        public int SeguimientoId { get; set; }
        public DateTime FechaCreacion { get; set; }
        public string Mensaje { get; set; } = null!;
        public bool EscaladaAlCoordinador { get; set; }
        public DateTime? FechaEscalada { get; set; }
    }

    /// <summary>Bitácora: deja registrado el cierre (exitoso o fallido) de una adopción.</summary>
    public class EventoAdopcion
    {
        public int IdEvento { get; set; }
        public int SolicitudId { get; set; }
        public int AnimalId { get; set; }
        public TipoEventoAdopcion Tipo { get; set; }
        public DateTime Fecha { get; set; }
        public string Detalle { get; set; } = null!;
    }

    public class SeguimientoOpciones
    {
        public const string Seccion = "Seguimientos";
        public int IntervaloMinutos { get; set; } = 60;
    }


}
