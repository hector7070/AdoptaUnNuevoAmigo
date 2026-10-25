using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Abstracciones.Modelos
{
    public class TipoVivienda
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ID_TIPO_VIVIENDA")]
        public int IdTipoVivienda { get; set; }

    }
}

