'use client';

import { useMemo, useState } from 'react';
import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import { cn } from '@/lib/utils';
import { buildCronogramaItems, cronogramaSummary } from './buildCronogramaItems';

type Props = {
  obraNombre: string;
  nodes: CanvasNode[];
  edges: CanvasPrecedenceEdge[];
  tareaPublicacionByNodeId: Record<string, { publishedAt?: string | null; estado?: string } | undefined>;
  selectedId: string | null;
  onSelectTask: (id: string) => void;
};

const DAY_WIDTH = 28;

function weekLabels(totalDays: number): { label: string; left: number }[] {
  const weeks = Math.max(1, Math.ceil(totalDays / 7));
  return Array.from({ length: weeks }, (_, i) => ({
    label: `Semana ${i + 1}`,
    left: i * 7 * DAY_WIDTH,
  }));
}

export function CanvasCronogramaTab({
  obraNombre,
  nodes,
  edges,
  tareaPublicacionByNodeId,
  selectedId,
  onSelectTask,
}: Props) {
  const [soloPublicadas, setSoloPublicadas] = useState(false);
  const [mostrarCriticas, setMostrarCriticas] = useState(false);
  const [agruparPor, setAgruparPor] = useState<'fase' | 'ambiente'>('fase');

  const allItems = useMemo(
    () => buildCronogramaItems(nodes, edges, tareaPublicacionByNodeId),
    [nodes, edges, tareaPublicacionByNodeId],
  );

  const items = useMemo(() => {
    let list = allItems;
    if (soloPublicadas) list = list.filter((i) => i.publicada);
    if (mostrarCriticas) list = list.filter((i) => i.isCritical);
    return list;
  }, [allItems, soloPublicadas, mostrarCriticas]);

  const summary = useMemo(() => cronogramaSummary(allItems), [allItems]);
  const totalDays = Math.max(summary.totalDuration, 7);
  const timelineWidth = totalDays * DAY_WIDTH;

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const key =
        agruparPor === 'ambiente'
          ? item.groupLabel.split(' · ').pop() ?? item.groupLabel
          : item.groupLabel.split(' · ')[0] ?? item.groupLabel;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items, agruparPor]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#e5e7eb] bg-white px-5 py-4 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Obra</p>
        <h1 className="mt-0.5 text-xl font-black text-[#0f172a]">Cronograma de obra</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Tareas de <strong className="text-[#334155]">{obraNombre}</strong> ordenadas por duración y precedencias.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#94a3b8]">
            Día
          </span>
          <span className="rounded-lg border border-[#2563eb] bg-[#eff6ff] px-2.5 py-1 text-[11px] font-semibold text-[#1d4ed8]">
            Semana
          </span>
          <span className="rounded-lg border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#94a3b8]">
            Mes · Próximamente
          </span>
          <span className="mx-1 h-4 w-px bg-[#e5e7eb]" />
          <button
            type="button"
            onClick={() => setSoloPublicadas((v) => !v)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition',
              soloPublicadas
                ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]'
                : 'border-[#e5e7eb] bg-white text-[#64748b] hover:bg-[#f8fafc]',
            )}
          >
            Solo publicadas
          </button>
          <button
            type="button"
            onClick={() => setMostrarCriticas((v) => !v)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition',
              mostrarCriticas
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-[#e5e7eb] bg-white text-[#64748b] hover:bg-[#f8fafc]',
            )}
          >
            Mostrar críticas
          </button>
          <button
            type="button"
            onClick={() => setAgruparPor((g) => (g === 'fase' ? 'ambiente' : 'fase'))}
            className="rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#64748b] hover:bg-[#f8fafc]"
          >
            Agrupar por {agruparPor === 'fase' ? 'fase' : 'ambiente'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[#64748b]">
          <span>
            Duración estimada:{' '}
            <strong className="text-[#0f172a]">{summary.totalDuration} días</strong>
          </span>
          <span>
            Publicadas: <strong className="text-emerald-700">{summary.published}</strong> / {summary.total}
          </span>
          <span>
            Sin fecha real: <strong className="text-amber-700">{summary.missingDates}</strong>
          </span>
          <span>
            Camino crítico: <strong className="text-red-700">{summary.critical}</strong> tareas
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 md:p-5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-6 py-16 text-center">
            <p className="text-base font-bold text-[#0f172a]">Sin tareas para mostrar</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748b]">
              {allItems.length === 0
                ? 'Creá tareas en Organizar para ver el cronograma.'
                : 'Ninguna tarea coincide con los filtros activos.'}
            </p>
          </div>
        ) : (
          <div className="min-w-max">
            <div className="relative mb-3 h-8 border-b border-[#e5e7eb]" style={{ width: timelineWidth + 200 }}>
              {weekLabels(totalDays).map((w) => (
                <span
                  key={w.label}
                  className="absolute top-0 text-[10px] font-semibold text-[#94a3b8]"
                  style={{ left: w.left + 200 }}
                >
                  {w.label}
                </span>
              ))}
            </div>

            {grouped.map(([group, groupItems]) => (
              <div key={group} className="mb-6">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#64748b]">{group}</h3>
                <div className="space-y-1.5">
                  {groupItems.map((item) => {
                    const barLeft = item.startOffset * DAY_WIDTH;
                    const barWidth = Math.max(DAY_WIDTH, item.duracionDias * DAY_WIDTH);
                    const selected = selectedId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3"
                        style={{ minWidth: timelineWidth + 200 }}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectTask(item.id)}
                          className={cn(
                            'w-[188px] shrink-0 truncate rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold transition',
                            selected
                              ? 'bg-[#eff6ff] text-[#1d4ed8] ring-1 ring-[#2563eb]'
                              : 'text-[#334155] hover:bg-[#f8fafc]',
                          )}
                          title={item.title}
                        >
                          {item.title}
                        </button>
                        <div className="relative h-8 flex-1 rounded-lg bg-[#f8fafc]">
                          {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => (
                            <span
                              key={i}
                              className="absolute inset-y-0 border-l border-[#e5e7eb]/80"
                              style={{ left: i * 7 * DAY_WIDTH }}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => onSelectTask(item.id)}
                            className={cn(
                              'absolute top-1 flex h-6 items-center rounded-md px-2 text-[10px] font-semibold text-white shadow-sm transition hover:brightness-95',
                              item.isCritical
                                ? 'bg-red-500'
                                : item.publicada
                                  ? 'bg-[#2563eb]'
                                  : 'bg-[#94a3b8]',
                              item.hasMissingDates && 'opacity-80',
                            )}
                            style={{ left: barLeft, width: barWidth, minWidth: 24 }}
                            title={`${item.title} · ${item.duracionDias} días · ${item.publicada ? 'Publicada' : 'Sin publicar'}${item.hasMissingDates ? ' · fecha estimada' : ''}`}
                          >
                            <span className="truncate">{item.duracionDias}d</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
