import { useState, type FormEvent } from "react";
import { Head, router } from "@inertiajs/react";
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
} from "@heroui/react";
import { ResponsiveTableScroll } from "@/components/ResponsiveTableScroll";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import type { UsuarioDto } from "@/types/models";

interface UsuariosPageProps {
  usuarios: UsuarioDto[];
  alertasCount: number;
  flashSuccess?: string | null;
  flashError?: string | null;
  apiError?: string | null;
}

const PAGE_SIZE = 8;

const ROLES = [
  { key: "Administrador", label: "Administrador" },
  { key: "Coordinador", label: "Coordinador" },
  { key: "Veterinario", label: "Veterinario" },
  { key: "Voluntario", label: "Voluntario" },
] as const;

const ROLE_CHIP_COLOR: Record<
  string,
  "danger" | "warning" | "primary" | "success" | "default"
> = {
  Administrador: "danger",
  Coordinador: "warning",
  Veterinario: "primary",
  Voluntario: "success",
};

export default function UsuariosPage({
  usuarios,
  alertasCount,
  flashSuccess,
  flashError,
  apiError,
}: UsuariosPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);

  // Create user form state
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [correo, setCorreo] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("Voluntario");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Inline role editor state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>("Voluntario");
  const [updatingRole, setUpdatingRole] = useState(false);

  const startRoleEdit = (u: UsuarioDto) => {
    setEditingUserId(String(u.id));
    setEditingRole(u.rol);
  };

  const cancelRoleEdit = () => {
    setEditingUserId(null);
  };

  const saveRoleEdit = (userId: number | string) => {
    setUpdatingRole(true);
    router.post(
      `/admin/usuarios/${userId}/rol`,
      { rol: editingRole },
      {
        preserveScroll: true,
        onSuccess: () => {
          setEditingUserId(null);
        },
        onFinish: () => setUpdatingRole(false),
      }
    );
  };

  // KPIs
  const totalUsuarios = usuarios.length;
  const adminCount = usuarios.filter((u) => u.rol === "Administrador").length;
  const coordCount = usuarios.filter((u) => u.rol === "Coordinador").length;
  const vetVolCount = usuarios.filter(
    (u) => u.rol === "Veterinario" || u.rol === "Voluntario"
  ).length;

  const query = searchQuery.trim().toLowerCase();
  const filtered = usuarios.filter((u) => {
    const matchesRole = roleFilter === "todos" || u.rol === roleFilter;
    const matchesQuery =
      !query ||
      u.nombre.toLowerCase().includes(query) ||
      u.correo.toLowerCase().includes(query) ||
      u.nombreUsuario.toLowerCase().includes(query);
    return matchesRole && matchesQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const resetForm = () => {
    setNombre("");
    setApellidoPaterno("");
    setApellidoMaterno("");
    setCorreo("");
    setNombreUsuario("");
    setPassword("");
    setRol("Voluntario");
    setFormError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim() || !apellidoPaterno.trim()) {
      setFormError("Ingrese el nombre y el primer apellido del usuario.");
      return;
    }
    if (!correo.trim() || !correo.includes("@")) {
      setFormError("Ingrese un correo electrónico válido.");
      return;
    }
    if (!nombreUsuario.trim()) {
      setFormError("Ingrese un nombre de usuario.");
      return;
    }
    if (password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSubmitting(true);
    router.post(
      "/admin/usuarios",
      {
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim() || null,
        correo: correo.trim(),
        nombreUsuario: nombreUsuario.trim(),
        password,
        rol,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          resetForm();
        },
        onFinish: () => setSubmitting(false),
      }
    );
  };

  return (
    <DashboardLayout activeNav="usuarios" alertasCount={alertasCount}>
      <Head title="Gestión de Usuarios" />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#11181C] sm:text-3xl">
          Gestión de Usuarios y Roles
        </h1>
        <p className="text-sm text-[#52525B]">
          Administre las cuentas del personal del refugio y asigne permisos según su rol operativo.
        </p>
      </div>

      {/* Flash & Error banners */}
      {apiError && (
        <Card className="mb-5 border border-red-200 bg-red-50 shadow-none">
          <CardBody className="py-3 text-sm text-red-700">
            No se pudo cargar la lista de usuarios: {apiError}
          </CardBody>
        </Card>
      )}
      {flashSuccess && (
        <Card className="mb-5 border border-emerald-200 bg-emerald-50 shadow-none">
          <CardBody className="py-3 text-sm font-medium text-emerald-800">
            {flashSuccess}
          </CardBody>
        </Card>
      )}
      {flashError && (
        <Card className="mb-5 border border-red-200 bg-red-50 shadow-none">
          <CardBody className="py-3 text-sm font-medium text-red-700">
            {flashError}
          </CardBody>
        </Card>
      )}

      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="gap-1 p-4">
            <span className="text-xs font-medium text-[#52525B]">
              Total cuentas
            </span>
            <span className="text-2xl font-bold text-[#11181C]">
              {totalUsuarios}
            </span>
          </CardBody>
        </Card>
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="gap-1 p-4">
            <span className="text-xs font-medium text-[#52525B]">
              Administradores
            </span>
            <span className="text-2xl font-bold text-red-600">
              {adminCount}
            </span>
          </CardBody>
        </Card>
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="gap-1 p-4">
            <span className="text-xs font-medium text-[#52525B]">
              Coordinadores
            </span>
            <span className="text-2xl font-bold text-amber-600">
              {coordCount}
            </span>
          </CardBody>
        </Card>
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardBody className="gap-1 p-4">
            <span className="text-xs font-medium text-[#52525B]">
              Veterinarios y Voluntarios
            </span>
            <span className="text-2xl font-bold text-emerald-600">
              {vetVolCount}
            </span>
          </CardBody>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Users Table */}
        <div className="min-w-0 lg:col-span-7">
          <Card className="border border-black/5 bg-white shadow-sm">
            <CardBody className="gap-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#11181C]">
                    Cuentas registradas ({filtered.length})
                  </h2>
                  <p className="text-xs text-[#52525B]">
                    Busque por nombre, usuario o correo electrónico.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  size="sm"
                  variant="bordered"
                  placeholder="Buscar por nombre, usuario o correo..."
                  value={searchQuery}
                  onValueChange={(val) => {
                    setSearchQuery(val);
                    setCurrentPage(1);
                  }}
                  isClearable
                  className="flex-1"
                />
                <Select
                  size="sm"
                  variant="bordered"
                  aria-label="Filtrar por rol"
                  selectedKeys={[roleFilter]}
                  onSelectionChange={(keys) => {
                    const first = Array.from(keys)[0];
                    setRoleFilter(first ? String(first) : "todos");
                    setCurrentPage(1);
                  }}
                  className="sm:w-44"
                >
                  <SelectItem key="todos">Todos los roles</SelectItem>
                  <SelectItem key="Administrador">Administrador</SelectItem>
                  <SelectItem key="Coordinador">Coordinador</SelectItem>
                  <SelectItem key="Veterinario">Veterinario</SelectItem>
                  <SelectItem key="Voluntario">Voluntario</SelectItem>
                </Select>
              </div>

              <ResponsiveTableScroll>
                <Table
                  aria-label="Tabla de usuarios del sistema"
                  removeWrapper
                  classNames={{
                    table: "min-w-[660px]",
                    th: "bg-[#FAF8F5] text-[#52525B] text-xs font-semibold",
                    td: "py-3 text-sm whitespace-nowrap",
                  }}
                >
                  <TableHeader>
                    <TableColumn>NOMBRE</TableColumn>
                    <TableColumn>USUARIO</TableColumn>
                    <TableColumn>CORREO</TableColumn>
                    <TableColumn>ROL</TableColumn>
                    <TableColumn align="end">ACCIONES</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No se encontraron usuarios con los filtros actuales.">
                    {pageItems.map((u) => {
                      const isEditing = editingUserId === String(u.id);
                      return (
                        <TableRow key={String(u.id)}>
                          <TableCell className="font-semibold text-[#11181C]">
                            {u.nombre}
                          </TableCell>
                          <TableCell className="text-[#52525B]">
                            @{u.nombreUsuario}
                          </TableCell>
                          <TableCell className="text-[#52525B]">
                            {u.correo}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Select
                                aria-label={`Nuevo rol para ${u.nombre}`}
                                size="sm"
                                variant="bordered"
                                selectedKeys={[editingRole]}
                                onSelectionChange={(keys) => {
                                  const first = Array.from(keys)[0];
                                  if (first) setEditingRole(String(first));
                                }}
                                className="w-40"
                              >
                                {ROLES.map((r) => (
                                  <SelectItem key={r.key} textValue={r.label}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </Select>
                            ) : (
                              <Chip
                                size="sm"
                                variant="flat"
                                color={ROLE_CHIP_COLOR[u.rol] ?? "default"}
                                className="font-semibold"
                              >
                                {u.rol}
                              </Chip>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1.5">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    radius="full"
                                    color="warning"
                                    isLoading={updatingRole}
                                    onPress={() => saveRoleEdit(u.id)}
                                    className="font-semibold text-[#11181C]"
                                  >
                                    Guardar
                                  </Button>
                                  <Button
                                    size="sm"
                                    radius="full"
                                    variant="flat"
                                    isDisabled={updatingRole}
                                    onPress={cancelRoleEdit}
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  radius="full"
                                  variant="flat"
                                  onPress={() => startRoleEdit(u)}
                                >
                                  Editar rol
                                </Button>
                              )}
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
                    size="sm"
                    color="warning"
                    page={safePage}
                    total={totalPages}
                    onChange={setCurrentPage}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: Create User Form */}
        <div className="min-w-0 lg:col-span-5">
          <Card className="border border-black/5 bg-white shadow-sm">
            <CardBody className="gap-4 p-5">
              <div>
                <h2 className="text-base font-bold text-[#11181C]">
                  Nuevo Usuario del Sistema
                </h2>
                <p className="text-xs text-[#52525B]">
                  Complete los datos para habilitar acceso al panel correspondiente.
                </p>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <Input
                  label="Nombre"
                  placeholder="Ej. María"
                  variant="bordered"
                  size="sm"
                  isRequired
                  value={nombre}
                  onValueChange={setNombre}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Primer apellido"
                    placeholder="Ej. Rojas"
                    variant="bordered"
                    size="sm"
                    isRequired
                    value={apellidoPaterno}
                    onValueChange={setApellidoPaterno}
                  />
                  <Input
                    label="Segundo apellido"
                    placeholder="Opcional"
                    variant="bordered"
                    size="sm"
                    value={apellidoMaterno}
                    onValueChange={setApellidoMaterno}
                  />
                </div>

                <Input
                  type="email"
                  label="Correo electrónico"
                  placeholder="correo@adopta.cr"
                  variant="bordered"
                  size="sm"
                  isRequired
                  value={correo}
                  onValueChange={setCorreo}
                />

                <Input
                  label="Nombre de usuario"
                  placeholder="Ej. mrojas"
                  variant="bordered"
                  size="sm"
                  isRequired
                  value={nombreUsuario}
                  onValueChange={setNombreUsuario}
                />

                <Input
                  type="password"
                  label="Contraseña temporal"
                  placeholder="Mínimo 8 caracteres"
                  variant="bordered"
                  size="sm"
                  isRequired
                  value={password}
                  onValueChange={setPassword}
                  description="Debe contener al menos 8 caracteres."
                />

                <Select
                  label="Rol asignado"
                  variant="bordered"
                  size="sm"
                  isRequired
                  selectedKeys={[rol]}
                  onSelectionChange={(keys) => {
                    const first = Array.from(keys)[0];
                    if (first) setRol(String(first));
                  }}
                >
                  {ROLES.map((r) => (
                    <SelectItem key={r.key}>{r.label}</SelectItem>
                  ))}
                </Select>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="flat"
                    radius="full"
                    onPress={resetForm}
                    isDisabled={submitting}
                  >
                    Limpiar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    color="warning"
                    radius="full"
                    isLoading={submitting}
                    className="font-semibold text-[#11181C]"
                  >
                    Crear usuario
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
