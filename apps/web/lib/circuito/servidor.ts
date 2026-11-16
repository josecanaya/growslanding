import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/auth/session-user';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export type Db = SupabaseClient<any>;
export class CircuitoError extends Error {
  constructor(public status: number, message: string, public code = 'ERROR') { super(message); }
}
export type Roles = {
  responsable: boolean; coordinador: boolean; auditor: boolean; contratista: boolean; inversor: boolean; socio_ids: string[];
};

export async function sesion(): Promise<{ user: User; db: Db }> {
  const user = await getSessionUser();
  if (!user) throw new CircuitoError(401, 'Iniciá sesión para continuar.', 'NO_AUTENTICADO');
  return { user, db: createServiceSupabaseClient() as Db };
}

export async function rolesEnObra(db: Db, obraId: string, userId: string): Promise<Roles> {
  const { data, error } = await db.rpc('circ_roles', { p_obra: obraId, p_user: userId });
  if (error) throw new CircuitoError(503, 'No se pudo comprobar el acceso a la obra.');
  return data as Roles;
}

const STATUS: Record<string, number> = { '42501': 403, GR404: 404, GR409: 409, GR422: 422, '23505': 409, '22P02': 422, '23514': 422, '23502': 422, '22007': 422 };
/** Ejecuta una función circ_* y traduce los códigos de la base a HTTP. Los errores inesperados no filtran detalles. */
export async function rpc<T = Record<string, unknown>>(db: Db, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (!error) return data as T;
  const status = STATUS[error.code ?? ''];
  if (!status) {
    console.error('[circuito]', fn, error.code, error.message);
    throw new CircuitoError(503, 'No se pudo completar la operación. Reintentá con la misma clave de idempotencia.', 'NO_DISPONIBLE');
  }
  const propio = error.code === '42501' || (error.code ?? '').startsWith('GR');
  throw new CircuitoError(status, propio ? error.message : 'Los datos enviados no son válidos o ya existen.', error.code);
}

export async function responder(fn: () => Promise<unknown>, okStatus = 200) {
  try {
    return NextResponse.json(await fn(), { status: okStatus, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof CircuitoError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error('[circuito] error inesperado', error);
    return NextResponse.json({ error: 'No se pudo completar la operación.', code: 'NO_DISPONIBLE' }, { status: 503 });
  }
}

export function claveIdempotencia(request: Request): string | null {
  const clave = request.headers.get('idempotency-key')?.trim();
  if (clave && (clave.length < 8 || clave.length > 200)) throw new CircuitoError(422, 'Idempotency-Key inválida.', 'GR422');
  return clave || null;
}

export const UUID = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
