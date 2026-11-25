import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ResponsiveTableScroll } from "@/components/ResponsiveTableScroll";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import {
  formatAge,
  formatDate,
  formatVaccinationSummary,
  getPetImageUrl,
} from "@/lib/petHelpers";
import type {
  AdoptanteDto,
  AnimalDto,
  EstadoSolicitud,
  SolicitudDto,
  VacunacionDto,
  VisitaDto,
} from "@/types/models";

interface VoluntarioOpcion {
  idVoluntario: number;
  nombre: string;
}

interface SolicitudesPageProps {
  solicitudes: SolicitudDto[];
  animales: AnimalDto[];
  adoptantes: AdoptanteDto[];
  visitas: VisitaDto[];
  vacunaciones: VacunacionDto[];
  voluntarios: VoluntarioOpcion[];
  alertasCount: number;
  flashSuccess?: string | null;
  flashError?: string | null;
  apiError?: string | null;
}

type EstadoFilter = "todas" | "pendiente_visita" | EstadoSolicitud;

const PAGE_SIZE = 6;

const ESTADO_UI: Record<
  EstadoSolicitud,
  { label: string; color: "warning" | "primary" | "secondary" | "success" | "danger" | "default" }
> = {
  Enviada: { label: "Enviada", color: "warning" },
  EnRevision: { label: "En revisión", color: "primary" },
  VisitaProgramada: { label: "Visita programada", color: "secondary" },
  Aprobada: { label: "Aprobada", color: "success" },
  Rechazada: { label: "Rechazada", color: "danger" },
  Cancelada: { label: "Cancelada", color: "default" },
};

export default function SolicitudesPage({
  solicitudes,
  animales,
  adoptantes,
  visitas,
  vacunaciones,
  voluntarios,
  alertasCount,
  flashSuccess,
  flashError,
  apiError,
}: SolicitudesPageProps) {
  const [statusFilter, setStatusFilter] = useState<EstadoFilter>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(
    solicitudes[0] ? Number(solicitudes[0].idSolicitud) : null
  );

  // Schedule visit form state
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [voluntarioId, setVoluntarioId] = useState<string>(
    voluntarios[0] ? String(voluntarios[0].idVoluntario) : ""
  );
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });

  // Confirm modal state for state transitions
  const [pendingStateChange, setPendingStateChange] = useState<{
    solicitudId: number;
    estado: EstadoSolicitud;
    petName: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const animalById = new Map(animales.map((a) => [String(a.idAnimal), a]));
  const adoptanteById = new Map(
    adoptantes.map((a) => [String(a.idAdoptante), a])
  );

  const latestVisitBySolicitud = new Map<string, VisitaDto>();
  for (const v of visitas) {
    const key = String(v.solicitudId);
    const prev = latestVisitBySolicitud.get(key);
    if (!prev || new Date(v.fecha).getTime() > new Date(prev.fecha).getTime()) {
      latestVisitBySolicitud.set(key, v);
    }
  }

  const query = searchQuery.trim().toLowerCase();

  const filtered = solicitudes.filter((s) => {
    const matchesStatus =
      statusFilter === "todas"
        ? true
        : statusFilter === "pendiente_visita"
          ? s.estado === "Enviada" || s.estado === "EnRevision"
          : s.estado === statusFilter;

    const animal = animalById.get(String(s.animalId));
    const adoptante = adoptanteById.get(String(s.adoptanteId));

    const matchesQuery =
      !query ||
      (animal?.nombre ?? s.animalNombre ?? "").toLowerCase().includes(query) ||
      (adoptante?.nombre ?? s.adoptanteNombre ?? "").toLowerCase().includes(query) ||
      (adoptante?.contacto ?? "").toLowerCase().includes(query);

    return matchesStatus && matchesQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const selectedSolicitud =
    solicitudes.find((s) => Number(s.idSolicitud) === selectedId) ??
    pageItems[0] ??
    null;

  const selectedAnimal = selectedSolicitud
    ? animalById.get(String(selectedSolicitud.animalId))
    : undefined;
  const selectedAdoptante = selectedSolicitud
    ? adoptanteById.get(String(selectedSolicitud.adoptanteId))
    : undefined;
  const selectedVisit = selectedSolicitud
    ? latestVisitBySolicitud.get(String(selectedSolicitud.idSolicitud))
    : undefined;
  const selectedEstado = selectedSolicitud ? selectedSolicitud.estado : null;
  const selectedVisitResult = selectedVisit ? selectedVisit.resultado : null;

  const handleConfirmStateChange = () => {
    if (!pendingStateChange) return;
    setSubmitting(true);
    router.post(
      `/admin/solicitudes/${pendingStateChange.solicitudId}/estado`,
      { estado: pendingStateChange.estado },
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
          setPendingStateChange(null);
        },
      }
    );
  };

  const handleScheduleVisit = () => {
    if (!selectedSolicitud || !voluntarioId || !visitDate) return;
    setSubmitting(true);
    router.post(
      `/admin/solicitudes/${selectedSolicitud.idSolicitud}/visita`,
      {
        voluntarioId: Number(voluntarioId),
        fecha: visitDate,
      },
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
          setShowVisitForm(false);
        },
      }
    );
  };

  const filterOptions: { key: EstadoFilter; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "pendiente_visita", label: "Pendiente visita" },
    { key: "VisitaProgramada", label: "Visita programada" },
    { key: "Aprobada", label: "Aprobadas" },
    { key: "Rechazada", label: "Rechazadas" },
  ];

  return (
    <>
      <Head title="Bandeja de solicitudes" />
      <DashboardLayout activeNav="solicitudes" alertasCount={alertasCount}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#52525B]">
          Solicitudes de adopción · Revise los datos del adoptante y coordine la visita domiciliaria.
        </p>

        {apiError && (
          <Card className="mb-5 border border-danger-200 bg-danger-50 shadow-sm">
            <CardBody className="flex flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-danger-700">
                  No se pudo conectar con AdopcionAPI
                </p>
                <p className="text-xs text-danger-600">{apiError}</p>
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

        {flashSuccess && (
          <div className="mb-5 rounded-2xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
            {flashSuccess}
          </div>
        )}

        {flashError && (
          <div className="mb-5 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
            {flashError}
          </div>
        )}

        {/* Main Table Card matching Figma "Bandeja de solicitudes" */}
        <Card className="rounded-3xl border border-black/5 bg-white shadow-sm">
          <CardBody className="gap-4 p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="mr-2 text-lg font-bold text-[#11181C]">
                  Bandeja de solicitudes
                </h1>
                {filterOptions.map((opt) => (
                  <Button
                    key={opt.key}
                    size="sm"
                    radius="full"
                    variant={statusFilter === opt.key ? "solid" : "flat"}
                    color={statusFilter === opt.key ? "warning" : "default"}
                    onPress={() => {
                      setStatusFilter(opt.key);
                      setCurrentPage(1);
                    }}
                    className={
                      statusFilter === opt.key
                        ? "font-semibold text-white"
                        : "font-medium text-[#52525B]"
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>

              <span className="text-xs font-medium text-[#52525B]">
                {filtered.length}{" "}
                {filtered.length === 1 ? "solicitud" : "solicitudes"} en total
              </span>
            </div>

            <Input
              aria-label="Buscar solicitud por mascota o adoptante"
              placeholder="Buscar por mascota, adoptante o contacto..."
              value={searchQuery}
              onValueChange={(v) => {
                setSearchQuery(v);
                setCurrentPage(1);
              }}
              isClearable
              onClear={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              variant="flat"
              radius="full"
              size="sm"
              className="max-w-md"
            />

            <ResponsiveTableScroll>
              <Table
                aria-label="Tabla de solicitudes de adopción"
                removeWrapper
                classNames={{
                  table: "min-w-[680px]",
                }}
                selectionMode="single"
                selectedKeys={
                  selectedSolicitud ? [String(selectedSolicitud.idSolicitud)] : []
                }
                onSelectionChange={(keys) => {
                  const first = Array.from(keys)[0];
                  if (first) {
                    setSelectedId(Number(first));
                    setShowVisitForm(false);
                  }
                }}
              >
                <TableHeader>
                  <TableColumn>MASCOTA</TableColumn>
                  <TableColumn>ADOPTANTE</TableColumn>
                  <TableColumn>FECHA</TableColumn>
                  <TableColumn>VISITA DOMICILIARIA</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn align="end">ACCIONES</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No hay solicitudes que coincidan con el filtro.">
                  {pageItems.map((s) => {
                    const animal = animalById.get(String(s.animalId));
                    const adoptante = adoptanteById.get(String(s.adoptanteId));
                    const visit = latestVisitBySolicitud.get(String(s.idSolicitud));
                    const estado = s.estado;
                    const estadoUi = ESTADO_UI[estado];
                    const petName = animal?.nombre ?? s.animalNombre ?? `#${s.animalId}`;

                    return (
                      <TableRow key={String(s.idSolicitud)} className="cursor-pointer">
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={animal ? getPetImageUrl(animal) : undefined}
                              name={petName}
                              size="sm"
                            />
                            <span className="font-semibold text-[#11181C]">
                              {petName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[140px] leading-tight">
                            <p className="text-xs font-semibold text-[#11181C]">
                              {adoptante?.nombre ?? s.adoptanteNombre ?? `#${s.adoptanteId}`}
                            </p>
                            {adoptante?.contacto && (
                              <p className="text-[11px] text-[#52525B]">
                                {adoptante.contacto}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-[#52525B]">
                          {formatDate(s.fechaSolicitud)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-[#52525B]">
                          {visit ? (
                            <div className="flex flex-col gap-0.5">
                              <span>{formatDate(visit.fecha)}</span>
                              <span className="text-[11px] font-medium">
                                {visit.resultado}
                              </span>
                            </div>
                          ) : (
                            <span>Sin programar</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Chip size="sm" variant="flat" color={estadoUi.color}>
                            {estadoUi.label}
                          </Chip>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              radius="full"
                              variant="flat"
                              color="warning"
                              onPress={() => {
                                setSelectedId(Number(s.idSolicitud));
                                if (estado === "EnRevision") {
                                  setShowVisitForm(true);
                                }
                              }}
                              className="font-semibold text-amber-900"
                            >
                              {estado === "EnRevision"
                                ? "Programar visita"
                                : "Gestionar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ResponsiveTableScroll>

            {totalPages > 1 && (
              <div className="flex justify-center pt-2">
                <Pagination
                  total={totalPages}
                  page={safePage}
                  onChange={setCurrentPage}
                  color="warning"
                  showControls
                  radius="full"
                />
              </div>
            )}
          </CardBody>
        </Card>

        {/* Bottom Selected Request Detail Panel matching Figma "El siguiente paso: conocerse" */}
        {selectedSolicitud && selectedEstado && (
          <Card className="mt-6 rounded-3xl border border-black/5 bg-white shadow-sm">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start">
                {/* Pet Photo Preview */}
                <div className="md:col-span-4">
                  <div className="overflow-hidden rounded-2xl bg-stone-200">
                    <img
                      src={
                        selectedAnimal
                          ? getPetImageUrl(selectedAnimal)
                          : `https://placehold.co/600x400/EDE8DF/52525B?text=${encodeURIComponent(
                              selectedSolicitud.animalNombre ?? "Mascota"
                            )}`
                      }
                      alt={selectedAnimal?.nombre ?? "Mascota"}
                      className="h-56 w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#11181C]">
                      {selectedAnimal?.nombre ?? selectedSolicitud.animalNombre}
                      {selectedAnimal
                        ? ` • ${formatAge(selectedAnimal.fechaNacimiento)}`
                        : ""}
                    </h3>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={ESTADO_UI[selectedEstado].color}
                    >
                      {ESTADO_UI[selectedEstado].label}
                    </Chip>
                  </div>
                  {selectedAnimal && (
                    <p className="mt-1 text-xs text-[#52525B]">
                      {formatVaccinationSummary(
                        selectedAnimal.idAnimal,
                        selectedAnimal.sexo,
                        vacunaciones
                      )}
                    </p>
                  )}
                </div>

                {/* Next Step & Actions */}
                <div className="flex flex-col gap-4 md:col-span-8">
                  <div>
                    <h2 className="text-xl font-bold text-[#11181C]">
                      El siguiente paso: conocerse
                    </h2>
                    <p className="mt-1 text-sm text-[#52525B]">
                      <strong className="text-[#11181C]">
                        {selectedAdoptante?.nombre ??
                          selectedSolicitud.adoptanteNombre}
                      </strong>{" "}
                      ha solicitado adoptar a{" "}
                      <strong className="text-[#11181C]">
                        {selectedAnimal?.nombre ?? selectedSolicitud.animalNombre}
                      </strong>
                      .
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 rounded-2xl bg-[#FAF8F5] p-4 text-xs text-[#52525B] sm:grid-cols-2">
                    <p>
                      <strong className="text-[#11181C]">Solicitud recibida:</strong>{" "}
                      {formatDate(selectedSolicitud.fechaSolicitud)}
                    </p>
                    <p>
                      <strong className="text-[#11181C]">Contacto:</strong>{" "}
                      {selectedAdoptante?.contacto ?? "No registrado"}
                    </p>
                    <p>
                      <strong className="text-[#11181C]">Vivienda:</strong>{" "}
                      {selectedAdoptante?.tipoViviendaNombre ?? "No indicada"}
                    </p>
                    <p>
                      <strong className="text-[#11181C]">Visita domiciliaria:</strong>{" "}
                      {selectedVisit
                        ? `${formatDate(selectedVisit.fecha)} (${selectedVisitResult}) · ${
                            selectedVisit.voluntarioNombre ?? "Voluntario"
                          }`
                        : "Sin programar"}
                    </p>
                    {selectedAdoptante?.otrasMascotas && (
                      <p className="sm:col-span-2">
                        <strong className="text-[#11181C]">Hogar / Otras mascotas:</strong>{" "}
                        {selectedAdoptante.otrasMascotas}
                      </p>
                    )}
                  </div>

                  {/* Schedule Visit inline form */}
                  {showVisitForm &&
                    (selectedEstado === "EnRevision" ||
                      selectedEstado === "VisitaProgramada") && (
                      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                        <p className="text-xs font-bold text-[#11181C]">
                          Programar visita domiciliaria
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Select
                            label="Voluntario responsable"
                            selectedKeys={voluntarioId ? [voluntarioId] : []}
                            onSelectionChange={(keys) => {
                              const first = Array.from(keys)[0];
                              setVoluntarioId(first ? String(first) : "");
                            }}
                            variant="flat"
                            size="sm"
                          >
                            {voluntarios.map((v) => (
                              <SelectItem key={String(v.idVoluntario)}>
                                {v.nombre}
                              </SelectItem>
                            ))}
                          </Select>

                          <Input
                            type="datetime-local"
                            label="Fecha y hora de la visita"
                            value={visitDate}
                            onValueChange={setVisitDate}
                            variant="flat"
                            size="sm"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            radius="full"
                            variant="flat"
                            onPress={() => setShowVisitForm(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            radius="full"
                            isLoading={submitting}
                            onPress={handleScheduleVisit}
                            className="bg-[#F59E0B] font-semibold text-white"
                          >
                            Confirmar visita
                          </Button>
                        </div>
                      </div>
                    )}

                  <Divider className="bg-black/5" />

                  {/* Contextual State Machine Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {selectedEstado === "Enviada" && (
                      <Button
                        radius="full"
                        isLoading={submitting}
                        onPress={() =>
                          setPendingStateChange({
                            solicitudId: Number(selectedSolicitud.idSolicitud),
                            estado: "EnRevision",
                            petName:
                              selectedAnimal?.nombre ??
                              selectedSolicitud.animalNombre ??
                              "la mascota",
                          })
                        }
                        className="bg-[#F59E0B] font-semibold text-white shadow-sm"
                      >
                        Pasar a En Revisión
                      </Button>
                    )}

                    {selectedEstado === "EnRevision" && !showVisitForm && (
                      <Button
                        radius="full"
                        onPress={() => setShowVisitForm(true)}
                        className="bg-[#F59E0B] font-semibold text-white shadow-sm"
                      >
                        Programar visita
                      </Button>
                    )}

                    {selectedEstado === "VisitaProgramada" &&
                      selectedVisitResult === "Favorable" && (
                        <Button
                          radius="full"
                          color="success"
                          isLoading={submitting}
                          onPress={() =>
                            setPendingStateChange({
                              solicitudId: Number(selectedSolicitud.idSolicitud),
                              estado: "Aprobada",
                              petName:
                                selectedAnimal?.nombre ??
                                selectedSolicitud.animalNombre ??
                                "la mascota",
                            })
                          }
                          className="font-semibold text-white shadow-sm"
                        >
                          Aprobar solicitud (Generar seguimientos 30/60/90)
                        </Button>
                      )}

                    {selectedEstado === "VisitaProgramada" &&
                      selectedVisitResult === "Desfavorable" &&
                      !showVisitForm && (
                        <Button
                          radius="full"
                          variant="flat"
                          color="warning"
                          onPress={() => setShowVisitForm(true)}
                          className="font-semibold text-amber-900"
                        >
                          Reprogramar visita
                        </Button>
                      )}

                    {selectedEstado === "VisitaProgramada" &&
                      selectedVisitResult === "Pendiente" && (
                        <Chip variant="flat" color="warning" size="sm">
                          Esperando resultado de la visita domiciliaria
                        </Chip>
                      )}

                    {(selectedEstado === "Enviada" ||
                      selectedEstado === "EnRevision" ||
                      selectedEstado === "VisitaProgramada") && (
                      <Button
                        radius="full"
                        variant="flat"
                        color="danger"
                        onPress={() =>
                          setPendingStateChange({
                            solicitudId: Number(selectedSolicitud.idSolicitud),
                            estado: "Rechazada",
                            petName:
                              selectedAnimal?.nombre ??
                              selectedSolicitud.animalNombre ??
                              "la mascota",
                          })
                        }
                        className="font-semibold"
                      >
                        Rechazar solicitud
                      </Button>
                    )}

                    {(selectedEstado === "Aprobada" ||
                      selectedEstado === "Rechazada" ||
                      selectedEstado === "Cancelada") && (
                      <p className="text-xs text-[#52525B]">
                        Esta solicitud está cerrada ({ESTADO_UI[selectedEstado].label})
                        {selectedSolicitud.fechaResolucion
                          ? ` desde el ${formatDate(selectedSolicitud.fechaResolucion)}`
                          : ""}
                        .
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        <ConfirmModal
          isOpen={pendingStateChange !== null}
          onClose={() => setPendingStateChange(null)}
          onConfirm={handleConfirmStateChange}
          isLoading={submitting}
          title={
            pendingStateChange?.estado === "Aprobada"
              ? "Aprobar solicitud de adopción?"
              : pendingStateChange?.estado === "Rechazada"
                ? "Rechazar solicitud de adopción?"
                : "Pasar solicitud a revisión?"
          }
          subtitle={
            pendingStateChange
              ? `Solicitud #${pendingStateChange.solicitudId} · ${pendingStateChange.petName}`
              : undefined
          }
          description={
            pendingStateChange?.estado === "Aprobada"
              ? `Al aprobar esta solicitud, ${pendingStateChange.petName} pasará a estado EnSeguimiento y se generarán automáticamente los seguimientos de 30, 60 y 90 días.`
              : pendingStateChange?.estado === "Rechazada"
                ? `Al rechazar esta solicitud, ${pendingStateChange.petName} volverá a estar Disponible en el catálogo público.`
                : "La solicitud pasará a estado En Revisión para poder programar la visita domiciliaria."
          }
          question="Desea confirmar este cambio?"
          confirmText="Sí, confirmar"
          cancelText="Cancelar"
        />
      </DashboardLayout>
    </>
  );
}
