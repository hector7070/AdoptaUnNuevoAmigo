import { Head, Link, router } from "@inertiajs/react";
import { Button, Card, CardBody, Chip, Divider } from "@heroui/react";
import { PublicLayout } from "@/layouts/PublicLayout";
import {
  formatAge,
  formatDate,
  formatVaccinationSummary,
  getPetImageUrl,
} from "@/lib/petHelpers";
import type { AnimalDto, ConsultaDto, VacunacionDto } from "@/types/models";

interface AnimalDetailPageProps {
  animal: AnimalDto | null;
  vacunaciones: VacunacionDto[];
  consultas: ConsultaDto[];
  apiError?: string | null;
}

export default function AnimalDetailPage({
  animal,
  vacunaciones,
  consultas,
  apiError,
}: AnimalDetailPageProps) {
  const handleLoginClick = () => {
    router.visit("/Cuenta/Ingresar");
  };

  if (!animal) {
    return (
      <>
        <Head title="Mascota no encontrada" />
        <PublicLayout onLoginClick={handleLoginClick}>
          <Card className="mx-auto max-w-lg border border-danger-200 bg-danger-50 shadow-sm">
            <CardBody className="gap-3 p-6 text-center">
              <p className="text-base font-semibold text-danger-700">
                No pudimos cargar los detalles de esta mascota
              </p>
              {apiError && (
                <p className="text-xs text-danger-600">{apiError}</p>
              )}
              <div className="mt-2 flex justify-center gap-2">
                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  onPress={() => router.visit("/")}
                >
                  Volver a mascotas
                </Button>
                <Button
                  size="sm"
                  radius="full"
                  color="danger"
                  variant="flat"
                  onPress={() => router.reload()}
                >
                  Reintentar
                </Button>
              </div>
            </CardBody>
          </Card>
        </PublicLayout>
      </>
    );
  }

  const ageText = formatAge(animal.fechaNacimiento);
  const imageUrl = getPetImageUrl(animal);
  const vaccineSummary = formatVaccinationSummary(
    animal.idAnimal,
    animal.sexo,
    vacunaciones
  );
  const isSterilized = animal.esterilizado.toLowerCase().startsWith("s");

  const handleAdoptClick = () => {
    router.visit(`/Adopcion/Solicitar/${animal.idAnimal}`);
  };

  return (
    <>
      <Head title={`${animal.nombre} • ${ageText}`} />
      <PublicLayout onLoginClick={handleLoginClick}>
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52525B] transition hover:text-[#11181C]"
          >
            <span aria-hidden="true">←</span>
            <span>Volver a mascotas</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start">
          {/* Left column: Pet photo + quick facts */}
          <div className="md:col-span-5 md:sticky md:top-20">
            <Card className="overflow-hidden rounded-[22px] border-none bg-stone-800 shadow-[0_14px_30px_-8px_rgba(0,0,0,0.24),0_4px_12px_-4px_rgba(0,0,0,0.12)]">
              <img
                src={imageUrl}
                alt={`${animal.nombre}, ${animal.razaNombre ?? "mascota"}`}
                className="aspect-[4/4] w-full object-cover md:aspect-[4/5]"
              />
            </Card>

            <div className="mt-4 flex flex-wrap gap-2">
              {animal.razaNombre && (
                <Chip variant="flat" className="bg-white text-xs font-medium text-[#11181C] shadow-xs">
                  Raza: {animal.razaNombre}
                </Chip>
              )}
              <Chip variant="flat" className="bg-white text-xs font-medium text-[#11181C] shadow-xs">
                {animal.sexo}
              </Chip>
              <Chip variant="flat" className="bg-white text-xs font-medium text-[#11181C] shadow-xs">
                Tamaño {animal.tamanio}
              </Chip>
              <Chip
                variant="flat"
                color={isSterilized ? "success" : "default"}
                className="text-xs font-medium"
              >
                {isSterilized ? "Esterilizado" : "No esterilizado"}
              </Chip>
            </div>
          </div>

          {/* Right column: Story, Health, Adoption Process & CTA */}
          <div className="flex flex-col gap-6 md:col-span-7">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#11181C] md:text-4xl">
                {animal.nombre} • {ageText}
              </h1>
              <p className="mt-1 text-sm text-[#52525B]">
                {animal.razaNombre
                  ? `${animal.razaNombre} listo para encontrar su nuevo hogar.`
                  : "Listo para encontrar su nuevo hogar."}
              </p>

              <Button
                size="lg"
                radius="full"
                onPress={handleAdoptClick}
                className="mt-5 w-full bg-[#F59E0B] font-semibold text-white shadow-[0_8px_20px_-4px_rgba(245,158,11,0.5)] md:w-auto md:px-10"
              >
                Quiero adoptar a {animal.nombre}
              </Button>
            </div>

            {/* Section 1: Story */}
            <section>
              <h2 className="text-lg font-bold text-[#11181C]">
                Una vida juntos
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#52525B]">
                {animal.descripcion?.trim() ||
                  `${animal.nombre} espera una familia con la que empezar una nueva etapa llena de cariño, paseos y cuidados.`}
              </p>
            </section>

            <Divider className="bg-black/5" />

            {/* Section 2: Health & Vaccines */}
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-[#11181C]">
                Su salud y bienestar
              </h2>

              <Card className="border border-black/5 bg-white shadow-sm">
                <CardBody className="gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#11181C]">
                      Vacunas al día
                    </span>
                    <Chip
                      size="sm"
                      color={vacunaciones.length > 0 ? "success" : "warning"}
                      variant="flat"
                    >
                      {vacunaciones.length}{" "}
                      {vacunaciones.length === 1 ? "vacuna" : "vacunas"}
                    </Chip>
                  </div>
                  <p className="text-sm text-[#52525B]">{vaccineSummary}.</p>

                  {vacunaciones.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {vacunaciones.map((v) => (
                        <Chip
                          key={String(v.idVacunacion)}
                          size="sm"
                          variant="flat"
                          className="bg-[#FAF8F5] text-xs text-[#52525B]"
                        >
                          {v.tipoVacunaNombre ?? "Vacuna"} · {formatDate(v.fecha)}
                        </Chip>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card className="border border-black/5 bg-white shadow-sm">
                <CardBody className="gap-3 p-4">
                  <span className="text-sm font-semibold text-[#11181C]">
                    Historial veterinario
                  </span>

                  {consultas.length === 0 ? (
                    <p className="text-sm text-[#52525B]">
                      Sin antecedentes médicos registrados recientemente.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {consultas.map((c) => (
                        <div
                          key={String(c.idConsulta)}
                          className="rounded-xl bg-[#FAF8F5] p-3 text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[#11181C]">
                              {c.diagnostico}
                            </span>
                            <span className="shrink-0 text-xs text-[#52525B]">
                              {formatDate(c.fecha)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#52525B]">
                            Tratamiento: {c.tratamiento}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </section>

            {/* Section 3: Care guidance (shared copy for all pets) */}
            <Card className="border border-amber-200/70 bg-amber-50/70 shadow-none">
              <CardBody className="gap-1.5 p-4">
                <h2 className="text-base font-bold text-[#11181C]">
                  {animal.nombre} necesita un hogar!
                </h2>
                <p className="text-sm leading-relaxed text-[#52525B]">
                  Ofrézcale paseos diarios, agua fresca y un espacio seguro. Luego
                  de la adaptación ofrézcale un ambiente tranquilo, cariño y
                  paciencia.
                </p>
              </CardBody>
            </Card>

            {/* Section 4: Next step */}
            <section>
              <h2 className="text-lg font-bold text-[#11181C]">
                El siguiente paso: conocerse
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#52525B]">
                Complete la solicitud. Nuestro equipo revisará sus datos y
                coordinará una visita a su domicilio antes de la adopción.
              </p>

              <Button
                size="lg"
                radius="full"
                onPress={handleAdoptClick}
                className="mt-5 w-full bg-[#F59E0B] font-semibold text-white shadow-[0_8px_20px_-4px_rgba(245,158,11,0.5)] md:hidden"
              >
                Quiero adoptar a {animal.nombre}
              </Button>
            </section>
          </div>
        </div>
      </PublicLayout>
    </>
  );
}
