'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import {
  Card,
  EmptyState,
} from '@/components/ui/grows';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Database } from '@/lib/types/supabase.gen';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { ordenarTareasPorPrecedencias } from '@/utils/ordenarTareasPorPrecedencias';
import { SolicitarPresupuestoModal } from '@/components/clienteTecnico/presupuestos/SolicitarPresupuestoModal';
import { PanelEstado } from './asigna/PanelEstado';
import { StageSummaryCard } from './asigna/StageSummaryCard';
import { PresupuestoPDFModal } from './asigna/PresupuestoPDFModal';
import { PresupuestoListaModal } from './asigna/PresupuestoListaModal';
import { PresupuestoRechazarModal } from './asigna/PresupuestoRechazarModal';
import { PresupuestoComentarioModal } from './asigna/PresupuestoComentarioModal';

const STAGE_DEFINITIONS = [
  {
    key: 'estructura' as const,
    label: 'Estructura',
    description: 'Fundaciones, columnas y vigas principales.',
    accent: 'border-blue-200 bg-blue-50/70',
    badgeClass: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  {
    key: 'obra gris' as const,
    label: 'Obra gris',
    description: 'Mampostería, instalaciones y cerramientos.',
    accent: 'border-slate-200 bg-slate-50/80',
    badgeClass: 'bg-slate-200 text-slate-700 border border-slate-300',
  },
  {
    key: 'terminaciones' as const,
    label: 'Terminaciones',
    description: 'Acabados finales, pintura y carpinterías.',
    accent: 'border-emerald-200 bg-emerald-50/80',
    badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
];

const FALLBACK_STAGE = {
  key: 'otros' as const,
  label: 'Sin etapa definida',
  description: 'Organizá estas tareas para priorizarlas y asignarlas.',
  accent: 'border-slate-300 bg-white',
  badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return DATE_FORMATTER.format(date);
}

type AsignarSectionProps = {
  obraId?: string | null;
};

type RawTarea = Record<string, any> & {
  id: string;
  title?: string | null;
  nombre?: string | null;
  etapa?: string | null;
  tipo?: string | null;
  category?: string | null;
  fase?: string | null;
  obra_id: string;
  responsable?: string | null;
  estado?: string | null;
  cuadrilla_id?: string | null;
};

type RawPresupuesto = Record<string, any> & {
  id: string;
  tarea_id: string;
  created_at: string;
  updated_at?: string | null;
  monto?: number | null;
  moneda?: string | null;
  estado?: string | null;
  notas?: string | null;
  socio_id?: string | null;
  cantidad?: number | null;
  unidad?: string | null;
};

type TaskInfo = {
  id: string;
  titulo: string;
  etapa: string | null;
  obraId: string;
  responsable: string | null;
  cuadrillaId: string | null;
  estado: string | null;
  duracion_estimada?: number | null;
};

type StageKey = (typeof STAGE_DEFINITIONS)[number]['key'] | typeof FALLBACK_STAGE.key;

function normalizeStage(value: string | null | undefined): StageKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes('estructura')) return 'estructura';
  if (normalized.includes('gris')) return 'obra gris';
  if (normalized.includes('termin')) return 'terminaciones';
  return null;
}

export function AsignarSection({ obraId }: AsignarSectionProps) {
  const currentUser = useCurrentUser();
  const supabase = useMemo(
    () => createClientComponentClient<Database>() as any,
    []
  );
  const { toast } = useToast();
  const abrirModalAsignacion = useCuadrillasStore((state) => state.abrirModalAsignacion);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [budgets, setBudgets] = useState<RawPresupuesto[]>([]);
  const [cuadrillas, setCuadrillas] = useState<{ id: string; nombre: string }[]>([]);
  const [socioEmailMap, setSocioEmailMap] = useState<Map<string, string>>(new Map());
  const [sociosMap, setSociosMap] = useState<Map<string, string>>(new Map()); // socio_id -> nombre

  const [assigningBudgetId, setAssigningBudgetId] = useState<string | null>(null);
  const [updatingBudgetId, setUpdatingBudgetId] = useState<string | null>(null);
  const [aprobandoPresupuestoSocioId, setAprobandoPresupuestoSocioId] = useState<string | null>(null);
  const [etapaActiva, setEtapaActiva] = useState<StageKey>('estructura');
  
  // Estado para el nuevo modal de presupuesto
  const [presupuestoModalOpen, setPresupuestoModalOpen] = useState(false);
  const [presupuestoModalEtapa, setPresupuestoModalEtapa] = useState<string>('');
  const [presupuestoModalObraId, setPresupuestoModalObraId] = useState<string>('');
  const [presupuestoModalTareas, setPresupuestoModalTareas] = useState<Array<{
    id: string;
    title: string;
    etapa: string | null;
    elemento: any;
    es: number | null;
    ef: number | null;
    fecha_inicio_estimada: string | null;
    fecha_fin_estimada: string | null;
  }>>([]);
  
  // Estados para los modales de PDF, Lista y Rechazar
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfModalData, setPdfModalData] = useState<{ cuadrillaNombre: string; presupuestos: any[] } | null>(null);
  
  const [listaModalOpen, setListaModalOpen] = useState(false);
  const [listaModalData, setListaModalData] = useState<{ cuadrillaNombre: string; presupuestos: any[] } | null>(null);
  
  const [rechazarModalOpen, setRechazarModalOpen] = useState(false);
  const [rechazarModalData, setRechazarModalData] = useState<{ cuadrillaNombre: string; presupuestos: any[] } | null>(null);
  const [comentarioModalOpen, setComentarioModalOpen] = useState(false);
  const [comentarioModalData, setComentarioModalData] = useState<{ cuadrillaNombre: string; presupuestos: any[] } | null>(null);
  const [elementosMap, setElementosMap] = useState<Map<string, { id: string; nombre: string | null; unidad?: string | null; cantidad?: number | null }>>(new Map());

  // Estado para banner de éxito
  const [successBanner, setSuccessBanner] = useState<{ message: string; tareasAprobadas: number } | null>(null);

  // Calcular obraIdActual para usar en modales
  const obraIdActual = useMemo(() => {
    return obraId || (tasks.length > 0 ? tasks[0]?.obraId : null);
  }, [obraId, tasks]);

  // Función reutilizable para cargar/refrescar datos
  const refetchData = useCallback(async (showLoading = false) => {
    if (!currentUser?.orgId) {
      setError('No se pudo identificar tu organización.');
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      let obraIds: string[] = [];

      if (obraId) {
        obraIds = [obraId];
      } else {
        const { data: obrasData, error: obrasError } = await supabase
          .from('obras')
          .select('id')
          .eq('org_id', currentUser.orgId);

        if (obrasError) {
          throw obrasError;
        }

        type ObraRow = { id: string | null };
        const obraRows = ((obrasData ?? []) as unknown) as ObraRow[];
        obraIds = obraRows.map((obra) => obra.id ?? '').filter(Boolean);
      }

      if (!obraIds.length) {
        setTasks([]);
        setBudgets([]);
        setCuadrillas([]);
        if (showLoading) setLoading(false);
        return;
      }

      const { data: rawTasks, error: tareasError } = await supabase
        .from('tareas')
        .select('*')
        .in('obra_id', obraIds);

      if (tareasError) throw tareasError;

      // Cargar elementos para las tareas
      const elementoIds = (rawTasks ?? [])
        .map((t: RawTarea) => (t as any).elemento_id)
        .filter((id: string | null | undefined): id is string => !!id);
      
      let elementosData: any[] = [];
      if (elementoIds.length > 0) {
        const { data: elementos, error: elementosError } = await supabase
          .from('elementos')
          .select('id, nombre, unidad, cantidad')
          .in('id', elementoIds);
        
        if (!elementosError && elementos) {
          elementosData = elementos;
        }
      }

      const elementosMapLocal = new Map(
        elementosData.map((el: any) => [
          el.id,
          { id: el.id, nombre: el.nombre, unidad: el.unidad, cantidad: el.cantidad },
        ])
      );
      setElementosMap(elementosMapLocal);

      const mappedTasks: TaskInfo[] = (rawTasks ?? []).map((row: RawTarea) => {
        const rawStage =
          row.etapa ??
          row.tipo ??
          row.category ??
          (row as any).stage ??
          row.fase ??
          null;

        return {
          id: row.id,
          titulo:
            row.title ??
            row.nombre ??
            (row as any).titulo ??
            (row as any).name ??
            'Tarea sin título',
          etapa: rawStage ? String(rawStage) : null,
          obraId: row.obra_id,
          responsable: row.responsable ?? null,
          cuadrillaId: row.cuadrilla_id ?? null,
          estado: row.estado ?? null,
          duracion_estimada: (row as any).duracion_estimada ?? null,
        };
      });

      const tareaIds = mappedTasks.map((t) => t.id);

      // Obtener socios para mapear socio_id -> email
      const socioIds = new Set<string>();
      const [{ data: rawBudgets }, { data: cuadrillasData }, { data: sociosData }] = await Promise.all([
        tareaIds.length
          ? supabase
              .from('tareas_presupuestos')
              .select('id, tarea_id, monto, moneda, estado, notas, created_at, updated_at, socio_id, cantidad, unidad')
              .in('tarea_id', tareaIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from('cuadrillas')
          .select('id, nombre, org_id')
          .eq('org_id', currentUser.orgId),
        // Obtener socios para mapear socio_id -> email
        supabase
          .from('socios')
          .select('id, nombre, email, telefono, org_id')
          .eq('org_id', currentUser.orgId),
      ]);

      // Extraer socio_ids de los presupuestos
      (rawBudgets ?? []).forEach((b: any) => {
        if (b.socio_id) socioIds.add(b.socio_id);
      });

      // Crear mapa de socio_id -> email
      const socioEmailMap = new Map<string, string>();
      // Crear mapa de socio_id -> nombre
      const sociosMap = new Map<string, string>();
      (sociosData ?? []).forEach((s: any) => {
        if (s.id) {
          if (s.email) {
            socioEmailMap.set(s.id, s.email);
          }
          if (s.nombre) {
            sociosMap.set(s.id, s.nombre);
          }
        }
      });

      setTasks(mappedTasks);
      setBudgets((rawBudgets ?? []) as RawPresupuesto[]);
      setCuadrillas((cuadrillasData ?? []) as { id: string; nombre: string }[]);
      setSocioEmailMap(socioEmailMap);
      setSociosMap(sociosMap);
    } catch (err) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : String(err);
      setError('No se pudieron obtener las tareas y presupuestos.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [currentUser?.orgId, obraId, supabase]);

  useEffect(() => {
    void refetchData(true);
  }, [currentUser?.orgId, obraId, supabase]);

  const taskMap = useMemo(() => {
    const map = new Map<string, TaskInfo>();
    tasks.forEach((task) => {
      map.set(task.id, task);
    });
    return map;
  }, [tasks]);

  const cuadrillaMap = useMemo(() => {
    const map = new Map<string, string>();
    cuadrillas.forEach((c) => map.set(c.id, c.nombre));
    return map;
  }, [cuadrillas]);

  const budgetsByTask = useMemo(() => {
    const map = new Map<string, RawPresupuesto[]>();
    budgets.forEach((budget) => {
      const list = map.get(budget.tarea_id) ?? [];
      list.push(budget);
      map.set(budget.tarea_id, list);
    });
    return map;
  }, [budgets]);

  const tasksForBuckets = useMemo(() => {
    return tasks.filter((task) => {
      const hasBudgets = (budgetsByTask.get(task.id)?.length ?? 0) > 0;
      const isPending = !task.cuadrillaId;
      return hasBudgets || isPending;
    });
  }, [tasks, budgetsByTask]);

  const tareasPendientes = useMemo(
    () => tasksForBuckets.filter((task) => !task.cuadrillaId),
    [tasksForBuckets]
  );

  const tareasSinPresupuesto = useMemo(() => {
    return tareasPendientes.filter((task) => {
      const list = budgetsByTask.get(task.id) ?? [];
      return list.length === 0;
    });
  }, [tareasPendientes, budgetsByTask]);

  const stageBuckets = useMemo(() => {
    const map = new Map<
      StageKey,
      {
        key: StageKey;
        label: string;
        description: string;
        accent: string;
        badgeClass: string;
        tasks: TaskInfo[];
      }
    >();

    STAGE_DEFINITIONS.forEach((definition) => {
      map.set(definition.key, {
        ...definition,
        tasks: [],
      });
    });

    map.set(FALLBACK_STAGE.key, {
      ...FALLBACK_STAGE,
      tasks: [],
    });

    tasksForBuckets.forEach((task) => {
      const stageKey = normalizeStage(task.etapa) ?? FALLBACK_STAGE.key;
      const bucket = map.get(stageKey);
      if (bucket) {
        bucket.tasks.push(task);
      }
    });

    const ordered = STAGE_DEFINITIONS.map((definition) => map.get(definition.key)!);
    const fallback = map.get(FALLBACK_STAGE.key)!;
    if (fallback.tasks.length > 0) {
      ordered.push(fallback);
    }

    return ordered;
  }, [tasksForBuckets]);

  useEffect(() => {
    const firstWithTasks = stageBuckets.find((bucket) => bucket.tasks.length > 0);
    if (firstWithTasks) {
      setEtapaActiva(firstWithTasks.key);
    } else {
      setEtapaActiva('estructura');
    }
  }, [stageBuckets]);

  // Preparar datos para cada etapa (StageSummaryCards)
  const etapasData = useMemo(() => {
    return STAGE_DEFINITIONS.map((stageDef) => {
      const bucket = stageBuckets.find((b) => b.key === stageDef.key);
      const tareas = bucket?.tasks ?? [];
      
      // Tareas sin presupuesto
      const tareasSinPresupuesto = tareas.filter((task) => {
        const list = budgetsByTask.get(task.id) ?? [];
        return list.length === 0;
      });

      // Presupuestos para esta etapa
      const tareaIds = tareas.map((t) => t.id);
      const presupuestosEtapa = budgets
        .filter((budget) => tareaIds.includes(budget.tarea_id))
        .map((budget) => {
          const tarea = taskMap.get(budget.tarea_id);
          // Usar el mapa de socios en lugar de cuadrillas
          const socioNombre = sociosMap.get(budget.socio_id ?? '') ?? 'Socio sin nombre';
          // Intentar extraer duración ofrecida de las notas
          let duracionOfrecida: number | null = null;
          if (budget.notas) {
            const match = budget.notas.match(/(\d+)\s*d[ií]a[s]?/i);
            if (match) {
              duracionOfrecida = parseInt(match[1], 10);
            }
          }
          return {
            id: budget.id,
            tarea_id: budget.tarea_id,
            tarea_titulo: tarea?.titulo ?? 'Tarea sin título',
            cuadrilla_nombre: socioNombre,
            monto: budget.monto ?? null,
            moneda: budget.moneda ?? null,
            estado: budget.estado ?? null,
            notas: budget.notas ?? null,
            duracion_estimada: tarea?.duracion_estimada ?? null,
            duracion_ofrecida: duracionOfrecida,
            created_at: budget.created_at ?? '',
            updated_at: budget.updated_at ?? null,
            socio_id: budget.socio_id ?? null,
          };
        });

      return {
        stageKey: stageDef.key,
        stageLabel: stageDef.label,
        stageDescription: stageDef.description,
        tareas: tareas.map((t) => ({
          id: t.id,
          titulo: t.titulo,
          etapa: t.etapa,
          duracion_estimada: t.duracion_estimada ?? null,
        })),
        presupuestos: presupuestosEtapa,
        tareasSinPresupuesto: tareasSinPresupuesto.map((t) => ({
          id: t.id,
          titulo: t.titulo,
          etapa: t.etapa,
          duracion_estimada: t.duracion_estimada ?? null,
        })),
      };
    });
  }, [stageBuckets, budgetsByTask, budgets, taskMap, sociosMap]);

  // handleOpenModal removido - ahora se usa handleOpenPresupuestoModal

  const handleOpenPresupuestoModal = (etapa?: string, tareaId?: string) => {
    // Si no hay obraId, intentar obtenerlo de las tareas
    const obraIdActual = obraId || (tasks.length > 0 ? tasks[0].obraId : null);
    if (!obraIdActual) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar la obra. Seleccioná una obra primero.',
        variant: 'destructive',
      });
      return;
    }

    // Determinar qué tareas mostrar
    let tareasParaModal: typeof presupuestoModalTareas = [];
    
    if (tareaId) {
      // Modal para una sola tarea
      const tarea = tasks.find((t) => t.id === tareaId);
      if (tarea) {
        const elemento = elementosMap.get((tarea as any).elemento_id || '');
        tareasParaModal = [{
          id: tarea.id,
          title: tarea.titulo,
          etapa: tarea.etapa,
          elemento: elemento || null,
          es: (tarea as any).es,
          ef: (tarea as any).ef,
          fecha_inicio_estimada: (tarea as any).fecha_inicio_estimada,
          fecha_fin_estimada: (tarea as any).fecha_fin_estimada,
        }];
        setPresupuestoModalEtapa(tarea.etapa || '');
      }
    } else {
      // Modal para todas las tareas de la etapa especificada
      if (etapa) {
        const bucket = stageBuckets.find((b) => b.key === etapa);
        if (bucket) {
          tareasParaModal = bucket.tasks.map((task) => {
            const elemento = elementosMap.get((task as any).elemento_id || '');
            return {
              id: task.id,
              title: task.titulo,
              etapa: task.etapa,
              elemento: elemento || null,
              es: (task as any).es,
              ef: (task as any).ef,
              fecha_inicio_estimada: (task as any).fecha_inicio_estimada,
              fecha_fin_estimada: (task as any).fecha_fin_estimada,
            };
          });
          setPresupuestoModalEtapa(bucket.label);
        }
      } else {
        // Si no se especifica etapa, usar la primera etapa con tareas
        const firstBucket = stageBuckets.find((b) => b.tasks.length > 0);
        if (firstBucket) {
          tareasParaModal = firstBucket.tasks.map((task) => {
            const elemento = elementosMap.get((task as any).elemento_id || '');
            return {
              id: task.id,
              title: task.titulo,
              etapa: task.etapa,
              elemento: elemento || null,
              es: (task as any).es,
              ef: (task as any).ef,
              fecha_inicio_estimada: (task as any).fecha_inicio_estimada,
              fecha_fin_estimada: (task as any).fecha_fin_estimada,
            };
          });
          setPresupuestoModalEtapa(firstBucket.label);
        }
      }
    }

    setPresupuestoModalObraId(obraIdActual);
    setPresupuestoModalTareas(tareasParaModal);
    setPresupuestoModalOpen(true);
  };

  const handlePresupuestoSuccess = async () => {
    // Recargar datos después de crear presupuesto
    await refetchData(false);
  };

  const handleVerPdf = (cuadrillaNombre: string, presupuestos: any[]) => {
    setPdfModalData({ cuadrillaNombre, presupuestos });
    setPdfModalOpen(true);
  };

  const handleVerLista = (cuadrillaNombre: string, presupuestos: any[]) => {
    setListaModalData({ cuadrillaNombre, presupuestos });
    setListaModalOpen(true);
  };

  const handleRechazarPresupuesto = (cuadrillaNombre: string, presupuestos: any[]) => {
    setRechazarModalData({ cuadrillaNombre, presupuestos });
    setRechazarModalOpen(true);
  };

  const handleComentar = (cuadrillaNombre: string, presupuestos: any[]) => {
    setComentarioModalData({ cuadrillaNombre, presupuestos });
    setComentarioModalOpen(true);
  };

  const handleAbrirAsignacion = () => {
    abrirModalAsignacion();
  };

  // handleCreateBudget removido - ahora se usa SolicitarPresupuestoModal con API

  const handleUpdateBudgetStatus = async (budgetId: string, status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO') => {
    setUpdatingBudgetId(budgetId);
    try {
      const { data, error } = await supabase
        .from('tareas_presupuestos')
        .update({ estado: status, updated_at: new Date().toISOString() })
        .eq('id', budgetId)
        .select()
        .maybeSingle();

      if (error) throw error;

      setBudgets((prev) =>
        prev.map((budget) =>
          budget.id === budgetId
            ? {
                ...budget,
                estado: status,
                updated_at: data?.updated_at ?? new Date().toISOString(),
              }
            : budget
        )
      );

      toast({
        title: status === 'APROBADO' ? 'Presupuesto aprobado' : 'Estado actualizado',
        description:
          status === 'APROBADO'
            ? 'Podés asignar la cuadrilla con esta oferta.'
            : 'Actualizamos el estado del presupuesto.',
      });
    } catch (err) {
      toast({
        title: 'No se pudo actualizar el presupuesto',
        description: 'Intentá nuevamente en unos minutos.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingBudgetId(null);
    }
  };

  const handleAssignBudget = async (budget: RawPresupuesto) => {
    if (!currentUser?.orgId) return;

    const tarea = taskMap.get(budget.tarea_id);
    const socioId = budget.socio_id;
    if (!tarea || !socioId) {
      toast({
        title: 'No se pudo asignar la tarea',
        description: 'Faltan datos del socio o la tarea.',
        variant: 'destructive',
      });
      return;
    }

    // Obtener email del socio (CRÍTICO: el socio busca tareas por email en responsable)
    let socioEmail = socioEmailMap.get(socioId);
    let socioNombre = cuadrillaMap.get(socioId) ?? 'Socio sin nombre';
    
    if (!socioEmail) {
      // Si no tenemos el email en el mapa, obtenerlo de la BD
      const { data: socioData } = await supabase
        .from('socios')
        .select('email, nombre')
        .eq('id', socioId)
        .eq('org_id', currentUser.orgId)
        .maybeSingle();
      
      if (!socioData?.email) {
        toast({
          title: 'No se pudo asignar la tarea',
          description: 'El socio no tiene email registrado. Actualizá los datos del socio.',
          variant: 'destructive',
        });
        return;
      }
      
      socioEmail = socioData.email;
      socioNombre = socioData.nombre ?? socioNombre;
      
      // Actualizar el mapa
      setSocioEmailMap((prev) => {
        const nuevo = new Map(prev);
        nuevo.set(socioId, socioEmail!);
        return nuevo;
      });
    }
    setAssigningBudgetId(budget.id);

    try {
      // CRÍTICO: Guardar el EMAIL del socio en responsable, no el nombre
      const tareaUpdates: Record<string, any> = {
        responsable: socioEmail, // Email del socio para que lo encuentre
        cuadrilla_id: socioId,
      };

      const { error: tareaError } = await supabase
        .from('tareas')
        .update(tareaUpdates)
        .eq('id', budget.tarea_id)
        .eq('org_id', currentUser.orgId);

      if (tareaError) throw tareaError;

      const { error: approveError } = await supabase
        .from('tareas_presupuestos')
        .update({ estado: 'APROBADO', updated_at: new Date().toISOString() })
        .eq('id', budget.id);

      if (approveError) throw approveError;

      const otros = budgets
        .filter((b) => b.tarea_id === budget.tarea_id && b.id !== budget.id)
        .map((b) => b.id);

      if (otros.length) {
        const { error: rejectError } = await supabase
          .from('tareas_presupuestos')
          .update({ estado: 'RECHAZADO', updated_at: new Date().toISOString() })
          .in('id', otros);

        if (rejectError) throw rejectError;
      }

      // Crear notificación para el socio
      // Notificación Supabase: usamos siempre remitente_id + destinatario_id (no usar socio_id)
      try {
        await (supabase as any).from('notificaciones').insert({
          org_id: currentUser.orgId,
          remitente_id: currentUser.id,
          destinatario_id: socioId,
          obra_id: tarea.obraId,
          tarea_id: budget.tarea_id,
          titulo: 'Tarea asignada',
          mensaje: `Te asignaron la tarea "${tarea.titulo}" en la obra.`,
          tipo: 'asignacion',
          leida: false,
          created_at: new Date().toISOString(),
        });
      } catch (notifError) {
        // No fallar si la notificación no se crea
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === budget.tarea_id
            ? {
                ...task,
                responsable: socioEmail ?? null,
                cuadrillaId: socioId,
              }
            : task
        )
      );

      setBudgets((prev) =>
        prev.map((b) => {
          if (b.id === budget.id) {
            return {
              ...b,
              estado: 'APROBADO',
              updated_at: new Date().toISOString(),
            };
          }
          if (b.tarea_id === budget.tarea_id) {
            return {
              ...b,
              estado: 'RECHAZADO',
              updated_at: new Date().toISOString(),
            };
          }
          return b;
        })
      );

      toast({
        title: 'Tarea asignada',
        description: `Asignaste la tarea a ${socioNombre}. El socio recibirá una notificación.`,
      });
    } catch (err) {
      toast({
        title: 'No se pudo asignar la tarea',
        description: 'Intentá nuevamente en unos minutos.',
        variant: 'destructive',
      });
    } finally {
      setAssigningBudgetId(null);
    }
  };

  const handleAprobarPresupuesto = async (socioId: string, etapaId: string) => {
    if (!currentUser?.orgId || !currentUser?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar la organización o usuario.',
        variant: 'destructive',
      });
      return;
    }

    // Obtener obraId desde las tareas si no está disponible
    const obraIdActual = obraId || (tasks.length > 0 ? tasks[0].obraId : null);
    if (!obraIdActual) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar la obra.',
        variant: 'destructive',
      });
      return;
    }

    setAprobandoPresupuestoSocioId(socioId);

    try {
      const url = `/api/presupuestos/aprobar-socio`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socio_id: socioId,
          obra_id: obraIdActual,
          etapa_id: etapaId,
        }),
      });

      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        toast({
          title: 'Error al aprobar presupuesto',
          description: `El servidor respondió con un error (${response.status}). Verificá la consola para más detalles.`,
          variant: 'destructive',
        });
        return;
      }

      const data = await response.json().catch(() => {
        return { success: false, error: 'Error al parsear la respuesta del servidor' };
      });

      if (!response.ok) {
        toast({
          title: 'Error al aprobar presupuesto',
          description: data.error || `Error ${response.status}: No se pudo aprobar el presupuesto.`,
          variant: 'destructive',
        });
        return;
      }

      if (data.success && data.ok) {
        const tareasAprobadas = data.tareas_aprobadas || 0;
        
        // Mostrar banner de éxito
        setSuccessBanner({
          message: `Presupuesto aprobado con éxito. ${tareasAprobadas} tarea${tareasAprobadas === 1 ? '' : 's'} asignada${tareasAprobadas === 1 ? '' : 's'}.`,
          tareasAprobadas,
        });

        // Ocultar banner después de 5 segundos (opcional)
        setTimeout(() => {
          setSuccessBanner(null);
        }, 5000);

        // Refrescar datos sin recargar la página
        await refetchData(false);

        toast({
          title: 'Presupuesto aprobado',
          description: `Se aprobaron y asignaron ${tareasAprobadas} tarea${tareasAprobadas === 1 ? '' : 's'} correctamente.`,
        });
      } else if (data.warning) {
        toast({
          title: 'Proceso completado con advertencias',
          description: data.warning,
          variant: 'default',
        });
        // Refrescar datos de todas formas
        await refetchData(false);
      } else {
        toast({
          title: 'Error inesperado',
          description: 'La respuesta del servidor no fue la esperada.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error al aprobar presupuesto',
        description: err instanceof Error ? err.message : 'Ocurrió un error inesperado. Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setAprobandoPresupuestoSocioId(null);
    }
  };

  // Calcular estadísticas de presupuestos (debe estar antes de los early returns)
  const estadisticasPresupuestos = useMemo(() => {
    if (!budgets || budgets.length === 0) {
      return { pendientes: 0, enviados: 0, aprobados: 0 };
    }

    const presupuestosFiltrados = obraId
      ? budgets.filter((budget) => {
          const tarea = taskMap.get(budget.tarea_id);
          return tarea?.obraId === obraId;
        })
      : budgets;

    const pendientes = presupuestosFiltrados.filter(
      (budget) => (budget.estado ?? '').toUpperCase() === 'PENDIENTE'
    ).length;
    
    const enviados = presupuestosFiltrados.filter(
      (budget) => {
        const estado = (budget.estado ?? '').toUpperCase();
        return estado === 'PEDIDO' || estado === 'PENDIENTE';
      }
    ).length;
    
    const aprobados = presupuestosFiltrados.filter(
      (budget) => (budget.estado ?? '').toUpperCase() === 'APROBADO'
    ).length;

    return { pendientes, enviados, aprobados };
  }, [budgets, obraId, taskMap]);

  if (!currentUser?.orgId) {
    return (
      <EmptyState
        title="Iniciá sesión nuevamente"
        description="Necesitás una organización activa para gestionar asignaciones."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando tareas y presupuestos…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-amber-200 bg-amber-50 text-amber-700">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">No pudimos cargar los datos</h3>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      {/* Banner de éxito */}
      {successBanner && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Presupuesto aprobado con éxito</h3>
              <p className="text-sm text-green-700">{successBanner.message}</p>
            </div>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-green-600 hover:text-green-800"
              aria-label="Cerrar"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Panel de Estado */}
      <PanelEstado
        presupuestosPendientes={estadisticasPresupuestos.pendientes}
        presupuestosEnviados={estadisticasPresupuestos.enviados}
        presupuestosAprobados={estadisticasPresupuestos.aprobados}
      />

      {/* Stage Summary Cards */}
      <div className="space-y-4">
        {etapasData.map((etapaData) => {
          // Solo mostrar etapas que tengan tareas
          if (etapaData.tareas.length === 0) return null;

          return (
            <StageSummaryCard
              key={etapaData.stageKey}
              stageKey={etapaData.stageKey}
              stageLabel={etapaData.stageLabel}
              stageDescription={etapaData.stageDescription}
              tareas={etapaData.tareas}
              presupuestos={etapaData.presupuestos}
              tareasSinPresupuesto={etapaData.tareasSinPresupuesto}
              onSolicitarPresupuesto={(tareaIds) => {
                if (tareaIds.length === 1) {
                  handleOpenPresupuestoModal(etapaData.stageKey, tareaIds[0]);
                } else {
                  handleOpenPresupuestoModal(etapaData.stageKey);
                }
              }}
              onAprobar={(id) => handleUpdateBudgetStatus(id, 'APROBADO')}
              onRechazar={(id) => handleUpdateBudgetStatus(id, 'RECHAZADO')}
              onAsignar={(id) => {
                const presupuesto = budgets.find((b) => b.id === id);
                if (presupuesto) handleAssignBudget(presupuesto);
              }}
              onAprobarPresupuesto={handleAprobarPresupuesto}
              onVerPdf={handleVerPdf}
              onVerLista={handleVerLista}
              onRechazarPresupuesto={handleRechazarPresupuesto}
              onComentar={handleComentar}
              actualizandoId={updatingBudgetId}
              asignandoId={assigningBudgetId}
              aprobandoPresupuestoSocioId={aprobandoPresupuestoSocioId}
            />
          );
        })}
      </div>

      {/* Mensaje si no hay tareas */}
      {!stageBuckets.some((bucket) => bucket.tasks && bucket.tasks.length > 0) && (
        <EmptyState
          title="No hay tareas pendientes de asignación"
          description="Cuando se creen nuevas tareas sin cuadrilla vas a poder gestionarlas desde acá."
        />
      )}

      {/* Modal de solicitud de presupuesto */}
      {presupuestoModalOpen && presupuestoModalObraId && (
        <SolicitarPresupuestoModal
          open={presupuestoModalOpen}
          onClose={() => setPresupuestoModalOpen(false)}
          obraId={presupuestoModalObraId}
          etapa={presupuestoModalEtapa}
          tareas={presupuestoModalTareas}
          onSuccess={handlePresupuestoSuccess}
        />
      )}

      {/* Modales de PDF, Lista y Rechazar */}
      {pdfModalData && (
        <PresupuestoPDFModal
          open={pdfModalOpen}
          onClose={() => {
            setPdfModalOpen(false);
            setPdfModalData(null);
          }}
          cuadrillaNombre={pdfModalData.cuadrillaNombre}
          presupuestos={pdfModalData.presupuestos}
        />
      )}

      {listaModalData && (
        <PresupuestoListaModal
          open={listaModalOpen}
          onClose={() => {
            setListaModalOpen(false);
            setListaModalData(null);
          }}
          cuadrillaNombre={listaModalData.cuadrillaNombre}
          presupuestos={listaModalData.presupuestos}
        />
      )}

      {rechazarModalData && (
        <PresupuestoRechazarModal
          open={rechazarModalOpen}
          onClose={() => {
            setRechazarModalOpen(false);
            setRechazarModalData(null);
          }}
          cuadrillaNombre={rechazarModalData.cuadrillaNombre}
          presupuestos={rechazarModalData.presupuestos}
          obraId={obraIdActual || null}
          onSuccess={() => refetchData(false)}
        />
      )}

      {comentarioModalData && (
        <PresupuestoComentarioModal
          open={comentarioModalOpen}
          onClose={() => {
            setComentarioModalOpen(false);
            setComentarioModalData(null);
          }}
          cuadrillaNombre={comentarioModalData.cuadrillaNombre}
          presupuestos={comentarioModalData.presupuestos}
          obraId={obraIdActual || null}
        />
      )}
    </div>
  );
}
