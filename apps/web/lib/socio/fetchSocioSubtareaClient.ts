export async function fetchSocioSubtareaClient(
  subtareaId: string,
): Promise<{ ok: boolean; subtarea: Record<string, unknown> | null; error?: string }> {
  const res = await fetch(`/api/socio/subtareas/${encodeURIComponent(subtareaId)}`, {
    credentials: 'include',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, subtarea: null, error: json.error ?? 'Subtarea no encontrada' };
  }
  return { ok: true, subtarea: json.subtarea ?? null };
}

export async function fetchSocioSubtareaEvidenciaClient(subtareaId: string): Promise<{
  ok: boolean;
  evidencia_url?: string | null;
  evidencia_cargada?: boolean | null;
  publicUrl?: string | null;
  error?: string;
}> {
  const res = await fetch(
    `/api/socio/subtareas/${encodeURIComponent(subtareaId)}?vista=evidencia`,
    { credentials: 'include' },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: json.error ?? 'No se pudo cargar evidencia' };
  }
  return {
    ok: true,
    evidencia_url: json.evidencia_url,
    evidencia_cargada: json.evidencia_cargada,
    publicUrl: json.publicUrl,
  };
}

export async function fetchSocioBloquesResumenClient(tareaId: string): Promise<{
  ok: boolean;
  bloques: Array<{ id: string; estado?: string | null; orden?: number | null }>;
  error?: string;
}> {
  const res = await fetch(
    `/api/socio/tareas/${encodeURIComponent(tareaId)}/bloques-resumen`,
    { credentials: 'include' },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, bloques: [], error: json.error ?? 'Error al cargar bloques' };
  }
  return { ok: true, bloques: json.bloques ?? [] };
}
