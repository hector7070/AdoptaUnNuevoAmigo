using Abstracciones.TiposViviendas;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Abstracciones.Adoptantes
{

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EstadoAdoptante { Activo, EnEspera }

    public class Adoptante
    {

        public int IdAdoptante { get; set; }
        public string Identificacion { get; set; }
        public string Nombre { get; set; }
        public string Contacto { get; set; }
        public string OtrasMascotas { get; set; }
        public int TipoViviendaId { get; set; }

        public TipoVivienda TipoVivienda { get; set; }

        public DateTime FechaRegistro { get; set; }
       
        public bool Activo { get; set; }


    }
}
