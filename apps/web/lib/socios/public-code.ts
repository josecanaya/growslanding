/** Prefijo visible del ID público de socio (no reemplaza el valor en BD, solo presentación). */
export const SOCIO_PUBLIC_ID_PREFIX = 'SOC-' as const;

/** Devuelve ej. SOC-ABC12345 para mostrar y copiar; null si no hay código en BD. */
export function displayPublicSocioCode(dbValue: string | null | undefined): string | null {
  if (!dbValue?.trim()) return null;
  const core = dbValue.trim().toUpperCase().replace(/^SOC-/, '');
  if (!core) return null;
  return `${SOCIO_PUBLIC_ID_PREFIX}${core}`;
}

/** Normaliza entrada del usuario o URL para buscar por columna public_codigo (sin prefijo SOC-). */
export function normalizePublicCodigoForLookup(input: string): string {
  let s = input.trim().toUpperCase();
  if (s.startsWith('SOC-')) s = s.slice(4);
  return s.replace(/[^A-Z0-9]/g, '');
}
