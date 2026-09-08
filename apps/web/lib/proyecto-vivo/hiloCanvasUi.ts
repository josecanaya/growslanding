export type HiloLinea = {
  id: string;
  role: 'user' | 'horizonte';
  text: string;
  at: string;
  /** Scope donde se escribió el mensaje — cadena de contención. */
  scopePathIds?: string[];
  /** Nodos seleccionados al enviarlo. */
  selectionIds?: string[];
};

export function parseHiloCanvasUi(canvasUi: unknown): HiloLinea[] {
  if (!canvasUi || typeof canvasUi !== 'object') return [];
  const hilo = (canvasUi as { hilo?: unknown }).hilo;
  if (!Array.isArray(hilo)) return [];
  const out: HiloLinea[] = [];
  for (const row of hilo) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    if ((r.role !== 'user' && r.role !== 'horizonte') || typeof r.text !== 'string') continue;
    const scopePathIds = Array.isArray(r.scopePathIds)
      ? (r.scopePathIds as unknown[]).filter((x): x is string => typeof x === 'string')
      : undefined;
    const selectionIds = Array.isArray(r.selectionIds)
      ? (r.selectionIds as unknown[]).filter((x): x is string => typeof x === 'string')
      : undefined;
    out.push({
      id: typeof r.id === 'string' ? r.id : `h-${out.length}`,
      role: r.role,
      text: r.text.slice(0, 8000),
      at: typeof r.at === 'string' ? r.at : new Date().toISOString(),
      ...(scopePathIds ? { scopePathIds } : {}),
      ...(selectionIds ? { selectionIds } : {}),
    });
  }
  return out.slice(-80);
}

export function mergeCanvasUiHilo(canvasUi: unknown, extra: HiloLinea[]): Record<string, unknown> {
  const base =
    canvasUi && typeof canvasUi === 'object' && !Array.isArray(canvasUi)
      ? { ...(canvasUi as Record<string, unknown>) }
      : {};
  const prev = parseHiloCanvasUi(base);
  return { ...base, hilo: [...prev, ...extra].slice(-80) };
}
