import type { SocioAhoraResult } from '@/lib/socio/socio-ahora.service';

export async function fetchSocioAhoraClient(opts?: {
  tareaId?: string | null;
}): Promise<SocioAhoraResult & { ok: boolean }> {
  const qs = opts?.tareaId?.trim() ? `?tareaId=${encodeURIComponent(opts.tareaId.trim())}` : '';
  const res = await fetch(`/api/socio/ahora${qs}`, { credentials: 'include' });
  const json = (await res.json().catch(() => ({}))) as SocioAhoraResult & { ok?: boolean };
  if (!res.ok) {
    return {
      ok: false,
      orgId: null,
      socioId: null,
      tarea: null,
      operativas: [],
      progresoGeneral: { completadas: 0, total: 0, porcentaje: 0 },
      tareasCompletadasHoy: 0,
      tareasActivasCount: 0,
      bloquesActivosCount: 0,
      error: json.error ?? 'No se pudo cargar la vista Ahora.',
    };
  }
  return { ...json, ok: true };
}
