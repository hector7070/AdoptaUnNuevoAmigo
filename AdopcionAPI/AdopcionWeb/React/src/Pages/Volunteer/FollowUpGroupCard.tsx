import { useState } from "react";
import { router } from "@inertiajs/react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Progress,
  Textarea,
} from "@heroui/react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PawIcon } from "@/components/PawIcon";
import { getHitoDays } from "@/lib/enumHelpers";
import { formatDate, getPetImageUrl } from "@/lib/petHelpers";
import type {
  AdoptanteDto,
  AnimalDto,
  SeguimientoDto,
} from "@/types/models";

interface FollowUpGroupCardProps {
  solicitudId: number;
  seguimientos: SeguimientoDto[];
  animal?: AnimalDto;
  adoptante?: AdoptanteDto;
}

export function FollowUpGroupCard({
  solicitudId,
  seguimientos,
  animal,
  adoptante,
}: FollowUpGroupCardProps) {
  const [observaciones, setObservaciones] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    seguimiento: SeguimientoDto;
    favorable: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sorted = [...seguimientos].sort(
    (a, b) => getHitoDays(a.hito) - getHitoDays(b.hito)
  );

  const first = sorted[0];
  const petName =
    animal?.nombre ?? first?.animalNombre ?? `Solicitud #${solicitudId}`;
  const adopterName =
    adoptante?.nombre ?? first?.adoptanteNombre ?? "Adoptante";
  const imageUrl = animal
    ? getPetImageUrl(animal)
    : `https://placehold.co/600x400/EDE8DF/52525B?text=${encodeURIComponent(petName)}`;

  const completedDays = sorted.reduce((max, s) => {
    if (s.estado === "Favorable") {
      return Math.max(max, getHitoDays(s.hito));
    }
    return max;
  }, 0);

  const completedMilestones = sorted.filter(
    (s) =>
      s.estado === "Favorable" ||
      s.estado === "Desfavorable" ||
      s.estado === "Omitido"
  );

  const activeMilestone = sorted.find(
    (s) => s.estado === "Pendiente" || s.estado === "Vencido"
  );

  const activeDays = activeMilestone ? getHitoDays(activeMilestone.hito) : 0;
  const activeLabel = activeMilestone ? activeMilestone.estado : null;
  const isFinalMilestone = activeDays === 90;
  const isActiveFuture =
    activeMilestone !== undefined &&
    new Date(activeMilestone.fechaProgramada).getTime() > Date.now();

  const requestAction = (seguimiento: SeguimientoDto, favorable: boolean) => {
    setLocalError(null);
    if (!favorable && !observaciones.trim()) {
      setLocalError(
        "Las observaciones son obligatorias cuando se reporta una falla."
      );
      return;
    }
    setPendingAction({ seguimiento, favorable });
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    setSubmitting(true);
    router.post(
      `/voluntario/seguimientos/${pendingAction.seguimiento.idSeguimiento}/resultado`,
      {
        favorable: pendingAction.favorable,
        observaciones: observaciones.trim() || null,
      },
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
          setPendingAction(null);
          setObservaciones("");
        },
      }
    );
  };

  return (
    <>
      <Card className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[0_10px_24px_-6px_rgba(0,0,0,0.12)]">
        <CardBody className="gap-4 p-5">
          {/* Header */}
          <div>
            {adoptante && (
              <p className="text-xs text-[#52525B]">
                Contacto: {adoptante.contacto}
              </p>
            )}
            <h3 className="mt-0.5 text-2xl font-bold tracking-tight text-[#11181C]">
              {petName} con {adopterName}
            </h3>
          </div>

          {/* Pet photo */}
          <div className="overflow-hidden rounded-2xl bg-stone-200">
            <img
              src={imageUrl}
              alt={petName}
              loading="lazy"
              className="h-48 w-full object-cover"
            />
          </div>

          {/* Cycle progress bar matching Figma: "Progreso del ciclo (60 / 90 días)" */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#11181C]">
                Progreso del ciclo ({completedDays} / 90 días)
              </span>
              <span className="font-medium text-[#52525B]">
                {Math.round((completedDays / 90) * 100)}%
              </span>
            </div>
            <Progress
              aria-label="Progreso del ciclo de seguimiento"
              value={(completedDays / 90) * 100}
              color="success"
              size="sm"
            />
          </div>

          {/* Completed milestones timeline (clean Figma rows) */}
          {completedMilestones.length > 0 && (
            <div className="flex flex-col divide-y divide-black/5">
              {completedMilestones.map((s) => {
                const days = getHitoDays(s.hito);
                const label = s.estado;
                const isFavorable = label === "Favorable";

                return (
                  <div key={String(s.idSeguimiento)} className="py-2.5 first:pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#11181C]">
                        Día {days}: Fecha:{" "}
                        {formatDate(s.fechaRealizada ?? s.fechaProgramada)}
                      </span>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          isFavorable
                            ? "success"
                            : label === "Desfavorable"
                              ? "danger"
                              : "default"
                        }
                      >
                        {isFavorable ? "Completado" : label}
                      </Chip>
                    </div>
                    {s.observaciones && (
                      <p className="mt-1 text-xs text-[#52525B]">
                        {s.observaciones}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Active milestone & actions matching Figma bottom section */}
          {activeMilestone && (
            <>
              <Divider className="bg-black/5" />
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#52525B]">
                    Día {activeDays}:{" "}
                    <span
                      className={
                        activeLabel === "Vencido"
                          ? "text-danger-600"
                          : "text-[#11181C]"
                      }
                    >
                      {activeLabel}
                    </span>
                    , Programado: {formatDate(activeMilestone.fechaProgramada)}
                  </p>
                  {activeLabel === "Vencido" && (
                    <Chip size="sm" variant="flat" color="danger">
                      Vencido
                    </Chip>
                  )}
                </div>

                {isActiveFuture && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    Registro disponible a partir del{" "}
                    {formatDate(activeMilestone.fechaProgramada)}.
                  </div>
                )}

                {localError && (
                  <p className="rounded-xl bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700">
                    {localError}
                  </p>
                )}

                <Textarea
                  label={`Observaciones del Día ${activeDays}`}
                  placeholder="Describa cómo se encuentra la mascota en su hogar..."
                  value={observaciones}
                  onValueChange={(v) => {
                    setObservaciones(v);
                    setLocalError(null);
                  }}
                  variant="flat"
                  radius="lg"
                  minRows={2}
                  isDisabled={isActiveFuture}
                />

                <div className="flex flex-col gap-2">
                  <Button
                    radius="lg"
                    variant="flat"
                    color="success"
                    isDisabled={isActiveFuture}
                    onPress={() => requestAction(activeMilestone, true)}
                    className="w-full font-semibold"
                    endContent={<PawIcon color="currentColor" size={14} />}
                  >
                    {isFinalMilestone
                      ? "Registrar Hito Final"
                      : `Registrar Hito Día ${activeDays}`}
                  </Button>
                  <Button
                    radius="lg"
                    variant="flat"
                    color="danger"
                    isDisabled={isActiveFuture}
                    onPress={() => requestAction(activeMilestone, false)}
                    className="w-full font-semibold"
                    endContent={<PawIcon color="currentColor" size={14} />}
                  >
                    {isFinalMilestone
                      ? "Reportar Falla y Revertir a Disponible"
                      : "Reportar Falla en Seguimiento"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmAction}
        isLoading={submitting}
        title={
          pendingAction?.favorable
            ? isFinalMilestone
              ? "Confirmar adopción definitiva?"
              : "Registrar seguimiento favorable?"
            : isFinalMilestone
              ? "Revertir mascota a Disponible?"
              : "Reportar falla en seguimiento?"
        }
        subtitle={`${petName} con ${adopterName}`}
        description={
          pendingAction?.favorable
            ? isFinalMilestone
              ? `Al completar favorablemente el hito de 90 días, ${petName} pasará a estado Adoptado definitivo.`
              : "El seguimiento quedará marcado como completado con las observaciones ingresadas."
            : isFinalMilestone
              ? `Al reportar una falla en el seguimiento final de 90 días, ${petName} volverá al catálogo como Disponible y quedará registrado el evento.`
              : "El seguimiento quedará registrado como desfavorable para atención del coordinador."
        }
        question="Desea confirmar esta acción?"
        confirmText="Sí, confirmar"
        cancelText="Cancelar"
      />
    </>
  );
}
