import { useState, type FormEvent } from "react";
import { Head, router } from "@inertiajs/react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Select,
  SelectItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
} from "@heroui/react";
import { ResponsiveTableScroll } from "@/components/ResponsiveTableScroll";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { getHitoDays } from "@/lib/enumHelpers";
import { formatAge, formatDate, getPetImageUrl } from "@/lib/petHelpers";
import type {
  AnimalDto,
  ConsultaDto,
  RazaDto,
  SeguimientoDto,
  SolicitudDto,
  TipoVacunaDto,
  VacunacionDto,
  VeterinariaDto,
} from "@/types/models";

interface HistorialMedicoPageProps {
  selectedAnimalId?: number | null;
  animales: AnimalDto[];
  razas: RazaDto[];
  vacunaciones: VacunacionDto[];
  tiposVacunas: TipoVacunaDto[];
  consultas: ConsultaDto[];
  veterinarias: VeterinariaDto[];
  solicitudes: SolicitudDto[];
  seguimientos: SeguimientoDto[];
  alertasCount: number;
  flashSuccess?: string | null;
  flashError?: string | null;
  apiError?: string | null;
}

const ESTADO_ANIMAL_TEXT: Record<string, string> = {
  Disponible: "Disponible",
  EnProceso: "En proceso",
  EnSeguimiento: "En seguimiento",
  Adoptado: "Adoptado",
  NoAdoptable: "No adoptable",
};

function getVaccineStatus(proximaDosis?: string | null): {
  label: string;
  color: "success" | "warning" | "danger";
} {
  if (!proximaDosis) return { label: "Al día", color: "success" };
  const diffDays = Math.ceil(
    (new Date(proximaDosis).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return { label: "Vencida", color: "danger" };
  if (diffDays <= 30) return { label: `Vence en ${diffDays}d`, color: "warning" };
  return { label: "Al día", color: "success" };
}

export default function HistorialMedicoPage({
  selectedAnimalId,
  animales,
  razas,
  vacunaciones,
  tiposVacunas,
  consultas,
  veterinarias,
  solicitudes,
  seguimientos,
  alertasCount,
  flashSuccess,
  flashError,
  apiError,
}: HistorialMedicoPageProps) {
  const initialId =
    selectedAnimalId && animales.some((a) => Number(a.idAnimal) === selectedAnimalId)
      ? String(selectedAnimalId)
      : animales[0]
        ? String(animales[0].idAnimal)
        : "";

  const [animalIdStr, setAnimalIdStr] = useState(initialId);
  const [activeTab, setActiveTab] = useState("vacunas");
  const [showVacunaForm, setShowVacunaForm] = useState(false);
  const [showConsultaForm, setShowConsultaForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Vaccine form
  const [tipoVacunaId, setTipoVacunaId] = useState(
    tiposVacunas[0] ? String(tiposVacunas[0].idTipoVacuna) : ""
  );
  const [vacunaFecha, setVacunaFecha] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [proximaDosis, setProximaDosis] = useState(() => {
    const next = new Date();
    next.setFullYear(next.getFullYear() + 1);
    return next.toISOString().slice(0, 10);
  });

  // New Consultation form
  const [veterinariaId, setVeterinariaId] = useState(
    veterinarias[0] ? String(veterinarias[0].id) : ""
  );
  const [consultaFecha, setConsultaFecha] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");

  const razaById = new Map(razas.map((r) => [String(r.idRaza), r]));
  const tipoVacunaById = new Map(
    tiposVacunas.map((t) => [String(t.idTipoVacuna), t])
  );

  const selectedAnimal =
    animales.find((a) => String(a.idAnimal) === animalIdStr) ?? animales[0] ?? null;

  const selectedRaza = selectedAnimal
    ? razaById.get(String(selectedAnimal.razaId))
    : undefined;

  const animalVacunas = selectedAnimal
    ? vacunaciones.filter((v) => String(v.animalId) === String(selectedAnimal.idAnimal))
    : [];

  const animalConsultas = selectedAnimal
    ? consultas.filter((c) => String(c.animalId) === String(selectedAnimal.idAnimal))
    : [];

  const animalSolicitudes = selectedAnimal
    ? solicitudes.filter((s) => String(s.animalId) === String(selectedAnimal.idAnimal))
    : [];

  const animalSeguimientos = selectedAnimal
    ? seguimientos.filter((s) => String(s.animalId) === String(selectedAnimal.idAnimal))
    : [];

  const obligatorias = tiposVacunas.filter((t) => t.obligatoria && t.activo);
  const obligatoriasAlDia = obligatorias.filter((ob) =>
    animalVacunas.some(
      (v) =>
        String(v.tipoVacunaId) === String(ob.idTipoVacuna) &&
        (!v.proximaDosis || new Date(v.proximaDosis).getTime() >= Date.now())
    )
  ).length;

  const handleRegisterVacuna = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || !tipoVacunaId) return;
    setSubmitting(true);
    router.post(
      "/admin/historial-medico/vacunas",
      {
        animalId: Number(selectedAnimal.idAnimal),
        tipoVacunaId: Number(tipoVacunaId),
        fecha: vacunaFecha,
        proximaDosis,
      },
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
          setShowVacunaForm(false);
        },
      }
    );
  };

  const handleRegisterConsulta = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || !veterinariaId || !diagnostico.trim() || !tratamiento.trim())
      return;
    setSubmitting(true);
    router.post(
      "/admin/historial-medico/consultas",
      {
        animalId: Number(selectedAnimal.idAnimal),
        veterinariaId: Number(veterinariaId),
        fecha: consultaFecha,
        diagnostico: diagnostico.trim(),
        tratamiento: tratamiento.trim(),
      },
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
          setShowConsultaForm(false);
          setDiagnostico("");
          setTratamiento("");
        },
      }
    );
  };

  return (
    <>
      <Head title="Historial Médico y Vacunas" />
      <DashboardLayout activeNav="historial" alertasCount={alertasCount}>
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

        {/* Animal Selector */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-[#11181C]">
              Historial médico{selectedAnimal ? `: ${selectedAnimal.nombre}` : ""}
            </h1>
            <p className="text-xs text-[#52525B]">
              Carnet de vacunación, consultas veterinarias e historial completo del animal.
            </p>
          </div>

          <Select
            aria-label="Seleccionar mascota"
            label="Mascota"
            selectedKeys={selectedAnimal ? [String(selectedAnimal.idAnimal)] : []}
            onSelectionChange={(keys) => {
              const first = Array.from(keys)[0];
              if (first) setAnimalIdStr(String(first));
            }}
            variant="flat"
            size="sm"
            className="sm:w-64"
            classNames={{ trigger: "bg-white border border-black/10" }}
          >
            {animales.map((a) => {
              const label = `${a.nombre} (${a.razaNombre ?? "Refugio"})`;
              return (
                <SelectItem key={String(a.idAnimal)} textValue={label}>
                  {label}
                </SelectItem>
              );
            })}
          </Select>
        </div>

        {/* Selected Animal Summary Banner matching Figma */}
        {selectedAnimal && (
          <Card className="mb-6 rounded-3xl border border-black/5 bg-white shadow-sm">
            <CardBody className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip size="sm" variant="flat" color="warning">
                    {ESTADO_ANIMAL_TEXT[selectedAnimal.estado] ?? selectedAnimal.estado}
                  </Chip>
                  <Chip size="sm" variant="flat" color="success">
                    {obligatoriasAlDia}/{obligatorias.length} vacunas obligatorias al día
                  </Chip>
                </div>

                <p className="text-sm text-[#52525B]">
                  {selectedAnimal.descripcion?.trim() ||
                    "Expediente médico activo en el refugio."}
                </p>

                <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#52525B]">
                  <span>
                    <strong className="text-[#11181C]">Edad:</strong>{" "}
                    {formatAge(selectedAnimal.fechaNacimiento)}
                  </span>
                  <span>
                    <strong className="text-[#11181C]">Especie / Raza:</strong>{" "}
                    {selectedRaza?.especieNombre ?? "Mascota"} ·{" "}
                    {selectedAnimal.razaNombre ?? "Mestizo"}
                  </span>
                  <span>
                    <strong className="text-[#11181C]">Tamaño:</strong>{" "}
                    {selectedAnimal.tamanio}
                  </span>
                  <span>
                    <strong className="text-[#11181C]">Sexo:</strong>{" "}
                    {selectedAnimal.sexo}
                  </span>
                  <span>
                    <strong className="text-[#11181C]">Esterilizado:</strong>{" "}
                    {selectedAnimal.esterilizado}
                  </span>
                </div>
              </div>

              <div className="shrink-0 overflow-hidden rounded-2xl bg-stone-200 md:w-56">
                <img
                  src={getPetImageUrl(selectedAnimal, selectedRaza?.especieNombre)}
                  alt={selectedAnimal.nombre}
                  className="h-36 w-full object-cover"
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* 3 Medical & History Tabs */}
        {selectedAnimal && (
          <Card className="rounded-3xl border border-black/5 bg-white shadow-sm">
            <CardBody className="gap-5 p-5 md:p-6">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(k) => setActiveTab(String(k))}
                color="warning"
                variant="underlined"
                classNames={{
                  base: "w-full max-w-full",
                  tabList:
                    "gap-x-4 gap-y-1 sm:gap-6 border-b border-black/10 w-full flex-wrap",
                  tab: "px-1 pb-2.5 text-xs sm:text-sm font-semibold w-auto",
                }}
              >
                {/* TAB 1: Esquema de Vacunas */}
                <Tab
                  key="vacunas"
                  title={
                    <div className="flex items-center gap-2">
                      <span>Esquema de Vacunas</span>
                      <Chip size="sm" variant="flat">
                        {animalVacunas.length}
                      </Chip>
                    </div>
                  }
                >
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-[#11181C]">
                          Carnet de vacunación
                        </h2>
                        <p className="text-xs text-[#52525B]">
                          {obligatoriasAlDia}/{obligatorias.length} vacunas obligatorias al día
                        </p>
                      </div>
                      <Button
                        size="sm"
                        radius="full"
                        onPress={() => setShowVacunaForm(!showVacunaForm)}
                        className="bg-[#F59E0B] font-semibold text-white"
                      >
                        {showVacunaForm ? "Cerrar formulario" : "Agregar Vacuna"}
                      </Button>
                    </div>

                    {showVacunaForm && (
                      <form
                        onSubmit={handleRegisterVacuna}
                        className="grid grid-cols-1 gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:grid-cols-4 sm:items-end"
                      >
                        <Select
                          label="Vacuna"
                          selectedKeys={tipoVacunaId ? [tipoVacunaId] : []}
                          onSelectionChange={(keys) => {
                            const first = Array.from(keys)[0];
                            setTipoVacunaId(first ? String(first) : "");
                          }}
                          variant="flat"
                          size="sm"
                          isRequired
                        >
                          {tiposVacunas
                            .filter((t) => t.activo)
                            .map((t) => {
                              const label = t.obligatoria
                                ? `${t.nombre} (Obligatoria)`
                                : t.nombre;
                              return (
                                <SelectItem
                                  key={String(t.idTipoVacuna)}
                                  textValue={label}
                                >
                                  {label}
                                </SelectItem>
                              );
                            })}
                        </Select>

                        <Input
                          type="date"
                          label="Fecha de aplicación"
                          value={vacunaFecha}
                          onValueChange={setVacunaFecha}
                          variant="flat"
                          size="sm"
                          isRequired
                        />

                        <Input
                          type="date"
                          label="Próxima dosis"
                          value={proximaDosis}
                          onValueChange={setProximaDosis}
                          variant="flat"
                          size="sm"
                          isRequired
                        />

                        <Button
                          type="submit"
                          size="md"
                          radius="full"
                          isLoading={submitting}
                          className="bg-[#F59E0B] font-semibold text-white"
                        >
                          Guardar vacuna
                        </Button>
                      </form>
                    )}

                    {animalVacunas.length === 0 ? (
                      <p className="py-6 text-center text-sm text-[#52525B]">
                        Esta mascota aún no tiene vacunas registradas.
                      </p>
                    ) : (
                      <ResponsiveTableScroll>
                        <Table
                          aria-label="Tabla de vacunas aplicadas"
                          removeWrapper
                          classNames={{
                            table: "min-w-[560px]",
                          }}
                        >
                          <TableHeader>
                            <TableColumn>VACUNA</TableColumn>
                            <TableColumn>TIPO</TableColumn>
                            <TableColumn>FECHA APLICACIÓN</TableColumn>
                            <TableColumn>PRÓXIMA DOSIS</TableColumn>
                            <TableColumn>ESTADO</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {animalVacunas.map((v) => {
                              const tipo = tipoVacunaById.get(String(v.tipoVacunaId));
                              const status = getVaccineStatus(v.proximaDosis);
                              return (
                                <TableRow key={String(v.idVacunacion)}>
                                  <TableCell className="whitespace-nowrap font-semibold text-[#11181C]">
                                    {v.tipoVacunaNombre ?? tipo?.nombre ?? "Vacuna"}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      color={tipo?.obligatoria ? "warning" : "default"}
                                    >
                                      {tipo?.obligatoria ? "Obligatoria" : "Opcional"}
                                    </Chip>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap text-xs text-[#52525B]">
                                    {formatDate(v.fecha)}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap text-xs text-[#52525B]">
                                    {v.proximaDosis ? formatDate(v.proximaDosis) : "No aplica"}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <Chip size="sm" variant="flat" color={status.color}>
                                      {status.label}
                                    </Chip>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ResponsiveTableScroll>
                    )}
                  </div>
                </Tab>

                {/* TAB 2: Consultas y Tratamientos */}
                <Tab
                  key="consultas"
                  title={
                    <div className="flex items-center gap-2">
                      <span>Consultas y Tratamientos</span>
                      <Chip size="sm" variant="flat">
                        {animalConsultas.length}
                      </Chip>
                    </div>
                  }
                >
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-base font-bold text-[#11181C]">
                        Historial de consultas veterinarias
                      </h2>
                      <Button
                        size="sm"
                        radius="full"
                        onPress={() => setShowConsultaForm(!showConsultaForm)}
                        className="bg-[#F59E0B] font-semibold text-white"
                      >
                        {showConsultaForm ? "Cerrar formulario" : "Registrar Consulta"}
                      </Button>
                    </div>

                    {showConsultaForm && (
                      <form
                        onSubmit={handleRegisterConsulta}
                        className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Select
                            label="Clínica veterinaria"
                            selectedKeys={veterinariaId ? [veterinariaId] : []}
                            onSelectionChange={(keys) => {
                              const first = Array.from(keys)[0];
                              setVeterinariaId(first ? String(first) : "");
                            }}
                            variant="flat"
                            size="sm"
                            isRequired
                          >
                            {veterinarias
                              .filter((v) => v.activo)
                              .map((v) => (
                                <SelectItem key={String(v.id)}>{v.nombre}</SelectItem>
                              ))}
                          </Select>

                          <Input
                            type="date"
                            label="Fecha de consulta"
                            value={consultaFecha}
                            onValueChange={setConsultaFecha}
                            variant="flat"
                            size="sm"
                            isRequired
                          />
                        </div>

                        <Textarea
                          label="Diagnóstico"
                          placeholder="Describa el diagnóstico encontrado..."
                          value={diagnostico}
                          onValueChange={setDiagnostico}
                          variant="flat"
                          minRows={2}
                          isRequired
                        />

                        <Textarea
                          label="Tratamiento"
                          placeholder="Describa el tratamiento recetado..."
                          value={tratamiento}
                          onValueChange={setTratamiento}
                          variant="flat"
                          minRows={2}
                          isRequired
                        />

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            size="sm"
                            radius="full"
                            isLoading={submitting}
                            className="bg-[#F59E0B] px-6 font-semibold text-white"
                          >
                            Guardar consulta
                          </Button>
                        </div>
                      </form>
                    )}

                    {animalConsultas.length === 0 ? (
                      <p className="py-6 text-center text-sm text-[#52525B]">
                        No hay consultas veterinarias registradas para {selectedAnimal.nombre}.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {animalConsultas.map((c) => (
                          <div
                            key={String(c.idConsulta)}
                            className="rounded-2xl border border-black/5 bg-[#FAF8F5] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-bold text-[#11181C]">
                                {c.diagnostico}
                              </span>
                              <span className="text-xs font-medium text-[#52525B]">
                                {formatDate(c.fecha)} ·{" "}
                                {c.veterinariaNombre ?? "Clínica veterinaria"}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs text-[#52525B]">
                              <strong className="text-[#11181C]">Tratamiento:</strong>{" "}
                              {c.tratamiento}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Tab>

                {/* TAB 3: Historial de Adopción y Seguimientos (HU-14 / CU-15) */}
                <Tab
                  key="adopcion"
                  title={
                    <div className="flex items-center gap-2">
                      <span>Historial de Adopción</span>
                      <Chip size="sm" variant="flat">
                        {animalSolicitudes.length}
                      </Chip>
                    </div>
                  }
                >
                  <div className="mt-4 flex flex-col gap-4">
                    <h2 className="text-base font-bold text-[#11181C]">
                      Solicitudes y seguimientos asociados
                    </h2>

                    {animalSolicitudes.length === 0 ? (
                      <p className="py-6 text-center text-sm text-[#52525B]">
                        {selectedAnimal.nombre} aún no tiene solicitudes de adopción registradas.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {animalSolicitudes.map((sol) => {
                          const segs = animalSeguimientos
                            .filter((s) => String(s.solicitudId) === String(sol.idSolicitud))
                            .sort((a, b) => getHitoDays(a.hito) - getHitoDays(b.hito));

                          return (
                            <div
                              key={String(sol.idSolicitud)}
                              className="rounded-2xl border border-black/5 bg-[#FAF8F5] p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-bold text-[#11181C]">
                                  Solicitud #{sol.idSolicitud} ·{" "}
                                  {sol.adoptanteNombre ?? `Adoptante #${sol.adoptanteId}`}
                                </span>
                                <Chip size="sm" variant="flat" color="warning">
                                  {sol.estado}
                                </Chip>
                              </div>
                              <p className="mt-1 text-xs text-[#52525B]">
                                Recibida: {formatDate(sol.fechaSolicitud)}
                                {sol.fechaResolucion
                                  ? ` · Resuelta: ${formatDate(sol.fechaResolucion)}`
                                  : ""}
                              </p>

                              {segs.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {segs.map((s) => (
                                    <Chip
                                      key={String(s.idSeguimiento)}
                                      size="sm"
                                      variant="flat"
                                      color={
                                        s.estado === "Favorable"
                                          ? "success"
                                          : s.estado === "Vencido" ||
                                              s.estado === "Desfavorable"
                                            ? "danger"
                                            : "warning"
                                      }
                                    >
                                      Día {getHitoDays(s.hito)}: {s.estado}
                                    </Chip>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        )}
      </DashboardLayout>
    </>
  );
}
