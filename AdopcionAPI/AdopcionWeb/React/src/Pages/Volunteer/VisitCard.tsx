import { useState } from "react";
import { router } from "@inertiajs/react";
import { Button, Card, CardBody, Chip, Textarea } from "@heroui/react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PawIcon } from "@/components/PawIcon";
import {
  formatAge,
  formatDate,
  formatVaccinationSummary,
  getPetImageUrl,
} from "@/lib/petHelpers";
import type {
  AdoptanteDto,
  AnimalDto,
  VacunacionDto,
  VisitaDto,
} from "@/types/models";

interface VisitCardProps {
  visita: VisitaDto;
  animal?: AnimalDto;
  adoptante?: AdoptanteDto;
  vacunaciones: VacunacionDto[];
}

export function VisitCard({
  visita,
  animal,
  adoptante,
  vacunaciones,
}: VisitCardProps) {
  const [observaciones, setObservaciones] = useState(visita.observaciones ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const petName = animal?.nombre ?? `Solicitud #${visita.solicitudId}`;
  const ageText = animal ? formatAge(animal.fechaNacimiento) : null;
  const imageUrl = animal
    ? getPetImageUrl(animal)
    : `https://placehold.co/600x400/EDE8DF/52525B?text=${encodeURIComponent(petName)}`;
  const vaccineSummary = animal
    ? formatVaccinationSummary(animal.idAnimal, animal.sexo, vacunaciones)
    : null;

  const resultadoLabel = visita.resultado;
  const isPending = resultadoLabel === "Pendiente";
  const isFutureDate = isPending && new Date(visita.fecha).getTime() > Date.now();

  const requestDecision = (favorable: boolean) => {
    setLocalError(null);
    if (!favorable && !observaciones.trim()) {
      setLocalError("Las observaciones son obligatorias cuando el resultado es no favorable.");
      return;
    }
    setPendingDecision(favorable);
  };

  const confirmDecision = () => {
    if (pendingDecision === null) return;
    setSubmitting(true);
    router.post(
      `/voluntario/visitas/${visita.idVisita}/resultado`,
      {
        favorable: pendingDecision,
        observaciones: observaciones.trim() || null,
      },
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
          setPendingDecision(null);
        },
      }
    );
  };

  return (
    <>
      <Card className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[0_10px_24px_-6px_rgba(0,0,0,0.12)]">
        <CardBody className="gap-4 p-5">
          {/* Header metadata */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {vaccineSummary && (
                <p className="text-xs font-medium text-[#52525B]">{vaccineSummary}</p>
              )}
              <Chip
                size="sm"
                variant="flat"
                color={
                  isPending
                    ? "warning"
                    : resultadoLabel === "Favorable"
                      ? "success"
                      : "danger"
                }
              >
                {resultadoLabel}
              </Chip>
            </div>

            {adoptante && (
              <p className="text-xs text-[#52525B]">
                Adoptante: <strong className="text-[#11181C]">{adoptante.nombre}</strong> · Contacto:{" "}
                {adoptante.contacto}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-[#11181C]">
                {petName}
                {ageText ? ` • ${ageText}` : ""}
              </h3>
              <span className="text-xs font-medium text-[#52525B]">
                Visita: {formatDate(visita.fecha)}
              </span>
            </div>
          </div>

          {/* Adopter housing context */}
          {adoptante && (
            <div className="flex flex-col gap-1.5 rounded-xl bg-[#FAF8F5] px-3.5 py-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#11181C]">Hogar del adoptante:</span>
                {adoptante.tipoViviendaNombre && (
                  <Chip size="sm" variant="flat" className="bg-white text-[#11181C]">
                    {adoptante.tipoViviendaNombre}
                  </Chip>
                )}
              </div>
              {adoptante.otrasMascotas && (
                <p className="text-[#52525B]">
                  Otras mascotas / detalles: {adoptante.otrasMascotas}
                </p>
              )}
            </div>
          )}

          {/* Pet photo */}
          <div className="overflow-hidden rounded-2xl bg-stone-200">
            <img
              src={imageUrl}
              alt={petName}
              loading="lazy"
              className="h-48 w-full object-cover"
            />
          </div>

          {/* Observations & Action buttons */}
          {isPending ? (
            <div className="flex flex-col gap-3">
              {isFutureDate && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Registro disponible a partir del {formatDate(visita.fecha)}.
                </div>
              )}

              {localError && (
                <p className="rounded-xl bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700">
                  {localError}
                </p>
              )}

              <Textarea
                label="Observaciones del hogar"
                placeholder="Espacio suficiente, patio cerrado, condiciones óptimas..."
                value={observaciones}
                onValueChange={(v) => {
                  setObservaciones(v);
                  setLocalError(null);
                }}
                variant="flat"
                radius="lg"
                minRows={3}
                isDisabled={isFutureDate}
              />

              <div className="grid grid-cols-2 gap-3">
                <Button
                  radius="lg"
                  variant="flat"
                  color="danger"
                  isDisabled={isFutureDate}
                  onPress={() => requestDecision(false)}
                  className="font-semibold"
                  endContent={<PawIcon color="currentColor" size={14} />}
                >
                  No Favorable
                </Button>
                <Button
                  radius="lg"
                  variant="flat"
                  color="success"
                  isDisabled={isFutureDate}
                  onPress={() => requestDecision(true)}
                  className="font-semibold"
                  endContent={<PawIcon color="currentColor" size={14} />}
                >
                  Favorable
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#FAF8F5] p-3 text-xs text-[#52525B]">
              <span className="font-semibold text-[#11181C]">Observaciones registradas: </span>
              {visita.observaciones?.trim() || "Sin observaciones adicionales."}
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={pendingDecision !== null}
        onClose={() => setPendingDecision(null)}
        onConfirm={confirmDecision}
        isLoading={submitting}
        title={
          pendingDecision
            ? "Registrar visita favorable?"
            : "Registrar visita no favorable?"
        }
        subtitle={`${petName} · Solicitud #${visita.solicitudId}`}
        description={
          pendingDecision
            ? "Al registrar esta visita como favorable, el coordinador podrá aprobar la solicitud de adopción."
            : "Al registrar esta visita como no favorable, quedarán guardadas sus observaciones para revisión del coordinador."
        }
        question="Desea guardar este resultado?"
        confirmText={pendingDecision ? "Sí, favorable" : "Sí, no favorable"}
        cancelText="Volver"
      />
    </>
  );
}
