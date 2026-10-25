using Abstracciones.Modelos;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace DA.Contexto.AdopcionContexto
{
    public class AdopcionContexto : DbContext
    {
        //las opciones llegan por inyección de dependencias desde program.cs
        public AdopcionContexto(DbContextOptions<AdopcionContexto> options) : base(options)
        {
        }
        //cada dbset se convierte en una tabla, el nombre de la propiedad define el nombre de la tabla
        public DbSet<Especie> Especies => Set<Especie>();
    }
}
