/** Las 4 fases comerciales base de Obra Check (mismo criterio que StepFases). */
export const CANONICAL_PHASES = ['Preparacion', 'Estructura', 'Instalaciones', 'Terminaciones'] as const;

export type CanonicalPhase = (typeof CANONICAL_PHASES)[number];

export const PHASE_COLORS: Record<CanonicalPhase, { bg: string; bar: string; border: string }> = {
  Preparacion: { bg: '#E8F4FD', bar: '#4A6FA5', border: '#4A6FA5' },
  Estructura: { bg: '#FFF3E0', bar: '#E65100', border: '#F57C00' },
  Instalaciones: { bg: '#E8F5E9', bar: '#2E7D32', border: '#43A047' },
  Terminaciones: { bg: '#F3E5F5', bar: '#6A1B9A', border: '#8E24AA' },
};

/** Normaliza nombre de fase al catálogo canónico (case-insensitive). */
export function normalizePhase(fase: string | null | undefined): CanonicalPhase {
  const raw = (fase ?? '').trim().toLowerCase();
  if (!raw) return 'Preparacion';
  const hit = CANONICAL_PHASES.find((p) => p.toLowerCase() === raw);
  if (hit) return hit;
  if (/demolic|suelo|fundac|estructura|mampost|hormigon/.test(raw)) return 'Estructura';
  if (/electri|sanitar|gas|instal|colocacion/.test(raw)) return 'Instalaciones';
  if (/pint|limpieza|revoque|piso|carpinter|techo|termin/.test(raw)) return 'Terminaciones';
  return 'Preparacion';
}

export function phaseIndex(fase: string | null | undefined): number {
  return CANONICAL_PHASES.indexOf(normalizePhase(fase));
}
