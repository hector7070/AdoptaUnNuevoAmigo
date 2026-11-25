using Abstracciones.Razas;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Abstracciones.Animales
{

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EstadoAnimal { Disponible, EnProceso, EnSeguimiento, Adoptado, NoAdoptable }


    public class Animal
    {

        public int IdAnimal { get; set; }
        public string Nombre { get; set; } = null!;
        public int RazaId { get; set; }
        public DateTime FechaNacimiento { get; set; }
        public string Sexo { get; set; } = null!;
        public String Tamanio { get; set; } = null!;
        public String Esterilizado { get; set; } = null!;

        public bool Activo { get; set; } = true;

        public Raza? Raza { get; set; }

        public EstadoAnimal Estado { get; set; } = EstadoAnimal.Disponible;

        public string? FotoUrl { get; set; }
        public string? Descripcion { get; set; }

    }
}
