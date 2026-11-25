import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { Button, Card, CardBody, Chip, Tab, Tabs } from "@heroui/react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { getHitoDays } from "@/lib/enumHelpers";
import { formatDate, getPetImageUrl } from "@/lib/petHelpers";
import type {
  AdoptanteDto,
  AlertaDto,
  AnimalDto,
  SeguimientoDto,
  SolicitudDto,
  TipoVacunaDto,
  VacunacionDto,
} from "@/types/models";

interface AlertasPageProps {
  alertas: AlertaDto[];
  seguimientos: SeguimientoDto[];
  solicitudes: SolicitudDto[];
  animales: AnimalDto[];
  adoptantes: AdoptanteDto[];
  vacunaciones: VacunacionDto[];
  tiposVacunas: TipoVacunaDto[];
  alertasCount: number;
  apiError?: string | null;
}

export default function AlertasPage({
  alertas,
  seguimientos,
  solicitudes,
  animales,
  adoptantes,
  vacunaciones,
  tiposVacunas,
  alertasCount,
  apiError,
}: AlertasPageProps) {
  const [selectedTab, setSelectedTab] = useState("seguimientos");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const seguimientoById = new Map(
    seguimientos.map((s) => [String(s.idSeguimiento), s])
  );
  const solicitudById = new Map(
    solicitudes.map((s) => [String(s.idSolicitud), s])
  );
  const animalById = new Map(animales.map((a) => [String(a.idAnimal), a]));
  const adoptanteById = new Map(
    adoptantes.map((a) => [String(a.idAdoptante), a])
  );
  const tipoVacunaById = new Map(
    tiposVacunas.map((t) => [String(t.idTipoVacuna), t])
  );

  // Affected adopters across active alerts
  const affectedAdopters = Array.from(
    new Set(
      alertas
        .map((a) => {
          const seg = seguimientoById.get(String(a.seguimientoId));
          const sol = seg ? solicitudById.get(String(seg.solicitudId)) : undefined;
          const ad = sol ? adoptanteById.get(String(sol.adoptanteId)) : undefined;
          return ad?.nombre ?? seg?.adoptanteNombre ?? null;
        })
        .filter((n): n is string => Boolean(n))
    )
  );

  // Expiring or expired vaccines within 30 days
  const nowMs = Date.now();
  const in30DaysMs = nowMs + 30 * 24 * 60 * 60 * 1000;
  const expiringVaccines = vacunaciones
    .filter(
      (v) => v.proximaDosis && new Date(v.proximaDosis).getTime() <= in30DaysMs
    )
    .sort(
      (a, b) =>
        new Date(a.proximaDosis!).getTime() - new Date(b.proximaDosis!).getTime()
    );

  const handleCopyContact = (idKey: string, contact: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(contact);
    }
    setCopiedId(idKey);
    window.setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <>
      <Head title="Alertas de Seguimiento y Vacunas" />
      <DashboardLayout activeNav="alertas" alertasCount={alertasCount}>
        {apiError && (
          <Card className="mb-5 border border-danger-200 bg-danger-50 shadow-sm">
            <CardBody className="flex flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-danger-700">
                  No se pudo conectar con AdopcionAPI
                </p>
                <p className="text-xs text-danger-600">{apiError}</p>
              </div>
              <Button size="sm" color="danger" variant="flat" onPress={() => router.reload()}>
                Reintentar
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Header matching Figma Captura 4 left */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <img
              src="/images/brand/hero-mascot.png"
              alt="Alertas"
              className="h-12 w-14 shrink-0 object-contain"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#11181C]">
                  Alertas de Seguimiento Vencido
                </h1>
                <Chip size="sm" color="danger" variant="flat" className="font-semibold">
                  {alertas.length}{" "}
                  {alertas.length === 1 ? "alerta activa" : "alertas activas"}
                </Chip>
              </div>
              <p className="mt-0.5 text-sm text-[#52525B]">
                Seguimientos post-adopción vencidos y vacunas próximas a vencer que requieren atención.
              </p>
            </div>
          </div>

          <Card className="border border-black/5 bg-white shadow-xs md:min-w-64">
            <CardBody className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#52525B]">
                Adoptantes afectados
              </p>
              <p className="text-2xl font-bold text-[#11181C]">
                {affectedAdopters.length}
              </p>
              <p className="line-clamp-1 text-xs text-[#52525B]">
                {affectedAdopters.length > 0
                  ? affectedAdopters.join(", ")
                  : "Ninguno"}
              </p>
            </CardBody>
          </Card>
        </div>

        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(k) => setSelectedTab(String(k))}
          variant="solid"
          radius="lg"
          classNames={{
            base: "w-full max-w-full",
            tabList:
              "bg-[#EFECE6] p-1 w-full sm:w-fit flex flex-wrap sm:flex-nowrap gap-1",
            cursor: "bg-white shadow-sm",
            tab: "w-auto h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold",
          }}
        >
          {/* TAB 1: Seguimientos Vencidos */}
          <Tab
            key="seguimientos"
            title={
              <div className="flex items-center gap-2">
                <span>Seguimientos vencidos</span>
                <Chip size="sm" color="danger" variant="flat">
                  {alertas.length}
                </Chip>
              </div>
            }
          >
            <section className="mt-5">
              {alertas.length === 0 ? (
                <Card className="border border-dashed border-black/15 bg-white/75 shadow-none">
                  <CardBody className="py-12 text-center">
                    <p className="text-sm font-semibold text-[#11181C]">
                      No hay alertas de seguimientos vencidos!
                    </p>
                    <p className="mt-1 text-xs text-[#52525B]">
                      Todos los hitos de 30, 60 y 90 días se encuentran al día.
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {alertas.map((alerta) => {
                    const seg = seguimientoById.get(String(alerta.seguimientoId));
                    const sol = seg
                      ? solicitudById.get(String(seg.solicitudId))
                      : undefined;
                    const animal = sol
                      ? animalById.get(String(sol.animalId))
                      : undefined;
                    const adoptante = sol
                      ? adoptanteById.get(String(sol.adoptanteId))
                      : undefined;

                    const resolvedPetName =
                      animal?.nombre ?? seg?.animalNombre ?? null;
                    const petName = resolvedPetName ?? "Mascota";
                    const adopterName =
                      adoptante?.nombre ?? seg?.adoptanteNombre ?? "Adoptante";
                    const hitoDays = seg ? getHitoDays(seg.hito) : 60;
                    const overdueDays = seg
                      ? Math.max(
                          1,
                          Math.floor(
                            (nowMs - new Date(seg.fechaProgramada).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )
                      : 1;
                    const contact = adoptante?.contacto ?? "Sin contacto";
                    const cardKey = String(alerta.idAlerta);

                    return (
                      <Card
                        key={cardKey}
                        className="overflow-hidden rounded-[22px] border border-danger-200/80 bg-white shadow-[0_10px_24px_-6px_rgba(220,38,38,0.12)]"
                      >
                        <CardBody className="gap-4 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Chip
                              size="sm"
                              color="danger"
                              variant="flat"
                              className="font-semibold"
                            >
                              Vencido hace {overdueDays}{" "}
                              {overdueDays === 1 ? "día" : "días"}
                            </Chip>
                            {alerta.escaladaAlCoordinador && (
                              <Chip size="sm" variant="flat" color="warning">
                                Escalada al coordinador
                              </Chip>
                            )}
                          </div>

                          <h2 className="text-xl font-bold text-[#11181C]">
                            {resolvedPetName
                              ? `Seguimiento Día ${hitoDays}: ${resolvedPetName}`
                              : `Seguimiento Día ${hitoDays} (#${alerta.seguimientoId})`}
                          </h2>

                          <div className="overflow-hidden rounded-2xl bg-stone-200">
                            <img
                              src={
                                animal
                                  ? getPetImageUrl(animal)
                                  : `https://placehold.co/600x400/EDE8DF/52525B?text=${encodeURIComponent(petName)}`
                              }
                              alt={petName}
                              className="h-48 w-full object-cover"
                            />
                          </div>

                          <div className="flex flex-col gap-1 text-xs text-[#52525B]">
                            <p>
                              <strong className="text-[#11181C]">Adoptante:</strong>{" "}
                              {adopterName} · {contact}
                            </p>
                            <p>{alerta.mensaje}</p>
                          </div>

                          <div className="flex flex-col gap-2 pt-1">
                            <Button
                              radius="lg"
                              variant="flat"
                              color="warning"
                              onPress={() => handleCopyContact(cardKey, contact)}
                              className="w-full font-semibold text-amber-900"
                            >
                              {copiedId === cardKey
                                ? "Contacto copiado al portapapeles!"
                                : "Contactar Adoptante"}
                            </Button>
                            <Button
                              as={Link}
                              href={
                                animal
                                  ? `/admin/historial-medico?animalId=${animal.idAnimal}`
                                  : "/admin/solicitudes"
                              }
                              radius="lg"
                              variant="flat"
                              color="danger"
                              className="w-full font-semibold"
                            >
                              Revisar Expediente y Seguimiento
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </Tab>

          {/* TAB 2: Vacunas próximas a vencer */}
          <Tab
            key="vacunas"
            title={
              <div className="flex items-center gap-2">
                <span>Vacunas próximas a vencer</span>
                <Chip size="sm" color="warning" variant="flat">
                  {expiringVaccines.length}
                </Chip>
              </div>
            }
          >
            <section className="mt-5">
              {expiringVaccines.length === 0 ? (
                <Card className="border border-dashed border-black/15 bg-white/75 shadow-none">
                  <CardBody className="py-12 text-center">
                    <p className="text-sm font-semibold text-[#11181C]">
                      No hay vacunas próximas a vencer en los próximos 30 días!
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {expiringVaccines.map((v) => {
                    const animal = animalById.get(String(v.animalId));
                    const tipo = tipoVacunaById.get(String(v.tipoVacunaId));
                    const daysLeft = Math.ceil(
                      (new Date(v.proximaDosis!).getTime() - nowMs) /
                        (1000 * 60 * 60 * 24)
                    );
                    const expired = daysLeft < 0;

                    return (
                      <Card
                        key={String(v.idVacunacion)}
                        className="rounded-2xl border border-amber-200 bg-white shadow-xs"
                      >
                        <CardBody className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-[#11181C]">
                                {animal?.nombre ?? v.animalNombre ?? "Mascota"}
                              </span>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={expired ? "danger" : "warning"}
                              >
                                {expired
                                  ? `Vencida hace ${Math.abs(daysLeft)}d`
                                  : `Vence en ${daysLeft}d`}
                              </Chip>
                            </div>
                            <p className="mt-1 text-xs text-[#52525B]">
                              Vacuna:{" "}
                              <strong className="text-[#11181C]">
                                {v.tipoVacunaNombre ?? tipo?.nombre ?? "Vacuna"}
                              </strong>{" "}
                              · Próxima dosis: {formatDate(v.proximaDosis!)}
                            </p>
                          </div>

                          <Button
                            as={Link}
                            href={`/admin/historial-medico?animalId=${v.animalId}`}
                            size="sm"
                            radius="full"
                            variant="flat"
                            color="warning"
                            className="shrink-0 font-semibold text-amber-900"
                          >
                            Ver carnet
                          </Button>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </Tab>
        </Tabs>
      </DashboardLayout>
    </>
  );
}
