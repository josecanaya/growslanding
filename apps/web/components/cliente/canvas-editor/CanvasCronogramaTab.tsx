'use client';

import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import { cn } from '@/lib/utils';
import {
  buildCronogramaItems,
  buildCronogramaTree,
  cronogramaSummary,
  formatCronogramaDate,
  offsetToDate,
  type CronogramaTreeNode,
} from './buildCronogramaItems';

type Props = {
  obraNombre: string;
  nodes: CanvasNode[];
  edges: CanvasPrecedenceEdge[];
  tareaPublicacionByNodeId: Record<string, { publishedAt?: string | null; estado?: string } | undefined>;
  selectedId: string | null;
  onSelectTask: (id: string) => void;
  projectStart?: Date;
};

const DAY_WIDTH = 22;
const LABEL_WIDTH = 220;

function dateAxisLabels(projectStart: Date, totalDays: number): { label: string; left: number; key: string }[] {
  const labels: { label: string; left: number; key: string }[] = [];
  const step = totalDays > 60 ? 7 : totalDays > 21 ? 3 : 1;
  for (let d = 0; d <= totalDays; d += step) {
    labels.push({
      key: `d-${d}`,
      label: formatCronogramaDate(offsetToDate(projectStart, d)),
      left: d * DAY_WIDTH,
    });
  }
  return labels;
}

function flattenVisibleTree(
  nodes: CronogramaTreeNode[],
  collapsed: Set<string>,
  depth = 0,
): CronogramaTreeNode[] {
  const out: CronogramaTreeNode[] = [];
  for (const n of nodes) {
    out.push({ ...n, depth });
    if (n.kind !== 'tarea' && !collapsed.has(n.id)) {
      out.push(...flattenVisibleTree(n.children, collapsed, depth + 1));
    }
  }
  return out;
}

function collectGroupIds(nodes: CronogramaTreeNode[]): string[] {
  const ids: string[] = [];
  for (const n of nodes) {
    if (n.kind !== 'tarea') ids.push(n.id);
    ids.push(...collectGroupIds(n.children));
  }
  return ids;
}

export function CanvasCronogramaTab({
  obraNombre,
  nodes,
  edges,
  tareaPublicacionByNodeId,
  selectedId,
  onSelectTask,
  projectStart: projectStartProp,
}: Props) {
  const projectStart = useMemo(() => {
    const d = projectStartProp ? new Date(projectStartProp) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [projectStartProp]);

  const [soloPublicadas, setSoloPublicadas] = useState(false);
  const [mostrarCriticas, setMostrarCriticas] = useState(false);

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

  const tree = useMemo(() => buildCronogramaTree(items), [items]);

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsed(new Set(collectGroupIds(tree)));
  }, [tree]);

  const expandAll = useCallback(() => {
    setCollapsed(new Set());
  }, []);

  const visibleRows = useMemo(() => flattenVisibleTree(tree, collapsed), [tree, collapsed]);

  const summary = useMemo(() => cronogramaSummary(allItems), [allItems]);
  const totalDays = Math.max(summary.projectEnd + 2, 14);
  const timelineWidth = totalDays * DAY_WIDTH;
  const axisLabels = useMemo(
    () => dateAxisLabels(projectStart, totalDays),
    [projectStart, totalDays],
  );

  const projectEndDate = formatCronogramaDate(offsetToDate(projectStart, summary.projectEnd));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#e5e7eb] bg-white px-5 py-4 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Obra</p>
        <h1 className="mt-0.5 text-xl font-black text-[#0f172a]">Cronograma de obra</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Vista temporal de <strong className="text-[#334155]">{obraNombre}</strong> — solo lectura. Editá en
          Organizar.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-[#2563eb] bg-[#eff6ff] px-2.5 py-1 text-[11px] font-semibold text-[#1d4ed8]">
            Fechas calendario
          </span>
          <span className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#64748b]">
            Inicio: {formatCronogramaDate(projectStart)}
          </span>
          <span className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#64748b]">
            Fin estimado: {projectEndDate}
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
            onClick={expandAll}
            className="rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#64748b] hover:bg-[#f8fafc]"
          >
            Expandir todo
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#64748b] hover:bg-[#f8fafc]"
          >
            Colapsar todo
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[#64748b]">
          <span>
            Duración: <strong className="text-[#0f172a]">{summary.totalDuration} días</strong>
          </span>
          <span>
            Publicadas: <strong className="text-emerald-700">{summary.published}</strong> / {summary.total}
          </span>
          <span>
            Camino crítico: <strong className="text-red-700">{summary.critical}</strong>
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
            <div
              className="sticky top-0 z-10 mb-1 flex border-b border-[#e5e7eb] bg-white pb-2"
              style={{ width: LABEL_WIDTH + timelineWidth }}
            >
              <div className="shrink-0" style={{ width: LABEL_WIDTH }} />
              <div className="relative h-8 flex-1">
                {axisLabels.map((tick) => (
                  <span
                    key={tick.key}
                    className="absolute top-0 border-l border-[#e5e7eb] pl-1 text-[10px] font-semibold text-[#64748b]"
                    style={{ left: tick.left }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-0.5">
              {visibleRows.map((row) => {
                const isGroup = row.kind !== 'tarea';
                const isCollapsed = isGroup && collapsed.has(row.id);
                const item = row.item;
                const barLeft = row.startOffset * DAY_WIDTH;
                const barWidth = Math.max(DAY_WIDTH * 0.5, (row.endOffset - row.startOffset) * DAY_WIDTH);
                const selected = !isGroup && selectedId === row.id;
                const endDate = formatCronogramaDate(offsetToDate(projectStart, row.endOffset));
                const indent = row.depth * 14;

                return (
                  <div
                    key={row.id}
                    className="flex items-center gap-0"
                    style={{ width: LABEL_WIDTH + timelineWidth }}
                  >
                    <div
                      className="flex shrink-0 items-center gap-1 py-1 pr-2"
                      style={{ width: LABEL_WIDTH, paddingLeft: indent }}
                    >
                      {isGroup ? (
                        <button
                          type="button"
                          onClick={() => toggleCollapse(row.id)}
                          className="flex min-w-0 flex-1 items-center gap-1 rounded-lg px-1 py-1 text-left hover:bg-[#f8fafc]"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#64748b]" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#64748b]" />
                          )}
                          <span
                            className={cn(
                              'truncate text-[11px] font-bold uppercase tracking-wide',
                              row.kind === 'fase' ? 'text-[#0f172a]' : 'text-[#475569]',
                            )}
                            title={row.label}
                          >
                            {row.label}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectTask(row.id)}
                          className={cn(
                            'min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-[11px] font-medium transition',
                            selected
                              ? 'bg-[#eff6ff] text-[#1d4ed8] ring-1 ring-[#2563eb]'
                              : 'text-[#334155] hover:bg-[#f8fafc]',
                          )}
                          title={row.label}
                        >
                          {row.label}
                        </button>
                      )}
                    </div>

                    <div className="relative h-9 flex-1 rounded-lg bg-[#fafbfc]">
                      {axisLabels.map((tick) => (
                        <span
                          key={`grid-${row.id}-${tick.key}`}
                          className="absolute inset-y-0 border-l border-[#eef2f7]"
                          style={{ left: tick.left }}
                        />
                      ))}
                      <div
                        className={cn(
                          'absolute top-1.5 flex h-6 items-center overflow-hidden rounded-md px-1.5 text-[10px] font-semibold shadow-sm',
                          isGroup && 'opacity-45',
                          !isGroup && item?.isCritical && 'bg-red-500 text-white',
                          !isGroup && !item?.isCritical && item?.publicada && 'bg-[#2563eb] text-white',
                          !isGroup && !item?.isCritical && !item?.publicada && 'bg-[#94a3b8] text-white',
                          isGroup && 'border border-[#cbd5e1] bg-[#64748b] text-white',
                        )}
                        style={{ left: barLeft, width: Math.max(barWidth, 20) }}
                        title={
                          isGroup
                            ? `${row.label}: ${formatCronogramaDate(offsetToDate(projectStart, row.startOffset))} → ${endDate}`
                            : `${row.label} · fin ${endDate} · ${item?.duracionDias ?? 0} días`
                        }
                      >
                        {!isGroup ? (
                          <span className="truncate">{endDate}</span>
                        ) : (
                          <span className="truncate opacity-0">·</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
