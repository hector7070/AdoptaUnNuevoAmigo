using Abstracciones.Interfaces.IEspecie;
using Abstracciones.Modelos;
using DA.Contexto.AdopcionContexto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace DA
{
    public class EspecieDA : IEspecieDA
    {
        private readonly AdopcionContexto _contexto;

        public EspecieDA(AdopcionContexto contexto) => _contexto = contexto;

        public async Task<List<Especie>> Obtener() => await _contexto.Especies.AsNoTracking().ToListAsync();

        public async Task<Especie?> ObtenerPorId(int id) => await _contexto.Especies.AsNoTracking().FirstOrDefaultAsync(e => e.IdEspecie == id);

        public async Task<Especie> Agregar(Especie especie)
        {
            _contexto.Especies.Add(especie);
            await _contexto.SaveChangesAsync();
            return especie;
        }

        public async Task<bool> Actualizar(int id, Especie datos)
        {
            var existe = await _contexto.Especies.FindAsync(id);
            if (existe is null) return false;

            existe.Nombre = datos.Nombre;
            existe.Descripcion = datos.Descripcion;
            existe.IdEstado = datos.IdEstado;
            await _contexto.SaveChangesAsync();
            return true;
        }

        public async Task<bool> Eliminar(int id)
        {
            var existe = await _contexto.Especies.FindAsync(id);
            if (existe is null) return false;

            _contexto.Especies.Remove(existe);
            await _contexto.SaveChangesAsync();
            return true;
        }
    }
}