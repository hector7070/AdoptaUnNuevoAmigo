using Abstracciones.Adoptantes;
using Abstracciones.Animales;
using Abstracciones.Comunes;
using Abstracciones.Excepciones;
using DA.Animales;
using DA.Comunes;
using DA.Contexto.AdopcionContexto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace DA.Adoptantes
{
    public class AdoptanteDA : IAdoptanteDA
    {
        private readonly AdopcionContexto _adoptanteContexto;

        public AdoptanteDA(AdopcionContexto adoptanteContexto)
        {
           _adoptanteContexto = adoptanteContexto;
        }

        public async Task<bool> ActualizarAsync(Adoptante datos, CancellationToken ct)
        {
            var existente = await _adoptanteContexto.Adoptantes.FirstOrDefaultAsync(a => a.IdAdoptante == datos.IdAdoptante, ct);
            if (existente is null) return false;

            existente.Nombre = datos.Nombre;
            existente.Identificacion = datos.Identificacion;
            existente.Contacto = datos.Contacto;
            existente.OtrasMascotas = datos.OtrasMascotas;
            existente.TipoViviendaId = datos.TipoViviendaId;
            existente.FechaRegistro = datos.FechaRegistro;
            existente.Activo = datos.Activo;

            try
            {
                await _adoptanteContexto.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ErroresSql.EsDuplicado(ex))
            {
                throw new ConflictoException($"Ya existe otro adoptante con el nombre '{datos.Nombre}'.");
            }
            return true;
        }

        public async Task<Adoptante> AgregarAsync(Adoptante adoptante, CancellationToken ct)
        {
            _adoptanteContexto.Adoptantes.Add(adoptante);
            try
            {
                await _adoptanteContexto.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ErroresSql.EsDuplicado(ex))
            {
                throw new ConflictoException($"Ya existe un adoptante con el nombre '{adoptante.Nombre}'.");
            }
            return adoptante;
        }

        public async Task<ResultadoPaginado<Adoptante>> BuscarAsync(AdoptanteDtos.AdoptanteFiltro filtro, CancellationToken ct)
        {
            var consulta = _adoptanteContexto.Adoptantes.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(filtro.Q))
            {
                // Contains se traduce a LIKE con los comodines escapados. En SQL Server la comparación
                // no distingue mayúsculas por la collation por defecto.
                var texto = filtro.Q.Trim();
                consulta = consulta.Where(t => t.Nombre.Contains(texto) || t.Identificacion.Contains(texto) || t.Contacto.Contains(texto) || t.OtrasMascotas.Contains(texto));
            }

            var total = await consulta.CountAsync(ct);

            var items = await AdoptanteConsultas.Ordenar(consulta, filtro.Orden)
                .Include(t => t.TipoVivienda)
                .Skip((filtro.Pagina - 1) * filtro.Tamano)
                .Take(filtro.Tamano)
                .ToListAsync(ct);

            return new ResultadoPaginado<Adoptante>
            {
                Items = items,
                Total = total,
                Pagina = filtro.Pagina,
                Tamano = filtro.Tamano
            };
        }

        public async Task<bool> EliminarAsync(int id, CancellationToken ct)
        {
            var existente = await _adoptanteContexto.Adoptantes.FirstOrDefaultAsync(a => a.IdAdoptante == id, ct);
            if (existente is null) return false;

            // 1. Cambio a eliminación lógica
            existente.Activo = false;
            _adoptanteContexto.Adoptantes.Update(existente);

            try
            {
                await _adoptanteContexto.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ErroresSql.EsLlaveForanea(ex))
            {
                throw new ConflictoException("Error.");
            }
            return true;
        }

        public Task<Adoptante?> ObtenerPorIdAsync(int id, CancellationToken ct) =>
        _adoptanteContexto.Adoptantes.AsNoTracking().Include(a => a.TipoVivienda).FirstOrDefaultAsync(a => a.IdAdoptante == id, ct);
    }
}
