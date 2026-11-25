import type { HitoSeguimiento } from "@/types/models";

const HITO_DAYS_MAP: Record<HitoSeguimiento, number> = {
  Dias30: 30,
  Dias60: 60,
  Dias90: 90,
};

export function getHitoDays(hito: HitoSeguimiento): number {
  return HITO_DAYS_MAP[hito] ?? 30;
}
