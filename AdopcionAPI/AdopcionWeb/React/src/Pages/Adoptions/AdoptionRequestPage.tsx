import { useState, type FormEvent } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PublicLayout } from "@/layouts/PublicLayout";
import {
  formatAge,
  formatVaccinationSummary,
  getPetImageUrl,
} from "@/lib/petHelpers";
import type {
  AnimalDto,
  SolicitudDto,
  TipoViviendaDto,
  VacunacionDto,
} from "@/types/models";

interface AdoptionRequestPageProps {
  animal: AnimalDto | null;
  vacunaciones: VacunacionDto[];
  tiposViviendas: TipoViviendaDto[];
  solicitudCreada?: SolicitudDto | null;
  formError?: string | null;
  apiError?: string | null;
}

export default function AdoptionRequestPage({
  animal,
  vacunaciones,
  tiposViviendas,
  solicitudCreada,
  formError,
  apiError,
}: AdoptionRequestPageProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const defaultViviendaId = tiposViviendas[0] ? String(tiposViviendas[0].id) : "";

  const { data, setData, post, processing } = useForm({
    animalId: animal ? Number(animal.idAnimal) : 0,
    nombre: "",
    identificacion: "",
    correo: "",
    telefono: "",
    tipoViviendaId: defaultViviendaId,
    descripcionHogar: "",
    otrasMascotas: "",
    aceptaVisita: false,
  });

  const handleLoginClick = () => {
    router.visit("/Cuenta/Ingresar");
  };

  if (!animal) {
    return (
      <>
        <Head title="Formulario de adopción" />
        <PublicLayout onLoginClick={handleLoginClick}>
          <Card className="mx-auto max-w-lg border border-danger-200 bg-danger-50 shadow-sm">
            <CardBody className="gap-3 p-6 text-center">
              <p className="text-base font-semibold text-danger-700">
                No pudimos cargar el formulario de adopción
              </p>
              {apiError && <p className="text-xs text-danger-600">{apiError}</p>}
              <div className="mt-2 flex justify-center gap-2">
                <Button
                  size="sm"
                  radius="full"
                  variant="flat"
                  onPress={() => router.visit("/")}
                >
                  Volver a mascotas
                </Button>
                <Button
                  size="sm"
                  radius="full"
                  color="danger"
                  variant="flat"
                  onPress={() => router.reload()}
                >
                  Reintentar
                </Button>
              </div>
            </CardBody>
          </Card>
        </PublicLayout>
      </>
    );
  }

  const ageText = formatAge(animal.fechaNacimiento);
  const imageUrl = getPetImageUrl(animal);
  const vaccineSummary = formatVaccinationSummary(
    animal.idAnimal,
    animal.sexo,
    vacunaciones
  );

  const validateAndOpenConfirm = (e: FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (data.nombre.trim().length < 2) {
      setClientError("Por favor ingrese su nombre completo (mínimo 2 caracteres).");
      return;
    }
    const idTrim = data.identificacion.trim();
    if (idTrim.length < 9 || idTrim.length > 20 || /\s/.test(idTrim)) {
      setClientError("La identificación debe tener entre 9 y 20 caracteres sin espacios.");
      return;
    }
    if (!data.correo.trim() || !data.telefono.trim()) {
      setClientError("Por favor ingrese su correo electrónico y teléfono / WhatsApp.");
      return;
    }
    if (!data.tipoViviendaId) {
      setClientError("Por favor seleccione su tipo de vivienda.");
      return;
    }
    if (!data.aceptaVisita) {
      setClientError("Debe aceptar la visita domiciliaria previa para continuar.");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    post(`/Adopcion/Solicitar/${animal.idAnimal}`, {
      preserveScroll: true,
      onFinish: () => setIsConfirmOpen(false),
    });
  };

  const displayError = clientError || formError;

  const petSummaryCard = (
    <Card className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[0_12px_28px_-6px_rgba(0,0,0,0.16)]">
      <div className="relative h-48 bg-stone-800">
        <img
          src={imageUrl}
          alt={animal.nombre}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/25" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <Chip
            size="sm"
            className="bg-[#F59E0B] text-[10px] font-bold uppercase tracking-wider text-white"
          >
            Formulario de adopción
          </Chip>
          <h1 className="mt-1.5 text-2xl font-bold leading-tight">
            Solicite adoptar a {animal.nombre}
          </h1>
          <p className="mt-1 text-xs text-white/85">
            Complete sus datos y nos pondremos en contacto para coordinar la adopción.
          </p>
        </div>
      </div>

      <CardBody className="gap-1 bg-white px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">
          Datos de {animal.nombre}
        </p>
        <p className="text-sm font-semibold text-[#11181C]">
          {animal.nombre} · {ageText}
          {animal.razaNombre ? ` · ${animal.razaNombre}` : ""}
        </p>
        <p className="text-xs text-[#52525B]">{vaccineSummary}</p>
      </CardBody>
    </Card>
  );

  const infoBox = (
    <Card className="border border-black/5 bg-[#F4F4F5] shadow-none">
      <CardBody className="flex flex-row items-start gap-3 p-4">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#11181C] text-[11px] font-bold text-white">
          i
        </span>
        <div>
          <p className="text-xs font-bold text-[#11181C]">
            Qué sucede después de enviar la solicitud?
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#52525B]">
            Su solicitud entrará en estado <strong>Enviada</strong> para revisión
            por parte de nuestro equipo de coordinadores y coordinación de la
            visita domiciliaria.
          </p>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <>
      <Head title={`Solicitar adopción de ${animal.nombre}`} />
      <PublicLayout onLoginClick={handleLoginClick}>
        <div className="mb-5">
          <Link
            href={`/Animales/${animal.idAnimal}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#52525B] transition hover:text-[#11181C]"
          >
            <span aria-hidden="true">←</span>
            <span>Volver a {animal.nombre}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
          {/* Left column: Pet summary + process info */}
          <div className="flex flex-col gap-4 md:sticky md:top-20 md:col-span-5">
            {petSummaryCard}
            <div className="hidden md:block">{infoBox}</div>
          </div>

          {/* Right column: Adoption form or confirmation state */}
          <div className="md:col-span-7">
            {solicitudCreada ? (
              <Card className="border border-success-200 bg-white shadow-sm">
                <CardBody className="items-center gap-3 p-8 text-center">
                  <Chip color="success" variant="flat" size="lg">
                    Solicitud #{solicitudCreada.idSolicitud} · {solicitudCreada.estado}
                  </Chip>
                  <h2 className="mt-1 text-2xl font-bold text-[#11181C]">
                    Solicitud enviada con éxito!
                  </h2>
                  <p className="max-w-md text-sm leading-relaxed text-[#52525B]">
                    Hemos registrado su solicitud para adoptar a{" "}
                    <strong className="text-[#11181C]">{animal.nombre}</strong>.
                    Nuestro equipo de coordinadores la revisará y se pondrá en
                    contacto con usted para agendar la visita domiciliaria.
                  </p>
                  <Button
                    radius="full"
                    onPress={() => router.visit("/")}
                    className="mt-3 bg-[#F59E0B] px-8 font-semibold text-white shadow-[0_8px_20px_-4px_rgba(245,158,11,0.5)]"
                  >
                    Volver al catálogo
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <Card className="border border-black/5 bg-white shadow-sm">
                <CardBody className="p-6">
                  <form onSubmit={validateAndOpenConfirm} className="flex flex-col gap-6">
                    {displayError && (
                      <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-xs font-medium text-danger-700">
                        {displayError}
                      </div>
                    )}

                    {/* Section 1: Sus datos */}
                    <div className="flex flex-col gap-4">
                      <h2 className="text-base font-bold text-[#11181C]">
                        Sus datos
                      </h2>

                      <Input
                        label="Nombre completo"
                        placeholder="Su nombre completo"
                        value={data.nombre}
                        onValueChange={(v) => setData("nombre", v)}
                        variant="flat"
                        radius="lg"
                        isRequired
                      />

                      <Input
                        label="Identificación / Cédula"
                        placeholder="1-1234-5678 (sin espacios)"
                        value={data.identificacion}
                        onValueChange={(v) => setData("identificacion", v)}
                        variant="flat"
                        radius="lg"
                        isRequired
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                          type="email"
                          label="Correo electrónico"
                          placeholder="correo@ejemplo.com"
                          value={data.correo}
                          onValueChange={(v) => setData("correo", v)}
                          variant="flat"
                          radius="lg"
                          isRequired
                        />
                        <Input
                          type="tel"
                          label="Teléfono / WhatsApp"
                          placeholder="+506 8888-4444"
                          value={data.telefono}
                          onValueChange={(v) => setData("telefono", v)}
                          variant="flat"
                          radius="lg"
                          isRequired
                        />
                      </div>
                    </div>

                    <Divider className="bg-black/5" />

                    {/* Section 2: El hogar que le ofrece */}
                    <div className="flex flex-col gap-4">
                      <h2 className="text-base font-bold text-[#11181C]">
                        El hogar que le ofrece
                      </h2>

                      <Select
                        label="Tipo de vivienda"
                        selectedKeys={data.tipoViviendaId ? [data.tipoViviendaId] : []}
                        onSelectionChange={(keys) => {
                          const first = Array.from(keys)[0];
                          setData("tipoViviendaId", first ? String(first) : "");
                        }}
                        variant="flat"
                        radius="lg"
                        isRequired
                      >
                        {tiposViviendas.map((tv) => (
                          <SelectItem key={String(tv.id)}>{tv.nombre}</SelectItem>
                        ))}
                      </Select>

                      <Textarea
                        label="Describa su hogar"
                        placeholder="Ej. Apartamento con balcón cerrado para que salga, o casa con patio grande y cercado..."
                        value={data.descripcionHogar}
                        onValueChange={(v) => setData("descripcionHogar", v)}
                        variant="flat"
                        radius="lg"
                        minRows={3}
                      />

                      <Textarea
                        label="Tiene otras mascotas en casa?"
                        placeholder="Ej. Ninguna, o tengo 1 gato esterilizado y tranquilo..."
                        value={data.otrasMascotas}
                        onValueChange={(v) => setData("otrasMascotas", v)}
                        variant="flat"
                        radius="lg"
                        minRows={2}
                      />

                      <Checkbox
                        isSelected={data.aceptaVisita}
                        onValueChange={(v) => setData("aceptaVisita", v)}
                        color="warning"
                        size="sm"
                      >
                        <span className="text-xs text-[#52525B]">
                          Acepto recibir una visita a mi domicilio previa a la adopción.
                        </span>
                      </Checkbox>
                    </div>

                    <div className="md:hidden">{infoBox}</div>

                    <Button
                      type="submit"
                      size="lg"
                      radius="full"
                      isLoading={processing}
                      className="w-full bg-[#F59E0B] font-semibold text-white shadow-[0_8px_20px_-4px_rgba(245,158,11,0.5)]"
                    >
                      Enviar solicitud
                    </Button>
                  </form>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmSubmit}
          isLoading={processing}
          title="Listo para dar este gran paso?"
          subtitle={`Solicitud de adopción para ${animal.nombre}`}
          description={`Adoptar a ${animal.nombre} es una gran responsabilidad y un compromiso lleno de cariño para toda la vida. Nuestro equipo coordinará una visita previa a su hogar para asegurarnos de que ambos estén muy bien.`}
          question="Está seguro de que desea enviar su solicitud?"
          confirmText="Sí, enviar solicitud"
          cancelText="Revisar datos"
        />
      </PublicLayout>
    </>
  );
}
