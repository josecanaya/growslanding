/**
 * Cliente HTTP del front de Obra Check hacia /api/obra-check.
 * El browser nunca habla directo con Supabase: todo pasa por estas rutas (cookie httpOnly).
 */

import type { ObraCheckBudgetGroup, ObraCheckContact, ObraCheckTask, OrdenarResult } from './types';

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
  email: string;
  empresa?: string;
  tipoObra?: string;
  consentProcesamiento: true;
  consentPatrones?: boolean;
};

export const obraCheckApi = {
  createSession: (body: CreateSessionInput) =>
    call<{ sessionId: string; inboxToken: string | null }>('session', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getSession: () =>
    call<{ sessionId: string; email: string | null; inboxToken: string | null; inboxUrl: string | null }>(
      'session',
      { method: 'GET' },
    ),

  saveTasks: (tasks: ObraCheckTask[]) =>
    call<{ count: number }>('tasks', { method: 'PUT', body: JSON.stringify({ tasks }) }),

  ordenar: () => call<OrdenarResult>('ordenar', { method: 'POST' }),

  saveBudgetGroups: (groups: ObraCheckBudgetGroup[]) =>
    call<{ count: number }>('budget-groups', {
      method: 'PUT',
      body: JSON.stringify({
        groups: groups.map((g, i) => ({
          id: g.id,
          nombre: g.nombre,
          blockIds: g.blockIds,
          parentId: g.parentId ?? null,
          kind: g.kind ?? (g.parentId ? 'subgrupo' : 'fase'),
          orden: g.orden ?? i,
        })),
      }),
    }),

  listBudgetGroups: () => call<ObraCheckBudgetGroup[]>('budget-groups', { method: 'GET' }),

  listContacts: () => call<ObraCheckContact[]>('contacts', { method: 'GET' }),

  createContact: (body: { nombre: string; rubro?: string | null; telefono?: string | null }) =>
    call<ObraCheckContact>('contacts', { method: 'POST', body: JSON.stringify(body) }),

  asignar: (body: { contactId: string; blockId?: string; taskClientIds?: string[] }) =>
    call<{ ok: boolean }>('asignar', { method: 'POST', body: JSON.stringify(body) }),

  generarWa: (body: {
    contactId: string;
    blockId: string;
    budgetGroupId?: string;
    groupName?: string;
    tipo: 'orden_trabajo' | 'pedido_presupuesto';
    fechaLimite?: string | null;
  }) =>
    call<{ texto: string; waLink: string; formUrl: string; inviteToken: string }>('wa', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listLeads: () =>
    call<
      Array<{
        id: string;
        nombre: string;
        telefono: string;
        email: string | null;
        rubro: string | null;
        empresa: string | null;
        mensaje: string | null;
        detalle: unknown;
        createdAt: string;
        blockId: string | null;
        viewToken: string | null;
      }>
    >('leads', { method: 'GET' }),

  getObraDatos: () =>
    call<{
      metrosCuadrados: number | null;
      planos: Array<{ id: string; nombre: string; mime: string; url: string; sizeBytes: number }>;
    }>('obra-datos', { method: 'GET' }),

  saveMetrosCuadrados: (metrosCuadrados: number | null) =>
    call<{ ok: boolean }>('obra-datos', {
      method: 'PATCH',
      body: JSON.stringify({ metrosCuadrados }),
    }),

  uploadPlano: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/obra-check/obra-datos', {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    const json = await res.json().catch(() => ({ success: false, error: 'Respuesta inválida' }));
    if (!res.ok || !json.success) throw new Error(json.error ?? `Error ${res.status}`);
    return json.data as { id: string; nombre: string; mime: string; url: string; sizeBytes: number };
  },

  deletePlano: (planoId: string) =>
    call<{ ok: boolean }>(`obra-datos?planoId=${encodeURIComponent(planoId)}`, { method: 'DELETE' }),

  event: (tipo: string, payload?: Record<string, unknown>) =>
    call<{ ok: boolean }>('events', { method: 'POST', body: JSON.stringify({ tipo, payload }) }).catch(() => ({
      ok: false,
    })),

  complete: () =>
    call<{ sent: boolean; alreadySent: boolean }>('complete', { method: 'POST', body: JSON.stringify({}) }),

  chat: (message: string, state?: Record<string, unknown>) =>
    call<{ reply?: string; actions?: unknown[]; fallback?: boolean }>('chat', {
      method: 'POST',
      body: JSON.stringify({ message, state }),
    }),
};
