using Abstracciones.Modelos;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace DA.Contexto.UsuarioContexto
{
    public class UsuarioContexto: DbContext
    {

        public UsuarioContexto(DbContextOptions<UsuarioContexto> options) : base(options)
        {
        }
        //cada dbset se convierte en una tabla, el nombre de la propiedad define el nombre de la tabla
        public DbSet<Usuario> Usuarios => Set<Usuario>();

    }

}
