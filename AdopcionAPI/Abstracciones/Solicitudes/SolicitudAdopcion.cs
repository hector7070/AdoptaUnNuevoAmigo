using Abstracciones.Adoptantes;
using Abstracciones.Animales;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Abstracciones.Solicitudes
{

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EstadoSolicitud { Enviada, EnRevision, VisitaProgramada, Aprobada, Rechazada, Cancelada }
    // ORDEN IMPORTA: el índice filtrado de abajo usa los valores 0,1,2 (los activos).

    public class SolicitudAdopcion
    {
    
            public int IdSolicitud { get; set; }
            public int AnimalId { get; set; }
            public int AdoptanteId { get; set; }
            public DateTime FechaSolicitud { get; set; }
            public DateTime? FechaResolucion { get; set; }   // se llena al aprobar/rechazar/cancelar
            public EstadoSolicitud Estado { get; set; } = EstadoSolicitud.Enviada;

            public Animal Animal { get; set; } = null!;
            public Adoptante Adoptante { get; set; } = null!;
     
    }


    public class ReglasAdopcionOpciones
    {
        public const string Seccion = "ReglasAdopcion";
        public int DiasEsperaTrasRechazo { get; set; } = 30;
        public int MaxAnimalesEnSeguimiento { get; set; } = 2;
    }


}
