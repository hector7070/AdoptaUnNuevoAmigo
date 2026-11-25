import { Button, Chip, Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { PawIcon } from "@/components/PawIcon";
import { usePage } from "@inertiajs/react";

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

export function PublicNavbar({ availableCount, onLoginClick }: PublicNavbarProps) {
  const props = usePage<{ auth?: AuthProps; csrfToken?: string }>().props;
  const sesion = props.auth?.autenticado ? props.auth : null;
  const csrfToken = props.csrfToken;

  return (
    <Navbar
      maxWidth="xl"
      isBordered
      className="bg-[#FAF8F5]/90 backdrop-blur-md border-black/5"
    >
      <NavbarBrand>
        <a href="/" className="flex items-center gap-2.5 text-[#11181C] no-underline">
          <PawIcon color="#292D32" size={22} />
          <span className="text-[15px] font-bold tracking-tight">
            Adopta Un Nuevo Amigo
          </span>
        </a>
      </NavbarBrand>

      <NavbarContent justify="end" className="hidden md:flex">
        {typeof availableCount === "number" && (
          <NavbarItem>
            <Chip color="success" variant="flat" size="sm">
              {availableCount} mascotas disponibles
            </Chip>
          </NavbarItem>
        )}
        {sesion ? (
          <>
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
