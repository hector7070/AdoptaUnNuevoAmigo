using Abstracciones.Interfaces;
using Abstracciones.Modelos;
using System;
using System.Collections.Generic;
using System.Text;

namespace Flujo
{
    public class EspecieFlujo : IEspecieFlujo
    {
        private readonly IEspecieDA _especieDA;

        public EspecieFlujo(IEspecieDA especieDA) => _especieDA = especieDA;

        public Task<List<Especie>> Obtener() => _especieDA.Obtener();

        public Task<Especie?> ObtenerPorId(int id) => _especieDA.ObtenerPorId(id);

        public Task<Especie> Agregar(Especie especie)
        {
            especie.Nombre = especie.Nombre.Trim();

            if (!string.IsNullOrWhiteSpace(especie.Descripcion))
            {
                especie.Descripcion = especie.Descripcion.Trim();
            }

            return _especieDA.Agregar(especie);
        }

        public Task<bool> Actualizar(int id, Especie datos)
        {
            datos.Nombre = datos.Nombre.Trim();

            if (!string.IsNullOrWhiteSpace(datos.Descripcion))
            {
                datos.Descripcion = datos.Descripcion.Trim();
            }

            return _especieDA.Actualizar(id, datos);
        }

        public Task<bool> Eliminar(int id) => _especieDA.Eliminar(id);
    }
}
