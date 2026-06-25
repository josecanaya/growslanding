/**
 * Tipos de obra en el producto (wizard). Cadena canvas: siempre `simple` (etapa → tareas).
 */
export const OBRA_PRODUCT_KINDS = [
  'casa',
  'edificio',
  'reforma',
  'trabajo_simple',
  'mantenimiento',
] as const;

export type ObraProductKind = (typeof OBRA_PRODUCT_KINDS)[number];

export const OBRA_PRODUCT_KIND_LABEL: Record<ObraProductKind, string> = {
  casa: 'Casa',
  edificio: 'Edificio',
  reforma: 'Reforma',
  trabajo_simple: 'Trabajo simple',
  mantenimiento: 'Mantenimiento',
};

export const WIZARD_OBRA_PRODUCT_OPCIONES: ReadonlyArray<{
  kind: ObraProductKind;
  label: string;
  descripcion: string;
}> = [
  { kind: 'casa', label: 'Casa', descripcion: 'Obra residencial unifamiliar' },
  { kind: 'edificio', label: 'Edificio', descripcion: 'Edificación con más de una unidad o escala mayor' },
  { kind: 'reforma', label: 'Reforma', descripcion: 'Intervención sobre lo existente' },
  { kind: 'trabajo_simple', label: 'Trabajo simple', descripcion: 'Trabajo acotado (portón, aire, pintura…)' },
  { kind: 'mantenimiento', label: 'Mantenimiento', descripcion: 'Mantenimiento o service técnico' },
];

export function isObraProductKind(v: string | null | undefined): v is ObraProductKind {
  return !!v && (OBRA_PRODUCT_KINDS as readonly string[]).includes(v);
}

/** Sin m², plantas ni paso de superficie: solo datos y canvas + librería ahí. */
export function isLightObraProductKind(kind: ObraProductKind | ''): boolean {
  return kind === 'trabajo_simple' || kind === 'mantenimiento';
}

/** Compatibilidad con columna legacy `tipo_obra` en API. */
export function obraProductKindToLegacyTipoObra(kind: ObraProductKind): 'nueva' | 'reforma' | 'ampliacion' {
  if (kind === 'reforma') return 'reforma';
  if (kind === 'mantenimiento' || kind === 'trabajo_simple') return 'ampliacion';
  return 'nueva';
}

const OBRA_PRODUCT_KIND_SESSION_PREFIX = 'grows:obra-product-kind:';

export function seedSessionObraProductKind(obraId: string, kind: ObraProductKind): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${OBRA_PRODUCT_KIND_SESSION_PREFIX}${obraId}`, kind);
  } catch {
    /* noop */
  }
}

export function peekSessionObraProductKind(obraId: string): ObraProductKind | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(`${OBRA_PRODUCT_KIND_SESSION_PREFIX}${obraId}`);
    return isObraProductKind(v) ? v : null;
  } catch {
    return null;
  }
}
