import { useState } from "react";
import { Head } from "@inertiajs/react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { ResponsiveTableScroll } from "@/components/ResponsiveTableScroll";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import type {
  AdoptanteDto,
  AnimalDto,
  SeguimientoDto,
  SolicitudDto,
  TipoVacunaDto,
  VacunacionDto,
} from "@/types/models";

interface ReportesPageProps {
  solicitudes: SolicitudDto[];
  animales: AnimalDto[];
  adoptantes: AdoptanteDto[];
  seguimientos: SeguimientoDto[];
  vacunaciones: VacunacionDto[];
  tiposVacunas: TipoVacunaDto[];
  alertasCount: number;
  apiError?: string | null;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export default function ReportesPage({
  solicitudes,
  animales,
  adoptantes,
  seguimientos,
  vacunaciones,
  tiposVacunas,
  alertasCount,
  apiError,
}: ReportesPageProps) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [diasVacuna, setDiasVacuna] = useState("30");

  const now = new Date();
  const nowMs = now.getTime();

  // 1. Adopciones aprobadas
  const aprobadas = solicitudes.filter((s) => s.estado === "Aprobada");

  const aprobadasFiltradas = aprobadas.filter((s) => {
    const refDate = new Date(s.fechaResolucion ?? s.fechaSolicitud);
    if (desde) {
      const fromDate = new Date(`${desde}T00:00:00`);
      if (refDate < fromDate) return false;
    }
    if (hasta) {
      const toDate = new Date(`${hasta}T23:59:59`);
      if (refDate > toDate) return false;
    }
    return true;
  });

  // 2. Seguimientos vencidos
  const seguimientosVencidos = seguimientos.filter((s) => {
    if (s.estado === "Vencido") return true;
    if (s.estado === "Pendiente") {
      return new Date(s.fechaProgramada).getTime() < nowMs;
    }
    return false;
  });

  // 3. Vacunas próximas a vencer
  const diasNum = Math.max(1, Number(diasVacuna) || 30);
  const limiteVacunaMs = nowMs + diasNum * 24 * 60 * 60 * 1000;
  const vacunasProximas = vacunaciones.filter((v) => {
    if (!v.proximaDosis) return false;
    const proxMs = new Date(v.proximaDosis).getTime();
    return !Number.isNaN(proxMs) && proxMs <= limiteVacunaMs;
  });

  // 4. Tiempo promedio de permanencia / resolución
  const aprobadasConResolucion = aprobadas.filter((s) => Boolean(s.fechaResolucion));
  const promedioDias =
    aprobadasConResolucion.length > 0
      ? Math.round(
          aprobadasConResolucion.reduce(
            (acc, s) => acc + daysBetween(s.fechaSolicitud, s.fechaResolucion!),
            0
          ) / aprobadasConResolucion.length
        )
      : 0;

  // Build CSV URLs
  const adopcionesParams = new URLSearchParams();
  if (desde) adopcionesParams.set("desde", desde);
  if (hasta) adopcionesParams.set("hasta", hasta);
  const adopcionesCsvUrl = `/admin/reportes/csv/adopciones${
    adopcionesParams.toString() ? `?${adopcionesParams.toString()}` : ""
  }`;
  const seguimientosCsvUrl = "/admin/reportes/csv/seguimientos-vencidos";
  const vacunasCsvUrl = `/admin/reportes/csv/vacunas-proximas?dias=${diasNum}`;
  const permanenciaCsvUrl = "/admin/reportes/csv/permanencia-refugio";

  // Lookup helpers for preview table
  const animalById = new Map(animales.map((a) => [String(a.idAnimal), a]));
  const adoptanteById = new Map(
    adoptantes.map((a) => [String(a.idAdoptante), a])
  );

  const recientesAprobadas = [...aprobadas]
    .sort((a, b) => {
      const da = new Date(a.fechaResolucion ?? a.fechaSolicitud).getTime();
      const db = new Date(b.fechaResolucion ?? b.fechaSolicitud).getTime();
      return db - da;
    })
    .slice(0, 8);

  return (
    <DashboardLayout activeNav="reportes" alertasCount={alertasCount}>
      <Head title="Reportes Operativos" />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#11181C] sm:text-3xl">
          Reportes y Exportación CSV
        </h1>
        <p className="text-sm text-[#52525B]">
          Consulte los indicadores clave del refugio y descargue reportes operativos listos para Excel.
        </p>
      </div>

      {apiError && (
        <Card className="mb-5 border border-red-200 bg-red-50 shadow-none">
          <CardBody className="py-3 text-sm text-red-700">
            No se pudieron cargar los datos de reportes: {apiError}
          </CardBody>
        </Card>
      )}

      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="gap-1 p-4">
            <span className="text-xs font-medium text-[#52525B]">
              Adopciones aprobadas
            </span>
            <span className="text-2xl font-bold text-emerald-600">
              {aprobadas.length}
            </span>
          </CardBody>
        </Card>
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="gap-1 p-4">
            <span className="text-xs font-medium text-[#52525B]">
              Seguimientos vencidos
            </span>
            <span className="text-2xl font-bold text-red-600">
              {seguimientosVencidos.length}
            </span>
          </CardBody>
        </Card>
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="gap-1 p-4">
            <span className="text-xs font-medium text-[#52525B]">
              Vacunas por vencer ({diasNum}d)
            </span>
            <span className="text-2xl font-bold text-amber-600">
              {vacunasProximas.length}
            </span>
          </CardBody>
        </Card>
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="gap-1 p-4">
            <span className="text-xs font-medium text-[#52525B]">
              Promedio días en proceso
            </span>
            <span className="text-2xl font-bold text-[#11181C]">
              {promedioDias} d
            </span>
          </CardBody>
        </Card>
      </div>

      {/* 4 Export Report Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Report 1: Adopciones por período */}
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="flex flex-col justify-between gap-4 p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#11181C]">
                    1. Adopciones por período
                  </h2>
                  <p className="text-xs text-[#52525B]">
                    Listado de adopciones aprobadas filtrado por rango de fechas.
                  </p>
                </div>
                <Chip size="sm" variant="flat" color="success" className="font-semibold">
                  {aprobadasFiltradas.length} registros
                </Chip>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  type="date"
                  size="sm"
                  variant="bordered"
                  label="Desde"
                  value={desde}
                  onValueChange={setDesde}
                />
                <Input
                  type="date"
                  size="sm"
                  variant="bordered"
                  label="Hasta"
                  value={hasta}
                  onValueChange={setHasta}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                size="sm"
                variant="light"
                radius="full"
                isDisabled={!desde && !hasta}
                onPress={() => {
                  setDesde("");
                  setHasta("");
                }}
              >
                Limpiar fechas
              </Button>
              <Button
                as="a"
                href={adopcionesCsvUrl}
                download
                size="sm"
                color="warning"
                radius="full"
                className="font-semibold text-[#11181C]"
              >
                Descargar CSV
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Report 2: Seguimientos vencidos */}
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="flex flex-col justify-between gap-4 p-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#11181C]">
                    2. Seguimientos post-adopción vencidos
                  </h2>
                  <p className="text-xs text-[#52525B]">
                    Hitos de 30, 60 o 90 días cuya fecha programada ya expiró sin cierre.
                  </p>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  color={seguimientosVencidos.length > 0 ? "danger" : "success"}
                  className="font-semibold"
                >
                  {seguimientosVencidos.length} vencidos
                </Chip>
              </div>
              <p className="text-xs text-[#52525B]">
                Incluye mascota, adoptante, hito, fecha programada y días de atraso acumulados.
              </p>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Button
                as="a"
                href={seguimientosCsvUrl}
                download
                size="sm"
                color="warning"
                radius="full"
                className="font-semibold text-[#11181C]"
              >
                Descargar CSV
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Report 3: Vacunas próximas a vencer */}
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="flex flex-col justify-between gap-4 p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#11181C]">
                    3. Vacunas próximas a vencer
                  </h2>
                  <p className="text-xs text-[#52525B]">
                    Refuerzos vencidos o programados dentro de la ventana seleccionada ({tiposVacunas.length} tipos registrados).
                  </p>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  color={vacunasProximas.length > 0 ? "warning" : "success"}
                  className="font-semibold"
                >
                  {vacunasProximas.length} dosis
                </Chip>
              </div>

              <Select
                size="sm"
                variant="bordered"
                label="Ventana de vencimiento"
                selectedKeys={[diasVacuna]}
                onSelectionChange={(keys) => {
                  const first = Array.from(keys)[0];
                  if (first) setDiasVacuna(String(first));
                }}
                className="max-w-xs"
              >
                <SelectItem key="15">Próximos 15 días</SelectItem>
                <SelectItem key="30">Próximos 30 días</SelectItem>
                <SelectItem key="60">Próximos 60 días</SelectItem>
                <SelectItem key="90">Próximos 90 días</SelectItem>
              </Select>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Button
                as="a"
                href={vacunasCsvUrl}
                download
                size="sm"
                color="warning"
                radius="full"
                className="font-semibold text-[#11181C]"
              >
                Descargar CSV
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Report 4: Tiempo promedio de permanencia */}
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="flex flex-col justify-between gap-4 p-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#11181C]">
                    4. Permanencia y tiempo de resolución
                  </h2>
                  <p className="text-xs text-[#52525B]">
                    Detalle por adopción aprobada con los días transcurridos entre solicitud y resolución.
                  </p>
                </div>
                <Chip size="sm" variant="flat" color="primary" className="font-semibold">
                  Promedio: {promedioDias} días
                </Chip>
              </div>
              <p className="text-xs text-[#52525B]">
                Calculado sobre {aprobadasConResolucion.length} adopciones con fecha de resolución registrada ({animales.length} animales en inventario total).
              </p>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Button
                as="a"
                href={permanenciaCsvUrl}
                download
                size="sm"
                color="warning"
                radius="full"
                className="font-semibold text-[#11181C]"
              >
                Descargar CSV
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Preview Table of Recent Approved Adoptions */}
      <Card className="border border-black/5 bg-white shadow-sm">
        <CardBody className="gap-4 p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#11181C]">
                Últimas adopciones aprobadas
              </h2>
              <p className="text-xs text-[#52525B]">
                Vista rápida de las aprobaciones más recientes incluidas en los reportes.
              </p>
            </div>
            <Chip size="sm" variant="flat" className="font-semibold">
              Mostrando {recientesAprobadas.length} de {aprobadas.length}
            </Chip>
          </div>

          <ResponsiveTableScroll>
            <Table
              aria-label="Vista previa de adopciones aprobadas"
              removeWrapper
              classNames={{
                table: "min-w-[660px]",
                th: "bg-[#FAF8F5] text-[#52525B] text-xs font-semibold",
                td: "py-3 text-sm whitespace-nowrap",
              }}
            >
              <TableHeader>
                <TableColumn>SOLICITUD</TableColumn>
                <TableColumn>MASCOTA</TableColumn>
                <TableColumn>ADOPTANTE</TableColumn>
                <TableColumn>FECHA SOLICITUD</TableColumn>
                <TableColumn>APROBACIÓN</TableColumn>
                <TableColumn>DÍAS EN PROCESO</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Todavía no hay adopciones aprobadas registradas.">
                {recientesAprobadas.map((s) => {
                  const animalNombre =
                    s.animalNombre ??
                    animalById.get(String(s.animalId))?.nombre ??
                    `Animal #${s.animalId}`;
                  const adoptanteNombre =
                    s.adoptanteNombre ??
                    adoptanteById.get(String(s.adoptanteId))?.nombre ??
                    `Adoptante #${s.adoptanteId}`;
                  const dias = s.fechaResolucion
                    ? daysBetween(s.fechaSolicitud, s.fechaResolucion)
                    : null;

                  return (
                    <TableRow key={String(s.idSolicitud)}>
                      <TableCell className="font-semibold text-[#11181C]">
                        #{s.idSolicitud}
                      </TableCell>
                      <TableCell className="font-medium text-[#11181C]">
                        {animalNombre}
                      </TableCell>
                      <TableCell className="text-[#52525B]">
                        {adoptanteNombre}
                      </TableCell>
                      <TableCell className="text-[#52525B]">
                        {formatDate(s.fechaSolicitud)}
                      </TableCell>
                      <TableCell className="text-[#52525B]">
                        {formatDate(s.fechaResolucion)}
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color="success">
                          {dias !== null ? `${dias} días` : "—"}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ResponsiveTableScroll>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
