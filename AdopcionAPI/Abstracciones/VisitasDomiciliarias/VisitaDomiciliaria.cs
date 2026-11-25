using Abstracciones.Solicitudes;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Abstracciones.VisitasDomiciliarias
{

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum ResultadoVisita { Pendiente, Favorable, Desfavorable } // Pendiente = 0: el índice filtrado depende de eso


    public class Voluntario
    {
        public int IdVoluntario { get; set; }
        public string Nombre { get; set; } = null!;
        public string Contacto { get; set; } = null!;
        public bool Activo { get; set; } = true;
    }

    public class VisitaDomiciliaria
    {
        public int IdVisita { get; set; }
        public int SolicitudId { get; set; }
        public int VoluntarioId { get; set; }
        public DateTime Fecha { get; set; }
        public ResultadoVisita Resultado { get; set; } = ResultadoVisita.Pendiente;
        public string? Observaciones { get; set; }

        public SolicitudAdopcion Solicitud { get; set; } = null!;
        public Voluntario Voluntario { get; set; } = null!;
    }
}
