import { useState, type FormEvent } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
  Button,
  Card,
  CardBody,
  Chip,
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
  Textarea,
} from "@heroui/react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ResponsiveTableScroll } from "@/components/ResponsiveTableScroll";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { formatAge } from "@/lib/petHelpers";
import type { AnimalDto, EspecieDto, EstadoAnimal, RazaDto } from "@/types/models";

interface InventarioPageProps {
  animales: AnimalDto[];
  razas: RazaDto[];
  especies: EspecieDto[];
  alertasCount: number;
  flashSuccess?: string | null;
  flashError?: string | null;
  apiError?: string | null;
}

const PAGE_SIZE = 7;

const ESTADO_ANIMAL_UI: Record<
  EstadoAnimal,
  { label: string; color: "success" | "warning" | "primary" | "secondary" | "danger" }
> = {
  Disponible: { label: "Disponible", color: "success" },
  EnProceso: { label: "En proceso", color: "warning" },
  EnSeguimiento: { label: "En seguimiento", color: "primary" },
  Adoptado: { label: "Adoptado", color: "secondary" },
  NoAdoptable: { label: "No adoptable", color: "danger" },
};

export default function InventarioPage({
  animales,
  razas,
  especies,
  alertasCount,
  flashSuccess,
  flashError,
  apiError,
}: InventarioPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);

  // Create / Edit form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [especieId, setEspecieId] = useState(
    especies[0] ? String(especies[0].id) : ""
  );
  const [razaId, setRazaId] = useState(razas[0] ? String(razas[0].idRaza) : "");
  const [fechaNacimiento, setFechaNacimiento] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [sexo, setSexo] = useState("Macho");
  const [tamanio, setTamanio] = useState("Mediano");
  const [esterilizado, setEsterilizado] = useState("Sí");
  const [fotoUrl, setFotoUrl] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<AnimalDto | null>(null);

  const razaById = new Map(razas.map((r) => [String(r.idRaza), r]));

  const filteredRazas = especieId
    ? razas.filter((r) => String(r.especieId) === especieId)
    : razas;

  // KPIs
  const activos = animales.filter((a) => a.activo);
  const disponiblesCount = activos.filter((a) => a.estado === "Disponible").length;
  const enProcesoCount = activos.filter(
    (a) => a.estado === "EnProceso" || a.estado === "EnSeguimiento"
  ).length;
  const noAdoptablesCount = activos.filter(
    (a) => a.estado === "NoAdoptable"
  ).length;

  const query = searchQuery.trim().toLowerCase();
  const filtered = activos.filter((a) => {
    const matchesEstado = estadoFilter === "todos" || a.estado === estadoFilter;
    const matchesQuery =
      !query ||
      a.nombre.toLowerCase().includes(query) ||
      (a.razaNombre ?? "").toLowerCase().includes(query);
    return matchesEstado && matchesQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setFotoUrl("");
    setDescripcion("");
    setSexo("Macho");
    setTamanio("Mediano");
    setEsterilizado("Sí");
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    setFechaNacimiento(d.toISOString().slice(0, 10));
  };

  const startEdit = (animal: AnimalDto) => {
    const raza = razaById.get(String(animal.razaId));
    setEditingId(Number(animal.idAnimal));
    setNombre(animal.nombre);
    if (raza) setEspecieId(String(raza.especieId));
    setRazaId(String(animal.razaId));
    setFechaNacimiento(animal.fechaNacimiento.slice(0, 10));
    setSexo(animal.sexo);
    setTamanio(animal.tamanio);
    setEsterilizado(animal.esterilizado);
    setFotoUrl(animal.fotoUrl ?? "");
    setDescripcion(animal.descripcion ?? "");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !razaId) return;
    setSubmitting(true);

    const url = editingId
      ? `/admin/inventario/${editingId}/editar`
      : "/admin/inventario";

    router.post(
      url,
      {
        nombre: nombre.trim(),
        razaId: Number(razaId),
        fechaNacimiento,
        sexo,
        tamanio,
        esterilizado,
        activo: true,
        fotoUrl: fotoUrl.trim() || null,
        descripcion: descripcion.trim() || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => resetForm(),
        onFinish: () => setSubmitting(false),
      }
    );
  };

  const confirmDeactivate = () => {
    if (!deactivateTarget) return;
    setSubmitting(true);
    router.post(
      `/admin/inventario/${deactivateTarget.idAnimal}/desactivar`,
      {},
      {
        preserveScroll: true,
        onFinish: () => {
          setSubmitting(false);
          setDeactivateTarget(null);
        },
      }
    );
  };

  return (
    <>
      <Head title="Inventario del Refugio" />
      <DashboardLayout activeNav="inventario" alertasCount={alertasCount}>
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[#11181C]">
            Inventario del Refugio
          </h1>
          <p className="text-xs text-[#52525B]">
            Consulte el estado general, edite fichas o registre el ingreso de un nuevo animal.
          </p>
        </div>

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

        {/* 4 KPI Stat Cards matching Figma Captura 4 right */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border border-black/5 bg-white shadow-xs">
            <CardBody className="p-4">
              <p className="text-2xl font-bold text-[#11181C]">{activos.length}</p>
              <p className="text-xs text-[#52525B]">Bajo custodia</p>
            </CardBody>
          </Card>
          <Card className="border border-black/5 bg-white shadow-xs">
            <CardBody className="p-4">
              <p className="text-2xl font-bold text-emerald-700">{disponiblesCount}</p>
              <p className="text-xs text-[#52525B]">Disponibles</p>
            </CardBody>
          </Card>
          <Card className="border border-black/5 bg-white shadow-xs">
            <CardBody className="p-4">
              <p className="text-2xl font-bold text-amber-600">{enProcesoCount}</p>
              <p className="text-xs text-[#52525B]">En proceso / seguimiento</p>
            </CardBody>
          </Card>
          <Card className="border border-black/5 bg-white shadow-xs">
            <CardBody className="p-4">
              <p className="text-2xl font-bold text-danger-600">{noAdoptablesCount}</p>
              <p className="text-xs text-[#52525B]">No adoptables / tratamiento</p>
            </CardBody>
          </Card>
        </div>

        {/* 2-Column Layout matching Figma */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left: Animals Table */}
          <Card className="min-w-0 rounded-3xl border border-black/5 bg-white shadow-sm lg:col-span-7">
            <CardBody className="gap-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[#11181C]">
                  Animales registrados
                </h2>
                <span className="text-xs text-[#52525B]">
                  {filtered.length} de {activos.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Input
                  aria-label="Buscar animal"
                  placeholder="Buscar por nombre o raza..."
                  value={searchQuery}
                  onValueChange={(v) => {
                    setSearchQuery(v);
                    setCurrentPage(1);
                  }}
                  isClearable
                  onClear={() => setSearchQuery("")}
                  variant="flat"
                  radius="full"
                  size="sm"
                  className="flex-1"
                />

                <Select
                  aria-label="Filtrar por estado"
                  selectedKeys={[estadoFilter]}
                  onSelectionChange={(keys) => {
                    const first = Array.from(keys)[0];
                    setEstadoFilter(first ? String(first) : "todos");
                    setCurrentPage(1);
                  }}
                  variant="flat"
                  radius="full"
                  size="sm"
                  className="sm:w-44"
                >
                  <SelectItem key="todos">Todos los estados</SelectItem>
                  <SelectItem key="Disponible">Disponible</SelectItem>
                  <SelectItem key="EnProceso">En proceso</SelectItem>
                  <SelectItem key="EnSeguimiento">En seguimiento</SelectItem>
                  <SelectItem key="Adoptado">Adoptado</SelectItem>
                  <SelectItem key="NoAdoptable">No adoptable</SelectItem>
                </Select>
              </div>

              <ResponsiveTableScroll>
                <Table
                  aria-label="Animales registrados en el refugio"
                  removeWrapper
                  classNames={{
                    table: "min-w-[560px]",
                  }}
                >
                  <TableHeader>
                    <TableColumn>ANIMAL</TableColumn>
                    <TableColumn>EDAD</TableColumn>
                    <TableColumn>ESTADO</TableColumn>
                    <TableColumn align="end">ACCIONES</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay animales que coincidan con la búsqueda.">
                    {pageItems.map((animal) => {
                      const ui = ESTADO_ANIMAL_UI[animal.estado];

                      return (
                        <TableRow key={String(animal.idAnimal)}>
                          <TableCell className="whitespace-nowrap">
                            <div className="leading-tight">
                              <p className="font-semibold text-[#11181C]">
                                {animal.nombre}
                              </p>
                              <p className="text-[11px] text-[#52525B]">
                                {animal.razaNombre ?? "Mestizo"} · {animal.sexo}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-[#52525B]">
                            {formatAge(animal.fechaNacimiento)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Chip size="sm" variant="flat" color={ui.color}>
                              {ui.label}
                            </Chip>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                radius="full"
                                variant="flat"
                                onPress={() => startEdit(animal)}
                              >
                                Editar
                              </Button>
                              <Button
                                as={Link}
                                href={`/admin/historial-medico?animalId=${animal.idAnimal}`}
                                size="sm"
                                radius="full"
                                variant="flat"
                                color="warning"
                                className="text-amber-900"
                              >
                                Médico
                              </Button>
                              <Button
                                size="sm"
                                radius="full"
                                variant="flat"
                                color="danger"
                                onPress={() => setDeactivateTarget(animal)}
                              >
                                Baja
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
                <div className="flex justify-center pt-1">
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

          {/* Right: Create / Edit Animal Form matching Figma "Ingreso de Nuevo Animal" */}
          <Card className="min-w-0 rounded-3xl border border-black/5 bg-white shadow-sm lg:sticky lg:top-20 lg:col-span-5">
            <CardBody className="gap-4 p-6">
              <div>
                <h2 className="text-base font-bold text-[#11181C]">
                  {editingId ? `Editar Ficha (#${editingId})` : "Ingreso de Nuevo Animal"}
                </h2>
                <p className="text-xs text-[#52525B]">
                  {editingId
                    ? "Modifique los datos y guarde la ficha actualizada."
                    : "Cree la ficha inicial de un nuevo rescate."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <Input
                  label="Nombre del Animal"
                  placeholder="Ej. Toby"
                  value={nombre}
                  onValueChange={setNombre}
                  variant="flat"
                  size="sm"
                  isRequired
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    label="Especie"
                    selectedKeys={especieId ? [especieId] : []}
                    onSelectionChange={(keys) => {
                      const first = Array.from(keys)[0];
                      const nextEsp = first ? String(first) : "";
                      setEspecieId(nextEsp);
                      const firstRaza = razas.find(
                        (r) => String(r.especieId) === nextEsp
                      );
                      if (firstRaza) setRazaId(String(firstRaza.idRaza));
                    }}
                    variant="flat"
                    size="sm"
                  >
                    {especies.map((e) => (
                      <SelectItem key={String(e.id)}>{e.nombre}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Raza / Cruce"
                    selectedKeys={razaId ? [razaId] : []}
                    onSelectionChange={(keys) => {
                      const first = Array.from(keys)[0];
                      setRazaId(first ? String(first) : "");
                    }}
                    variant="flat"
                    size="sm"
                    isRequired
                  >
                    {filteredRazas.map((r) => (
                      <SelectItem key={String(r.idRaza)}>{r.nombre}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    type="date"
                    label="Fecha de nacimiento (aprox.)"
                    value={fechaNacimiento}
                    onValueChange={setFechaNacimiento}
                    variant="flat"
                    size="sm"
                    isRequired
                  />

                  <Select
                    label="Sexo"
                    selectedKeys={[sexo]}
                    onSelectionChange={(keys) => {
                      const first = Array.from(keys)[0];
                      if (first) setSexo(String(first));
                    }}
                    variant="flat"
                    size="sm"
                  >
                    <SelectItem key="Macho">Macho</SelectItem>
                    <SelectItem key="Hembra">Hembra</SelectItem>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    label="Tamaño"
                    selectedKeys={[tamanio]}
                    onSelectionChange={(keys) => {
                      const first = Array.from(keys)[0];
                      if (first) setTamanio(String(first));
                    }}
                    variant="flat"
                    size="sm"
                  >
                    <SelectItem key="Pequeño">Pequeño</SelectItem>
                    <SelectItem key="Mediano">Mediano</SelectItem>
                    <SelectItem key="Grande">Grande</SelectItem>
                  </Select>

                  <Select
                    label="Esterilizado"
                    selectedKeys={[esterilizado]}
                    onSelectionChange={(keys) => {
                      const first = Array.from(keys)[0];
                      if (first) setEsterilizado(String(first));
                    }}
                    variant="flat"
                    size="sm"
                  >
                    <SelectItem key="Sí">Sí</SelectItem>
                    <SelectItem key="No">No</SelectItem>
                  </Select>
                </div>

                <Input
                  label="URL de fotografía (opcional)"
                  placeholder="https://..."
                  value={fotoUrl}
                  onValueChange={setFotoUrl}
                  variant="flat"
                  size="sm"
                />

                <Textarea
                  label="Historia y Observaciones de Rescate"
                  placeholder="Describa dónde fue encontrado y las observaciones de su ingreso..."
                  value={descripcion}
                  onValueChange={setDescripcion}
                  variant="flat"
                  minRows={3}
                />

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    radius="full"
                    variant="flat"
                    onPress={resetForm}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    radius="full"
                    isLoading={submitting}
                    className="bg-[#F59E0B] px-6 font-semibold text-white"
                  >
                    {editingId ? "Actualizar Ficha" : "Guardar Ficha"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <ConfirmModal
          isOpen={deactivateTarget !== null}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={confirmDeactivate}
          isLoading={submitting}
          title="Desactivar animal del inventario?"
          subtitle={deactivateTarget ? deactivateTarget.nombre : undefined}
          description="El animal quedará marcado como inactivo y dejará de mostrarse en el catálogo público."
          question="Desea continuar?"
          confirmText="Sí, desactivar"
          cancelText="Cancelar"
        />
      </DashboardLayout>
    </>
  );
}
