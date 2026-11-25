import { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Pagination,
  Tab,
  Tabs,
} from "@heroui/react";
import { Footer } from "@/components/Footer";
import { PawIcon } from "@/components/PawIcon";
import { FollowUpGroupCard } from "@/Pages/Volunteer/FollowUpGroupCard";
import { VisitCard } from "@/Pages/Volunteer/VisitCard";
import type {
  AdoptanteDto,
  AnimalDto,
  SeguimientoDto,
  SolicitudDto,
  VacunacionDto,
  VisitaDto,
} from "@/types/models";

interface SharedAuth {
  autenticado: boolean;
  nombre: string | null;
  correo: string | null;
  rol: string | null;
}

interface VolunteerPageProps {
  voluntarioNombre: string;
  visitas: VisitaDto[];
  seguimientos: SeguimientoDto[];
  solicitudes: SolicitudDto[];
  animales: AnimalDto[];
  adoptantes: AdoptanteDto[];
  vacunaciones: VacunacionDto[];
  flashSuccess?: string | null;
  flashError?: string | null;
  apiError?: string | null;
}

const PAGE_SIZE = 6;

export default function VolunteerPage({
  voluntarioNombre,
  visitas,
  seguimientos,
  solicitudes,
  animales,
  adoptantes,
  vacunaciones,
  flashSuccess,
  flashError,
  apiError,
}: VolunteerPageProps) {
  const [selectedTab, setSelectedTab] = useState<string>("visitas");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"visitas" | "seguimientos">("visitas");
  const [currentPage, setCurrentPage] = useState(1);

  const { auth, csrfToken } = usePage<{
    auth?: SharedAuth;
    csrfToken?: string;
  }>().props;

  const displayName =
    auth?.autenticado && auth.nombre ? auth.nombre : voluntarioNombre;

  const solicitudById = new Map(
    solicitudes.map((s) => [String(s.idSolicitud), s])
  );
  const animalById = new Map(animales.map((a) => [String(a.idAnimal), a]));
  const adoptanteById = new Map(
    adoptantes.map((a) => [String(a.idAdoptante), a])
  );

  const query = searchQuery.trim().toLowerCase();

  const matchesSearch = (solicitudId: number | string) => {
    if (!query) return true;
    const sol = solicitudById.get(String(solicitudId));
    const animal = sol ? animalById.get(String(sol.animalId)) : undefined;
    const adoptante = sol ? adoptanteById.get(String(sol.adoptanteId)) : undefined;

    return (
      (animal?.nombre ?? "").toLowerCase().includes(query) ||
      (adoptante?.nombre ?? "").toLowerCase().includes(query) ||
      (sol?.animalNombre ?? "").toLowerCase().includes(query) ||
      (sol?.adoptanteNombre ?? "").toLowerCase().includes(query)
    );
  };

  const pendingVisits = visitas.filter(
    (v) => v.resultado === "Pendiente" && matchesSearch(v.solicitudId)
  );
  const completedVisits = visitas.filter(
    (v) => v.resultado !== "Pendiente" && matchesSearch(v.solicitudId)
  );

  const followUpGroupsMap = new Map<number, SeguimientoDto[]>();
  for (const s of seguimientos) {
    const sid = Number(s.solicitudId);
    const list = followUpGroupsMap.get(sid) ?? [];
    list.push(s);
    followUpGroupsMap.set(sid, list);
  }

  const allFollowUpGroups = Array.from(followUpGroupsMap.entries()).map(
    ([solicitudId, items]) => ({
      solicitudId,
      items,
      hasOpen: items.some(
        (i) => i.estado === "Pendiente" || i.estado === "Vencido"
      ),
      hasOverdue: items.some((i) => i.estado === "Vencido"),
    })
  );

  const openFollowUpGroups = allFollowUpGroups.filter(
    (g) =>
      g.hasOpen &&
      (!onlyOverdue || g.hasOverdue) &&
      matchesSearch(g.solicitudId)
  );
  const closedFollowUpGroups = allFollowUpGroups.filter(
    (g) => !g.hasOpen && matchesSearch(g.solicitudId)
  );

  const totalPendingVisitsCount = visitas.filter(
    (v) => v.resultado === "Pendiente"
  ).length;
  const totalOpenFollowUpsCount = allFollowUpGroups.filter((g) => g.hasOpen).length;
  const totalHistoryCount =
    visitas.filter((v) => v.resultado !== "Pendiente").length +
    allFollowUpGroups.filter((g) => !g.hasOpen).length;

  const paginate = <T,>(items: T[]) => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    return {
      totalPages,
      safePage,
      pageItems: items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    };
  };

  const handleTabChange = (key: string) => {
    setSelectedTab(key);
    setCurrentPage(1);
  };

  const handleLogout = () => {
    router.post(
      "/Cuenta/Salir",
      { __RequestVerificationToken: csrfToken ?? "" },
      { forceFormData: true }
    );
  };

  const visitsPage = paginate(pendingVisits);
  const followUpsPage = paginate(openFollowUpGroups);
  const historyVisitsPage = paginate(completedVisits);
  const historyFollowUpsPage = paginate(closedFollowUpGroups);

  return (
    <>
      <Head title="Panel de Voluntario" />
      <div className="flex min-h-screen flex-col overflow-x-clip bg-[#FAF8F5] text-[#11181C]">
        <Navbar
          maxWidth="xl"
          isBordered
          className="border-black/5 bg-[#FAF8F5]/90 backdrop-blur-md"
          classNames={{
            wrapper: "px-3 sm:px-6 gap-2",
          }}
        >
          <NavbarBrand className="min-w-0">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 text-[#11181C] no-underline"
            >
              <PawIcon color="#292D32" size={20} />
              <span className="truncate text-xs font-bold tracking-tight sm:text-[15px]">
                Adopta Un Nuevo Amigo
              </span>
            </Link>
          </NavbarBrand>

          <NavbarContent justify="end" className="gap-2">
            <NavbarItem className="hidden sm:flex">
              <Button
                as={Link}
                href="/"
                size="sm"
                radius="full"
                variant="light"
                className="font-medium text-[#52525B]"
              >
                Ver catálogo
              </Button>
            </NavbarItem>
            <NavbarItem className="hidden sm:flex">
              <Chip
                size="sm"
                variant="flat"
                className="bg-amber-100 font-semibold text-amber-800"
              >
                Voluntario
              </Chip>
            </NavbarItem>
            {auth?.autenticado && (
              <NavbarItem>
                <Button
                  size="sm"
                  radius="full"
                  variant="bordered"
                  onPress={handleLogout}
                  className="border-default-300 bg-white px-3 font-semibold text-[#11181C]"
                >
                  <span className="sm:hidden">Salir</span>
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </Button>
              </NavbarItem>
            )}
          </NavbarContent>
        </Navbar>

        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-8 pt-6 sm:px-6 md:px-8 md:pt-8">
          {/* Greeting header */}
          <section className="flex items-center justify-between gap-4 md:rounded-3xl md:border md:border-black/5 md:bg-white/75 md:p-7 md:shadow-sm">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#11181C] md:text-4xl">
                Bienvenido, {displayName}.
              </h1>
              <p className="mt-1 text-sm text-[#52525B]">
                Visitas y seguimientos asignados
              </p>
            </div>
            <img
              src="/images/brand/volunteer-mascot.png"
              alt="Mascotas de Adopta Un Nuevo Amigo"
              className="h-16 w-20 shrink-0 object-contain md:h-20 md:w-24"
            />
          </section>

          {apiError && (
            <Card className="mt-5 border border-danger-200 bg-danger-50 shadow-sm">
              <CardBody className="flex flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-danger-700">
                    No se pudo conectar con AdopcionAPI
                  </p>
                  <p className="text-xs text-danger-600">{apiError}</p>
                </div>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => router.reload()}
                >
                  Reintentar
                </Button>
              </CardBody>
            </Card>
          )}

          {flashSuccess && (
            <div className="mt-5 rounded-2xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
              {flashSuccess}
            </div>
          )}

          {flashError && (
            <div className="mt-5 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
              {flashError}
            </div>
          )}

          {/* Search & quick filter bar */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              aria-label="Buscar por mascota o adoptante"
              placeholder="Buscar por mascota o adoptante..."
              value={searchQuery}
              onValueChange={(v) => {
                setSearchQuery(v);
                setCurrentPage(1);
              }}
              isClearable
              onClear={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              variant="flat"
              radius="full"
              size="md"
              className="sm:max-w-md"
              classNames={{
                inputWrapper: "bg-white border border-black/10 shadow-xs",
              }}
            />

            {selectedTab === "seguimientos" && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  radius="full"
                  variant={onlyOverdue ? "solid" : "flat"}
                  color={onlyOverdue ? "danger" : "default"}
                  onPress={() => {
                    setOnlyOverdue(!onlyOverdue);
                    setCurrentPage(1);
                  }}
                  className="font-semibold"
                >
                  {onlyOverdue ? "Mostrando solo vencidos" : "Filtrar solo vencidos"}
                </Button>
              </div>
            )}

            {selectedTab === "historial" && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  radius="full"
                  variant={historyFilter === "visitas" ? "solid" : "flat"}
                  color={historyFilter === "visitas" ? "warning" : "default"}
                  onPress={() => {
                    setHistoryFilter("visitas");
                    setCurrentPage(1);
                  }}
                  className={
                    historyFilter === "visitas"
                      ? "font-semibold text-white"
                      : "font-semibold"
                  }
                >
                  Visitas ({completedVisits.length})
                </Button>
                <Button
                  size="sm"
                  radius="full"
                  variant={historyFilter === "seguimientos" ? "solid" : "flat"}
                  color={historyFilter === "seguimientos" ? "warning" : "default"}
                  onPress={() => {
                    setHistoryFilter("seguimientos");
                    setCurrentPage(1);
                  }}
                  className={
                    historyFilter === "seguimientos"
                      ? "font-semibold text-white"
                      : "font-semibold"
                  }
                >
                  Seguimientos ({closedFollowUpGroups.length})
                </Button>
              </div>
            )}
          </div>

          {/* 3 Clean Segmented Tabs: Visitas pendientes | Seguimientos pendientes | Historial */}
          <div className="mt-5">
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => handleTabChange(String(key))}
              variant="solid"
              radius="lg"
              classNames={{
                base: "w-full max-w-full",
                tabList:
                  "bg-[#EFECE6] p-1 w-full flex flex-wrap gap-1 sm:grid sm:grid-cols-3",
                cursor: "bg-white shadow-sm",
                tab: "h-9 sm:h-10 text-xs sm:text-sm font-semibold flex-1 min-w-fit",
              }}
            >
              <Tab
                key="visitas"
                title={
                  <div className="flex items-center gap-2">
                    <span>Visitas pendientes</span>
                    <Chip size="sm" variant="flat" color="warning">
                      {totalPendingVisitsCount}
                    </Chip>
                  </div>
                }
              >
                <section className="mt-5">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-[#11181C]">
                      Visitas domiciliarias pendientes
                    </h2>
                    <span className="shrink-0 whitespace-nowrap text-xs font-medium text-[#52525B]">
                      {pendingVisits.length}{" "}
                      {pendingVisits.length === 1 ? "resultado" : "resultados"}
                    </span>
                  </div>

                  {visitsPage.pageItems.length === 0 ? (
                    <Card className="border border-dashed border-black/15 bg-white/75 shadow-none">
                      <CardBody className="py-10 text-center">
                        <p className="text-sm font-semibold text-[#11181C]">
                          No hay visitas pendientes con ese filtro
                        </p>
                        <p className="mt-1 text-xs text-[#52525B]">
                          Cuando un coordinador le asigne una nueva visita domiciliaria, aparecerá aquí.
                        </p>
                      </CardBody>
                    </Card>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {visitsPage.pageItems.map((visita) => {
                          const sol = solicitudById.get(String(visita.solicitudId));
                          const animal = sol
                            ? animalById.get(String(sol.animalId))
                            : undefined;
                          const adoptante = sol
                            ? adoptanteById.get(String(sol.adoptanteId))
                            : undefined;

                          return (
                            <VisitCard
                              key={String(visita.idVisita)}
                              visita={visita}
                              animal={animal}
                              adoptante={adoptante}
                              vacunaciones={vacunaciones}
                            />
                          );
                        })}
                      </div>

                      {visitsPage.totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                          <Pagination
                            total={visitsPage.totalPages}
                            page={visitsPage.safePage}
                            onChange={setCurrentPage}
                            color="warning"
                            showControls
                            radius="full"
                          />
                        </div>
                      )}
                    </>
                  )}
                </section>
              </Tab>

              <Tab
                key="seguimientos"
                title={
                  <div className="flex items-center gap-2">
                    <span>Seguimientos pendientes</span>
                    <Chip size="sm" variant="flat" color="warning">
                      {totalOpenFollowUpsCount}
                    </Chip>
                  </div>
                }
              >
                <section className="mt-5">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-[#11181C]">
                      Animales a los que realiza seguimientos
                    </h2>
                    <span className="text-xs font-medium text-[#52525B]">
                      {openFollowUpGroups.length}{" "}
                      {openFollowUpGroups.length === 1 ? "ciclo" : "ciclos"}
                    </span>
                  </div>

                  {followUpsPage.pageItems.length === 0 ? (
                    <Card className="border border-dashed border-black/15 bg-white/75 shadow-none">
                      <CardBody className="py-10 text-center">
                        <p className="text-sm font-semibold text-[#11181C]">
                          No hay seguimientos pendientes con ese filtro
                        </p>
                        <p className="mt-1 text-xs text-[#52525B]">
                          Los seguimientos de 30, 60 y 90 días se generan automáticamente al aprobar una adopción.
                        </p>
                      </CardBody>
                    </Card>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {followUpsPage.pageItems.map((group) => {
                          const sol = solicitudById.get(String(group.solicitudId));
                          const animal = sol
                            ? animalById.get(String(sol.animalId))
                            : undefined;
                          const adoptante = sol
                            ? adoptanteById.get(String(sol.adoptanteId))
                            : undefined;

                          return (
                            <FollowUpGroupCard
                              key={group.solicitudId}
                              solicitudId={group.solicitudId}
                              seguimientos={group.items}
                              animal={animal}
                              adoptante={adoptante}
                            />
                          );
                        })}
                      </div>

                      {followUpsPage.totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                          <Pagination
                            total={followUpsPage.totalPages}
                            page={followUpsPage.safePage}
                            onChange={setCurrentPage}
                            color="warning"
                            showControls
                            radius="full"
                          />
                        </div>
                      )}
                    </>
                  )}
                </section>
              </Tab>

              <Tab
                key="historial"
                title={
                  <div className="flex items-center gap-2">
                    <span>Historial</span>
                    <Chip size="sm" variant="flat">
                      {totalHistoryCount}
                    </Chip>
                  </div>
                }
              >
                <section className="mt-5">
                  {historyFilter === "visitas" ? (
                    <>
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-[#11181C]">
                          Visitas registradas
                        </h2>
                        <span className="text-xs font-medium text-[#52525B]">
                          {completedVisits.length} registros
                        </span>
                      </div>

                      {historyVisitsPage.pageItems.length === 0 ? (
                        <Card className="border border-dashed border-black/15 bg-white/75 shadow-none">
                          <CardBody className="py-10 text-center">
                            <p className="text-sm font-semibold text-[#11181C]">
                              No hay visitas en el historial con ese filtro
                            </p>
                          </CardBody>
                        </Card>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {historyVisitsPage.pageItems.map((visita) => {
                              const sol = solicitudById.get(
                                String(visita.solicitudId)
                              );
                              const animal = sol
                                ? animalById.get(String(sol.animalId))
                                : undefined;
                              const adoptante = sol
                                ? adoptanteById.get(String(sol.adoptanteId))
                                : undefined;

                              return (
                                <VisitCard
                                  key={String(visita.idVisita)}
                                  visita={visita}
                                  animal={animal}
                                  adoptante={adoptante}
                                  vacunaciones={vacunaciones}
                                />
                              );
                            })}
                          </div>

                          {historyVisitsPage.totalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                              <Pagination
                                total={historyVisitsPage.totalPages}
                                page={historyVisitsPage.safePage}
                                onChange={setCurrentPage}
                                color="warning"
                                showControls
                                radius="full"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-[#11181C]">
                          Ciclos de seguimiento cerrados
                        </h2>
                        <span className="text-xs font-medium text-[#52525B]">
                          {closedFollowUpGroups.length} ciclos
                        </span>
                      </div>

                      {historyFollowUpsPage.pageItems.length === 0 ? (
                        <Card className="border border-dashed border-black/15 bg-white/75 shadow-none">
                          <CardBody className="py-10 text-center">
                            <p className="text-sm font-semibold text-[#11181C]">
                              No hay ciclos cerrados con ese filtro
                            </p>
                          </CardBody>
                        </Card>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {historyFollowUpsPage.pageItems.map((group) => {
                              const sol = solicitudById.get(
                                String(group.solicitudId)
                              );
                              const animal = sol
                                ? animalById.get(String(sol.animalId))
                                : undefined;
                              const adoptante = sol
                                ? adoptanteById.get(String(sol.adoptanteId))
                                : undefined;

                              return (
                                <FollowUpGroupCard
                                  key={group.solicitudId}
                                  solicitudId={group.solicitudId}
                                  seguimientos={group.items}
                                  animal={animal}
                                  adoptante={adoptante}
                                />
                              );
                            })}
                          </div>

                          {historyFollowUpsPage.totalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                              <Pagination
                                total={historyFollowUpsPage.totalPages}
                                page={historyFollowUpsPage.safePage}
                                onChange={setCurrentPage}
                                color="warning"
                                showControls
                                radius="full"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </section>
              </Tab>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
