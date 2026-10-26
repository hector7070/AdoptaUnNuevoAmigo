using Abstracciones.Interfaces.IUsuario;
using Abstracciones.Modelos;
using DA.Usuarios;
using System;
using System.Collections.Generic;
using System.Text;

namespace Flujo.Usuarios
{
    //Flujo de Usuarios
    public class UsuarioFlujo : IUsuarioFlujo
    {

        private readonly IUsuarioDA _usuarioDA;

        public UsuarioFlujo(IUsuarioDA usuarioDA)
        {
            _usuarioDA = usuarioDA;
        }

        public Task<bool> ActualizarUsuario(Usuario usuairo, int id)
        {
            return _usuarioDA.ActualizarUsuario(usuairo, id);
        }

        public Task<bool> EliminarUsuario(int id)
        {
            return _usuarioDA.EliminarUsuario(id);
        }

        public Task<Usuario> GuardarUsuario(Usuario usuario)
        {
            return _usuarioDA.GuardarUsuario(usuario);
        }

        public Task<List<Usuario>> Obtener()
        {
            return _usuarioDA.Obtener();
        }

        public Task<Usuario> ObtenerPorId(int id)
        {
            return _usuarioDA.ObtenerPorId(id);
        }
    }
}
