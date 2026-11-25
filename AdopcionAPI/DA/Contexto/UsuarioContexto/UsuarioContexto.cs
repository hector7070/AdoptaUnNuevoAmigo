using Abstracciones.Modelos;
using Microsoft.EntityFrameworkCore;

namespace DA.Contexto.UsuarioContexto
{
    public class UsuarioContexto: DbContext
    {

        public UsuarioContexto(DbContextOptions<UsuarioContexto> options) : base(options)
        {
        }
        //cada dbset se convierte en una tabla, el nombre de la propiedad define el nombre de la tabla
        public DbSet<Usuario> Usuarios => Set<Usuario>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // La configuración vive aquí y no en una clase IEntityTypeConfiguration:
            // AdopcionContexto aplica TODAS las configuraciones del ensamblado y no debe ver la tabla Usuarios.
            modelBuilder.Entity<Usuario>(b =>
            {
                b.ToTable("Usuarios");
                b.HasKey(u => u.IdUsuario);

                b.Property(u => u.Nombre).IsRequired().HasMaxLength(100);
                b.Property(u => u.ApellidoPaterno).IsRequired().HasMaxLength(100);
                b.Property(u => u.ApellidoMaterno).HasMaxLength(100);
                b.Property(u => u.Correo).IsRequired().HasMaxLength(150);
                b.Property(u => u.NombreUsuario).IsRequired().HasMaxLength(50);
                b.Property(u => u.ContraseniaHash).IsRequired().HasMaxLength(500);

                // El rol se guarda como texto: agregar un rol nuevo no invalida los datos existentes.
                b.Property(u => u.Rol).HasConversion<string>().HasMaxLength(30).IsRequired();

                b.HasIndex(u => u.Correo).IsUnique();
                b.HasIndex(u => u.NombreUsuario).IsUnique();
            });
        }

    }

}
