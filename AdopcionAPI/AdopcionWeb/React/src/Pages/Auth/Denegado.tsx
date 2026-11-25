import { Head } from "@inertiajs/react";
import { Button, Card, CardBody } from "@heroui/react";
import { Footer } from "@/components/Footer";

export default function Denegado() {
  return (
    <>
      <Head title="Acceso denegado" />
      <div className="flex min-h-screen flex-col bg-[#FAF8F5] text-[#11181C]">
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-10 md:px-8">
          <Card className="w-full max-w-md rounded-[20px] border border-black/5 bg-white/80 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.14)]">
            <CardBody className="gap-4 p-7 text-center">
              <h1 className="text-[20px] font-bold tracking-tight">Acceso denegado</h1>
              <p className="text-sm leading-relaxed text-[#52525B]">
                Su rol no tiene permiso para esta acción. Si cree que es un error, hable con un
                administrador.
              </p>
              <Button
                as="a"
                href="/"
                radius="full"
                className="bg-[#F59E0B] font-semibold text-white"
              >
                Volver al catálogo
              </Button>
            </CardBody>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}
