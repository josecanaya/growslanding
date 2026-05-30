export async function fetchSocioTareaAvanceClient(tareaId: string): Promise<{
  ok: boolean;
  avanceDiario: number;
  evidenciasFinales: string[];
  error?: string;
}> {
  const res = await fetch(
    `/api/socio/tareas/${encodeURIComponent(tareaId)}/avance-evidencias`,
    { credentials: 'include' },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      avanceDiario: 0,
      evidenciasFinales: [],
      error: json.error ?? 'Error al cargar avance',
    };
  }
  return {
    ok: true,
    avanceDiario: json.avanceDiario ?? 0,
    evidenciasFinales: json.evidenciasFinales ?? [],
  };
}
