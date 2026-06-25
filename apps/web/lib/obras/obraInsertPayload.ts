/** Columnas que existen en `obras` según supabase.gen (sin fechas opcionales legacy). */
export const OBRAS_INSERT_ALLOWED_KEYS = [
  'org_id',
  'name',
  'address',
  'propietario',
  'tipo_obra',
  'latitud',
  'longitud',
  'plantas',
  'terreno',
  'superficies',
  'estado',
  'obra_product_kind',
] as const;

export type ObraInsertPayload = {
  org_id: string;
  name: string;
  address?: string | null;
  propietario?: string | null;
  tipo_obra?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  plantas?: number | null;
  terreno?: number | null;
  superficies?: unknown;
  estado?: string | null;
  obra_product_kind?: string | null;
};

export function buildObraInsertRow(data: ObraInsertPayload): Record<string, unknown> {
  const row: Record<string, unknown> = {
    org_id: data.org_id,
    name: data.name,
    address: data.address ?? null,
  };
  if (data.propietario != null && data.propietario !== '') row.propietario = data.propietario;
  if (data.tipo_obra != null) row.tipo_obra = data.tipo_obra;
  if (data.latitud != null) row.latitud = data.latitud;
  if (data.longitud != null) row.longitud = data.longitud;
  if (data.plantas != null) row.plantas = data.plantas;
  if (data.terreno != null) row.terreno = data.terreno;
  if (data.superficies != null) row.superficies = data.superficies;
  if (data.estado != null) row.estado = data.estado;
  if (data.obra_product_kind) row.obra_product_kind = data.obra_product_kind;
  return row;
}

/** Quita columnas que PostgREST rechaza (schema cache / migración pendiente). */
export function stripMissingColumnFromInsert(
  row: Record<string, unknown>,
  errorMessage: string,
): Record<string, unknown> | null {
  const match = errorMessage.match(/Could not find the '([^']+)' column/i);
  if (!match?.[1]) return null;
  const col = match[1];
  if (!(col in row)) return null;
  const next = { ...row };
  delete next[col];
  return next;
}
