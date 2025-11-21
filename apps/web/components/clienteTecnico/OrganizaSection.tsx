

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ClipboardList, Loader2, Plus, Trash2, Pencil, HelpCircle } from 'lucide-react';

import { Button, EmptyState } from '@/components/ui/grows';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useOrganizaStore, selectCanvasTasks } from '@/lib/hooks/useOrganizaStore';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { agruparTareasConsolidadasPorPlanta, obtenerNombreFase, type TareaDisponible, type TareaAgrupadaConsolidada, type TareaConsolidada } from '@/lib/utils/organiza-tareas';
import { calcularCPM, type TareaCPM, type CPMResultado } from '@/lib/utils/cpm';
import { OnboardingOrganizarProvider, useOnboardingOrganizar } from '@/components/onboarding/OnboardingOrganizar';
import TutorialButton from '@/components/common/TutorialButton';

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
  dependeDe: string | string[] | null;
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

function OrganizaSectionContent({
  obraId,
  tareas,
  isLoading,
  canvasOrder,
  precedencias,
  onCanvasOrderChange,
  onPrecedenciasChange,
}: OrganizaSectionProps) {
  const { startOnboarding } = useOnboardingOrganizar();
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
  const [precedenciaDraft, setPrecedenciaDraft] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('edit');
  const [tareasDisponiblesDesdeSupabase, setTareasDisponiblesDesdeSupabase] = useState<TareaDisponible[]>([]);
  const [tareasAgrupadas, setTareasAgrupadas] = useState<TareaAgrupadaConsolidada[]>([]);
  const [loadingTareasDisponibles, setLoadingTareasDisponibles] = useState(false);
  const [openPlantas, setOpenPlantas] = useState<Record<string, boolean>>({});
  const [openFases, setOpenFases] = useState<Record<string, boolean>>({});

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
        // Comparar dependeDe considerando arrays
        const currentDependeDe = current.dependeDe;
        const nextDependeDe = next.dependeDe;
        const dependeDeEqual = 
          currentDependeDe === nextDependeDe ||
          (Array.isArray(currentDependeDe) && Array.isArray(nextDependeDe) &&
           currentDependeDe.length === nextDependeDe.length &&
           currentDependeDe.every((val, idx) => val === nextDependeDe[idx]));
        return (
          current.posX !== next.posX ||
          current.posY !== next.posY ||
          !dependeDeEqual ||
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
        // Comparar dependeDe considerando arrays
        const currentDependeDe = current.dependeDe;
        const nextDependeDe = next.dependeDe;
        const dependeDeEqual = 
          currentDependeDe === nextDependeDe ||
          (Array.isArray(currentDependeDe) && Array.isArray(nextDependeDe) &&
           currentDependeDe.length === nextDependeDe.length &&
           currentDependeDe.every((val, idx) => val === nextDependeDe[idx]));
        return (
          current.posX !== next.posX ||
          current.posY !== next.posY ||
          !dependeDeEqual ||
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

  const handleAddTaskToCanvas = (taskId: string, duracionCalculada?: number) => {
    if (!obraId || !taskId) return;
    if (canvasOrderFiltrado.includes(taskId)) {
      toast({
        title: 'Tarea ya en el lienzo',
        description: 'Esta tarea ya está en el lienzo.',
      });
      return;
    }

    const tarea = tareasPorId.get(taskId);
    const defaultDuracion = duracionCalculada ?? tarea?.duracion ?? DEFAULT_DURACION;
    const lastTaskId =
      canvasOrderFiltrado.length > 0 ? canvasOrderFiltrado[canvasOrderFiltrado.length - 1] : null;
    const meta = precedenciasState[taskId];

    setSelectedTaskId(taskId);
    setDuracionDraft(meta?.duracion ?? (defaultDuracion > 0 ? defaultDuracion : DEFAULT_DURACION));
    // Convertir dependeDe a array (puede ser string | null o string[])
    const dependeDeActual = meta?.dependeDe ?? (lastTaskId ? [lastTaskId] : null);
    setPrecedenciaDraft(dependeDeActual ? (Array.isArray(dependeDeActual) ? dependeDeActual : [dependeDeActual]) : []);
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

  // Cargar tareas disponibles desde Supabase cuando se abre el modal
  useEffect(() => {
    if (!isAddModalOpen || !obraId) return;

    async function cargarTareasDisponibles() {
      setLoadingTareasDisponibles(true);
      try {
        const response = await fetch(`/api/obras/${obraId}/tareas-disponibles`);
        
        // Verificar si la respuesta es JSON válido
        let responseData: any = {};
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            responseData = await response.json();
          } catch (jsonError) {
            console.error('[OrganizaSection] Error parseando JSON:', jsonError);
            const textResponse = await response.text();
            console.error('[OrganizaSection] Respuesta de texto:', textResponse);
            throw new Error(`Error al parsear respuesta del servidor: ${textResponse.substring(0, 200)}`);
          }
        } else {
          const textResponse = await response.text();
          console.error('[OrganizaSection] Respuesta no es JSON:', textResponse);
          throw new Error(`Respuesta inesperada del servidor (${response.status}): ${textResponse.substring(0, 200)}`);
        }
        
        if (!response.ok) {
          const errorMessage = responseData?.error || responseData?.details || responseData?.message || `Error ${response.status}: ${response.statusText}`;
          console.error('[OrganizaSection] Error de API:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            details: responseData,
          });
          throw new Error(errorMessage);
        }
        
        if (!responseData.success) {
          const errorMessage = responseData?.error || responseData?.details || 'Error al cargar tareas disponibles';
          console.error('[OrganizaSection] API retornó success: false:', responseData);
          throw new Error(errorMessage);
        }
        
        const { data } = responseData;
        
        // Filtrar tareas que ya están en el lienzo
        const selected = new Set(canvasOrderFiltrado);
        const tareasFiltradas = (data || []).filter((tarea: TareaDisponible) => !selected.has(tarea.id));
        
        setTareasDisponiblesDesdeSupabase(tareasFiltradas);
        
        // Consolidar por ID técnico y agrupar por planta y fase
        const agrupadas = agruparTareasConsolidadasPorPlanta(tareasFiltradas);
        setTareasAgrupadas(agrupadas);
        
        // Inicializar estados de expansión
        const nuevasPlantas: Record<string, boolean> = {};
        const nuevasFases: Record<string, boolean> = {};
        agrupadas.forEach((grupo) => {
          const plantaKey = grupo.planta_id || 'sin_planta';
          nuevasPlantas[plantaKey] = true;
          grupo.fases.forEach((fase) => {
            const faseKey = `${plantaKey}-${fase.fase_normalizada}`;
            nuevasFases[faseKey] = true;
          });
        });
        setOpenPlantas(nuevasPlantas);
        setOpenFases(nuevasFases);
      } catch (error) {
        console.error('[OrganizaSection] Error cargando tareas disponibles:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las tareas disponibles',
          variant: 'destructive',
        });
      } finally {
        setLoadingTareasDisponibles(false);
      }
    }

    cargarTareasDisponibles();
  }, [isAddModalOpen, obraId, canvasOrderFiltrado]);

  // Tareas disponibles para agregar (NO en el lienzo) - MANTENER para compatibilidad con código existente
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

  // Función para guardar valores CPM en Supabase
  const guardarCPMEnSupabase = useCallback(
    async (obraId: string, resultadosCPM: Array<{ id: string; es: number; ef: number; ls: number; lf: number; float: number; isCritical: boolean }>) => {
      try {
        const tareasCPMData = resultadosCPM.map((result) => ({
          id: result.id,
          es: result.es,
          ef: result.ef,
          ls: result.ls,
          lf: result.lf,
          float: result.float,
          isCritical: result.isCritical,
        }));

        console.log('[OrganizaSection] ===== INICIANDO GUARDADO CPM =====');
        console.log('[OrganizaSection] Guardando CPM para', tareasCPMData.length, 'tareas');
        console.log('[OrganizaSection] URL:', `/api/obras/${obraId}/guardar-cpm`);
        console.log('[OrganizaSection] Obra ID:', obraId);
        console.log('[OrganizaSection] Datos a enviar (primeros 2):', JSON.stringify(tareasCPMData.slice(0, 2), null, 2));
        
        let response: Response;
        try {
          console.log('[OrganizaSection] Ejecutando fetch...');
          response = await fetch(`/api/obras/${obraId}/guardar-cpm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tareas: tareasCPMData }),
          });
          console.log('[OrganizaSection] Fetch completado. Status:', response.status, response.statusText);
        } catch (fetchError) {
          console.error('[OrganizaSection] ===== ERROR EN FETCH =====');
          console.error('[OrganizaSection] Error en fetch:', fetchError);
          console.error('[OrganizaSection] Error type:', typeof fetchError);
          console.error('[OrganizaSection] Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
          console.error('[OrganizaSection] Error stack:', fetchError instanceof Error ? fetchError.stack : undefined);
          // No lanzar error, solo loguear - el guardado de CPM es opcional
          console.warn('[OrganizaSection] No se pudo guardar CPM en Supabase, pero el cálculo local sigue funcionando');
          return; // Salir silenciosamente sin error
        }

        // Leer la respuesta como texto primero para poder parsearla después
        let responseText = '';
        try {
          console.log('[OrganizaSection] Leyendo respuesta como texto...');
          responseText = await response.text();
          console.log('[OrganizaSection] Respuesta recibida (longitud):', responseText.length);
          console.log('[OrganizaSection] Respuesta recibida (primeros 200 chars):', responseText.substring(0, 200));
          console.log('[OrganizaSection] Respuesta completa:', responseText);
        } catch (textError) {
          console.error('[OrganizaSection] ===== ERROR LEYENDO RESPUESTA =====');
          console.error('[OrganizaSection] Error leyendo respuesta como texto:', textError);
          console.error('[OrganizaSection] Error type:', typeof textError);
          throw new Error(`Error al leer respuesta del servidor: ${textError instanceof Error ? textError.message : String(textError)}`);
        }

        let responseData: any = {};
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
            console.log('[OrganizaSection] Respuesta parseada:', responseData);
          } catch (parseError) {
            console.error('[OrganizaSection] Error parseando respuesta JSON:', parseError);
            console.error('[OrganizaSection] Respuesta raw completa:', responseText);
            // Si no es JSON, usar el texto como mensaje de error
            responseData = { error: responseText, rawText: true };
          }
        } else {
          console.warn('[OrganizaSection] Respuesta vacía del servidor');
          responseData = { error: 'Respuesta vacía del servidor' };
        }

        if (!response.ok) {
          const errorMessage = responseData.error || responseData.details || responseData.message || `Error ${response.status}: ${response.statusText}`;
          
          // Log detallado línea por línea para evitar problemas de serialización
          console.error('=== ERROR GUARDANDO CPM ===');
          console.error('Status:', response.status);
          console.error('Status Text:', response.statusText);
          console.error('Error Message:', errorMessage);
          console.error('Response Data:', JSON.stringify(responseData, null, 2));
          console.error('Response Text (primeros 500):', responseText.substring(0, 500));
          console.error('Response Text Length:', responseText.length);
          console.error('Content-Type:', response.headers.get('content-type'));
          console.error('Tareas enviadas:', tareasCPMData.length);
          console.error('Primera tarea:', JSON.stringify(tareasCPMData[0], null, 2));
          console.error('Obra ID:', obraId);
          console.error('==========================');
          
          throw new Error(errorMessage);
        }

        console.log('[OrganizaSection] CPM guardado exitosamente:', responseData.message || 'OK');
      } catch (error) {
        // Log detallado del error capturado
        console.error('=== ERROR CAPTURADO EN CATCH ===');
        console.error('Error type:', typeof error);
        console.error('Error instanceof Error:', error instanceof Error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        } else {
          console.error('Error value:', String(error));
          console.error('Error JSON:', JSON.stringify(error, null, 2));
        }
        console.error('================================');
        // No mostrar toast para no interrumpir al usuario, solo log
      }
    },
    [],
  );

  const viewerTasks = useMemo<TaskCanvasNode[]>(() => {
    if (!obraId) return [];
    const metaMap = new Map(canvasTasks.map((task) => [task.tareaId, task]));

    const nodes = canvasOrderFiltrado
      .map((taskId) => {
        const origen = tareasPorId.get(taskId);
        if (!origen) return null;

        const canvasMeta = metaMap.get(taskId);
        // Priorizar props (Supabase) sobre estado local
        const metaFromProps = precedencias[taskId];
        const metaFromState = precedenciasState[taskId];
        const meta = metaFromProps ?? metaFromState;
        const dependeDe = meta?.dependeDe ?? canvasMeta?.dependeDe ?? null;
        // Manejar tanto string como string[] o null
        const dependencias = dependeDe 
          ? Array.isArray(dependeDe) 
            ? dependeDe 
            : [dependeDe]
          : [];
        
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

    // Calcular CPM si hay tareas en el lienzo
    if (nodes.length > 0) {
      try {
        // Preparar tareas para CPM
        // Filtrar dependencias que no existen en los nodos actuales
        const nodeIds = new Set(nodes.map((n) => n.id));
        const tareasCPM: TareaCPM[] = nodes.map((node) => ({
          id: node.id,
          name: node.nombre,
          duration: node.duracion,
          // Filtrar dependencias que ya no existen (tareas borradas)
          predecessors: node.dependencias.filter((depId) => nodeIds.has(depId)),
        }));

        // Calcular CPM (con manejo de errores)
        let resultadoCPM: CPMResultado;
        try {
          resultadoCPM = calcularCPM(tareasCPM);
        } catch (error) {
          console.error('[OrganizaSection] Error calculando CPM:', error);
          // Si hay error, continuar sin valores CPM en lugar de romper
          return nodes;
        }

        // Guardar CPM en Supabase (async, no bloquea el render)
        if (obraId && resultadoCPM.tareas.length > 0) {
          guardarCPMEnSupabase(obraId, resultadoCPM.tareas).catch((error) => {
            console.error('[OrganizaSection] Error guardando CPM:', error);
          });
        }

        // Crear mapa de resultados CPM
        const cpmMap = new Map(
          resultadoCPM.tareas.map((result) => [
            result.id,
            {
              es: result.es,
              ef: result.ef,
              ls: result.ls,
              lf: result.lf,
              float: result.float,
              float_free: result.float_free,
              isCritical: result.isCritical,
            },
          ]),
        );

        // Agregar valores CPM a cada nodo
        return nodes.map((node) => {
          const cpm = cpmMap.get(node.id);
          return {
            ...node,
            cpm: cpm ? { ...cpm } : undefined,
          };
        });
      } catch (error) {
        console.error('[OrganizaSection] Error calculando CPM:', error);
        // Si hay error, retornar nodos sin CPM
        return nodes;
      }
    }

    return nodes;
  }, [canvasOrderFiltrado, canvasTasks, obraId, precedencias, precedenciasState, tareasPorId, guardarCPMEnSupabase]);

  // Calcular métricas del proyecto (duración y críticas) para el header
  const proyectoMetrics = useMemo(() => {
    if (viewerTasks.length === 0) {
      return { project_duration: 0, critical_count: 0 };
    }
    try {
      const nodeIds = new Set(viewerTasks.map((n) => n.id));
      const tareasCPM: TareaCPM[] = viewerTasks.map((node) => ({
        id: node.id,
        name: node.nombre,
        duration: node.duracion,
        predecessors: node.dependencias.filter((depId) => nodeIds.has(depId)),
      }));
      const resultadoCPM = calcularCPM(tareasCPM);
      return {
        project_duration: resultadoCPM.project_duration,
        critical_count: resultadoCPM.critical_count,
      };
    } catch (error) {
      console.error('[OrganizaSection] Error calculando métricas del proyecto:', error);
      return { project_duration: 0, critical_count: 0 };
    }
  }, [viewerTasks]);

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

    // Preparar datos para cada tarea
    const tareasData = canvasOrderFiltrado.map((taskId) => {
      const metaState = precedenciasState[taskId];
      const canvasMeta = canvasTasks.find((task) => task.tareaId === taskId);
      const lagDias =
        metaState?.duracion ??
        canvasMeta?.duracion ??
        tareasPorId.get(taskId)?.duracion ??
        DEFAULT_DURACION;
      const dependeDe = metaState?.dependeDe ?? canvasMeta?.dependeDe ?? null;
      
      // Normalizar dependeDe a array
      const dependenciasArray = Array.isArray(dependeDe) 
        ? dependeDe 
        : dependeDe 
          ? [dependeDe] 
          : [];
      
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
        dependencias: dependenciasArray,
        tipo_dependencia: 'FINISH_TO_START' as const,
        lag_dias: lagDias > 0 ? lagDias : DEFAULT_DURACION,
        pos_x: posX,
        pos_y: posY,
      };
    });

    // Eliminar todas las precedencias existentes para estas tareas
    if (canvasOrderFiltrado.length > 0) {
      const { error: deleteError } = await supabase
        .from('tarea_precedencias')
        .delete()
        .in('tarea_id', canvasOrderFiltrado);

      if (deleteError) {
        console.error('[OrganizaSection] Error eliminando precedencias existentes', deleteError);
        toast({
          title: 'Error al guardar',
          description: 'No pudimos eliminar las precedencias existentes. Intentá nuevamente.',
        });
        setIsSaving(false);
        return;
      }
    }

    // Preparar filas para insertar (una por cada precedencia)
    const rowsToInsert: Array<{
      tarea_id: string;
      depende_de: string;
      tipo_dependencia: string;
      lag_dias: number;
      pos_x: number;
      pos_y: number;
    }> = [];

    tareasData.forEach((tareaData) => {
      if (tareaData.dependencias.length > 0) {
        tareaData.dependencias.forEach((depId) => {
          rowsToInsert.push({
            tarea_id: tareaData.tarea_id,
            depende_de: depId,
            tipo_dependencia: tareaData.tipo_dependencia,
            lag_dias: tareaData.lag_dias,
            pos_x: tareaData.pos_x,
            pos_y: tareaData.pos_y,
          });
        });
      } else {
        // Si no hay dependencias, insertar una fila con depende_de = null para mantener pos_x y pos_y
        rowsToInsert.push({
          tarea_id: tareaData.tarea_id,
          depende_de: null as any,
          tipo_dependencia: tareaData.tipo_dependencia,
          lag_dias: tareaData.lag_dias,
          pos_x: tareaData.pos_x,
          pos_y: tareaData.pos_y,
        });
      }
    });

    // Insertar todas las nuevas precedencias
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
        const tareaData = tareasData.find((t) => t.tarea_id === taskId);
        if (!tareaData) return;
        const existing = next[taskId] ?? {
          dependeDe: tareasPorId.get(taskId)?.dependencias ?? null,
          duracion: prev[taskId]?.duracion ?? tareasPorId.get(taskId)?.duracion ?? DEFAULT_DURACION,
          posX: null,
          posY: null,
        };
        next[taskId] = {
          dependeDe: tareaData.dependencias.length > 0 ? tareaData.dependencias : null,
          duracion: existing.duracion,
          posX: typeof tareaData.pos_x === 'number' ? tareaData.pos_x : existing.posX,
          posY: typeof tareaData.pos_y === 'number' ? tareaData.pos_y : existing.posY,
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
    // Convertir dependeDe a array (puede ser string | null o string[])
    const dependeDeActual = metaState?.dependeDe ?? meta?.dependeDe ?? null;
    setPrecedenciaDraft(dependeDeActual ? (Array.isArray(dependeDeActual) ? dependeDeActual : [dependeDeActual]) : []);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedTaskId(null);
    setDialogMode('edit');
  };

  const handleConfirmDialog = async () => {
    if (!obraId || !selectedTaskId) {
      setIsDialogOpen(false);
      return;
    }

    const sanitizedDuration = Number.isFinite(duracionDraft) ? Math.max(1, Math.trunc(duracionDraft)) : DEFAULT_DURACION;
    
    // Guardar múltiples precedencias en Supabase
    try {
      const supabase = createClientComponentClient();
      
      // Eliminar todas las precedencias existentes para esta tarea
      await supabase
        .from('tarea_precedencias')
        .delete()
        .eq('tarea_id', selectedTaskId);

      // Insertar nuevas precedencias (una fila por cada precedencia)
      // Asegurar que precedenciasArray siempre sea un array
      const precedenciasArray = Array.isArray(precedenciaDraft) 
        ? precedenciaDraft 
        : precedenciaDraft 
          ? [precedenciaDraft] 
          : [];
      if (precedenciasArray.length > 0) {
        const precedenciasToInsert = precedenciasArray.map((predecesoraId) => ({
          tarea_id: selectedTaskId,
          depende_de: predecesoraId,
          tipo_dependencia: 'FINISH_TO_START' as const,
          lag_dias: sanitizedDuration,
        }));

        const { error: insertError } = await supabase
          .from('tarea_precedencias')
          .insert(precedenciasToInsert);

        if (insertError) {
          console.error('[OrganizaSection] Error guardando precedencias:', insertError);
          toast({
            title: 'Error al guardar',
            description: 'No se pudieron guardar las precedencias. Intentá nuevamente.',
            variant: 'destructive',
          });
          return;
        }
      }

      const payload = {
        dependeDe: precedenciasArray.length > 0 ? precedenciasArray : null,
        duracion: sanitizedDuration,
      };

      if (dialogMode === 'create') {
        // SOLO usar pos_x y pos_y, sin cálculos automáticos
        const x = 0;
        const y = 0;

        upsertCanvasTask(obraId, {
          tareaId: selectedTaskId,
          dependeDe: precedenciasArray.length > 0 ? precedenciasArray : null,
          duracion: sanitizedDuration,
          x,
          y,
        });
        setPrecedenciasState((prev) => ({
          ...prev,
          [selectedTaskId]: {
            dependeDe: precedenciasArray.length > 0 ? precedenciasArray : null,
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
            dependeDe: precedenciasArray.length > 0 ? precedenciasArray : null,
            duracion: sanitizedDuration,
            posX: prev[selectedTaskId]?.posX ?? null,
            posY: prev[selectedTaskId]?.posY ?? null,
          },
        }));
      }

      toast({
        title: 'Precedencias guardadas',
        description: `${precedenciasArray.length} ${precedenciasArray.length === 1 ? 'precedencia guardada' : 'precedencias guardadas'}`,
      });

      closeDialog();
    } catch (error) {
      console.error('[OrganizaSection] Error en handleConfirmDialog:', error);
      toast({
        title: 'Error al guardar',
        description: 'Ocurrió un error inesperado. Intentá nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Tareas EN EL LIENZO (para dropdown de precedencias)
  const tareasEnLienzo = useMemo(() => {
    const tareas = canvasOrderFiltrado
      .map((taskId) => {
        const tarea = tareasPorId.get(taskId);
        if (!tarea) return null;
        return {
          id: tarea.id,
          nombre: tarea.nombre,
        };
      })
      .filter((task): task is { id: string; nombre: string } => task !== null);
    
    // Eliminar duplicados: mantener solo el primero de cada id
    return tareas.filter((task, index, self) => 
      index === self.findIndex((t) => t.id === task.id)
    );
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-xl font-semibold text-grows-text-primary">Organizá el flujo de trabajo</h2>
                <TutorialButton
                  onClick={() => {
                    console.log('🔵 Click en botón tutorial - llamando startOnboarding');
                    startOnboarding();
                  }}
                  data-onboarding="tutorial-button-organizar"
                />
                {proyectoMetrics.project_duration > 0 && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderColor: '#D1D5DB',
                      fontWeight: 600,
                      color: '#1F2937',
                      fontSize: '15px',
                    }}
                  >
                    <span className="text-lg">📅</span>
                    <span>Duración del proyecto:</span>
                    <span style={{ color: '#059669', fontWeight: 700, fontSize: '16px' }}>
                      {proyectoMetrics.project_duration} días
                    </span>
                  </div>
                )}
                {proyectoMetrics.critical_count > 0 && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: '#FEF2F2',
                      borderColor: '#FCA5A5',
                      fontWeight: 600,
                      color: '#B91C1C',
                      fontSize: '14px',
                    }}
                    data-onboarding="mostrar-cpm"
                  >
                    <span className="text-lg">⚡</span>
                    <span>Camino crítico:</span>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>
                      {proyectoMetrics.critical_count} {proyectoMetrics.critical_count === 1 ? 'tarea' : 'tareas'}
                    </span>
                  </div>
                )}
              </div>
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
                  <Button variant="primary" size="sm" onClick={handleGuardarLienzo} loading={isSaving} data-onboarding="guardar-lienzo">
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

        <div className="relative rounded-3xl border border-grows-border bg-grows-gray p-6 shadow-grows-sm">
          {viewerTasks.length === 0 ? (
            <div className="relative flex h-[520px] flex-col items-center justify-center text-center text-sm text-grows-text-secondary">
              <div className="absolute bottom-8 right-8 z-50 group relative">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsAddModalOpen(true)}
                  className="h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl"
                  title="Agregar tarea al lienzo"
                  data-onboarding="agregar-tarea"
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
            <div 
              className="relative rounded-2xl border border-grows-border/40 bg-white" 
              style={{ minHeight: '520px', height: '520px', overflow: 'hidden', position: 'relative' }}
              data-onboarding="lienzo-tareas"
            >
              <TaskCanvas
                tareas={viewerTasks}
                onTaskClick={(taskId) => {
                  setSelectedTaskId(taskId);
                  setIsDialogOpen(true);
                  setDialogMode('edit');
                }}
                onTaskDoubleClick={handleOpenDialog}
                onTaskDelete={handleDeleteNode}
                onPositionChange={handleNodePositionChange}
                onConnectionCreate={async (fromTaskId, toTaskId) => {
                  // Actualizar estado local inmediatamente
                  setPrecedenciasState((prev) => {
                    const updated = { ...prev };
                    if (!updated[toTaskId]) {
                      updated[toTaskId] = {
                        dependeDe: null,
                        duracion: DEFAULT_DURACION,
                        posX: null,
                        posY: null,
                      };
                    }
                    updated[toTaskId] = {
                      ...updated[toTaskId],
                      dependeDe: fromTaskId,
                    };
                    return updated;
                  });

                  // Guardar en Supabase
                  try {
                    const supabase = createClientComponentClient();
                    const { error } = await supabase
                      .from('tarea_precedencias')
                      .upsert({
                        tarea_id: toTaskId,
                        depende_de: fromTaskId,
                        tipo_dependencia: 'FINISH_TO_START',
                        lag_dias: DEFAULT_DURACION,
                      }, {
                        onConflict: 'tarea_id',
                      });

                    if (error) {
                      console.error('[OrganizaSection] Error guardando conexión:', error);
                      toast({
                        title: 'Error',
                        description: 'No se pudo guardar la conexión',
                        variant: 'destructive',
                      });
                      // Revertir cambio local
                      setPrecedenciasState((prev) => {
                        const updated = { ...prev };
                        if (updated[toTaskId]) {
                          updated[toTaskId] = {
                            ...updated[toTaskId],
                            dependeDe: null,
                          };
                        }
                        return updated;
                      });
                    } else {
                      toast({
                        title: 'Conexión creada',
                        description: 'La precedencia se guardó correctamente',
                      });
                    }
                  } catch (error) {
                    console.error('[OrganizaSection] Error guardando conexión:', error);
                  }
                }}
                onAddPrecedence={(taskId) => {
                  setSelectedTaskId(taskId);
                  setIsDialogOpen(true);
                  setDialogMode('edit');
                }}
                onViewDetails={(taskId) => {
                  setSelectedTaskId(taskId);
                  setIsDialogOpen(true);
                  setDialogMode('edit');
                }}
                onConnectionDelete={async (fromTaskId, toTaskId) => {
                  // Actualizar estado local
                  setPrecedenciasState((prev) => {
                    const updated = { ...prev };
                    if (updated[toTaskId]) {
                      updated[toTaskId] = {
                        ...updated[toTaskId],
                        dependeDe: null,
                      };
                    }
                    return updated;
                  });

                  // Eliminar de Supabase
                  try {
                    const supabase = createClientComponentClient();
                    const { error } = await supabase
                      .from('tarea_precedencias')
                      .update({ depende_de: null })
                      .eq('tarea_id', toTaskId)
                      .eq('depende_de', fromTaskId);

                    if (error) {
                      console.error('[OrganizaSection] Error eliminando conexión:', error);
                      toast({
                        title: 'Error',
                        description: 'No se pudo eliminar la conexión',
                        variant: 'destructive',
                      });
                    } else {
                      toast({
                        title: 'Conexión eliminada',
                        description: 'La precedencia se eliminó correctamente',
                      });
                    }
                  } catch (error) {
                    console.error('[OrganizaSection] Error eliminando conexión:', error);
                  }
                }}
              />
              <div className="absolute bottom-8 right-8 z-30 group pointer-events-none">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsAddModalOpen(true)}
                  className="h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl pointer-events-auto"
                  title="Agregar tarea al lienzo"
                  data-onboarding="agregar-tarea"
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
              <Label htmlFor="precedencia">Tareas previas</Label>
              <div className="w-[300px] max-h-60 overflow-y-auto rounded-lg border border-grows-border bg-white p-3 space-y-2">
                {tareasEnLienzo.length === 0 || tareasEnLienzo.filter((task) => task.id !== selectedTaskId).length === 0 ? (
                  <p className="text-sm text-grows-text-secondary py-2">No hay tareas disponibles para seleccionar</p>
                ) : (
                  tareasEnLienzo
                    .filter((task) => task.id !== selectedTaskId)
                    .filter((task, index, self) => 
                      // Eliminar duplicados: mantener solo el primero de cada id
                      index === self.findIndex((t) => t.id === task.id)
                    )
                    .map((task) => (
                      <div key={task.id} className="flex items-center gap-2 py-1">
                        <Checkbox
                          id={`precedencia-${task.id}`}
                          checked={Array.isArray(precedenciaDraft) ? precedenciaDraft.includes(task.id) : false}
                          onCheckedChange={(checked) => {
                            // Asegurar que current siempre sea un array
                            const current = Array.isArray(precedenciaDraft) 
                              ? precedenciaDraft 
                              : precedenciaDraft 
                                ? [precedenciaDraft] 
                                : [];
                            if (checked) {
                              setPrecedenciaDraft([...current, task.id]);
                            } else {
                              setPrecedenciaDraft(current.filter((id) => id !== task.id));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={`precedencia-${task.id}`}
                          className="text-sm text-grows-text-primary cursor-pointer flex-1"
                        >
                          {task.nombre}
                        </label>
                      </div>
                    ))
                )}
              </div>
              {precedenciaDraft && precedenciaDraft.length > 0 && (
                <p className="text-xs text-grows-text-secondary">
                  {precedenciaDraft.length} {precedenciaDraft.length === 1 ? 'precedencia seleccionada' : 'precedencias seleccionadas'}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="duracion" className="flex items-center gap-2">
                <span>Duración (días)</span>
                <Pencil className="h-3.5 w-3.5 text-grows-text-secondary" />
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
        <DialogContent className="max-w-3xl rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Agregar tarea al lienzo</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {loadingTareasDisponibles ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-grows-border/60 bg-grows-gray/30 p-6 text-center text-xs text-grows-text-secondary">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p>Cargando tareas disponibles...</p>
              </div>
            ) : tareasAgrupadas.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-grows-border/60 bg-grows-gray/30 p-6 text-center text-xs text-grows-text-secondary">
                <p>No quedan tareas por asignar al lienzo.</p>
              </div>
            ) : (
              <div className="flex max-h-[500px] flex-col gap-4 overflow-y-auto pr-1">
                {tareasAgrupadas.map((grupoPlanta) => {
                  const plantaKey = grupoPlanta.planta_id || 'sin_planta';
                  const isPlantaOpen = openPlantas[plantaKey] ?? true;

                  return (
                    <div key={plantaKey} className="rounded-grows-lg border border-grows-border/70 bg-white">
                      {/* Header de Planta */}
                      <button
                        type="button"
                        onClick={() => setOpenPlantas((prev) => ({ ...prev, [plantaKey]: !prev[plantaKey] }))}
                        className="flex w-full items-center justify-between gap-3 rounded-t-grows-lg bg-grows-secondary/10 px-4 py-3 text-left text-sm font-semibold text-grows-text-primary transition hover:bg-grows-secondary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grows-secondary focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{grupoPlanta.planta_nombre}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-grows-text-secondary">
                            {grupoPlanta.fases.reduce((sum, fase) => sum + fase.tareas.length, 0)} tareas
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform text-grows-text-secondary',
                            isPlantaOpen ? 'rotate-180' : 'rotate-0',
                          )}
                        />
                      </button>

                      {isPlantaOpen && (
                        <div className="flex flex-col gap-3 p-3">
                          {grupoPlanta.fases.map((fase) => {
                            const faseKey = `${plantaKey}-${fase.fase_normalizada}`;
                            const isFaseOpen = openFases[faseKey] ?? true;

                            if (fase.tareas.length === 0) return null;

                            return (
                              <div key={faseKey} className="rounded-lg border border-grows-border/50 bg-grows-gray/30">
                                {/* Header de Fase */}
                                <button
                                  type="button"
                                  onClick={() => setOpenFases((prev) => ({ ...prev, [faseKey]: !prev[faseKey] }))}
                                  className="flex w-full items-center justify-between gap-3 rounded-t-lg bg-grows-gray/50 px-3 py-2 text-left text-xs font-semibold text-grows-text-primary transition hover:bg-grows-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grows-secondary focus-visible:ring-offset-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{obtenerNombreFase(fase.fase_normalizada)}</span>
                                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-grows-text-secondary">
                                      {fase.tareas.length}
                                    </span>
                                  </div>
                                  <ChevronDown
                                    className={cn(
                                      'h-3 w-3 transition-transform text-grows-text-secondary',
                                      isFaseOpen ? 'rotate-180' : 'rotate-0',
                                    )}
                                  />
                                </button>

                                {isFaseOpen && (
                                  <div className="flex flex-col gap-2 p-2">
                                    {fase.tareas.map((tarea) => (
                                      <AvailableTaskButtonConsolidada
                                        key={tarea.id}
                                        tarea={tarea}
                                        onAdd={() => {
                                          // Usar el primer ID original para agregar al lienzo
                                          const primerId = tarea.ids_originales[0];
                                          if (primerId) {
                                            handleAddTaskToCanvas(primerId, tarea.duracion_calculada);
                                          }
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
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

interface AvailableTaskButtonWithElementoProps {
  tarea: TareaDisponible;
  onAdd: () => void;
}

function AvailableTaskButtonWithElemento({ tarea, onAdd }: AvailableTaskButtonWithElementoProps) {
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
        'w-full rounded-lg border border-grows-border bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grows-secondary focus-visible:ring-offset-2',
      )}
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-grows-text-primary">{tarea.nombre}</p>
        <p className="text-xs font-medium text-grows-secondary">
          Elemento: {tarea.elemento_nombre}
        </p>
        {tarea.descripcion ? (
          <p className="text-xs text-grows-text-secondary line-clamp-1">{tarea.descripcion}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-grows-text-secondary">
          <span
            className={cn(
              'rounded-full px-2 py-0.5',
              tarea.prioridad === 'Alta' && 'bg-grows-red/10 text-grows-red',
              tarea.prioridad === 'Media' && 'bg-grows-secondary/10 text-grows-secondary',
              (!tarea.prioridad || tarea.prioridad === 'Baja') && 'bg-grows-teal/10 text-grows-teal',
            )}
          >
            {tarea.prioridad ?? 'Media'}
          </span>
          <span className="rounded-full bg-grows-text-inverse/5 px-2 py-0.5">
            {obtenerNombreFase(tarea.etapa as 'estructura' | 'obra_gris' | 'terminaciones')}
          </span>
        </div>
      </div>
    </button>
  );
}

interface AvailableTaskButtonConsolidadaProps {
  tarea: TareaConsolidada;
  onAdd: () => void;
}

function AvailableTaskButtonConsolidada({ tarea, onAdd }: AvailableTaskButtonConsolidadaProps) {
  // Formatear lista de elementos
  const elementosTexto = tarea.elementos_origen
    .map((el) => `${el.elemento_nombre} ${el.cantidad} ${el.unidad}`)
    .join(', ');

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
        'w-full rounded-lg border border-grows-border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grows-secondary focus-visible:ring-offset-2',
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Nombre y cantidad total */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-grows-text-primary flex-1">
            {tarea.nombre}
          </p>
          <span className="text-xs font-medium text-grows-text-secondary whitespace-nowrap">
            {tarea.cantidad_total} {tarea.unidad}
          </span>
        </div>

        {/* Duración estimada */}
        <p className="text-xs text-grows-text-secondary">
          Duración estimada: <span className="font-semibold">{tarea.duracion_calculada} días</span>
        </p>

        {/* Fase */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-grows-text-secondary">Fase:</span>
          <span className="rounded-full bg-grows-text-inverse/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-grows-text-secondary">
            {obtenerNombreFase(tarea.fase)}
          </span>
        </div>

        {/* Elementos */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-grows-text-secondary">Elementos:</span>
          <p className="text-xs text-grows-text-secondary line-clamp-2">{elementosTexto}</p>
        </div>
      </div>
    </button>
  );
}

export function OrganizaSection(props: OrganizaSectionProps) {
  return (
    <OnboardingOrganizarProvider>
      <OrganizaSectionContent {...props} />
    </OnboardingOrganizarProvider>
  );
}
