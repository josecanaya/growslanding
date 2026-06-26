'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TareaItem } from './TareaItem';
import { buildBudgetGroupHierarchyBranches, type BudgetHierarchyBranch } from '@/lib/canvas/budgetGroupHierarchy';
import { dbCanvasRowsToCanvasNodes, type DbCanvasNodeRow } from '@/lib/canvas/dbCanvasRowsToNodes';
import { toClientNodeId } from '@/lib/canvas/canvasSupabaseMapper';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import { presupuestoLineaEstado } from '@/lib/socio/presupuestoLineaEstado';

type CanvasBudgetGroupRow = { id: string; name: string; status?: string | null };

export interface PresupuestoListaItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  observacion?: string | null;
  incluye_materiales?: boolean | null;
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
  canvasBudgetGroups: CanvasBudgetGroupRow[];
  onFieldChange: (
    tareaId: string,
    field: 'dias_reales' | 'monto' | 'observacion' | 'incluye_materiales',
    value: number | null | string | boolean,
  ) => void;
  editing: Map<string, { dias_reales: number | null; monto: number | null; observacion: string; incluye_materiales: boolean }>;
  stitchMode?: boolean;
}

const SIN_PAQUETE = '__sin_paquete__';

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
  editing: Map<string, { dias_reales: number | null; monto: number | null; observacion: string; incluye_materiales: boolean }>,
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
  canvasBudgetGroups,
  onFieldChange,
  editing,
  stitchMode = false,
}: ListaTareasProps) {
  const allCanvasNodes = useMemo(() => dbCanvasRowsToCanvasNodes(canvasNodesRaw), [canvasNodesRaw]);

  const nodeByClientId = useMemo(() => new Map(allCanvasNodes.map((n) => [n.id, n])), [allCanvasNodes]);

  const budgetGroupNameById = useMemo(
    () => new Map(canvasBudgetGroups.map((g) => [g.id, g.name])),
    [canvasBudgetGroups],
  );

  const presupuestosPorPaquete = useMemo(() => {
    const m = new Map<string, PresupuestoListaItem[]>();
    for (const p of presupuestos) {
      const raw = p.tarea?.canvas_node_id;
      let groupId = SIN_PAQUETE;
      if (raw) {
        const cid = toClientNodeId(raw);
        const node = nodeByClientId.get(cid);
        if (node?.budgetGroupId) groupId = node.budgetGroupId;
      }
      const arr = m.get(groupId) ?? [];
      arr.push(p);
      m.set(groupId, arr);
    }
    const entries = [...m.entries()].sort((a, b) => {
      if (a[0] === SIN_PAQUETE) return 1;
      if (b[0] === SIN_PAQUETE) return -1;
      const na = budgetGroupNameById.get(a[0]) ?? a[0];
      const nb = budgetGroupNameById.get(b[0]) ?? b[0];
      return na.localeCompare(nb, 'es', { sensitivity: 'base' });
    });
    return entries;
  }, [presupuestos, nodeByClientId, budgetGroupNameById]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isOpen = (key: string) => expanded[key] === true;

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !isOpen(key) }));
  };

  const renderLeaf = (taskNode: CanvasNode, breadcrumb: string[], scope: PresupuestoListaItem[]) => {
    const presupuesto = scope.find(
      (p) => p.tarea?.canvas_node_id && toClientNodeId(p.tarea.canvas_node_id) === taskNode.id,
    );
    if (!presupuesto) return null;
    const editData = editing.get(presupuesto.tarea_id) || {
      dias_reales: null,
      monto: null,
      observacion: '',
      incluye_materiales: false,
    };
    return (
      <TareaItem
        key={presupuesto.id}
        presupuesto={presupuesto}
        editing={editData}
        stitchMode={stitchMode}
        layout="compact"
        breadcrumb={breadcrumb.length > 0 ? breadcrumb : undefined}
        onFieldChange={(field, value) =>
          onFieldChange(presupuesto.tarea_id, field, value as number | null | string | boolean)
        }
      />
    );
  };

  const renderBranch = (
    branch: BudgetHierarchyBranch,
    ancestors: string[],
    depth: number,
    scope: PresupuestoListaItem[],
  ): ReactNode => {
    const key = `${depth}:${branch.segmentId}`;
    const open = isOpen(key);
    const title =
      branch.segmentId === ORPHAN_SEG ? 'Sin ubicación en el canvas' : branch.segmentTitle;
    const total = countTasksInBranch(branch);
    const itemsInBranch = branchPresupuestos(branch, scope);
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
                return renderBranch(sub, nextAncestors, depth + 1, scope);
              })}
              {branch.leafTasks.map((task) => {
                const crumb =
                  branch.segmentId === ORPHAN_SEG ? [] : [...ancestors, branch.segmentTitle];
                return renderLeaf(task, crumb, scope);
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
              return renderBranch(sub, nextAncestors, depth + 1, scope);
            })}
            {branch.leafTasks.map((task) => {
              const crumb =
                branch.segmentId === ORPHAN_SEG ? [] : [...ancestors, branch.segmentTitle];
                return renderLeaf(task, crumb, scope);
            })}
          </div>
        ) : null}
      </div>
    );
  };

  const buildScopeBranches = (scope: PresupuestoListaItem[]) => {
    if (allCanvasNodes.length === 0 || scope.length === 0) {
      return { branches: [] as BudgetHierarchyBranch[], sinJerarquia: scope };
    }
    const taskNodes: CanvasNode[] = [];
    const sinJerarquiaList: PresupuestoListaItem[] = [];
    for (const p of scope) {
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
      return { branches: [] as BudgetHierarchyBranch[], sinJerarquia: scope };
    }
    return {
      branches: buildBudgetGroupHierarchyBranches(allCanvasNodes, taskNodes),
      sinJerarquia: sinJerarquiaList,
    };
  };

  return (
    <div className="space-y-4 px-4 pb-4">
      <p
        className={cn(
          'text-[10px] font-bold uppercase tracking-widest',
          stitchMode ? 'text-[#43617c]' : 'text-slate-500',
        )}
      >
        Paquetes de trabajo
      </p>
      {presupuestosPorPaquete.map(([groupId, items]) => {
        const pkgKey = `pkg:${groupId}`;
        const pkgOpen = isOpen(pkgKey);
        const pkgTitle =
          groupId === SIN_PAQUETE
            ? 'Partidas sin paquete asignado'
            : budgetGroupNameById.get(groupId) ?? 'Paquete de trabajo';
        const cargadasPkg = countCargadas(items, editing);
        const { branches: pkgBranches, sinJerarquia: pkgOrphans } = buildScopeBranches(items);
        const mostrarArbolPkg = pkgBranches.length > 0;

        return (
          <div
            key={groupId}
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
                  {pkgTitle}
                </h3>
                <p className="mt-2 text-xs font-semibold text-[#43617c]">
                  {cargadasPkg}/{items.length} partidas listas · {items.length}{' '}
                  {items.length === 1 ? 'tarea' : 'tareas'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(pkgKey)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-xs font-bold transition active:scale-[0.98]',
                  stitchMode
                    ? 'bg-[#163274] text-white shadow-sm hover:bg-[#314a8d]'
                    : 'bg-slate-900 text-white hover:bg-slate-800',
                )}
              >
                {pkgOpen ? 'Cerrar' : 'Abrir'}
              </button>
            </div>
            {pkgOpen ? (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                {mostrarArbolPkg ? (
                  <>
                    <div className="space-y-3">
                      {pkgBranches.map((b) => renderBranch(b, [], 0, items))}
                    </div>
                    {pkgOrphans.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Sin enlace al canvas ({pkgOrphans.length})
                        </p>
                        {pkgOrphans.map((presupuesto) => {
                          const editData = editing.get(presupuesto.tarea_id) || {
                            dias_reales: null,
                            monto: null,
                            observacion: '',
                            incluye_materiales: false,
                          };
                          return (
                            <TareaItem
                              key={presupuesto.id}
                              presupuesto={presupuesto}
                              editing={editData}
                              stitchMode={stitchMode}
                              layout="compact"
                              onFieldChange={(field, value) =>
                                onFieldChange(
                                  presupuesto.tarea_id,
                                  field,
                                  value as number | null | string | boolean,
                                )
                              }
                            />
                          );
                        })}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="space-y-3">
                    {items.map((presupuesto) => {
                      const editData = editing.get(presupuesto.tarea_id) || {
                        dias_reales: null,
                        monto: null,
                        observacion: '',
                        incluye_materiales: false,
                      };
                      return (
                        <TareaItem
                          key={presupuesto.id}
                          presupuesto={presupuesto}
                          editing={editData}
                          stitchMode={stitchMode}
                          layout="compact"
                          onFieldChange={(field, value) =>
                            onFieldChange(
                              presupuesto.tarea_id,
                              field,
                              value as number | null | string | boolean,
                            )
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
