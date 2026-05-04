/** Prefijo visible del ID público de socio (no reemplaza el valor en BD, solo presentación). */
export const SOCIO_PUBLIC_ID_PREFIX = 'SOC-' as const;

/** Guiones tipográficos / Unicode que a veces copia el navegador u Office en lugar del ASCII `-`. */
const UNICODE_DASHES = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D\u00AD]/g;

/** Convierte guiones “raros” a `-` para que `SOC‑…` (Unicode) se trate igual que `SOC-…`. */
export function normalizePublicCodigoSeparators(input: string): string {
  return input.replace(UNICODE_DASHES, '-');
}

/** Devuelve ej. SOC-ABC12345 para mostrar y copiar; null si no hay código en BD. */
export function displayPublicSocioCode(dbValue: string | null | undefined): string | null {
  if (!dbValue?.trim()) return null;
  const core = normalizePublicCodigoSeparators(dbValue)
    .trim()
    .toUpperCase()
    .replace(/^SOC-/, '');
  if (!core) return null;
  return `${SOCIO_PUBLIC_ID_PREFIX}${core}`;
}

/** Normaliza entrada del usuario o URL para buscar por columna public_codigo (sin prefijo SOC-). */
export function normalizePublicCodigoForLookup(input: string): string {
  let s = normalizePublicCodigoSeparators(input).trim().toUpperCase();
  if (s.startsWith('SOC-')) s = s.slice(4);
  return s.replace(/[^A-Z0-9]/g, '');
}
