'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Boxes,
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Layers,
  LayoutGrid,
  Plus,
} from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import type { Connection } from '@xyflow/react';

import { Button } from '@/components/ui/grows';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  budgetGroupSummaryLabel,
  getBudgetGroupStateForNode,
} from '@/lib/canvas/budgetGroupTree';
import type {
  CanvasBudgetGroup,
  CanvasNode,
  CanvasPrecedenceEdge,
} from '@/lib/types/canvasMultinivel';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import { countChildren } from '@/lib/canvas/canvasMultinivelStorage';
import {
  canAddPrecedenceEdge,
  canEnterNode,
  checklistProgress,
  childTypeForContainer,
  labelEstadoNivel,
  labelEstadoTarea,
  labelEstadoTareaFromDb,
  labelTipoNodo,
} from './canvasMultinivelHelpers';
import { aristaCriticaVisual, type CanvasTaskCpmBundle } from './canvasMultinivelCpm';

const conn = (source: string, target: string): Connection =>
  ({
    source,
    target,
    sourceHandle: 'src',
    targetHandle: 'tgt',
  }) as Connection;

function tareaCriticaVisual(
  bundle: CanvasTaskCpmBundle | null,
  siblingEdges: CanvasPrecedenceEdge[],
  n: CanvasNode | null,
): boolean {
  if (!n?.id || n.type !== 'tarea') return false;
  if (n.esCritica) return true;
  if (bundle?.byId.get(n.id)?.isCritical) return true;
  return siblingEdges.some(
    (e) => aristaCriticaVisual(e, bundle) && (e.sourceId === n.id || e.targetId === n.id),
  );
}

function diasLabel(d: number | undefined): string {
  const n = Math.max(0, Math.round(d ?? 0));
  if (n === 1) return '1 día';
  return `${n} días`;
}

type Props = {
  obraId: string;
  projectKind: CanvasProjectKind;
  taskCpmBundle: CanvasTaskCpmBundle | null;
  selectedEdge: CanvasPrecedenceEdge | null;
  selectedNode: CanvasNode | null;
  nodes: CanvasNode[];
  edges: CanvasPrecedenceEdge[];
  siblingEdges: CanvasPrecedenceEdge[];
  containerId: string | null;
  patchEdge: (id: string, patch: Partial<Omit<CanvasPrecedenceEdge, 'id'>>) => void;
  removeEdgeIds: (ids: string[]) => void;
  setSelectedEdgeId: (id: string | null) => void;
  patchNode: (id: string, patch: Partial<CanvasNode>) => void;
  enterNode: (id: string) => void;
  createChildOf: (parentId: string) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  addChecklistItem: (taskId: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  updateChecklistLabel: (taskId: string, itemId: string, label: string) => void;
  removeChecklistItem: (taskId: string, itemId: string) => void;
  tryPrecedenceConnection: (c: Connection) => boolean;
  budgetGroups: CanvasBudgetGroup[];
  createBudgetGroup: (name: string) => string;
  applyBudgetGroupToNode: (
    selectedNodeId: string,
    budgetGroupId: string,
  ) => Promise<{
    affected: number;
    saveResult: { ok?: boolean; message?: string; canvasSaved?: boolean };
  }>;
  tareaPublicacionByNodeId: Record<
    string,
    { tareaId: string; estado: string; publishedAt: string | null }
  >;
  /** Abre el asistente de publicación (mismo flujo que la cinta). */
  onOpenPublishModal?: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
};

const inputClass =
  'mt-0.5 w-full rounded-md border border-slate-300/80 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20';

const inputCompactClass =
  'rounded-md border border-slate-300/80 bg-white px-2 py-1 text-xs font-medium text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20';

const sectionClass =
  'rounded-md border border-slate-200 bg-white p-3 shadow-sm';

function estadoTareaBadgeClass(est: CanvasNode['estadoTarea'] | undefined): string {
  switch (est) {
    case 'en_progreso':
      return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80';
    case 'para_validar':
      return 'bg-amber-50 text-amber-950 ring-1 ring-amber-200/80';
    case 'validada':
      return 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80';
    case 'rechazada':
      return 'bg-rose-50 text-rose-900 ring-1 ring-rose-200/80';
    case 'pendiente':
    default:
      return 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/90';
  }
}

function iconForType(type: CanvasNode['type']) {
  switch (type) {
    case 'etapa':
      return Layers;
    case 'planta':
      return Building2;
    case 'sector':
      return LayoutGrid;
    case 'ambiente':
      return DoorOpen;
    case 'tarea':
      return CheckSquare;
    default:
      return Boxes;
  }
}

export function CanvasLeftInspector({
  obraId,
  projectKind,
  taskCpmBundle,
  selectedEdge,
  selectedNode,
  nodes,
  edges,
  siblingEdges,
  containerId,
  patchEdge,
  removeEdgeIds,
  setSelectedEdgeId,
  patchNode,
  enterNode,
  createChildOf,
  deleteNode,
  duplicateNode,
  addChecklistItem,
  toggleChecklistItem,
  updateChecklistLabel,
  removeChecklistItem,
  tryPrecedenceConnection,
  budgetGroups,
  createBudgetGroup,
  applyBudgetGroupToNode,
  tareaPublicacionByNodeId,
  onOpenPublishModal,
  isOpen,
  onToggleOpen,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const checklistSectionRef = useRef<HTMLDivElement | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [pendingContainerGroupId, setPendingContainerGroupId] = useState('');

  useEffect(() => {
    setNewGroupName('');
    setPendingContainerGroupId('');
  }, [selectedNode?.id, selectedEdge?.id]);

  const siblingTasks = useMemo(
    () => nodes.filter((n) => n.parentId === containerId && n.type === 'tarea'),
    [nodes, containerId],
  );

  const edgeCpmCrit = selectedEdge ? aristaCriticaVisual(selectedEdge, taskCpmBundle) : false;

  const taskCrit = useMemo(
    () =>
      selectedNode?.type === 'tarea'
        ? tareaCriticaVisual(taskCpmBundle, siblingEdges, selectedNode)
        : false,
    [selectedNode, taskCpmBundle, siblingEdges],
  );

  const taskPredIn =
    selectedNode?.type === 'tarea'
      ? siblingEdges.filter((e) => e.targetId === selectedNode.id)
      : [];
  const taskPredOut =
    selectedNode?.type === 'tarea'
      ? siblingEdges.filter((e) => e.sourceId === selectedNode.id)
      : [];

  const candPred =
    selectedNode?.type === 'tarea'
      ? siblingTasks.filter(
          (t) =>
            t.id !== selectedNode.id &&
            canAddPrecedenceEdge(containerId, nodes, edges, t.id, selectedNode.id),
        )
      : [];

  const candSucc =
    selectedNode?.type === 'tarea'
      ? siblingTasks.filter(
          (t) =>
            t.id !== selectedNode.id &&
            canAddPrecedenceEdge(containerId, nodes, edges, selectedNode.id, t.id),
        )
      : [];

  const SelectedIcon = selectedNode ? iconForType(selectedNode.type) : Boxes;

  if (!isOpen) {
    return (
      <aside className="flex w-[64px] shrink-0 flex-col items-center bg-[#f0f4f8]/90 px-2 py-4 shadow-[-12px_0_32px_rgba(23,28,31,0.04)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#001629] text-white shadow-[0_12px_32px_rgba(23,28,31,0.10)]"
          title="Abrir inspector"
          aria-label="Abrir inspector"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="mt-4 h-px w-8 bg-[#dfe3e7]" />
        <p className="mt-4 [writing-mode:vertical-rl] text-[10px] font-black uppercase tracking-[0.22em] text-[#596574]">
          Inspector
        </p>
      </aside>
    );
  }

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-[#cbd5e1] bg-[#f1f5f9]">
      <div className="shrink-0 border-b border-[#cbd5e1] bg-[#334155] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#93c5fd]">Inspector</p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-200">Propiedades · Checklist · Presupuesto</p>
          </div>
          <button
            type="button"
            onClick={onToggleOpen}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/20 text-white/90 transition hover:bg-white/10"
            title="Colapsar inspector"
            aria-label="Colapsar inspector"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 w-full justify-start rounded-md border border-[#e2e8f0] bg-white text-xs text-[#334155] hover:bg-slate-50"
          type="button"
          onClick={() => router.push('/cliente/obras' as Route)}
        >
          ← Volver a obras
        </Button>

        {selectedEdge && (
          <div className={cn(sectionClass, 'space-y-3')}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#24a375]">Precedencias</p>
            <p className="text-sm font-bold text-[#001629]">
              {nodes.find((x) => x.id === selectedEdge.sourceId)?.title ?? '—'}
              <span className="mx-1 font-normal text-[#596574]">→</span>
              {nodes.find((x) => x.id === selectedEdge.targetId)?.title ?? '—'}
            </p>
            <p className="text-[11px] text-[#596574]">
              {edgeCpmCrit
                ? 'En camino crítico (CPM u override).'
                : 'Sin resalte automático de camino crítico en esta flecha.'}
            </p>
            <label className="text-[10px] font-bold uppercase text-[#596574]">Resaltar arista</label>
            <select
              className={inputClass}
              value={selectedEdge.critical ? 'yes' : 'no'}
              onChange={(e) => patchEdge(selectedEdge.id, { critical: e.target.value === 'yes' })}
            >
              <option value="no">Normal</option>
              <option value="yes">Destacada (manual)</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-xl text-red-700 hover:bg-red-50"
              type="button"
              onClick={() => {
                removeEdgeIds([selectedEdge.id]);
                setSelectedEdgeId(null);
              }}
            >
              Quitar conexión
            </Button>
          </div>
        )}

        {!selectedEdge && !selectedNode && (
          <div className={sectionClass}>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#d7e4f5] text-[#001629]">
              <Boxes className="h-5 w-5" strokeWidth={1.6} />
            </div>
            <p className="text-base font-black text-[#001629]">Sin selección</p>
            <p className="mt-2 text-sm leading-relaxed text-[#596574]">
              Hacé clic en un nodo o en una flecha de precedencia para editar propiedades, checklist,
              presupuesto y acciones. Usá el árbol izquierdo o el camino superior para cambiar de nivel.
            </p>
          </div>
        )}

        {!selectedEdge && selectedNode && selectedNode.type !== 'tarea' && (
          <div className="space-y-4">
            <div className={sectionClass}>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#001629] text-[#cfe5ff]">
                  <SelectedIcon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a94a5]">
                  {labelTipoNodo(selectedNode.type, projectKind)}
                </span>
              </div>
              <label className="mt-3 block text-[10px] font-bold uppercase text-[#596574]">Nombre</label>
              <input
                className={inputClass}
                value={selectedNode.title}
                onChange={(e) => patchNode(selectedNode.id, { title: e.target.value })}
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#596574]">
                <span>{countChildren(nodes, selectedNode.id)} hijos</span>
                <span className="text-[#c5c9d8]">·</span>
                <span>{labelEstadoNivel(selectedNode.estadoNivel)}</span>
              </div>
              <label className="mt-3 block text-[10px] font-bold uppercase text-[#596574]">Estado</label>
              <select
                className={inputClass}
                value={selectedNode.estadoNivel ?? 'pendiente'}
                onChange={(e) =>
                  patchNode(selectedNode.id, {
                    estadoNivel: e.target.value as CanvasNode['estadoNivel'],
                  })
                }
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_curso">En curso</option>
                <option value="completado">Completado</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>

            <div className={sectionClass}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001629]">Grupo de presupuesto</p>
              <p className="mt-2 text-[11px] leading-snug text-[#7b8494]">
                El grupo se asigna a las <strong>tareas</strong> hijas del subárbol (fase → piso → … → tarea), no al
                nodo visual contenedor.
              </p>
              {(() => {
                const agg = getBudgetGroupStateForNode(selectedNode.id, nodes);
                const summary = budgetGroupSummaryLabel(agg, budgetGroups);
                return (
                  <>
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-semibold text-[#001629]">
                        Consolidado descendientes:{' '}
                        <span className="font-bold text-[#24a375]">{summary}</span>
                      </p>
                      <p className="text-xs text-[#64748b]">
                        {agg.taskCount}{' '}
                        {agg.taskCount === 1 ? 'tarea descendiente' : 'tareas descendientes'}
                      </p>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-[#eef2f6] pt-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8494]">
                          Crear grupo rápido
                        </label>
                        <input
                          className={inputClass}
                          placeholder="Nombre del nuevo grupo"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="mt-2 w-full rounded-xl"
                          onClick={() => {
                            const id = createBudgetGroup(newGroupName);
                            setPendingContainerGroupId(id);
                            setNewGroupName('');
                          }}
                        >
                          Crear y seleccionar
                        </Button>
                      </div>

                      {budgetGroups.length > 0 && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8494]">
                            Grupo a aplicar
                          </label>
                          <select
                            className={inputClass}
                            value={pendingContainerGroupId}
                            onChange={(e) => setPendingContainerGroupId(e.target.value)}
                          >
                            <option value="">Elegir grupo…</option>
                            {budgetGroups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="w-full rounded-xl"
                        disabled={agg.taskCount === 0 || !pendingContainerGroupId}
                        onClick={async () => {
                          if (!pendingContainerGroupId) return;
                          const g = budgetGroups.find((x) => x.id === pendingContainerGroupId);
                          const name = g?.name ?? 'grupo';
                          if (
                            !window.confirm(
                              `Este nodo contiene ${agg.taskCount} tareas. Se asignarán todas al grupo «${name}». ¿Confirmar?`,
                            )
                          ) {
                            return;
                          }
                          const res = await applyBudgetGroupToNode(
                            selectedNode.id,
                            pendingContainerGroupId,
                          );
                          if (res.saveResult.ok !== true) {
                            if (res.saveResult.canvasSaved === true) {
                              toast({
                                title: `Grupo asignado a ${res.affected} ${
                                  res.affected === 1 ? 'tarea' : 'tareas'
                                } (en pantalla y canvas en nube)`,
                                description:
                                  typeof res.saveResult.message === 'string'
                                    ? res.saveResult.message
                                    : undefined,
                              });
                            } else {
                              toast({
                                variant: 'destructive',
                                title: 'No se pudo guardar en la nube',
                                description:
                                  typeof res.saveResult.message === 'string'
                                    ? res.saveResult.message
                                    : 'Probá de nuevo con «Guardar en la nube» en la barra superior.',
                              });
                            }
                            return;
                          }
                          toast({
                            title: `Grupo asignado a ${res.affected} ${
                              res.affected === 1 ? 'tarea' : 'tareas'
                            }.`,
                          });
                        }}
                      >
                        {agg.taskCount > 0
                          ? `Aplicar a tareas descendientes (${agg.taskCount})`
                          : 'Aplicar a tareas descendientes'}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>

            {selectedNode.type === 'etapa' && (
              <p className="text-xs text-[#6b728e]">
                Para orden entre etapas usá <strong>Conectar orden de fases</strong> en la barra superior.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {canEnterNode(selectedNode) && (
                <Button type="button" variant="primary" size="sm" className="w-full rounded-xl" onClick={() => enterNode(selectedNode.id)}>
                  Entrar
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full rounded-xl"
                disabled={childTypeForContainer(selectedNode, projectKind) === null}
                onClick={() => createChildOf(selectedNode.id)}
              >
                Crear hijo
              </Button>
              <Button type="button" variant="secondary" size="sm" className="w-full rounded-xl" onClick={() => duplicateNode(selectedNode.id)}>
                Duplicar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full rounded-xl text-red-700 hover:bg-red-50"
                onClick={() => deleteNode(selectedNode.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}

        {!selectedEdge && selectedNode && selectedNode.type === 'tarea' && (
          <div className="space-y-3">
            {/* General */}
            <div className={sectionClass}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#24a375]">General</p>
              <label className="mt-2 block text-[10px] font-bold uppercase text-[#596574]">Nombre</label>
              <input
                className={cn(inputClass, 'font-semibold')}
                value={selectedNode.title}
                onChange={(e) => patchNode(selectedNode.id, { title: e.target.value })}
                aria-label="Nombre de la tarea"
              />

              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8494]">Estado</p>
                  <span
                    className={cn(
                      'mt-1.5 inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                      estadoTareaBadgeClass(selectedNode.estadoTarea),
                    )}
                  >
                    {labelEstadoTarea(selectedNode.estadoTarea)}
                  </span>
                </div>

                <p
                  className="text-[11px] text-[#64748b]"
                  title="Próximamente"
                >
                  <span className="font-semibold text-[#475569]">Responsable:</span>{' '}
                  <span className="text-[#94a3b8]">—</span>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      taskCrit
                        ? 'bg-[#fff4e6] text-[#9a3412] ring-1 ring-[#fed7aa]/90'
                        : 'bg-[#f1f5f9] text-[#475569] ring-1 ring-slate-200/80',
                    )}
                  >
                    C. crítico: {taskCrit ? 'Sí' : 'No'}
                  </span>
                </div>

                <div className="flex flex-wrap items-end gap-3 border-t border-[#eef2f6] pt-3">
                  <label className="min-w-0 sm:min-w-[7rem]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8494]">
                      Duración (días)
                    </span>
                    <input
                      type="number"
                      min={0}
                      className={cn(inputCompactClass, 'mt-1.5 block w-full max-w-[6.5rem]')}
                      value={selectedNode.duracionDias ?? 0}
                      onChange={(e) =>
                        patchNode(selectedNode.id, {
                          duracionDias: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                    />
                  </label>
                  <p className="pb-1 text-xs text-[#596574]">{diasLabel(selectedNode.duracionDias)}</p>
                </div>
              </div>
            </div>

            {/* Publicación */}
            <div className={sectionClass}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001629]">Publicación</p>
              {(() => {
                const pub = tareaPublicacionByNodeId[selectedNode.id];
                if (!pub) {
                  return (
                    <p className="mt-2 text-[11px] leading-snug text-[#64748b]">
                      Todavía no fue creada como tarea operativa.
                    </p>
                  );
                }
                return (
                  <div className="mt-2 space-y-2">
                    <p className="text-[11px] font-bold text-[#0f172a]">
                      {pub.publishedAt ? 'Publicada' : 'Sin publicar'}
                    </p>
                    <p className="text-[11px] text-[#64748b]">
                      Estado operativo:{' '}
                      <span className="font-bold text-[#001629]">{labelEstadoTareaFromDb(pub.estado)}</span>
                    </p>
                    {pub.publishedAt ? (
                      <p className="text-[11px] text-[#64748b]">
                        Fecha:{' '}
                        <span className="font-medium text-[#374151]">
                          {new Date(pub.publishedAt).toLocaleString('es-AR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full rounded-xl"
                      disabled={!onOpenPublishModal || Boolean(pub.publishedAt)}
                      title={
                        !onOpenPublishModal
                          ? 'No disponible'
                          : pub.publishedAt
                            ? 'Ya está publicada'
                            : 'Abrir asistente para publicar tareas'
                      }
                      onClick={() => onOpenPublishModal?.()}
                    >
                      Publicar tareas…
                    </Button>
                  </div>
                );
              })()}
            </div>

            {/* Checklist */}
            <div ref={checklistSectionRef} className={sectionClass}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001629]">Checklist</p>
                  {(() => {
                    const { done, total } = checklistProgress(selectedNode);
                    return total > 0 ? (
                      <p className="mt-1 text-[11px] font-medium text-[#64748b]">
                        {total} ítem{total === 1 ? '' : 's'} · {done} listo{done === 1 ? '' : 's'}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[#94a3b8]">Sin ítems.</p>
                    );
                  })()}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 rounded-lg text-[11px]"
                  onClick={() => checklistSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Editar checklist
                </Button>
              </div>
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg text-[11px]"
                  onClick={() => addChecklistItem(selectedNode.id)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Agregar ítem
                </Button>
              </div>
              <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto pr-0.5">
                {(selectedNode.checklist ?? []).length === 0
                  ? null
                  : (selectedNode.checklist ?? []).map((it) => (
                      <div
                        key={it.id}
                        className="flex items-start gap-2 rounded-lg border border-[#e8edf3] bg-[#fcfcfd] px-2.5 py-1.5"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0 accent-[#24a375]"
                          checked={it.done}
                          onChange={() => toggleChecklistItem(selectedNode.id, it.id)}
                        />
                        <input
                          className="min-w-0 flex-1 border-none bg-transparent py-0.5 text-sm outline-none placeholder:text-[#94a3b8]"
                          value={it.label}
                          onChange={(e) => updateChecklistLabel(selectedNode.id, it.id, e.target.value)}
                        />
                        <button
                          type="button"
                          className="shrink-0 text-[11px] font-medium text-[#64748b] underline-offset-2 hover:text-[#0f172a] hover:underline"
                          onClick={() => removeChecklistItem(selectedNode.id, it.id)}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
              </div>
            </div>

            {/* Presupuesto */}
            <div className={sectionClass}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001629]">Presupuesto</p>
              <p className="mt-2 text-[11px] leading-snug text-[#7b8494]">
                Gestioná y enviá este grupo desde la pestaña Presupuestos. Al elegir un grupo abajo se aplica{' '}
                <strong>sólo a esta tarea</strong> (y sus tareas hijas si las hubiera).
              </p>
              {(() => {
                const aggT = getBudgetGroupStateForNode(selectedNode.id, nodes);
                const summaryT = budgetGroupSummaryLabel(aggT, budgetGroups);
                const gid = selectedNode.budgetGroupId;
                const grp = gid ? budgetGroups.find((g) => g.id === gid) : null;
                const nInGroup = gid
                  ? nodes.filter((n) => n.type === 'tarea' && n.budgetGroupId === gid).length
                  : 0;

                const resumenSubarbol = (
                  <div className="mt-3 rounded-lg border border-[#e8edf3] bg-[#fafbfd] px-3 py-2 text-xs text-[#475569]">
                    <span className="font-semibold text-[#001629]">Subárbol: </span>
                    {aggT.taskCount}{' '}
                    {aggT.taskCount === 1 ? 'tarea descendiente' : 'tareas descendientes'} ·{' '}
                    <span className="font-medium text-[#24a375]">{summaryT}</span>
                  </div>
                );

                if (!grp) {
                  return (
                    <div className="mt-4">
                      {resumenSubarbol}
                      <p className="mt-3 text-sm text-[#596574]">
                        Esta tarea todavía no está en ningún grupo de presupuesto.
                      </p>
                      <div className="mt-4 space-y-3">
                        <input
                          className={inputClass}
                          placeholder="Nombre del nuevo grupo"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full rounded-xl"
                          onClick={() => {
                            const id = createBudgetGroup(newGroupName);
                            patchNode(selectedNode.id, { budgetGroupId: id });
                            setNewGroupName('');
                          }}
                        >
                          Crear grupo
                        </Button>
                        {budgetGroups.length > 0 && (
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8494]">
                              Asignar tarea a grupo
                            </label>
                            <select
                              className={inputClass}
                              defaultValue=""
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v) {
                                  patchNode(selectedNode.id, { budgetGroupId: v });
                                  e.target.value = '';
                                }
                              }}
                            >
                              <option value="">Elegir grupo…</option>
                              {budgetGroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="mt-4 rounded-xl border border-[#e4e9ef] bg-[#f8fafc] p-3.5">
                    <p className="text-sm font-semibold text-[#001629]">{grp.name}</p>
                    <div className="mt-2 rounded-lg border border-[#e8edf3] bg-white px-3 py-2 text-xs text-[#475569]">
                      <span className="font-semibold text-[#001629]">Subárbol: </span>
                      {aggT.taskCount}{' '}
                      {aggT.taskCount === 1 ? 'tarea descendiente' : 'tareas descendientes'} ·{' '}
                      <span className="font-medium text-[#24a375]">{summaryT}</span>
                    </div>
                    <p className="mt-2 text-xs text-[#64748b]">
                      {nInGroup} {nInGroup === 1 ? 'tarea' : 'tareas'} en este grupo en toda la obra
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      {budgetGroups.length > 1 && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8494]">
                            Cambiar grupo
                          </label>
                          <select
                            className={inputClass}
                            value={gid}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v) patchNode(selectedNode.id, { budgetGroupId: v });
                            }}
                          >
                            {budgetGroups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full rounded-xl text-[#475569] hover:bg-white"
                        onClick={() => patchNode(selectedNode.id, { budgetGroupId: undefined })}
                      >
                        Quitar del grupo
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Precedencias */}
            <div className={sectionClass}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001629]">Precedencias</p>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-[#374151]">Entradas (viene después de)</p>
                  {taskPredIn.length === 0 ? (
                    <p className="mt-2 text-xs text-[#94a3b8]">Ninguna</p>
                  ) : (
                    <ul className="mt-2.5 flex flex-col gap-2">
                      {taskPredIn.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#e8edf3] bg-[#fafbfd] px-3 py-2"
                        >
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-medium text-[#001629]">
                              {nodes.find((x) => x.id === e.sourceId)?.title ?? '—'}
                            </span>
                            {aristaCriticaVisual(e, taskCpmBundle) && (
                              <span className="shrink-0 rounded-md bg-[#fff7ed] px-1.5 py-0.5 text-[10px] font-semibold text-[#c2410c] ring-1 ring-[#ffedd5]">
                                Crítico
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="shrink-0 text-xs font-medium text-[#64748b] underline-offset-2 transition hover:text-[#0f172a] hover:underline"
                            onClick={() => removeEdgeIds([e.id])}
                          >
                            Quitar conexión
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#374151]">Salidas (antes de)</p>
                  {taskPredOut.length === 0 ? (
                    <p className="mt-2 text-xs text-[#94a3b8]">Ninguna</p>
                  ) : (
                    <ul className="mt-2.5 flex flex-col gap-2">
                      {taskPredOut.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#e8edf3] bg-[#fafbfd] px-3 py-2"
                        >
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-medium text-[#001629]">
                              {nodes.find((x) => x.id === e.targetId)?.title ?? '—'}
                            </span>
                            {aristaCriticaVisual(e, taskCpmBundle) && (
                              <span className="shrink-0 rounded-md bg-[#fff7ed] px-1.5 py-0.5 text-[10px] font-semibold text-[#c2410c] ring-1 ring-[#ffedd5]">
                                Crítico
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="shrink-0 text-xs font-medium text-[#64748b] underline-offset-2 transition hover:text-[#0f172a] hover:underline"
                            onClick={() => removeEdgeIds([e.id])}
                          >
                            Quitar conexión
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-3 border-t border-[#eef2f6] pt-4">
                  {candPred.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8494]">
                        + Agregar predecesora
                      </label>
                      <select
                        className={inputClass}
                        defaultValue=""
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v && selectedNode) {
                            tryPrecedenceConnection(conn(v, selectedNode.id));
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Elegir tarea…</option>
                        {candPred.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {candSucc.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8494]">
                        + Agregar sucesora
                      </label>
                      <select
                        className={inputClass}
                        defaultValue=""
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v && selectedNode) {
                            tryPrecedenceConnection(conn(selectedNode.id, v));
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Elegir tarea…</option>
                        {candSucc.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {candPred.length === 0 && candSucc.length === 0 && (
                    <p className="text-[11px] text-[#94a3b8]">
                      No hay más tareas hermanas disponibles para conectar sin crear un ciclo.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className={sectionClass}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001629]">Acciones</p>
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-xl"
                  disabled={!tareaPublicacionByNodeId[selectedNode.id]}
                  title={
                    tareaPublicacionByNodeId[selectedNode.id]
                      ? 'Abrir detalle en línea de tiempo'
                      : 'Disponible cuando exista tarea operativa'
                  }
                  onClick={() => router.push(`/cliente/obras/${obraId}/timeline` as Route)}
                >
                  Abrir detalle / línea de tiempo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-xl"
                  onClick={() => duplicateNode(selectedNode.id)}
                >
                  Duplicar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-xl text-[#b91c1c] hover:bg-red-50"
                  onClick={() => deleteNode(selectedNode.id)}
                >
                  Eliminar
                </Button>
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-[#334155]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#24a375]"
                  checked={Boolean(selectedNode.esCritica)}
                  onChange={(e) => patchNode(selectedNode.id, { esCritica: e.target.checked })}
                />
                <span>Forzar en camino crítico (manual)</span>
              </label>
              <div className="mt-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8494]">Notas</label>
                <textarea
                  className={cn(inputClass, 'mt-1.5 min-h-[52px] resize-y')}
                  value={selectedNode.notas ?? ''}
                  onChange={(e) => patchNode(selectedNode.id, { notas: e.target.value || undefined })}
                />
              </div>
            </div>

            {(selectedNode.importSourceUid != null || selectedNode.importOutlineNumber) && (
              <details className="rounded-2xl border border-dashed border-[#d1d9e2] bg-[#fafbfc]">
                <summary className="cursor-pointer select-none px-4 py-3 text-xs font-bold text-[#8a94a5]">
                  Datos de importación
                </summary>
                <ul className="space-y-1 px-4 pb-4 font-mono text-[11px] text-[#596574]">
                  {selectedNode.importSourceUid != null && <li>UID origen: {selectedNode.importSourceUid}</li>}
                  {selectedNode.importOutlineNumber && <li>Outline: {selectedNode.importOutlineNumber}</li>}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
