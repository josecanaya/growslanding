'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ClipboardList, Loader2 } from 'lucide-react';

import { Button, EmptyState } from '@/components/ui/grows';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useOrganizaStore, selectCanvasTasks } from '@/lib/hooks/useOrganizaStore';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { TaskCanvas, type TaskCanvasNode, type TaskCanvasEstado, type TaskCanvasEtapa } from './TaskCanvas';

type Prioridad = 'Alta' | 'Media' | 'Baja';

interface OrganizaTask {
  id: string;
  nombre: string;
  descripcion?: string;
  estado?: string;
  responsable?: string;
  etapa?: string;
  fechaInicio?: string;
  fechaFin?: string;
  prioridad?: Prioridad;
  dependencias?: string[];
  duracion?: number;
}

type PrecedenciaMeta = {
  dependeDe: string | null;
  duracion: number;
};

interface OrganizaSectionProps {
  obraId: string | null;
  tareas: OrganizaTask[];
  isLoading: boolean;
  canvasOrder: string[];
  precedencias: Record<string, PrecedenciaMeta>;
  onCanvasOrderChange: (updater: (prev: string[]) => string[]) => void;
  onPrecedenciasChange: (updater: (prev: Record<string, PrecedenciaMeta>) => Record<string, PrecedenciaMeta>) => void;
}

const DEFAULT_DURACION = 2;
const POSITION_SPACING_X = 240;
const POSITION_SPACING_Y = 130;

type EditorEtapa = TaskCanvasEtapa;

const ETAPA_LABELS: Record<EditorEtapa, string> = {
  estructura: 'Estructura',
  obra_gris: 'Obra Gris',
  terminaciones: 'Terminaciones',
};

const mapEstado = (estado?: string): TaskCanvasEstado => {
  const value = estado?.toLowerCase() ?? '';
  if (value.includes('curso') || value.includes('progreso')) return 'en_progreso';
  if (value.includes('aprob') || value.includes('final')) return 'completada';
  if (value.includes('bloq')) return 'bloqueada';
  return 'pendiente';
};

const normalizeEtapa = (etapa?: string): EditorEtapa => {
  const value = etapa?.toLowerCase() ?? '';
  if (value.includes('termin')) return 'terminaciones';
  if (value.includes('gris')) return 'obra_gris';
  return 'estructura';
};

export function OrganizaSection({
  obraId,
  tareas,
  isLoading,
  canvasOrder,
  precedencias,
  onCanvasOrderChange,
  onPrecedenciasChange,
}: OrganizaSectionProps) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const { toast } = useToast();
  const syncCanvas = useOrganizaStore((state) => state.syncCanvas);
  const updateCanvasTask = useOrganizaStore((state) => state.updateCanvasTask);
  const resetCanvasStore = useOrganizaStore((state) => state.resetCanvas);
  const upsertCanvasTask = useOrganizaStore((state) => state.upsertCanvasTask);
  const canvasSelector = useMemo(() => selectCanvasTasks(obraId), [obraId]);
  const canvasTasks = useOrganizaStore(canvasSelector);

  const [precedenciasState, setPrecedenciasState] = useState<Record<string, PrecedenciaMeta>>(precedencias);
  const isSyncingFromPropsRef = useRef(false);
  type DialogMode = 'edit' | 'create';

  const [openEtapas, setOpenEtapas] = useState<Record<EditorEtapa, boolean>>({
    estructura: true,
    obra_gris: true,
    terminaciones: true,
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [duracionDraft, setDuracionDraft] = useState<number>(DEFAULT_DURACION);
  const [precedenciaDraft, setPrecedenciaDraft] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('edit');

  const tareasPorId = useMemo(() => new Map(tareas.map((task) => [task.id, task])), [tareas]);

  useEffect(() => {
    isSyncingFromPropsRef.current = true;
    setPrecedenciasState(precedencias);
  }, [precedencias]);

  useEffect(() => {
    if (!obraId) return;
    if (isSyncingFromPropsRef.current) {
      isSyncingFromPropsRef.current = false;
      return;
    }
    onPrecedenciasChange(() => precedenciasState);
  }, [obraId, onPrecedenciasChange, precedenciasState]);

  useEffect(() => {
    if (!obraId) return;

    // Al reconstruir el lienzo siempre calculamos precedencias
    const initialPrecedencias = canvasOrder.reduce<Record<string, PrecedenciaMeta>>((acc, taskId, index) => {
      const meta = precedenciasState[taskId];
      const previousId = index > 0 ? canvasOrder[index - 1] : null;
      const tarea = tareasPorId.get(taskId);

      acc[taskId] = {
        dependeDe: meta?.dependeDe ?? previousId,
        duracion: meta?.duracion ?? tarea?.duracion ?? DEFAULT_DURACION,
      };

      return acc;
    }, {});

    setPrecedenciasState(initialPrecedencias);

    if (canvasOrder.length === 0) {
      syncCanvas(obraId, [], () => ({
        tareaId: '',
        dependeDe: null,
        duracion: DEFAULT_DURACION,
      }));
      return;
    }

    // Calculamos posiciones basadas en dependencias
    const positionMap = new Map<string, { x: number; y: number }>();
    const layerMap = new Map<string, number>();

    const assignNode = (taskId: string, layer: number) => {
      if (layerMap.has(taskId)) {
        layerMap.set(taskId, Math.max(layerMap.get(taskId)!, layer));
      } else {
        layerMap.set(taskId, layer);
      }

      const dependents = canvasOrder.filter((id) => initialPrecedencias[id]?.dependeDe === taskId);
      dependents.forEach((childId, index) => {
        assignNode(childId, layer + 1);
      });
    };

    const roots = canvasOrder.filter((taskId) => (initialPrecedencias[taskId]?.dependeDe ?? null) === null);
    roots.forEach((rootId) => assignNode(rootId, 0));

    const layerCounts = new Map<number, number>();

    canvasOrder.forEach((taskId) => {
      const layer = layerMap.get(taskId) ?? 0;
      const indexInLayer = layerCounts.get(layer) ?? 0;
      layerCounts.set(layer, indexInLayer + 1);
      const y = indexInLayer * POSITION_SPACING_Y + 60;
      const x = layer * POSITION_SPACING_X + 80;
      positionMap.set(taskId, { x, y });
    });

    syncCanvas(obraId, canvasOrder, (taskId) => {
      const meta = initialPrecedencias[taskId];
      const position = positionMap.get(taskId) ?? { x: 80, y: 60 };
      return {
        tareaId: taskId,
        dependeDe: meta.dependeDe,
        duracion: meta.duracion,
        x: position.x,
        y: position.y,
      };
    });
  }, [canvasOrder, obraId, syncCanvas, tareasPorId]);

  const handleAddTaskToCanvas = (taskId: string) => {
    if (!obraId || !taskId) return;
    if (canvasOrder.includes(taskId)) {
      return;
    }

    const tarea = tareasPorId.get(taskId);
    const defaultDuracion = tarea?.duracion ?? DEFAULT_DURACION;
    const lastTaskId = canvasOrder.length > 0 ? canvasOrder[canvasOrder.length - 1] : null;
    const meta = precedenciasState[taskId];

    setSelectedTaskId(taskId);
    setDuracionDraft(meta?.duracion ?? (defaultDuracion > 0 ? defaultDuracion : DEFAULT_DURACION));
    setPrecedenciaDraft(meta?.dependeDe ?? lastTaskId);
    setDialogMode('create');
    setIsDialogOpen(true);
  };

  const availableTasks = useMemo(() => {
    const selected = new Set(canvasOrder);
    return tareas
      .filter((task) => task.id && !selected.has(task.id))
      .sort((a, b) => {
        const priorityWeight = (prioridad?: Prioridad) => {
          if (prioridad === 'Alta') return 0;
          if (prioridad === 'Media') return 1;
          return 2;
        };

        const diff = priorityWeight(a.prioridad) - priorityWeight(b.prioridad);
        if (diff !== 0) return diff;
        return a.nombre.localeCompare(b.nombre, 'es');
      });
  }, [canvasOrder, tareas]);

  const groupedAvailableTasks = useMemo(
    () =>
      (Object.keys(ETAPA_LABELS) as EditorEtapa[]).reduce(
        (acc, etapa) => {
          acc[etapa] = availableTasks.filter((task) => normalizeEtapa(task.etapa) === etapa);
          return acc;
        },
        {
          estructura: [] as OrganizaTask[],
          obra_gris: [] as OrganizaTask[],
          terminaciones: [] as OrganizaTask[],
        },
      ),
    [availableTasks],
  );

  const viewerTasks = useMemo<TaskCanvasNode[]>(() => {
    if (!obraId) return [];
    const metaMap = new Map(canvasTasks.map((task) => [task.tareaId, task]));

    return canvasOrder
      .map((taskId) => {
        const origen = tareasPorId.get(taskId);
        if (!origen) return null;

        const meta = metaMap.get(taskId);
        const duracion = meta?.duracion ?? origen.duracion ?? DEFAULT_DURACION;
        const dependeDe = meta?.dependeDe ?? null;

        const dependencias = dependeDe ? [dependeDe] : [];

        return {
          id: origen.id,
          nombre: origen.nombre,
          lider: origen.responsable || 'Sin asignar',
          estado: mapEstado(origen.estado),
          etapa: normalizeEtapa(origen.etapa),
          duracion: duracion > 0 ? duracion : DEFAULT_DURACION,
          dependencias,
        };
      })
      .filter((task): task is TaskCanvasNode => task !== null);
  }, [canvasOrder, canvasTasks, obraId, tareasPorId]);

  const toggleEtapa = (etapa: EditorEtapa) => {
    setOpenEtapas((prev) => ({ ...prev, [etapa]: !prev[etapa] }));
  };

  const handleResetCanvas = () => {
    onCanvasOrderChange(() => []);
    setPrecedenciasState(() => ({}));
    if (obraId) {
      resetCanvasStore(obraId);
    }
  };

  const handleGuardarLienzo = async () => {
    if (!obraId || canvasOrder.length === 0) {
      toast({
        title: 'No hay tareas en el lienzo',
        description: 'Agregá tareas antes de guardar la precedencia.',
      });
      setIsSaving(false);
      return;
    }

    setIsSaving(true);

    const nowIso = new Date().toISOString();
    type PrecedenciaUpsert = {
      tarea_id: string;
      depende_de: string | null;
      tipo_dependencia: string;
      lag_dias: number;
      created_at: string;
    };

    const payload: PrecedenciaUpsert[] = canvasOrder.map((taskId) => {
      const meta = precedenciasState[taskId] ?? {
        dependeDe: null,
        duracion: DEFAULT_DURACION,
      };
      return {
        tarea_id: taskId,
        depende_de: meta.dependeDe ?? null,
        tipo_dependencia: 'FINISH_TO_START',
        lag_dias: meta.duracion > 0 ? meta.duracion : DEFAULT_DURACION,
        created_at: nowIso,
      };
    });

    if (canvasOrder.length > 0) {
      const { error: deleteError } = await supabase
        .from('tarea_precedencias')
        .delete()
        .in('tarea_id', canvasOrder);

      if (deleteError) {
        console.error('[OrganizaSection] Error eliminando precedencias previas', deleteError);
        toast({
          title: 'Error al guardar',
          description: 'No pudimos limpiar precedencias previas. Intentá nuevamente.',
        });
        setIsSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('tarea_precedencias')
      .insert(payload);

    setIsSaving(false);

    if (error) {
      console.error('[OrganizaSection] Error guardando precedencias', { payload, error });
      toast({
        title: 'Error al guardar',
        description: 'No pudimos guardar las precedencias. Intentá nuevamente.',
      });
      return;
    }

    toast({
      title: 'Lienzo guardado con éxito',
      description: 'Las precedencias se actualizaron en la obra seleccionada.',
    });
  };

  const handleOpenDialog = (taskId: string) => {
    if (!obraId) return;
    const meta = canvasTasks.find((task) => task.tareaId === taskId);
    const metaState = precedenciasState[taskId];
    setSelectedTaskId(taskId);
    setDuracionDraft(
      metaState?.duracion ??
        meta?.duracion ??
        tareasPorId.get(taskId)?.duracion ??
        DEFAULT_DURACION,
    );
    setPrecedenciaDraft(metaState?.dependeDe ?? meta?.dependeDe ?? null);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedTaskId(null);
    setDialogMode('edit');
  };

  const handleConfirmDialog = () => {
    if (!obraId || !selectedTaskId) {
      setIsDialogOpen(false);
      return;
    }

    const sanitizedDuration = Number.isFinite(duracionDraft) ? Math.max(1, Math.trunc(duracionDraft)) : DEFAULT_DURACION;
    const payload = {
      tareaId: selectedTaskId,
      dependeDe: precedenciaDraft,
      duracion: sanitizedDuration,
    };

    if (dialogMode === 'create') {
      upsertCanvasTask(obraId, payload);
      setPrecedenciasState((prev) => ({
        ...prev,
        [selectedTaskId]: { dependeDe: precedenciaDraft, duracion: sanitizedDuration },
      }));
      onCanvasOrderChange((prev) => {
        if (prev.includes(selectedTaskId)) {
          return prev;
        }
        return [...prev, selectedTaskId];
      });
    } else {
      updateCanvasTask(obraId, selectedTaskId, payload);
      setPrecedenciasState((prev) => ({
        ...prev,
        [selectedTaskId]: { dependeDe: precedenciaDraft, duracion: sanitizedDuration },
      }));
    }

    closeDialog();
  };

  const tareasCanvasDisponibles = useMemo(
    () => viewerTasks.filter((task) => task.id !== selectedTaskId),
    [selectedTaskId, viewerTasks],
  );

  if (!obraId) {
    return (
      <EmptyState
        title="Seleccioná una obra"
        description="Elegí una obra activa para definir el orden de ejecución de sus tareas."
        icon={<ClipboardList className="h-10 w-10 text-grows-secondary" />}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-grows-text-secondary">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Cargando tareas disponibles…</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-grows-border bg-white p-6 shadow-grows-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-grows-text-primary">Organizá el flujo de trabajo</h2>
              <p className="text-sm text-grows-text-secondary">
                Arrastrá las tareas desde la columna lateral para definir el orden de ejecución. Cada tarea suma una
                precedencia automática con la anterior.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-grows-text-secondary">
              <span className="rounded-full bg-grows-secondary/10 px-3 py-1 font-semibold text-grows-secondary">
                {canvasOrder.length} en el lienzo
              </span>
              <span className="rounded-full bg-grows-text-inverse/5 px-3 py-1 font-semibold text-grows-text-secondary">
                {availableTasks.length} disponibles
              </span>
              {canvasOrder.length > 0 ? (
                <>
                  <Button variant="primary" size="sm" onClick={handleGuardarLienzo} loading={isSaving}>
                    Guardar lienzo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleResetCanvas} className="border border-grows-border">
                    Vaciar lienzo
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="relative overflow-hidden rounded-3xl border border-grows-border bg-grows-gray p-6 shadow-grows-sm">
            {viewerTasks.length === 0 ? (
              <div className="flex h-[520px] flex-col items-center justify-center text-center text-sm text-grows-text-secondary">
                <ClipboardList className="mb-3 h-10 w-10 text-grows-text-muted" />
                <p className="max-w-sm leading-relaxed">
                  Seleccioná una tarea desde la columna lateral para construir el orden de ejecución. Cada tarjeta que
                  agregues aparecerá en el editor visual.
                </p>
              </div>
            ) : (
              <div className="relative h-[520px] overflow-hidden rounded-2xl border border-grows-border/40 bg-white">
                <TaskCanvas tareas={viewerTasks} onTaskClick={handleOpenDialog} />
              </div>
            )}
          </div>

          <div className="flex h-full flex-col gap-4 rounded-3xl border border-grows-border bg-white p-6 shadow-grows-sm">
            <div>
              <h3 className="text-sm font-semibold text-grows-text-primary">Tareas disponibles</h3>
              <p className="text-xs text-grows-text-secondary">
                Ordenadas por prioridad y alfabéticamente. Hacé clic para sumarlas al lienzo.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {availableTasks.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-grows-lg border border-dashed border-grows-border/60 bg-grows-gray/30 p-6 text-center text-xs text-grows-text-secondary">
                  <p>No quedan tareas por asignar al lienzo.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(Object.keys(ETAPA_LABELS) as EditorEtapa[]).map((etapa) => {
                    const tareasEtapa = groupedAvailableTasks[etapa];
                    const isOpen = openEtapas[etapa];

                    return (
                      <div key={etapa} className="rounded-grows-lg border border-grows-border/70">
                        <button
                          type="button"
                          onClick={() => toggleEtapa(etapa)}
                          className="flex w-full items-center justify-between gap-3 rounded-t-grows-lg bg-grows-gray px-4 py-3 text-left text-sm font-semibold text-grows-text-primary transition hover:bg-grows-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grows-secondary focus-visible:ring-offset-2"
                        >
                          <div className="flex items-center gap-2">
                            <span>{ETAPA_LABELS[etapa]}</span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-grows-text-secondary">
                              {tareasEtapa.length}
                            </span>
                          </div>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform text-grows-text-secondary',
                              isOpen ? 'rotate-180' : 'rotate-0',
                            )}
                          />
                        </button>
                        {isOpen ? (
                          tareasEtapa.length > 0 ? (
                            <div className="flex flex-col gap-3 p-3">
                              {tareasEtapa.map((task) => (
                                <AvailableTaskButton key={task.id} task={task} onAdd={() => handleAddTaskToCanvas(task.id)} />
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-6 text-center text-xs text-grows-text-secondary">
                              No hay tareas en esta etapa.
                            </div>
                          )
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Agregar tarea al lienzo' : 'Editar precedencias'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="precedencia">Tarea previa</Label>
              <Select
                value={precedenciaDraft ?? 'none'}
                onValueChange={(value) => setPrecedenciaDraft(value === 'none' ? null : value)}
              >
                <SelectTrigger id="precedencia" className="w-[300px]">
                  <SelectValue placeholder="Sin precedencia" />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60 overflow-auto rounded-lg border border-grows-border bg-white shadow-grows-lg">
                  <SelectItem value="none">Sin precedencia</SelectItem>
                  {tareasCanvasDisponibles.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="duracion">
                Duración (días){' '}
                {selectedTaskId && tareasPorId.get(selectedTaskId)?.duracion
                  ? `(sugeridos ${tareasPorId.get(selectedTaskId)!.duracion} d)`
                  : `(sugeridos ${DEFAULT_DURACION} d)`}
              </Label>
              <Input
                id="duracion"
                type="number"
                min={1}
                value={duracionDraft}
                onChange={(event) => setDuracionDraft(Number.parseInt(event.target.value, 10) || DEFAULT_DURACION)}
                className="w-[300px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirmDialog}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AvailableTaskButtonProps {
  task: OrganizaTask;
  onAdd: () => void;
}

function AvailableTaskButton({ task, onAdd }: AvailableTaskButtonProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onAdd();
        }
      }}
      className={cn(
        'w-full rounded-grows-lg border border-grows-border bg-white p-4 text-left shadow-grows-sm transition-all hover:-translate-y-0.5 hover:shadow-grows-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grows-secondary focus-visible:ring-offset-2',
      )}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-grows-text-primary">{task.nombre}</p>
        {task.descripcion ? (
          <p className="text-xs text-grows-text-secondary line-clamp-2">{task.descripcion}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-grows-text-secondary">
          <span
            className={cn(
              'rounded-full px-2 py-0.5',
              task.prioridad === 'Alta' && 'bg-grows-red/10 text-grows-red',
              task.prioridad === 'Media' && 'bg-grows-secondary/10 text-grows-secondary',
              (!task.prioridad || task.prioridad === 'Baja') && 'bg-grows-teal/10 text-grows-teal',
            )}
          >
            {task.prioridad ?? 'Media'}
          </span>
          <span className="rounded-full bg-grows-text-inverse/5 px-2 py-0.5 text-grows-text-secondary">
            {task.etapa ?? 'Sin etapa'}
          </span>
        </div>
      </div>
    </button>
  );
}

