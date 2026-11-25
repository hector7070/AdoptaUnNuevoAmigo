import { useState, type ReactNode } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
  Button,
  Chip,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/react";
import { Footer } from "@/components/Footer";
import { PawIcon } from "@/components/PawIcon";

interface SharedAuth {
  autenticado: boolean;
  nombre: string | null;
  correo: string | null;
  rol: string | null;
}

export type AdminNavKey =
  | "solicitudes"
  | "inventario"
  | "historial"
  | "alertas"
  | "reportes"
  | "usuarios";

interface DashboardLayoutProps {
  activeNav: AdminNavKey;
  alertasCount?: number;
  children: ReactNode;
}

const ALL_NAV_ITEMS: {
  key: AdminNavKey;
  label: string;
  href: string;
  roles: string[];
}[] = [
  {
    key: "solicitudes",
    label: "Solicitudes",
    href: "/admin/solicitudes",
    roles: ["Administrador", "Coordinador"],
  },
  {
    key: "inventario",
    label: "Inventario",
    href: "/admin/inventario",
    roles: ["Administrador", "Coordinador"],
  },
  {
    key: "historial",
    label: "Historial Médico",
    href: "/admin/historial-medico",
    roles: ["Administrador", "Coordinador", "Veterinario"],
  },
  {
    key: "reportes",
    label: "Reportes",
    href: "/admin/reportes",
    roles: ["Administrador", "Coordinador"],
  },
  {
    key: "usuarios",
    label: "Usuarios",
    href: "/admin/usuarios",
    roles: ["Administrador"],
  },
];

export function DashboardLayout({
  activeNav,
  alertasCount = 0,
  children,
}: DashboardLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { auth, csrfToken } = usePage<{
    auth?: SharedAuth;
    csrfToken?: string;
  }>().props;

  const currentRole = auth?.rol ?? "Administrador";
  const navItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(currentRole)
  );

  const roleLabel =
    currentRole === "Coordinador" ? "Coordinación" : currentRole;

  const homeHref =
    currentRole === "Veterinario"
      ? "/admin/historial-medico"
      : "/admin/solicitudes";

  const handleLogout = () => {
    router.post(
      "/Cuenta/Salir",
      { __RequestVerificationToken: csrfToken ?? "" },
      { forceFormData: true }
    );
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[#FAF8F5] text-[#11181C]">
      <Navbar
        maxWidth="xl"
        isBordered
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        className="border-black/5 bg-[#FAF8F5]/95 backdrop-blur-md"
        classNames={{
          wrapper: "px-3 sm:px-6 gap-2",
        }}
      >
        <NavbarContent className="min-w-0 gap-2">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            className="shrink-0 lg:hidden"
          />
          <NavbarBrand className="min-w-0 gap-2">
            <Link
              href={homeHref}
              className="flex min-w-0 items-center gap-2 text-[#11181C] no-underline"
            >
              <PawIcon color="#292D32" size={20} />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-bold tracking-tight sm:text-sm">
                  Adopta Un Nuevo Amigo
                </p>
                <p className="hidden text-[11px] text-[#52525B] sm:block">
                  Dashboard de administración
                </p>
              </div>
            </Link>
            <Chip
              size="sm"
              variant="flat"
              color="success"
              className="hidden shrink-0 font-semibold sm:inline-flex"
            >
              {roleLabel}
            </Chip>
          </NavbarBrand>
        </NavbarContent>

        {/* Inline horizontal navigation on Desktop (lg+) */}
        <NavbarContent className="hidden gap-1 lg:flex" justify="center">
          {navItems.map((item) => {
            const isActive = item.key === activeNav;
            return (
              <NavbarItem key={item.key} isActive={isActive}>
                <Button
                  as={Link}
                  href={item.href}
                  size="sm"
                  radius="full"
                  variant={isActive ? "flat" : "light"}
                  color={isActive ? "warning" : "default"}
                  className={
                    isActive
                      ? "font-semibold text-amber-900"
                      : "font-medium text-[#52525B] hover:text-[#11181C]"
                  }
                >
                  {item.label}
                </Button>
              </NavbarItem>
            );
          })}
        </NavbarContent>

        <NavbarContent justify="end" className="gap-2">
          <NavbarItem>
            <Button
              as={Link}
              href="/admin/alertas"
              size="sm"
              radius="full"
              aria-current={activeNav === "alertas" ? "page" : undefined}
              aria-label={`Alertas activas: ${alertasCount}`}
              variant={activeNav === "alertas" ? "solid" : "flat"}
              color={
                activeNav === "alertas" || alertasCount > 0 ? "warning" : "default"
              }
              className={
                activeNav === "alertas"
                  ? "bg-[#F59E0B] font-semibold text-white shadow-sm ring-2 ring-amber-400/50"
                  : "font-semibold"
              }
            >
              <span aria-hidden="true">🔔</span>
              {activeNav === "alertas" ? (
                <>
                  <span className="hidden sm:inline">Alertas</span>
                  <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                    {alertasCount}
                  </span>
                </>
              ) : (
                <span>{alertasCount}</span>
              )}
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Button
              size="sm"
              radius="full"
              variant="flat"
              onPress={handleLogout}
              className="bg-[#EFECE6] px-3 font-semibold text-[#11181C]"
            >
              <span className="sm:hidden">Salir</span>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </NavbarItem>
        </NavbarContent>

        {/* Tablet & Mobile Burger Menu */}
        <NavbarMenu className="bg-[#FAF8F5]/95 pt-4 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = item.key === activeNav;
            return (
              <NavbarMenuItem key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    isActive
                      ? "bg-amber-100 text-amber-900"
                      : "text-[#11181C] hover:bg-black/5"
                  }`}
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            );
          })}
          <NavbarMenuItem className="pt-2">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full rounded-xl px-4 py-2.5 text-sm font-medium text-[#52525B]"
            >
              Ver catálogo público
            </Link>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>

      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-10 pt-5 sm:px-5 sm:pt-6 md:px-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
