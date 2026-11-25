import { Button, Chip, Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { Link, usePage } from "@inertiajs/react";
import { PawIcon } from "@/components/PawIcon";

interface AuthProps {
  autenticado: boolean;
  nombre?: string | null;
  correo?: string | null;
  rol?: string | null;
}

interface PublicNavbarProps {
  availableCount?: number;
  onLoginClick: () => void;
}

function getPanelDestination(rol?: string | null): { href: string; label: string } | null {
  switch (rol) {
    case "Voluntario":
      return { href: "/voluntario", label: "Voluntario" };
    case "Veterinario":
      return { href: "/admin/historial-medico", label: "Historial Médico" };
    case "Administrador":
    case "Coordinador":
      return { href: "/admin/solicitudes", label: "Dashboard" };
    default:
      return null;
  }
}

export function PublicNavbar({ availableCount, onLoginClick }: PublicNavbarProps) {
  const props = usePage<{ auth?: AuthProps; csrfToken?: string }>().props;
  const sesion = props.auth?.autenticado ? props.auth : null;
  const csrfToken = props.csrfToken;
  const panelLink = sesion ? getPanelDestination(sesion.rol) : null;

  return (
    <Navbar
      maxWidth="xl"
      isBordered
      className="bg-[#FAF8F5]/90 backdrop-blur-md border-black/5"
      classNames={{
        wrapper: "px-3 sm:px-6 gap-2",
      }}
    >
      <NavbarBrand className="min-w-0">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-[#11181C] no-underline">
          <PawIcon color="#292D32" size={22} />
          <span className="truncate text-sm font-bold tracking-tight sm:text-[15px]">
            Adopta Un Nuevo Amigo
          </span>
        </Link>
      </NavbarBrand>

      {/* Mobile quick link for authenticated users */}
      {sesion && (
        <NavbarContent justify="end" className="flex gap-1.5 md:hidden">
          {panelLink && (
            <NavbarItem>
              <Button
                as={Link}
                href={panelLink.href}
                size="sm"
                radius="full"
                variant="flat"
                color="warning"
                className="font-semibold text-amber-900"
              >
                {panelLink.label}
              </Button>
            </NavbarItem>
          )}
          <NavbarItem>
            <form method="post" action="/Cuenta/Salir" className="m-0">
              <input type="hidden" name="__RequestVerificationToken" value={csrfToken ?? ""} />
              <Button
                type="submit"
                size="sm"
                radius="full"
                variant="bordered"
                className="border-default-300 bg-white px-2.5 font-semibold text-[#11181C]"
              >
                Salir
              </Button>
            </form>
          </NavbarItem>
        </NavbarContent>
      )}

      {/* Desktop navbar actions */}
      <NavbarContent justify="end" className="hidden gap-2.5 md:flex">
        {typeof availableCount === "number" && (
          <NavbarItem>
            <Chip color="success" variant="flat" size="sm">
              {availableCount} mascotas disponibles
            </Chip>
          </NavbarItem>
        )}
        {sesion ? (
          <>
            {panelLink && (
              <NavbarItem>
                <Button
                  as={Link}
                  href={panelLink.href}
                  size="sm"
                  radius="full"
                  variant="flat"
                  color="warning"
                  className="font-semibold text-amber-900"
                >
                  {panelLink.label}
                </Button>
              </NavbarItem>
            )}
            <NavbarItem>
              <Chip variant="flat" size="sm" className="bg-[#F59E0B]/12 text-[#11181C]">
                {sesion.nombre} · {sesion.rol}
              </Chip>
            </NavbarItem>
            <NavbarItem>
              <form method="post" action="/Cuenta/Salir" className="m-0">
                <input type="hidden" name="__RequestVerificationToken" value={csrfToken ?? ""} />
                <Button
                  type="submit"
                  size="sm"
                  radius="full"
                  variant="bordered"
                  className="border-default-300 bg-white font-semibold text-[#11181C]"
                >
                  Salir
                </Button>
              </form>
            </NavbarItem>
          </>
        ) : (
          <NavbarItem>
            <Button
              size="sm"
              radius="full"
              variant="bordered"
              className="border-default-300 bg-white font-semibold text-[#11181C]"
              onPress={onLoginClick}
            >
              Iniciar sesión
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>
    </Navbar>
  );
}
