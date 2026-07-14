/**
 * Cliente HTTP del front de Obra Check hacia /api/obra-check.
 * El browser nunca habla directo con Supabase: todo pasa por estas rutas (cookie httpOnly).
 */

import type { ObraCheckContact, ObraCheckTask, OrdenarResult } from './types';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/obra-check/${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json = await res.json().catch(() => ({ success: false, error: 'Respuesta inválida' }));
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Error ${res.status}`);
  }
  return json.data as T;
}

export type CreateSessionInput = {
  email?: string;
  empresa?: string;
  tipoObra?: string;
  consentProcesamiento: true;
  consentPatrones?: boolean;
};

export const obraCheckApi = {
  createSession: (body: CreateSessionInput) =>
    call<{ sessionId: string }>('session', { method: 'POST', body: JSON.stringify(body) }),

  saveTasks: (tasks: ObraCheckTask[]) =>
    call<{ count: number }>('tasks', { method: 'PUT', body: JSON.stringify({ tasks }) }),

  ordenar: () => call<OrdenarResult>('ordenar', { method: 'POST' }),

  listContacts: () => call<ObraCheckContact[]>('contacts', { method: 'GET' }),

  createContact: (body: { nombre: string; rubro?: string | null; telefono?: string | null }) =>
    call<ObraCheckContact>('contacts', { method: 'POST', body: JSON.stringify(body) }),

  asignar: (body: { contactId: string; blockId?: string; taskClientIds?: string[] }) =>
    call<{ ok: boolean }>('asignar', { method: 'POST', body: JSON.stringify(body) }),

  generarWa: (body: {
    contactId: string;
    blockId: string;
    tipo: 'orden_trabajo' | 'pedido_presupuesto';
    fechaLimite?: string | null;
  }) => call<{ texto: string; waLink: string }>('wa', { method: 'POST', body: JSON.stringify(body) }),

  event: (tipo: string, payload?: Record<string, unknown>) =>
    call<{ ok: boolean }>('events', { method: 'POST', body: JSON.stringify({ tipo, payload }) }).catch(() => ({
      ok: false,
    })),

  chat: (message: string, state?: Record<string, unknown>) =>
    call<{ reply?: string; actions?: unknown[]; fallback?: boolean }>('chat', {
      method: 'POST',
      body: JSON.stringify({ message, state }),
    }),
};
