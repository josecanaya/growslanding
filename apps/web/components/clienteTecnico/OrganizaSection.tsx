

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ClipboardList, Loader2, Plus, Trash2 } from 'lucide-react';

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

import {
  TaskCanvas,
  type TaskCanvasNode,
  type TaskCanvasEstado,
  type TaskCanvasEtapa,
  CANVAS_COLUMN_WIDTH,
  CANVAS_ROW_HEIGHT,
  CANVAS_MARGIN_X,
  CANVAS_MARGIN_Y,
} from './TaskCanvas';

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
  obraId?: string | null;
}

type PrecedenciaMeta = {
  dependeDe: string | null;
  duracion: number;
  posX: number | null;
  posY: number | null;
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
  if (!etapa) return 'estructura';
  const value = etapa.toLowerCase().trim();
  
  // Primero verificar coincidencias exactas
  if (value === 'terminaciones' || value === 'terminacion') return 'terminaciones';
  if (value === 'obra_gris' || value === 'obra gris') return 'obra_gris';
  if (value === 'estructura') return 'estructura';
  
  // Luego verificar coincidencias parciales, con orden de prioridad
  if (value.includes('terminacion') || value.includes('termin')) return 'terminaciones';
  if ((value.includes('obra') || value.includes('gris')) && !value.includes('estructura')) return 'obra_gris';
  if (value.includes('estructura')) return 'estructura';
  
  // Si no coincide con ninguna, dejar en estructura por defecto
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
  const tareasFiltradas = useMemo(() => {
    if (!obraId) return [];
    return tareas.filter((tarea) => !tarea.obraId || tarea.obraId === obraId);
  }, [obraId, tareas]);

  const tareasPorId = useMemo(
    () => new Map(tareasFiltradas.map((task) => [task.id, task])),
    [tareasFiltradas],
  );

  const canvasOrderFiltrado = useMemo(
    () => canvasOrder.filter((taskId) => tareasPorId.has(taskId)),
    [canvasOrder, tareasPorId],
  );
  const supabase = useMemo(() => createClientComponentClient(), []);
  const { toast } = useToast();
  const syncCanvas = useOrganizaStore((state) => state.syncCanvas);
  const updateCanvasTask = useOrganizaStore((state) => state.updateCanvasTask);
  const resetCanvasStore = useOrganizaStore((state) => state.resetCanvas);
  const upsertCanvasTask = useOrganizaStore((state) => state.upsertCanvasTask);
  const updateNodePosition = useOrganizaStore((state) => state.updateNodePosition);
  const removeCanvasTask = useOrganizaStore((state) => state.removeCanvasTask);
  const canvasSelector = useMemo(() => selectCanvasTasks(obraId), [obraId]);
  const canvasTasks = useOrganizaStore(canvasSelector);

  const [precedenciasState, setPrecedenciasState] = useState<Record<string, PrecedenciaMeta>>(precedencias);
  const precedenciasStateRef = useRef(precedencias);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('edit');

  useEffect(() => {
    isSyncingFromPropsRef.current = true;
    const newState = Object.entries(precedencias).reduce<Record<string, PrecedenciaMeta>>((acc, [taskId, meta]) => {
      acc[taskId] = {
        dependeDe: meta?.dependeDe ?? null,
        duracion: meta?.duracion ?? DEFAULT_DURACION,
        posX: meta?.posX ?? null,
        posY: meta?.posY ?? null,
      };
      return acc;
    }, {});

    // Solo actualizar si realmente hay cambios para evitar loops
    const hasChanges =
      Object.keys(newState).length !== Object.keys(precedenciasStateRef.current).length ||
      Object.keys(newState).some((taskId) => {
        const current = precedenciasStateRef.current[taskId];
        const next = newState[taskId];
        if (!current && !next) return false;
        if (!current || !next) return true;
        return (
          current.posX !== next.posX ||
          current.posY !== next.posY ||
          current.dependeDe !== next.dependeDe ||
          current.duracion !== next.duracion
        );
      });

    if (hasChanges) {
      setPrecedenciasState(newState);
      precedenciasStateRef.current = newState;
    }
  }, [precedencias]);

  useEffect(() => {
    precedenciasStateRef.current = precedenciasState;
  }, [precedenciasState]);

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

    if (canvasOrderFiltrado.length === 0) {
      setPrecedenciasState({});
      syncCanvas(obraId, [], () => ({
        tareaId: '',
        dependeDe: null,
        duracion: DEFAULT_DURACION,
        x: 0,
        y: 0,
      }));
      return;
    }

    // Usar DIRECTAMENTE las precedencias de props (que vienen de Supabase)
    const nextPrecedencias = canvasOrderFiltrado.reduce<Record<string, PrecedenciaMeta>>(
      (acc, taskId) => {
        // Primero buscar en props (Supabase), luego en estado local actual
        const metaFromProps = precedencias[taskId];
        const metaFromState = precedenciasStateRef.current[taskId];
        const meta = metaFromProps ?? metaFromState;
        const tarea = tareasPorId.get(taskId);
        const dependeDe = meta?.dependeDe ?? null;
        const duracion = meta?.duracion ?? tarea?.duracion ?? DEFAULT_DURACION;

        // SOLO usar pos_x y pos_y de Supabase, sin cálculos automáticos
        const posX = typeof meta?.posX === 'number' && Number.isFinite(meta.posX) ? meta.posX : null;
        const posY = typeof meta?.posY === 'number' && Number.isFinite(meta.posY) ? meta.posY : null;

        acc[taskId] = {
          dependeDe,
          duracion,
          posX,
          posY,
        };

        return acc;
      },
      {},
    );

    // Solo actualizar estado si realmente hay cambios para evitar loops
    const hasChanges = Object.keys(nextPrecedencias).some(
      (taskId) => {
        const current = precedenciasStateRef.current[taskId];
        const next = nextPrecedencias[taskId];
        if (!current && !next) return false;
        if (!current || !next) return true;
        return (
          current.posX !== next.posX ||
          current.posY !== next.posY ||
          current.dependeDe !== next.dependeDe ||
          current.duracion !== next.duracion
        );
      },
    );

    syncCanvas(obraId, canvasOrderFiltrado, (taskId) => {
      const meta = nextPrecedencias[taskId];
      
      // SOLO usar pos_x y pos_y de Supabase, sin fallbacks ni cálculos automáticos
      const x = typeof meta?.posX === 'number' && Number.isFinite(meta.posX) ? meta.posX : 0;
      const y = typeof meta?.posY === 'number' && Number.isFinite(meta.posY) ? meta.posY : 0;

      return {
        tareaId: taskId,
        dependeDe: meta?.dependeDe ?? null,
        duracion: meta?.duracion ?? tareasPorId.get(taskId)?.duracion ?? DEFAULT_DURACION,
        x,
        y,
      };
    });

    if (hasChanges) {
      setPrecedenciasState(nextPrecedencias);
      precedenciasStateRef.current = nextPrecedencias;
    }
  }, [canvasOrderFiltrado, obraId, syncCanvas, tareasPorId, precedencias]);

  const handleAddTaskToCanvas = (taskId: string) => {
    if (!obraId || !taskId) return;
    if (canvasOrderFiltrado.includes(taskId)) {
      toast({
        title: 'Tarea ya en el lienzo',
        description: 'Esta tarea ya está en el lienzo.',
      });
      return;
    }

    const tarea = tareasPorId.get(taskId);
    const defaultDuracion = tarea?.duracion ?? DEFAULT_DURACION;
    const lastTaskId =
      canvasOrderFiltrado.length > 0 ? canvasOrderFiltrado[canvasOrderFiltrado.length - 1] : null;
    const meta = precedenciasState[taskId];

    setSelectedTaskId(taskId);
    setDuracionDraft(meta?.duracion ?? (defaultDuracion > 0 ? defaultDuracion : DEFAULT_DURACION));
    setPrecedenciaDraft(meta?.dependeDe ?? lastTaskId);
    setDialogMode('create');
    setIsAddModalOpen(false);
    setIsDialogOpen(true);
  };

  const handleDeleteNode = async (taskId: string) => {
    if (!obraId || !taskId) return;

    // Borrar fila donde esta tarea es tarea_id o donde es depende_de
    const { error } = await supabase
      .from('tarea_precedencias')
      .delete()
      .or(`tarea_id.eq.${taskId},depende_de.eq.${taskId}`);

    if (error) {
      console.error('[OrganizaSection] Error borrando nodo:', error);
      toast({
        title: 'Error al borrar nodo',
        description: 'No pudimos borrar el nodo. Intentá nuevamente.',
      });
      return;
    }

    // Remover del canvas order
    onCanvasOrderChange((prev) => prev.filter((id) => id !== taskId));

    // Remover del store
    removeCanvasTask(obraId, taskId);

    // Remover de precedencias state
    setPrecedenciasState((prev) => {
      const next = { ...prev };
      delete next[taskId];
      // También remover dependencias que apuntaban a este nodo
      Object.keys(next).forEach((id) => {
        if (next[id]?.dependeDe === taskId) {
          next[id] = {
            ...next[id],
            dependeDe: null,
          };
        }
      });
      return next;
    });

    toast({
      title: 'Nodo eliminado',
      description: 'Se eliminó el nodo del lienzo.',
    });
  };

  // Tareas disponibles para agregar (NO en el lienzo)
  const tareasDisponibles = useMemo(() => {
    const selected = new Set(canvasOrderFiltrado);
    return tareasFiltradas.filter((task) => task.id && !selected.has(task.id));
  }, [canvasOrderFiltrado, tareasFiltradas]);

  const groupedTareasDisponibles = useMemo(
    () =>
      (Object.keys(ETAPA_LABELS) as EditorEtapa[]).reduce(
        (acc, etapa) => {
          acc[etapa] = tareasDisponibles.filter((task) => normalizeEtapa(task.etapa) === etapa);
          return acc;
        },
        {
          estructura: [] as OrganizaTask[],
          obra_gris: [] as OrganizaTask[],
          terminaciones: [] as OrganizaTask[],
        },
      ),
    [tareasDisponibles],
  );

  const viewerTasks = useMemo<TaskCanvasNode[]>(() => {
    if (!obraId) return [];
    const metaMap = new Map(canvasTasks.map((task) => [task.tareaId, task]));

    return canvasOrderFiltrado
      .map((taskId) => {
        const origen = tareasPorId.get(taskId);
        if (!origen) return null;

        const canvasMeta = metaMap.get(taskId);
        // Priorizar props (Supabase) sobre estado local
        const metaFromProps = precedencias[taskId];
        const metaFromState = precedenciasState[taskId];
        const meta = metaFromProps ?? metaFromState;
        const dependeDe = meta?.dependeDe ?? canvasMeta?.dependeDe ?? null;
        const dependencias = dependeDe ? [dependeDe] : [];
        
        // SOLO usar pos_x y pos_y de Supabase (props) o del store (durante drag), sin cálculos automáticos
        // Priorizar props (Supabase), luego store (drag actual), luego 0
        const x =
          typeof metaFromProps?.posX === 'number' && Number.isFinite(metaFromProps.posX)
            ? metaFromProps.posX
            : typeof metaFromState?.posX === 'number' && Number.isFinite(metaFromState.posX)
            ? metaFromState.posX
            : typeof canvasMeta?.x === 'number' && Number.isFinite(canvasMeta.x)
            ? canvasMeta.x
            : 0;
        const y =
          typeof metaFromProps?.posY === 'number' && Number.isFinite(metaFromProps.posY)
            ? metaFromProps.posY
            : typeof metaFromState?.posY === 'number' && Number.isFinite(metaFromState.posY)
            ? metaFromState.posY
            : typeof canvasMeta?.y === 'number' && Number.isFinite(canvasMeta.y)
            ? canvasMeta.y
            : 0;
        const duracion =
          canvasMeta?.duracion ??
          meta?.duracion ??
          origen.duracion ??
          DEFAULT_DURACION;

        const node: TaskCanvasNode = {
          id: origen.id,
          nombre: origen.nombre,
          lider: origen.responsable || 'Sin asignar',
          estado: mapEstado(origen.estado),
          etapa: normalizeEtapa(origen.etapa),
          duracion: duracion > 0 ? duracion : DEFAULT_DURACION,
          dependencias,
          x,
          y,
        };

        return node;
      })
      .filter((task): task is TaskCanvasNode => task !== null);
  }, [canvasOrderFiltrado, canvasTasks, obraId, precedencias, precedenciasState, tareasPorId]);

  const toggleEtapa = (etapa: EditorEtapa) => {
    setOpenEtapas((prev) => ({ ...prev, [etapa]: !prev[etapa] }));
  };

  const handleResetCanvas = async () => {
    if (!obraId) return;

    // Obtener todos los tarea_id de esta obra
    const tareaIds = tareasFiltradas.map((t) => t.id);

    if (tareaIds.length === 0) {
      onCanvasOrderChange(() => []);
      setPrecedenciasState({});
      resetCanvasStore(obraId);
      return;
    }

    // Borrar todas las filas de tarea_precedencias para estas tareas
    const { error } = await supabase
      .from('tarea_precedencias')
      .delete()
      .in('tarea_id', tareaIds);

    if (error) {
      console.error('[OrganizaSection] Error borrando precedencias:', error);
      toast({
        title: 'Error al vaciar lienzo',
        description: 'No pudimos borrar las precedencias. Intentá nuevamente.',
      });
      return;
    }

    // Limpiar estado local
    onCanvasOrderChange(() => []);
    setPrecedenciasState({});
    resetCanvasStore(obraId);

    toast({
      title: 'Lienzo vaciado',
      description: 'Se borraron todas las precedencias de la obra.',
    });
  };

  const handleGuardarLienzo = async () => {
    if (!obraId || canvasOrderFiltrado.length === 0) {
      toast({
        title: 'No hay tareas en el lienzo',
        description: 'Agregá tareas antes de guardar la precedencia.',
      });
      setIsSaving(false);
      return;
    }

    setIsSaving(true);

    const payload = canvasOrderFiltrado.map((taskId, index) => {
      const metaState = precedenciasState[taskId];
      const canvasMeta = canvasTasks.find((task) => task.tareaId === taskId);
      const lagDias =
        metaState?.duracion ??
        canvasMeta?.duracion ??
        tareasPorId.get(taskId)?.duracion ??
        DEFAULT_DURACION;
      const dependeDe = metaState?.dependeDe ?? canvasMeta?.dependeDe ?? null;
      
      // SOLO usar coordenadas EXACTAS del store (drag actual) o Supabase, sin fallbacks
      const posX =
        typeof canvasMeta?.x === 'number' && Number.isFinite(canvasMeta.x)
          ? canvasMeta.x
          : typeof metaState?.posX === 'number' && Number.isFinite(metaState.posX)
          ? metaState.posX
          : 0;
      const posY =
        typeof canvasMeta?.y === 'number' && Number.isFinite(canvasMeta.y)
          ? canvasMeta.y
          : typeof metaState?.posY === 'number' && Number.isFinite(metaState.posY)
          ? metaState.posY
          : 0;

      return {
        tarea_id: taskId,
        depende_de: dependeDe,
        tipo_dependencia: 'FINISH_TO_START',
        lag_dias: lagDias > 0 ? lagDias : DEFAULT_DURACION,
        pos_x: posX,
        pos_y: posY,
      };
    });

    const { data: existingRows, error: fetchExistingError } = canvasOrderFiltrado.length
      ? await supabase
          .from('tarea_precedencias')
          .select('tarea_id')
          .in('tarea_id', canvasOrderFiltrado)
      : { data: [], error: null };

    if (fetchExistingError) {
      console.error('[OrganizaSection] Error consultando precedencias existentes', fetchExistingError);
      toast({
        title: 'Error al guardar',
        description: 'No pudimos verificar las precedencias existentes. Intentá nuevamente.',
      });
      setIsSaving(false);
      return;
    }

    const existingIds = new Set((existingRows ?? []).map((row) => row.tarea_id));
    const rowsToInsert: typeof payload = [];
    const rowsToUpdate: { tarea_id: string; fields: Record<string, unknown> }[] = [];

    payload.forEach((row) => {
      const baseFields = {
        depende_de: row.depende_de ?? null,
        tipo_dependencia: row.tipo_dependencia,
        lag_dias: row.lag_dias,
        pos_x: row.pos_x,
        pos_y: row.pos_y,
      };

      if (existingIds.has(row.tarea_id)) {
        rowsToUpdate.push({
          tarea_id: row.tarea_id,
          fields: baseFields,
        });
      } else {
        rowsToInsert.push({
          tarea_id: row.tarea_id,
          ...baseFields,
        });
      }
    });

    let updateError: any = null;
    if (rowsToUpdate.length > 0) {
      const updateResults = await Promise.all(
        rowsToUpdate.map(({ tarea_id, fields }) =>
          supabase.from('tarea_precedencias').update(fields).eq('tarea_id', tarea_id),
        ),
      );

      const failedUpdate = updateResults.find((result) => result.error);
      if (failedUpdate?.error) {
        updateError = failedUpdate.error;
      }
    }

    if (updateError) {
      console.error('[OrganizaSection] Error actualizando precedencias', updateError);
      toast({
        title: 'Error al guardar',
        description: 'No pudimos actualizar algunas precedencias. Intentá nuevamente.',
      });
      setIsSaving(false);
      return;
    }

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('tarea_precedencias')
        .insert(rowsToInsert);

      if (insertError) {
        console.error('[OrganizaSection] Error insertando precedencias', { rowsToInsert, insertError });
        toast({
          title: 'Error al guardar',
          description: insertError.message
            ? `No pudimos crear algunas precedencias (${insertError.message}).`
            : 'No pudimos crear nuevas precedencias. Intentá nuevamente.',
        });
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);

    toast({
      title: 'Lienzo guardado con éxito',
      description: 'Las precedencias se actualizaron en la obra seleccionada.',
    });

    setPrecedenciasState((prev) => {
      const next = { ...prev };
      canvasOrderFiltrado.forEach((taskId) => {
        const row = payload.find((r) => r.tarea_id === taskId);
        if (!row) return;
        const existing = next[taskId] ?? {
          dependeDe: row.depende_de ?? tareasPorId.get(taskId)?.dependencias?.[0] ?? null,
          duracion: prev[taskId]?.duracion ?? tareasPorId.get(taskId)?.duracion ?? DEFAULT_DURACION,
          posX: null,
          posY: null,
        };
        next[taskId] = {
          dependeDe: row.depende_de ?? existing.dependeDe ?? null,
          duracion: existing.duracion,
          posX: typeof row.pos_x === 'number' ? row.pos_x : existing.posX,
          posY: typeof row.pos_y === 'number' ? row.pos_y : existing.posY,
        };
      });
      return next;
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
      dependeDe: precedenciaDraft,
      duracion: sanitizedDuration,
    };

    if (dialogMode === 'create') {
      // SOLO usar pos_x y pos_y, sin cálculos automáticos
      const x = 0;
      const y = 0;

      upsertCanvasTask(obraId, {
        tareaId: selectedTaskId,
        dependeDe: precedenciaDraft,
        duracion: sanitizedDuration,
        x,
        y,
      });
      setPrecedenciasState((prev) => ({
        ...prev,
        [selectedTaskId]: {
          dependeDe: precedenciaDraft,
          duracion: sanitizedDuration,
          posX: x,
          posY: y,
        },
      }));
      if (!canvasOrderFiltrado.includes(selectedTaskId)) {
        onCanvasOrderChange(() => [...canvasOrderFiltrado, selectedTaskId]);
      }
    } else {
      updateCanvasTask(obraId, selectedTaskId, payload);
      setPrecedenciasState((prev) => ({
        ...prev,
        [selectedTaskId]: {
          dependeDe: precedenciaDraft,
          duracion: sanitizedDuration,
          posX: prev[selectedTaskId]?.posX ?? null,
          posY: prev[selectedTaskId]?.posY ?? null,
        },
      }));
    }

    closeDialog();
  };

  // Tareas EN EL LIENZO (para dropdown de precedencias)
  const tareasEnLienzo = useMemo(() => {
    return canvasOrderFiltrado
      .map((taskId) => {
        const tarea = tareasPorId.get(taskId);
        if (!tarea) return null;
        return {
          id: tarea.id,
          nombre: tarea.nombre,
        };
      })
      .filter((task): task is { id: string; nombre: string } => task !== null);
  }, [canvasOrderFiltrado, tareasPorId]);

  const handleNodePositionChange = useCallback(
    (taskId: string, position: { x: number; y: number }) => {
      if (!obraId) return;

      updateNodePosition(obraId, taskId, position);
      setPrecedenciasState((prev) => {
        const currentIndex = canvasOrderFiltrado.indexOf(taskId);
        const existing = prev[taskId] ?? {
          dependeDe: tareasPorId.get(taskId)?.dependencias?.[0] ?? null,
          duracion: tareasPorId.get(taskId)?.duracion ?? DEFAULT_DURACION,
          posX: null,
          posY: null,
        };
        return {
          ...prev,
          [taskId]: {
            ...existing,
            posX: position.x,
            posY: position.y,
          },
        };
      });
    },
    [canvasOrderFiltrado, obraId, tareasPorId, updateNodePosition],
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
                {canvasOrderFiltrado.length} en el lienzo
              </span>
              <span className="rounded-full bg-grows-text-inverse/5 px-3 py-1 font-semibold text-grows-text-secondary">
                {tareasDisponibles.length} disponibles
              </span>
              {canvasOrderFiltrado.length > 0 ? (
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

        <div className="relative overflow-hidden rounded-3xl border border-grows-border bg-grows-gray p-6 shadow-grows-sm">
          {viewerTasks.length === 0 ? (
            <div className="relative flex h-[520px] flex-col items-center justify-center text-center text-sm text-grows-text-secondary">
              <div className="absolute bottom-8 right-8 z-20 group relative">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsAddModalOpen(true)}
                  className="h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl"
                  title="Agregar tarea al lienzo"
                >
                  <Plus className="h-6 w-6" />
                </Button>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-full mr-3 whitespace-nowrap rounded-md bg-white border border-grows-border px-3 py-2 text-sm font-medium text-grows-text-primary opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 shadow-lg">
                  Agregar tarea
                  <div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 border-4 border-transparent border-l-white"></div>
                </div>
              </div>
              <ClipboardList className="mb-3 h-10 w-10 text-grows-text-muted" />
              <p className="max-w-sm leading-relaxed">
                Presioná el botón + para agregar tareas al lienzo y construir el orden de ejecución.
              </p>
            </div>
          ) : (
            <div className="relative h-[520px] rounded-2xl border border-grows-border/40 bg-white overflow-visible">
              <TaskCanvas
                tareas={viewerTasks}
                onTaskDoubleClick={handleOpenDialog}
                onTaskDelete={handleDeleteNode}
                onPositionChange={handleNodePositionChange}
              />
              <div className="absolute bottom-8 right-8 z-30 group pointer-events-none">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsAddModalOpen(true)}
                  className="h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl pointer-events-auto"
                  title="Agregar tarea al lienzo"
                >
                  <Plus className="h-6 w-6" />
                </Button>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-full mr-3 whitespace-nowrap rounded-md bg-white border border-grows-border px-3 py-2 text-sm font-medium text-grows-text-primary opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 shadow-lg">
                  Agregar tarea
                  <div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 border-4 border-transparent border-l-white"></div>
                </div>
              </div>
            </div>
          )}
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
                  {tareasEnLienzo
                    .filter((task) => task.id !== selectedTaskId)
                    .map((task) => (
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

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Agregar tarea al lienzo</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {tareasDisponibles.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-grows-border/60 bg-grows-gray/30 p-6 text-center text-xs text-grows-text-secondary">
                <p>No quedan tareas por asignar al lienzo.</p>
              </div>
            ) : (
              <div className="flex max-h-[400px] flex-col gap-3 overflow-y-auto pr-1">
                {(Object.keys(ETAPA_LABELS) as EditorEtapa[]).map((etapa) => {
                  const tareasEtapa = groupedTareasDisponibles[etapa];
                  const isOpen = openEtapas[etapa];

                  if (tareasEtapa.length === 0) return null;

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
                        <div className="flex flex-col gap-3 p-3">
                          {tareasEtapa.map((task) => (
                            <AvailableTaskButton key={task.id} task={task} onAdd={() => handleAddTaskToCanvas(task.id)} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cerrar
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

