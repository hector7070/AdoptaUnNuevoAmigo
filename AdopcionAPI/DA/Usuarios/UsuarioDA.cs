using Abstracciones.Excepciones;
using Abstracciones.Modelos;
using Abstracciones.Usuarios;
using DA.Comunes;
using DA.Contexto.UsuarioContexto;
using Microsoft.EntityFrameworkCore;

namespace DA.Usuarios
{
    public class UsuarioDA : IUsuarioDA
    {
        private readonly UsuarioContexto _ctx;

        public UsuarioDA(UsuarioContexto ctx) => _ctx = ctx;

        public Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken ct) =>
            _ctx.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Correo == correo, ct);

        public Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken ct) =>
            _ctx.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.IdUsuario == id, ct);

        public Task<bool> ExisteCorreoAsync(string correo, CancellationToken ct) =>
            _ctx.Usuarios.AnyAsync(u => u.Correo == correo, ct);

        public async Task<Usuario> AgregarAsync(Usuario usuario, CancellationToken ct)
        {
            _ctx.Usuarios.Add(usuario);
            try
            {
                await _ctx.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ErroresSql.EsDuplicado(ex))
            {
                throw new ConflictoException($"Ya existe un usuario con el correo '{usuario.Correo}'.");
            }
            return usuario;
        }

        public async Task<bool> GuardarCambiosAsync(Usuario usuario, CancellationToken ct)
        {
            var existente = await _ctx.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == usuario.IdUsuario, ct);
            if (existente is null) return false;

            existente.Nombre = usuario.Nombre;
            existente.ApellidoPaterno = usuario.ApellidoPaterno;
            existente.ApellidoMaterno = usuario.ApellidoMaterno;
            existente.Correo = usuario.Correo;
            existente.NombreUsuario = usuario.NombreUsuario;
            existente.Rol = usuario.Rol;
            existente.Activo = usuario.Activo;

            try
            {
                await _ctx.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ErroresSql.EsDuplicado(ex))
            {
                throw new ConflictoException($"Ya existe un usuario con el correo '{usuario.Correo}'.");
            }
            return true;
        }

        public Task<List<Usuario>> ListarAsync(CancellationToken ct) =>
            _ctx.Usuarios.AsNoTracking().OrderBy(u => u.Nombre).ToListAsync(ct);
    }
}
