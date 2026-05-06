'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TareaItem } from './TareaItem';
import { buildBudgetGroupHierarchyBranches, type BudgetHierarchyBranch } from '@/lib/canvas/budgetGroupHierarchy';
import { dbCanvasRowsToCanvasNodes, type DbCanvasNodeRow } from '@/lib/canvas/dbCanvasRowsToNodes';
import { toClientNodeId } from '@/lib/canvas/canvasSupabaseMapper';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import { bucketEtapaPresupuesto } from '@/lib/socio/bucketEtapaPresupuesto';
import { presupuestoLineaEstado } from '@/lib/socio/presupuestoLineaEstado';

export interface PresupuestoListaItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  observacion?: string | null;
  monto: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    duracion_sugerida: number | null;
    canvas_node_id?: string | null;
  } | null;
  elemento: {
    nombre: string | null;
    planta: string | null;
    altura: string | null;
    cantidad: number | null;
    unidad: string | null;
  } | null;
}

interface ListaTareasProps {
  presupuestos: PresupuestoListaItem[];
  canvasNodesRaw: DbCanvasNodeRow[];
  onFieldChange: (
    tareaId: string,
    field: 'dias_reales' | 'monto' | 'observacion',
    value: number | null | string,
  ) => void;
  editing: Map<string, { dias_reales: number | null; monto: number | null; observacion: string }>;
  stitchMode?: boolean;
}

const ORPHAN_SEG = '__sin_ubicacion__';

function countTasksInBranch(b: BudgetHierarchyBranch): number {
  let n = b.leafTasks.length;
  for (const s of b.sub) n += countTasksInBranch(s);
  return n;
}

function branchPresupuestos(
  branch: BudgetHierarchyBranch,
  presupuestos: PresupuestoListaItem[],
): PresupuestoListaItem[] {
  const out: PresupuestoListaItem[] = [];
  for (const t of branch.leafTasks) {
    const p = presupuestos.find(
      (pp) => pp.tarea?.canvas_node_id && toClientNodeId(pp.tarea.canvas_node_id) === t.id,
    );
    if (p) out.push(p);
  }
  for (const s of branch.sub) out.push(...branchPresupuestos(s, presupuestos));
  return out;
}

function countCargadas(
  items: PresupuestoListaItem[],
  editing: Map<string, { dias_reales: number | null; monto: number | null; observacion: string }>,
): number {
  let n = 0;
  for (const p of items) {
    const ed = editing.get(p.tarea_id) || { dias_reales: null, monto: null, observacion: '' };
    const { key } = presupuestoLineaEstado(p.estado, {
      monto: ed.monto ?? p.monto,
      dias_reales: ed.dias_reales ?? p.dias_reales,
    });
    if (key === 'lista' || key === 'enviada' || key === 'aprobada') n++;
  }
  return n;
}

/** Primer camino por sub[0] para armar subtítulo tipo “Piso 1 · Depto …”. */
function firstChildPathTitles(branch: BudgetHierarchyBranch, max = 4): string[] {
  const titles: string[] = [];
  let cur: BudgetHierarchyBranch | undefined = branch;
  while (cur != null && cur.sub.length > 0 && titles.length < max) {
    const next: BudgetHierarchyBranch = cur.sub[0];
    if (next.segmentId !== ORPHAN_SEG) titles.push(next.segmentTitle);
    cur = next;
  }
  return titles;
}

export function ListaTareas({
  presupuestos,
  canvasNodesRaw,
  onFieldChange,
  editing,
  stitchMode = false,
}: ListaTareasProps) {
  const allCanvasNodes = useMemo(() => dbCanvasRowsToCanvasNodes(canvasNodesRaw), [canvasNodesRaw]);

  const nodeByClientId = useMemo(() => new Map(allCanvasNodes.map((n) => [n.id, n])), [allCanvasNodes]);

  const { branches, sinJerarquia } = useMemo(() => {
    if (allCanvasNodes.length === 0 || presupuestos.length === 0) {
      return { branches: [] as BudgetHierarchyBranch[], sinJerarquia: presupuestos };
    }

    const taskNodes: CanvasNode[] = [];
    const sinJerarquiaList: PresupuestoListaItem[] = [];

    for (const p of presupuestos) {
      const raw = p.tarea?.canvas_node_id;
      if (!raw) {
        sinJerarquiaList.push(p);
        continue;
      }
      const cid = toClientNodeId(raw);
      const node = nodeByClientId.get(cid);
      if (!node || node.type !== 'tarea') {
        sinJerarquiaList.push(p);
        continue;
      }
      taskNodes.push(node);
    }

    if (taskNodes.length === 0) {
      return { branches: [] as BudgetHierarchyBranch[], sinJerarquia: presupuestos };
    }

    return {
      branches: buildBudgetGroupHierarchyBranches(allCanvasNodes, taskNodes),
      sinJerarquia: sinJerarquiaList,
    };
  }, [allCanvasNodes, nodeByClientId, presupuestos]);

  const gruposPorEtapa = useMemo(() => {
    const grupos = {
      ESTRUCTURA: [] as PresupuestoListaItem[],
      OBRA_GRIS: [] as PresupuestoListaItem[],
      TERMINACIONES: [] as PresupuestoListaItem[],
    };
    for (const p of presupuestos) {
      const bucket = bucketEtapaPresupuesto(p.tarea?.etapa);
      grupos[bucket].push(p);
    }
    return grupos;
  }, [presupuestos]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isOpen = (key: string) => expanded[key] === true;

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !isOpen(key) }));
  };

  const getEtapaLabel = (etapa: string) => {
    if (etapa === 'ESTRUCTURA') return 'Estructura';
    if (etapa === 'OBRA_GRIS') return 'Obra Gris';
    if (etapa === 'TERMINACIONES') return 'Terminaciones';
    return 'Otros';
  };

  const renderLeaf = (taskNode: CanvasNode, breadcrumb: string[]) => {
    const presupuesto = presupuestos.find(
      (p) => p.tarea?.canvas_node_id && toClientNodeId(p.tarea.canvas_node_id) === taskNode.id,
    );
    if (!presupuesto) return null;
    const editData = editing.get(presupuesto.tarea_id) || { dias_reales: null, monto: null, observacion: '' };
    return (
      <TareaItem
        key={presupuesto.id}
        presupuesto={presupuesto}
        editing={editData}
        stitchMode={stitchMode}
        layout="compact"
        breadcrumb={breadcrumb.length > 0 ? breadcrumb : undefined}
        onFieldChange={(field, value) =>
          onFieldChange(presupuesto.tarea_id, field, value as number | null | string)
        }
      />
    );
  };

  const renderBranch = (branch: BudgetHierarchyBranch, ancestors: string[], depth: number): ReactNode => {
    const key = `${depth}:${branch.segmentId}`;
    const open = isOpen(key);
    const title =
      branch.segmentId === ORPHAN_SEG ? 'Sin ubicación en el canvas' : branch.segmentTitle;
    const total = countTasksInBranch(branch);
    const itemsInBranch = branchPresupuestos(branch, presupuestos);
    const cargadas = countCargadas(itemsInBranch, editing);

    const pathHint = firstChildPathTitles(branch).join(' · ');
    const subtitleParts = [pathHint, `${total} ${total === 1 ? 'tarea' : 'tareas'}`].filter(Boolean);

    if (depth === 0) {
      return (
        <div
          key={key}
          className={cn(
            'rounded-3xl border bg-white p-4 shadow-[0_8px_28px_rgba(22,50,116,0.06)]',
            stitchMode ? 'border-[#163274]/10' : 'border-slate-200',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={cn(
                  'text-base font-bold leading-snug',
                  stitchMode ? 'font-stitch-headline text-[#163274]' : 'text-slate-900',
                )}
              >
                {title}
              </h3>
              {subtitleParts.length > 0 ? (
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitleParts.join(' · ')}</p>
              ) : null}
              <p className="mt-2 text-xs font-semibold text-[#43617c]">
                Estado:{' '}
                <span className="tabular-nums text-[#163274]">
                  {cargadas}/{total} cargadas
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-bold transition active:scale-[0.98]',
                stitchMode
                  ? 'bg-[#163274] text-white shadow-sm hover:bg-[#314a8d]'
                  : 'bg-slate-900 text-white hover:bg-slate-800',
              )}
            >
              {open ? 'Cerrar' : 'Abrir'}
            </button>
          </div>
          {open ? (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              {branch.sub.map((sub) => {
                const nextAncestors =
                  branch.segmentId === ORPHAN_SEG ? ancestors : [...ancestors, branch.segmentTitle];
                return renderBranch(sub, nextAncestors, depth + 1);
              })}
              {branch.leafTasks.map((task) => {
                const crumb =
                  branch.segmentId === ORPHAN_SEG ? [] : [...ancestors, branch.segmentTitle];
                return renderLeaf(task, crumb);
              })}
            </div>
          ) : null}
        </div>
      );
    }

    /* Niveles internos: panel suave, sin líneas punteadas */
    return (
      <div
        key={key}
        className={cn('rounded-2xl bg-[#f2f4f6]/90 p-3', !open && 'pb-3')}
      >
        <button
          type="button"
          onClick={() => toggle(key)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div className="min-w-0">
            <p
              className={cn(
                'text-sm font-bold',
                stitchMode ? 'text-[#163274]' : 'text-slate-900',
              )}
            >
              {title}
            </p>
            <p className="text-[11px] text-slate-500">
              {cargadas}/{total} listas · {total} {total === 1 ? 'tarea' : 'tareas'}
            </p>
          </div>
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[#163274]" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          )}
        </button>
        {open ? (
          <div className="mt-3 space-y-3 border-t border-white/60 pt-3">
            {branch.sub.map((sub) => {
              const nextAncestors =
                branch.segmentId === ORPHAN_SEG ? ancestors : [...ancestors, branch.segmentTitle];
              return renderBranch(sub, nextAncestors, depth + 1);
            })}
            {branch.leafTasks.map((task) => {
              const crumb =
                branch.segmentId === ORPHAN_SEG ? [] : [...ancestors, branch.segmentTitle];
              return renderLeaf(task, crumb);
            })}
          </div>
        ) : null}
      </div>
    );
  };

  const renderGrupoPlano = (etapa: string, items: PresupuestoListaItem[]) => {
    if (items.length === 0) return null;
    const key = `plano:${etapa}`;
    const open = isOpen(key);
    const total = items.length;
    const cargadas = countCargadas(items, editing);
    return (
      <div
        key={etapa}
        className={cn(
          'rounded-3xl border bg-white p-4 shadow-[0_8px_28px_rgba(22,50,116,0.06)]',
          stitchMode ? 'border-[#163274]/10' : 'border-slate-200',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className={cn('text-base font-bold', stitchMode ? 'text-[#163274]' : 'text-slate-900')}>
              {getEtapaLabel(etapa)}
            </h3>
            <p className="mt-2 text-xs font-semibold text-[#43617c]">
              Estado:{' '}
              <span className="tabular-nums text-[#163274]">
                {cargadas}/{total} cargadas
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggle(key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-xs font-bold transition active:scale-[0.98]',
              stitchMode
                ? 'bg-[#163274] text-white shadow-sm hover:bg-[#314a8d]'
                : 'bg-slate-900 text-white hover:bg-slate-800',
            )}
          >
            {open ? 'Cerrar' : 'Abrir'}
          </button>
        </div>
        {open ? (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            {items.map((presupuesto) => {
              const editData = editing.get(presupuesto.tarea_id) || {
                dias_reales: null,
                monto: null,
                observacion: '',
              };
              return (
                <TareaItem
                  key={presupuesto.id}
                  presupuesto={presupuesto}
                  editing={editData}
                  stitchMode={stitchMode}
                  layout="compact"
                  onFieldChange={(field, value) =>
                    onFieldChange(presupuesto.tarea_id, field, value as number | null | string)
                  }
                />
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  const mostrarArbol = branches.length > 0;

  return (
    <div className="space-y-4 px-4 pb-4">
      {mostrarArbol && (
        <div>
          <p
            className={cn(
              'mb-3 text-[10px] font-bold uppercase tracking-widest',
              stitchMode ? 'text-[#43617c]' : 'text-slate-500',
            )}
          >
            Partidas del canvas
          </p>
          <div className="space-y-3">{branches.map((b) => renderBranch(b, [], 0))}</div>
        </div>
      )}

      {mostrarArbol && sinJerarquia.length > 0 && (
        <div>
          <p
            className={cn(
              'mb-2 text-[10px] font-bold uppercase tracking-widest',
              stitchMode ? 'text-[#43617c]' : 'text-slate-500',
            )}
          >
            Sin enlace al canvas ({sinJerarquia.length})
          </p>
          <div className="space-y-3">
            {sinJerarquia.map((presupuesto) => {
              const editData = editing.get(presupuesto.tarea_id) || {
                dias_reales: null,
                monto: null,
                observacion: '',
              };
              return (
                <TareaItem
                  key={presupuesto.id}
                  presupuesto={presupuesto}
                  editing={editData}
                  stitchMode={stitchMode}
                  layout="compact"
                  onFieldChange={(field, value) =>
                    onFieldChange(presupuesto.tarea_id, field, value as number | null | string)
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {!mostrarArbol && (
        <div className="space-y-3">
          {(Object.entries(gruposPorEtapa) as [keyof typeof gruposPorEtapa, PresupuestoListaItem[]][]).map(
            ([etapa, items]) => renderGrupoPlano(etapa, items),
          )}
        </div>
      )}
    </div>
  );
}
