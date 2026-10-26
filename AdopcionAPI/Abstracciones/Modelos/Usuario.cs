using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Abstracciones.Modelos
{
    public class Usuario
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ID_USUARIO")]
        public int IdUsuario { get; set; }

        [Column("NOMBRE"), Required, MaxLength(100)]
        public string Nombre { get; set; } = null!;

        [Column("APELLIDO_PATERNO"), Required, MaxLength(100)]
        public string ApellidoPaterno { get; set; } = null!;

        [Column("APELLIDO_MATERNO"), MaxLength(100)]
        public string? ApellidoMaterno { get; set; }

        [Column("CORREO"), Required, MaxLength(150)]
        public string Correo { get; set; } = null!;

        [Column("NOMBRE_USUARIO"), Required, MaxLength(50)]
        public string NombreUsuario { get; set; } = null!;

        [Column("CONTRASENIA_HASH"), Required]
        public string ContraseniaHash { get; set; } = null!;

        [Column("ACTIVO")]
        public bool Activo { get; set; } = true;


    }
}
