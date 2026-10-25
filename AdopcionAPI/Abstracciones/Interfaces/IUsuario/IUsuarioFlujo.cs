using Abstracciones.Modelos;
using System;
using System.Collections.Generic;
using System.Text;

namespace Abstracciones.Interfaces.IUsuario
{
    public interface IUsuarioFlujo
    {

        Task<List<Usuario>> Obtener();

        Task<Usuario> ObtenerPorId(int id);

        Task<Usuario> GuardarUsuario(Usuario usuario);

        Task<bool> ActualizarUsuario(Usuario usuairo, int id);

        Task<bool> EliminarUsuario(int id);


    }
}
