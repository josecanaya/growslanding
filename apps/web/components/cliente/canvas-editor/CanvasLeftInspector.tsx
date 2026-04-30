'use client';

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

import { Button } from '@/components/ui/grows';
import { cn } from '@/lib/utils';
import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import { countChildren } from '@/lib/canvas/canvasMultinivelStorage';
import {
  canEnterNode,
  childTypeForContainer,
  labelEstadoNivel,
  labelTipoNodo,
} from './canvasMultinivelHelpers';
import { aristaCriticaVisual, type CanvasTaskCpmBundle } from './canvasMultinivelCpm';

function ioPred(nodeId: string, edges: CanvasPrecedenceEdge[]) {
  let inC = 0;
  let outC = 0;
  for (const e of edges) {
    if (e.targetId === nodeId) inC++;
    if (e.sourceId === nodeId) outC++;
  }
  return { inC, outC };
}

function tareaCriticaBanner(
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

type Props = {
  obraId: string;
  taskCpmBundle: CanvasTaskCpmBundle | null;
  selectedEdge: CanvasPrecedenceEdge | null;
  selectedNode: CanvasNode | null;
  nodes: CanvasNode[];
  siblingEdges: CanvasPrecedenceEdge[];
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
  isOpen: boolean;
  onToggleOpen: () => void;
};

const inputClass =
  'mt-1 w-full rounded-2xl border border-[#c3c7ce]/25 bg-[#f0f4f8] px-3.5 py-3 text-sm font-medium text-[#001629] outline-none transition focus:border-[#24a375] focus:bg-white focus:ring-2 focus:ring-[#24a375]/15';

const sectionCardClass =
  'rounded-[22px] bg-white/86 p-4 shadow-[0_12px_32px_rgba(23,28,31,0.06)] ring-1 ring-[#c3c7ce]/20 backdrop-blur-sm';

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

function progressValue(n: CanvasNode | null): number {
  return Math.min(100, Math.max(0, Math.round(n?.avancePct ?? 0)));
}

function statusPillClass(n: CanvasNode | null) {
  if (n?.type === 'tarea') return 'bg-[#d7e4f5] text-[#0f3d66]';
  switch (n?.estadoNivel ?? 'pendiente') {
    case 'completado':
      return 'bg-[#dff8ec] text-[#075c3d]';
    case 'en_curso':
      return 'bg-[#d7e4f5] text-[#0f3d66]';
    case 'bloqueado':
      return 'bg-[#ffdad6] text-[#93000a]';
    default:
      return 'bg-[#e8edf3] text-[#596574]';
  }
}

function metricLabelFor(type: CanvasNode['type']) {
  switch (type) {
    case 'etapa':
      return 'plantas';
    case 'planta':
      return 'sectores';
    case 'sector':
      return 'ambientes';
    case 'ambiente':
      return 'tareas';
    default:
      return 'hijos';
  }
}

export function CanvasLeftInspector({
  obraId,
  taskCpmBundle,
  selectedEdge,
  selectedNode,
  nodes,
  siblingEdges,
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
  isOpen,
  onToggleOpen,
}: Props) {
  const router = useRouter();

  const taskPredIn =
    selectedNode?.type === 'tarea'
      ? siblingEdges.filter((e) => e.targetId === selectedNode.id)
      : [];
  const taskPredOut =
    selectedNode?.type === 'tarea'
      ? siblingEdges.filter((e) => e.sourceId === selectedNode.id)
      : [];

  const critVisual =
    selectedNode?.type === 'tarea'
      ? tareaCriticaBanner(taskCpmBundle, siblingEdges, selectedNode)
      : false;

  const edgeCpmCrit = selectedEdge ? aristaCriticaVisual(selectedEdge, taskCpmBundle) : false;

  const selectedCpmRow =
    selectedNode?.type === 'tarea' ? taskCpmBundle?.byId.get(selectedNode.id) ?? null : null;
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
    <aside className="flex w-[390px] shrink-0 flex-col bg-[#f0f4f8]/96 shadow-[-20px_0_40px_rgba(23,28,31,0.06)] backdrop-blur-xl">
      <div className="px-5 pb-4 pt-5">
        <div className="rounded-[26px] bg-[#001629] p-5 text-white shadow-[0_12px_32px_rgba(23,28,31,0.10)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#85f8c4]">
                Inspector
              </p>
              <p className="mt-2 text-sm leading-5 text-white/70">
                Editá estructura, estado y carga operativa del elemento seleccionado.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleOpen}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/16 hover:text-white"
              title="Colapsar inspector"
              aria-label="Colapsar inspector"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 w-full justify-start rounded-2xl bg-white/70 text-[#406182] hover:bg-white"
          type="button"
          onClick={() => router.push(`/cliente/tareas/${obraId}` as Route)}
        >
          ← Volver al listado de tareas de la obra
        </Button>

        {selectedEdge && (
          <div className={cn(sectionCardClass, 'space-y-4')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7e4f5] text-[#001629]">
              <LayoutGrid className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#24a375]">
              Precedencia
            </p>
            <p className="text-sm text-[#596574]">A debe terminar antes que B.</p>
            <p className="rounded-2xl bg-[#f0f4f8] px-3 py-3 text-sm font-black text-[#001629]">
              {nodes.find((x) => x.id === selectedEdge.sourceId)?.title ?? '—'} →{' '}
              {nodes.find((x) => x.id === selectedEdge.targetId)?.title ?? '—'}
            </p>
            <div>
              <label className="text-[10px] font-bold uppercase text-[#596574]">
                Resaltar arista (override)
              </label>
              <p className="mt-0.5 text-[11px] text-[#8590a8]">
                Además del rojo automático por CPM (holgura 0). Podés marcar o quitar a mano.
              </p>
              <select
                className={inputClass}
                value={selectedEdge.critical ? 'yes' : 'no'}
                onChange={(e) =>
                  patchEdge(selectedEdge.id, { critical: e.target.value === 'yes' })
                }
              >
                <option value="no">Normal</option>
                <option value="yes">Forzar destacada</option>
              </select>
            </div>
            <p className="text-[11px] text-[#596574]">
              <span className="font-bold text-[#0f1e1f]">CPM visual · </span>
              {edgeCpmCrit
                ? 'Esta arista aparece destacada porque al menos uno de los extremos está en camino crítico calculado (o marcada manualmente).'
                : 'Sin resalte automático por CPM para esta flecha (revisá duraciones y dependencias).'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-2xl text-red-700 hover:bg-red-50"
              type="button"
              onClick={() => {
                removeEdgeIds([selectedEdge.id]);
                setSelectedEdgeId(null);
              }}
            >
              Eliminar conexión
            </Button>
          </div>
        )}

        {!selectedEdge && !selectedNode && (
          <div className={sectionCardClass}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7e4f5] text-[#001629]">
              <Boxes className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <p className="text-lg font-black tracking-[-0.03em] text-[#001629]">
              Seleccioná un elemento
            </p>
            <p className="mt-2 text-sm leading-6 text-[#596574]">
              Elegí una etapa, planta, sector o ambiente en el área central para cargar datos y avanzar por niveles.
            </p>
          </div>
        )}

        {!selectedEdge && selectedNode && (
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(23,28,31,0.06)] ring-1 ring-[#c3c7ce]/20">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#cfe5ff]/70 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#001629] text-[#cfe5ff]">
                    <SelectedIcon className="h-7 w-7" strokeWidth={1.6} />
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]', statusPillClass(selectedNode))}>
                    {selectedNode.type === 'tarea'
                      ? selectedNode.estadoTarea ?? 'pendiente'
                      : labelEstadoNivel(selectedNode.estadoNivel)}
                  </span>
                </div>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-[#24a375]">
                  {labelTipoNodo(selectedNode.type)}
                </p>
                <h2 className="mt-1 line-clamp-2 text-3xl font-black tracking-[-0.04em] text-[#001629]">
                  {selectedNode.title}
                </h2>
                {selectedNode.descripcion || selectedNode.notas ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#596574]">
                    {selectedNode.descripcion || selectedNode.notas}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/86 px-3 py-3 shadow-[0_12px_32px_rgba(23,28,31,0.05)]">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a94a5]">
                  {metricLabelFor(selectedNode.type)}
                </p>
                <p className="mt-1 text-lg font-black text-[#001629]">
                  {countChildren(nodes, selectedNode.id)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/86 px-3 py-3 shadow-[0_12px_32px_rgba(23,28,31,0.05)]">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a94a5]">
                  Avance
                </p>
                <p className="mt-1 text-lg font-black text-[#001629]">
                  {selectedNode.type === 'tarea' ? '—' : `${progressValue(selectedNode)}%`}
                </p>
              </div>
              <div className="rounded-2xl bg-white/86 px-3 py-3 shadow-[0_12px_32px_rgba(23,28,31,0.05)]">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a94a5]">
                  Conex.
                </p>
                <p className="mt-1 text-lg font-black text-[#001629]">
                  {ioPred(selectedNode.id, siblingEdges).inC + ioPred(selectedNode.id, siblingEdges).outC}
                </p>
              </div>
            </div>

            <div className={sectionCardClass}>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#8a94a5]">
                Datos editables
              </p>
            <div>
              <label className="text-[10px] font-bold uppercase text-[#596574]">Nombre</label>
              <input
                className={inputClass}
                value={selectedNode.title}
                onChange={(e) => patchNode(selectedNode.id, { title: e.target.value })}
              />
            </div>

            {selectedNode.type !== 'tarea' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#596574]">Descripción</label>
                  <textarea
                    className={`${inputClass} min-h-[72px] resize-y`}
                    placeholder="Resumen para el equipo..."
                    value={selectedNode.descripcion ?? ''}
                    onChange={(e) =>
                      patchNode(selectedNode.id, { descripcion: e.target.value || undefined })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#596574]">Estado</label>
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
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#596574]">
                    Avance declarado (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={inputClass}
                    value={selectedNode.avancePct ?? ''}
                    placeholder="Opcional"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') {
                        patchNode(selectedNode.id, { avancePct: undefined });
                        return;
                      }
                      patchNode(selectedNode.id, {
                        avancePct: Math.min(100, Math.max(0, parseInt(v, 10) || 0)),
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#596574]">Notas / observaciones</label>
                  <textarea
                    className={`${inputClass} min-h-[64px] resize-y`}
                    value={selectedNode.notas ?? ''}
                    onChange={(e) => patchNode(selectedNode.id, { notas: e.target.value || undefined })}
                  />
                </div>
              </div>
            )}

            {(selectedNode.type === 'planta' || selectedNode.type === 'sector' || selectedNode.type === 'ambiente') && (
              <div className="mt-4">
                <label className="text-[10px] font-bold uppercase text-[#596574]">Tipo / etiqueta</label>
                <input
                  className={inputClass}
                  placeholder="Ej. núcleo, frente, contractuales..."
                  value={selectedNode.tipoLabel ?? ''}
                  onChange={(e) =>
                    patchNode(selectedNode.id, { tipoLabel: e.target.value || undefined })
                  }
                />
              </div>
            )}

            {selectedNode.type === 'planta' && (
              <div className="mt-4">
                <label className="text-[10px] font-bold uppercase text-[#596574]">
                  Superficie aprox. (m²)
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={selectedNode.superficieM2 ?? ''}
                  placeholder="Opcional"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') patchNode(selectedNode.id, { superficieM2: undefined });
                    else patchNode(selectedNode.id, { superficieM2: Math.max(0, parseFloat(v) || 0) });
                  }}
                />
              </div>
            )}
            </div>

            <div className="rounded-[22px] bg-[#eaeef2] px-4 py-3 text-[13px] text-[#3d445c]">
              <span className="font-bold text-[#596574]">Tipo sistema · </span>
              {labelTipoNodo(selectedNode.type)}
              <span className="mx-2 text-[#c5c9d8]">|</span>
              <span className="font-bold text-[#596574]">Hijos · </span>
              {countChildren(nodes, selectedNode.id)}
              {selectedNode.type !== 'tarea' && (
                <>
                  <span className="mx-2 text-[#c5c9d8]">|</span>
                  <span className="font-bold text-[#596574]">Estado · </span>
                  {labelEstadoNivel(selectedNode.estadoNivel)}
                </>
              )}
            </div>

            {selectedNode.type === 'etapa' && (
              <p className="text-xs text-[#6b728e]">
                Activá <strong className="text-[#374151]">Conectar orden de fases</strong> encima del timeline y tocá dos
                etapas para registrar precedencia temporal.
              </p>
            )}

            {(selectedNode.type === 'etapa' || selectedNode.type === 'tarea') && (
              <p className="text-xs text-[#596574]">
                Precedencias en este nivel · {ioPred(selectedNode.id, siblingEdges).inC} entrantes,{' '}
                {ioPred(selectedNode.id, siblingEdges).outC} salientes
              </p>
            )}

            {selectedNode.type === 'tarea' && (
              <>
                <div
                  className={cn(
                    'rounded-lg border px-3 py-2 text-[12px]',
                    critVisual
                      ? 'border-[#e8aeb8] bg-[#fff9fa] text-[#7a2730]'
                      : 'border-[#eaeef6] bg-white text-[#596574]',
                  )}
                >
                  <p className="font-bold text-[#0f1e1f]">Camino crítico (CPM)</p>
                  {taskCpmBundle ? (
                    selectedCpmRow ? (
                      <>
                        <p className="mt-1">
                          Estado calculado ·{' '}
                          {selectedCpmRow.isCritical
                            ? 'tarea crítica (holgura total = 0).'
                            : `holgura total ${selectedCpmRow.float} d, libre ${selectedCpmRow.float_free} d.`}
                        </p>
                        <p className="mt-1 text-[11px]">
                          ES {selectedCpmRow.es} · EF {selectedCpmRow.ef} · LS {selectedCpmRow.ls} · LF{' '}
                          {selectedCpmRow.lf}
                        </p>
                        <p className="mt-1 text-[11px] text-[#6b7388]">
                          Duración nodo (input) · {selectedNode.duracionDias ?? 0} d
                        </p>
                      </>
                    ) : (
                      <p className="mt-1">No hay fila CPM para esta tarea.</p>
                    )
                  ) : (
                    <p className="mt-1">
                      CPM no disponible (revisá que no haya ciclo entre precedencias).
                    </p>
                  )}
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#c41e3a]"
                    checked={Boolean(selectedNode.esCritica)}
                    onChange={(e) => patchNode(selectedNode.id, { esCritica: e.target.checked })}
                  />
                  Forzar destacar como crítica (además del cálculo)
                </label>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#596574]">Estado operativo</label>
                  <select
                    className={inputClass}
                    value={selectedNode.estadoTarea ?? 'pendiente'}
                    onChange={(e) =>
                      patchNode(selectedNode.id, {
                        estadoTarea: e.target.value as CanvasNode['estadoTarea'],
                      })
                    }
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="para_validar">Próximo / para validar</option>
                    <option value="validada">Completado (validada)</option>
                    <option value="rechazada">Bloqueado (rechazada)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#596574]">Duración (días)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={selectedNode.duracionDias ?? 0}
                    onChange={(e) =>
                      patchNode(selectedNode.id, {
                        duracionDias: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#596574]">Socio (texto)</label>
                  <input
                    className={inputClass}
                    placeholder="Sin asignar"
                    value={selectedNode.socioLabel ?? ''}
                    onChange={(e) =>
                      patchNode(selectedNode.id, { socioLabel: e.target.value || undefined })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#596574]">Observaciones</label>
                  <textarea
                    className={`${inputClass} min-h-[56px]`}
                    value={selectedNode.notas ?? ''}
                    onChange={(e) => patchNode(selectedNode.id, { notas: e.target.value || undefined })}
                  />
                </div>
                {(taskPredIn.length > 0 || taskPredOut.length > 0) && (
                  <div className="rounded-lg border border-[#e8ecf4] bg-white px-3 py-2 text-[12px]">
                    <p className="text-[10px] font-bold uppercase text-[#596574]">Precedencias</p>
                    {taskPredIn.length > 0 && (
                      <p className="mt-1">
                        <span className="text-[#596574]">Desde · </span>
                        {taskPredIn
                          .map((e) => nodes.find((x) => x.id === e.sourceId)?.title ?? '—')
                          .join(' · ')}
                      </p>
                    )}
                    {taskPredOut.length > 0 && (
                      <p className="mt-1">
                        <span className="text-[#596574]">Hacia · </span>
                        {taskPredOut
                          .map((e) => nodes.find((x) => x.id === e.targetId)?.title ?? '—')
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#596574]">Checklist</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => addChecklistItem(selectedNode.id)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Ítem
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(selectedNode.checklist ?? []).length === 0 ? (
                      <p className="text-xs text-[#8b92a3]">Sin ítems todavía.</p>
                    ) : (
                      (selectedNode.checklist ?? []).map((it) => (
                        <div
                          key={it.id}
                          className="flex items-start gap-2 rounded-lg border border-[#eaeef4] bg-white px-2 py-2"
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-[#1f9d6c]"
                            checked={it.done}
                            onChange={() => toggleChecklistItem(selectedNode.id, it.id)}
                          />
                          <input
                            className="min-w-0 flex-1 border-b border-transparent text-sm outline-none focus:border-[#0042c8]"
                            value={it.label}
                            onChange={(e) =>
                              updateChecklistLabel(selectedNode.id, it.id, e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="text-[11px] text-red-700 hover:underline"
                            onClick={() => removeChecklistItem(selectedNode.id, it.id)}
                          >
                            Quitar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            <div className={cn(sectionCardClass, 'space-y-2')}>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#8a94a5]">
                Acciones
              </p>
              {canEnterNode(selectedNode) && (
                <Button type="button" variant="primary" size="sm" className="w-full rounded-2xl" onClick={() => enterNode(selectedNode.id)}>
                  Entrar
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full rounded-2xl"
                disabled={childTypeForContainer(selectedNode) === null}
                onClick={() => createChildOf(selectedNode.id)}
              >
                Crear hijo
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full rounded-2xl"
                onClick={() => duplicateNode(selectedNode.id)}
              >
                Duplicar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full rounded-2xl text-red-700 hover:bg-red-50"
                onClick={() => deleteNode(selectedNode.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
