import { Head, router } from "@inertiajs/react";
import { Button, Card, CardBody, Chip, Pagination } from "@heroui/react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { getAgeInMonths } from "@/lib/petHelpers";
import { PetCard } from "@/Pages/Catalog/PetCard";
import { SearchFilterBar } from "@/Pages/Catalog/SearchFilterBar";
import { useCatalogStore } from "@/stores/useCatalogStore";
import type { AnimalDto, EspecieDto, RazaDto, VacunacionDto } from "@/types/models";

interface CatalogPageProps {
  animales: AnimalDto[];
  especies: EspecieDto[];
  razas: RazaDto[];
  vacunaciones: VacunacionDto[];
  apiError?: string | null;
}

const PAGE_SIZE = 6;

export default function CatalogPage({
  animales,
  especies,
  razas,
  vacunaciones,
  apiError,
}: CatalogPageProps) {
  const { selectedSpeciesId, searchQuery, sortBy, currentPage, setPage, resetFilters } =
    useCatalogStore();

  const razaById = new Map(razas.map((r) => [String(r.idRaza), r]));
  const especieById = new Map(especies.map((e) => [String(e.id), e]));

  const query = searchQuery.trim().toLowerCase();

  let filtered = animales.filter((animal) => {
    const raza = razaById.get(String(animal.razaId));
    const matchesSpecies =
      selectedSpeciesId === "all" ||
      (raza && String(raza.especieId) === selectedSpeciesId);

    const matchesQuery =
      !query ||
      animal.nombre.toLowerCase().includes(query) ||
      (animal.razaNombre ?? "").toLowerCase().includes(query) ||
      (raza?.especieNombre ?? "").toLowerCase().includes(query);

    return matchesSpecies && matchesQuery;
  });

  if (sortBy === "nombre") {
    filtered = [...filtered].sort((a, b) => a.nombre.localeCompare(b.nombre));
  } else if (sortBy === "edad") {
    filtered = [...filtered].sort(
      (a, b) => getAgeInMonths(a.fechaNacimiento) - getAgeInMonths(b.fechaNacimiento)
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visibleAnimals = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const selectedSpecies =
    selectedSpeciesId === "all" ? null : especieById.get(selectedSpeciesId);

  const sectionHeading = selectedSpecies
    ? `Conoce a nuestros ${selectedSpecies.nombre.toLowerCase()}s`
    : "Conoce a nuestras mascotas";

  const handleLoginClick = () => {
    router.visit("/Cuenta/Ingresar");
  };

  const handleSelectPet = (animal: AnimalDto) => {
    router.visit(`/Animales/${animal.idAnimal}`);
  };

  return (
    <>
      <Head title="Inicio" />
      <PublicLayout availableCount={animales.length} onLoginClick={handleLoginClick}>
        <section className="flex items-start justify-between gap-4 md:items-center md:rounded-3xl md:border md:border-black/5 md:bg-white/75 md:p-8 md:shadow-sm">
          <div className="max-w-[250px] md:max-w-xl">
            <h1 className="text-[28px] font-bold leading-[1.15] tracking-tight text-[#11181C] md:text-4xl md:leading-tight">
              Un nuevo amigo.
              <br />
              Una vida juntos.
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-[#52525B]">
              Conoce a nuestras mascotas que esperan un hogar y buscan una nueva familia!
            </p>
          </div>

          <img
            src="/images/brand/hero-mascot.png"
            alt="Mascota de Adopta Un Nuevo Amigo"
            className="h-[78px] w-[98px] shrink-0 object-contain md:h-24 md:w-28"
          />
        </section>

        <SearchFilterBar especies={especies} onLoginClick={handleLoginClick} />

        {apiError && (
          <Card className="mt-6 border border-danger-200 bg-danger-50 shadow-sm">
            <CardBody className="flex flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-danger-700">
                  No se pudo conectar con AdopcionAPI
                </p>
                <p className="mt-0.5 text-xs text-danger-600">{apiError}</p>
              </div>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={() => router.reload()}
              >
                Reintentar
              </Button>
            </CardBody>
          </Card>
        )}

        <section className="mt-7">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#11181C]">
              {sectionHeading}
            </h2>
            <Chip
              size="sm"
              variant="flat"
              className="bg-amber-100 font-semibold text-amber-800"
            >
              {filtered.length}{" "}
              {filtered.length === 1 ? "resultado" : "resultados"}
            </Chip>
          </div>

          {visibleAnimals.length === 0 ? (
            <Card className="border border-dashed border-black/15 bg-white/75 shadow-none">
              <CardBody className="items-center py-10 text-center">
                <p className="text-sm font-semibold text-[#11181C]">
                  No encontramos mascotas con ese filtro
                </p>
                <p className="mt-1 text-xs text-[#52525B]">
                  Prueba buscando otro nombre, raza o cambiando la especie.
                </p>
                <Button
                  size="sm"
                  radius="full"
                  onPress={resetFilters}
                  className="mt-4 bg-[#F59E0B] font-semibold text-white"
                >
                  Limpiar filtros
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleAnimals.map((animal) => {
                const raza = razaById.get(String(animal.razaId));
                return (
                  <PetCard
                    key={String(animal.idAnimal)}
                    animal={animal}
                    especieNombre={raza?.especieNombre}
                    vacunaciones={vacunaciones}
                    onSelectPet={handleSelectPet}
                  />
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                total={totalPages}
                page={safePage}
                onChange={setPage}
                color="warning"
                showControls
                radius="full"
              />
            </div>
          )}
        </section>
      </PublicLayout>
    </>
  );
}
