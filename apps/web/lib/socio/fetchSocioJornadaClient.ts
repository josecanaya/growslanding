import type { JornadaRow } from '@/lib/socio/infrastructure/jornadas.repository';

export async function fetchSocioJornadaClient(fecha?: string): Promise<{
  ok: boolean;
  jornada: JornadaRow | null;
  error?: string;
}> {
  const qs = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
  const res = await fetch(`/api/socio/jornada${qs}`, { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, jornada: null, error: json.error ?? 'Error al cargar jornada' };
  }
  return { ok: true, jornada: json.jornada ?? null };
}

export async function iniciarSocioJornadaClient(obraId: string): Promise<{
  ok: boolean;
  jornada: JornadaRow | null;
  error?: string;
}> {
  const res = await fetch('/api/socio/jornada', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ obra_id: obraId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, jornada: null, error: json.error ?? 'Error al iniciar jornada' };
  }
  return { ok: true, jornada: json.jornada ?? null };
}

export async function finalizarSocioJornadaClient(jornadaId: string): Promise<{
  ok: boolean;
  jornada: JornadaRow | null;
  error?: string;
}> {
  const res = await fetch('/api/socio/jornada', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jornada_id: jornadaId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, jornada: null, error: json.error ?? 'Error al finalizar jornada' };
  }
  return { ok: true, jornada: json.jornada ?? null };
}
