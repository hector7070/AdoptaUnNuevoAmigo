using Abstracciones.Modelos;
using System;
using System.Collections.Generic;
using System.Text;

namespace Abstracciones.Interfaces
{
    public interface IEspecieFlujo
    {
        Task<List<Especie>> Obtener();
        Task<Especie?> ObtenerPorId(int id);
        Task<Especie> Agregar(Especie especie);
        Task<bool> Actualizar(int id, Especie datos);
        Task<bool> Eliminar(int id);
    }
}
