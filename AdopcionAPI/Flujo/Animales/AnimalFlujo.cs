using Abstracciones.Animales;
using Abstracciones.Comunes;
using Abstracciones.Especies;
using Abstracciones.Excepciones;
using Abstracciones.Razas;
using Abstracciones.TiposViviendas;
using DA.Razas;
using Flujo.Razas;
using System;
using System.Collections.Generic;
using System.Text;
using static Abstracciones.Animales.AnimalDtos;

namespace Flujo.Animales
{
    public class AnimalFlujo : IAnimalFlujo
    {

        private readonly IAnimalDA _animalDA;
        private readonly IRazaDA _razaDA;

        private readonly TimeProvider _reloj;

        public AnimalFlujo(IAnimalDA animalDA, TimeProvider reloj, IRazaDA razaDA)
        {
            _reloj = reloj;
            _animalDA = animalDA;
            _razaDA = razaDA;
        }

        public async Task ActualizarAsync(int id, AnimalActualizarDTO dto, CancellationToken ct)
        {

            if (await _razaDA.ObtenerPorIdAsync(dto.RazaId, ct) is null)
                throw new ValidacionNegocioException($"La raza {dto.RazaId} no existe.");

            _ = await _animalDA.ObtenerPorIdAsync(id, ct) ?? throw new NoEncontradoException("Animal", id);

            // La descripción puede repetirse solo si pertenece a la MISMA especie que se está editando.
            var actualizado = await _animalDA.ActualizarAsync(new Animal
            {
                IdAnimal = id,
                Nombre = dto.Nombre.Trim(),
                Esterilizado = dto.Esterilizado.Trim(),
                Sexo = dto.Sexo.Trim(),
                Tamanio = dto.Tamanio.Trim(),
                RazaId = dto.RazaId,
                Activo = dto.Activo,
                FechaNacimiento = dto.FechaNacimiento,
                FotoUrl = dto.FotoUrl?.Trim(),
                Descripcion = dto.Descripcion?.Trim()
            }, ct);

            if (!actualizado) throw new NoEncontradoException("Animal", id);
        }

        public async Task<AnimalDtos.AnimalDto> CrearAsync(AnimalDtos.AnimalCrearDTO dto, CancellationToken ct)
        {
            if (await _razaDA.ObtenerPorIdAsync(dto.RazaId, ct) is null)
                throw new ValidacionNegocioException($"La raza {dto.RazaId} no existe.");


            var animal = new Animal
            {
                // El código lo genera el sistema; el cliente HTTP nunca lo envía.
                Nombre = dto.Nombre.Trim(),
                Esterilizado = dto.Esterilizado.Trim(),
                Sexo = dto.Sexo.Trim(),
                Tamanio = dto.Tamanio.Trim(),
                RazaId = dto.RazaId,
                FechaNacimiento = dto.FechaNacimiento,
                FotoUrl = dto.FotoUrl?.Trim(),
                Descripcion = dto.Descripcion?.Trim()
            };

            await _animalDA.AgregarAsync(animal, ct);
            return await ObtenerAsync(animal.IdAnimal, ct);
        }

        public async Task EliminarAsync(int id, CancellationToken ct)
        {
            _ = await _animalDA.ObtenerPorIdAsync(id, ct) ?? throw new NoEncontradoException("Animal", id);

            if (!await _animalDA.EliminarAsync(id, ct))
                throw new NoEncontradoException("Animal", id);
        }

        public async Task<ResultadoPaginado<AnimalDtos.AnimalDto>> ListarAsync(AnimalDtos.AnimalFiltro filtro, CancellationToken ct)
        {
            var pagina = await _animalDA.BuscarAsync(filtro, ct);
            return new ResultadoPaginado<AnimalDto>
            {
                Items = pagina.Items.Select(AnimalMapeador.ADto).ToList(),
                Total = pagina.Total,
                Pagina = pagina.Pagina,
                Tamano = pagina.Tamano
            };
        }

        public async Task<AnimalDtos.AnimalDto> ObtenerAsync(int id, CancellationToken ct)
        {
            var animal = await _animalDA.ObtenerPorIdAsync(id, ct) ?? throw new NoEncontradoException("Animal", id);
            return AnimalMapeador.ADto(animal);
        }
    }
}
