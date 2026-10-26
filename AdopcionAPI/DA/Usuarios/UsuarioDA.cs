using Abstracciones.Interfaces.IUsuario;
using Abstracciones.Modelos;
using DA.Contexto.AdopcionContexto;
using DA.Contexto.UsuarioContexto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace DA.Usuarios
{
    public class UsuarioDA : IUsuarioDA
    {

        private readonly UsuarioContexto _contexto;

        public UsuarioDA(UsuarioContexto contexto)
        {
            _contexto = contexto;
        }

        public async Task<bool> ActualizarUsuario(Usuario usuario, int id)
        {
            var existe = await _contexto.Usuarios.FindAsync(id);
            if (existe is null) return false;

            existe.Nombre = usuario.Nombre;
            existe.ApellidoPaterno = usuario.ApellidoPaterno;
            existe.ApellidoMaterno = usuario.ApellidoMaterno;
            existe.NombreUsuario = usuario.NombreUsuario;
            existe.Correo = usuario.Correo;
            existe.ContraseniaHash = usuario.ContraseniaHash;
            existe.Activo = usuario.Activo;
            existe.IdUsuario = usuario.IdUsuario;
            await _contexto.SaveChangesAsync();
            return true;
        }

        public async Task<bool> EliminarUsuario(int id)
        {
            var existe = await _contexto.Usuarios.FindAsync(id);
            if (existe is null) return false;
            existe.Activo = false;
            await _contexto.SaveChangesAsync();
            return true;
        }

        public async Task<Usuario> GuardarUsuario(Usuario usuario)
        {
            _contexto.Usuarios.Add(usuario);
            await _contexto.SaveChangesAsync();
            return usuario;
        }

        public async Task<List<Usuario>> Obtener() => await _contexto.Usuarios.AsNoTracking().ToListAsync();

        public async Task<Usuario> ObtenerPorId(int id) => await _contexto.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.IdUsuario == id);
    }
}
