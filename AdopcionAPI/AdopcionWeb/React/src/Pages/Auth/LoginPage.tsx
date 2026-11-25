import { Head } from "@inertiajs/react";
import { Button, Card, CardBody, Divider, Input } from "@heroui/react";
import { useState, type FormEvent } from "react";
import { PawIcon } from "@/components/PawIcon";
import { Footer } from "@/components/Footer";

interface LoginPageProps {
  returnUrl?: string | null;
  correo?: string | null;
  error?: string | null;
  csrfToken?: string;
}

export default function LoginPage({ returnUrl, correo, error, csrfToken }: LoginPageProps) {
  const [correoValue, setCorreoValue] = useState(correo ?? "");
  const [password, setPassword] = useState("");

  const handleSubmit = (_e: FormEvent<HTMLFormElement>) => {
  };

  return (
    <>
      <Head title="Iniciar sesión" />
      <div className="flex min-h-screen flex-col bg-[#FAF8F5] text-[#11181C]">
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-10 md:px-8">
          <Card className="w-full max-w-md rounded-[20px] border border-black/5 bg-white/80 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.14),0_4px_12px_-4px_rgba(0,0,0,0.08)] backdrop-blur-md">
            <CardBody className="gap-5 p-7">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F59E0B]/12">
                  <PawIcon color="#F59E0B" size={26} />
                </div>
                <h1 className="text-[22px] font-bold leading-tight tracking-tight">
                  Iniciar sesión
                </h1>
                <p className="text-sm leading-relaxed text-[#52525B]">
                  Acceso para el personal del refugio
                </p>
              </div>

              {error && (
                <Card className="border border-danger-200 bg-danger-50 shadow-none">
                  <CardBody className="px-4 py-3">
                    <p className="text-sm font-medium text-danger-700">{error}</p>
                  </CardBody>
                </Card>
              )}

              <form method="post" action="/Cuenta/Ingresar" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="hidden" name="__RequestVerificationToken" value={csrfToken ?? ""} />
                {returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}

                <Input
                  name="Correo"
                  type="email"
                  label="Correo"
                  labelPlacement="outside"
                  placeholder="usuario@adopta.cr"
                  value={correoValue}
                  onValueChange={setCorreoValue}
                  variant="flat"
                  radius="lg"
                  autoComplete="username"
                  isRequired
                  classNames={{
                    inputWrapper: "bg-[#F4F4F5] data-[hover=true]:bg-white",
                    label: "text-sm font-medium text-[#52525B]",
                  }}
                />

                <Input
                  name="Password"
                  type="password"
                  label="Contraseña"
                  labelPlacement="outside"
                  placeholder="Su contraseña"
                  value={password}
                  onValueChange={setPassword}
                  variant="flat"
                  radius="lg"
                  autoComplete="current-password"
                  isRequired
                  classNames={{
                    inputWrapper: "bg-[#F4F4F5] data-[hover=true]:bg-white",
                    label: "text-sm font-medium text-[#52525B]",
                  }}
                />

                <Button
                  type="submit"
                  radius="full"
                  className="mt-1 h-11 w-full bg-[#F59E0B] font-semibold text-white shadow-[0_12px_26px_-6px_rgba(245,158,11,0.42)]"
                >
                  Entrar
                </Button>
              </form>

              <Divider className="bg-black/5" />

              <a
                href="/"
                className="text-center text-sm font-medium text-[#52525B] no-underline hover:text-[#11181C]"
              >
                Volver al catálogo
              </a>
            </CardBody>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
