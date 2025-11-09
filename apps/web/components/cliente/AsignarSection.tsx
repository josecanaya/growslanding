'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  PlusCircle,
  Search,
  Users,
  XCircle,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  EmptyState,
} from '@/components/ui/grows';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Database } from '@/lib/types/supabase.gen';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';

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

const STATUS_OPTIONS = ['PENDIENTE', 'APROBADO', 'RECHAZADO'];

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
  cuadrilla_id?: string | null;
  socio_id?: string | null;
};

type TaskInfo = {
  id: string;
  titulo: string;
  etapa: string | null;
  obraId: string;
  responsable: string | null;
  cuadrillaId: string | null;
  estado: string | null;
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
    () => createClientComponentClient<Database>(),
    []
  );
  const abrirModalAsignacion = useCuadrillasStore((state) => state.abrirModalAsignacion);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [budgets, setBudgets] = useState<RawPresupuesto[]>([]);
  const [cuadrillas, setCuadrillas] = useState<{ id: string; nombre: string }[]>([]);
  const [linkKey, setLinkKey] = useState<'cuadrilla_id' | 'socio_id'>('cuadrilla_id');

  const [stageFilter, setStageFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedCuadrilla, setSelectedCuadrilla] = useState<string>('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [notas, setNotas] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);
  const [assigningBudgetId, setAssigningBudgetId] = useState<string | null>(null);
  const [updatingBudgetId, setUpdatingBudgetId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function detectLinkKey() {
      try {
        const { data } = await supabase
          .from('tareas_presupuestos')
          .select('cuadrilla_id, socio_id')
          .limit(1)
          .maybeSingle();
        if (!active) return;
        if (data && 'cuadrilla_id' in data && data?.cuadrilla_id !== undefined) {
          setLinkKey('cuadrilla_id');
        } else if (data && 'socio_id' in data && data?.socio_id !== undefined) {
          setLinkKey('socio_id');
        } else {
          setLinkKey('cuadrilla_id');
        }
      } catch {
        setLinkKey('cuadrilla_id');
      }
    }

    void detectLinkKey();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!currentUser?.orgId) {
        setError('No se pudo identificar tu organización.');
        setLoading(false);
        return;
      }

      setLoading(true);
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

          obraIds = (obrasData ?? []).map((obra) => obra.id as string).filter(Boolean);
        }

        if (!obraIds.length) {
          if (!active) return;
          setTasks([]);
          setBudgets([]);
          setCuadrillas([]);
          setLoading(false);
          return;
        }

        const { data: rawTasks, error: tareasError } = await supabase
          .from('tareas')
          .select('id, title, nombre, etapa, obra_id, responsable, estado, cuadrilla_id')
          .in('obra_id', obraIds);

        if (tareasError) throw tareasError;

        const mappedTasks: TaskInfo[] = (rawTasks ?? []).map((row: RawTarea) => ({
          id: row.id,
          titulo: row.title ?? row.nombre ?? 'Tarea sin título',
          etapa: row.etapa ?? null,
          obraId: row.obra_id,
          responsable: row.responsable ?? null,
          cuadrillaId: row.cuadrilla_id ?? null,
          estado: row.estado ?? null,
        }));

        const tareaIds = mappedTasks.map((t) => t.id);

        const [{ data: rawBudgets }, { data: cuadrillasData }] = await Promise.all([
          tareaIds.length
            ? supabase
                .from('tareas_presupuestos')
                .select('id, tarea_id, monto, moneda, estado, notas, created_at, updated_at, cuadrilla_id, socio_id')
                .in('tarea_id', tareaIds)
            : Promise.resolve({ data: [] }),
          supabase
            .from('cuadrillas')
            .select('id, nombre, org_id')
            .eq('org_id', currentUser.orgId),
        ]);

        if (!active) return;

        setTasks(mappedTasks);
        setBudgets((rawBudgets ?? []) as RawPresupuesto[]);
        setCuadrillas((cuadrillasData ?? []) as { id: string; nombre: string }[]);
      } catch (err) {
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : String(err);
        console.error('[AsignarSection] Error fetching data', errorMessage, err);
        try {
          console.error('[AsignarSection] Error detail', JSON.stringify(err, null, 2));
        } catch {
          // ignore JSON stringify issues
        }
        if (active) {
          setError('No se pudieron obtener las tareas y presupuestos.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
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

  const tareasPendientes = useMemo(
    () => tasks.filter((task) => !task.cuadrillaId),
    [tasks]
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

    tareasPendientes.forEach((task) => {
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
  }, [tareasPendientes]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const tarea = taskMap.get(budget.tarea_id);
      if (!tarea) return false;

      if (stageFilter !== 'todas') {
        const etapa = tarea.etapa ? tarea.etapa.toLowerCase() : '';
        if (!etapa.includes(stageFilter)) return false;
      }

      if (statusFilter !== 'todos') {
        const estado = (budget.estado ?? '').toUpperCase();
        if (estado !== statusFilter.toUpperCase()) return false;
      }

      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matchesTarea = tarea.titulo.toLowerCase().includes(term);
        const vinculoId = (linkKey === 'cuadrilla_id' ? budget.cuadrilla_id : budget.socio_id) ?? '';
        const cuadrilla = cuadrillaMap.get(vinculoId) ?? '';
        if (!matchesTarea && !cuadrilla.toLowerCase().includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [budgets, taskMap, cuadrillaMap, stageFilter, statusFilter, search, linkKey]);

  const handleOpenModal = (taskId?: string) => {
    if (taskId) {
      setSelectedTask(taskId);
    } else {
      setSelectedTask('');
    }
    setSelectedCuadrilla('');
    setMonto('');
    setMoneda('ARS');
    setNotas('');
    setModalOpen(true);
  };

  const handleCreateBudget = async () => {
    if (!currentUser?.orgId || !selectedTask || !selectedCuadrilla || !monto) return;

    const montoNumber = Number.parseFloat(monto);
    if (Number.isNaN(montoNumber)) {
      toast({
        title: 'Monto inválido',
        description: 'Ingresá un número válido para el monto.',
        variant: 'destructive',
      });
      return;
    }

    const payload: Record<string, any> = {
      tarea_id: selectedTask,
      monto: montoNumber,
      moneda,
      estado: 'PENDIENTE',
      notas: notas || null,
    };

    if (linkKey === 'cuadrilla_id') {
      payload.cuadrilla_id = selectedCuadrilla;
    } else {
      payload.socio_id = selectedCuadrilla;
    }

    setSavingBudget(true);

    try {
      const { data, error: insertError } = await supabase
        .from('tareas_presupuestos')
        .insert(payload)
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      if (data) {
        setBudgets((prev) => [data as RawPresupuesto, ...prev]);
      }

      toast({
        title: 'Solicitud registrada',
        description: 'Se envió la solicitud de presupuesto a la cuadrilla seleccionada.',
      });
      setModalOpen(false);
    } catch (err) {
      console.error('[AsignarSection] Error inserting presupuesto', err);
      toast({
        title: 'No se pudo registrar el presupuesto',
        description: 'Intentá nuevamente en unos minutos.',
        variant: 'destructive',
      });
    } finally {
      setSavingBudget(false);
    }
  };

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
      console.error('[AsignarSection] Error updating presupuesto', err);
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
    const vinculoId = linkKey === 'cuadrilla_id' ? budget.cuadrilla_id : budget.socio_id;
    if (!tarea || !vinculoId) {
      toast({
        title: 'No se pudo asignar la tarea',
        description: 'Faltan datos de la cuadrilla o la tarea.',
        variant: 'destructive',
      });
      return;
    }

    const cuadrillaNombre = cuadrillaMap.get(vinculoId) ?? 'Cuadrilla sin nombre';
    setAssigningBudgetId(budget.id);

    try {
      const tareaUpdates: Record<string, any> = {
        responsable: cuadrillaNombre,
        cuadrilla_id: linkKey === 'cuadrilla_id' ? vinculoId : null,
      };

      const { error: tareaError } = await supabase
        .from('tareas')
        .update(tareaUpdates)
        .eq('id', budget.tarea_id);

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

      setTasks((prev) =>
        prev.map((task) =>
          task.id === budget.tarea_id
            ? {
                ...task,
                responsable: cuadrillaNombre,
                cuadrillaId: linkKey === 'cuadrilla_id' ? vinculoId : task.cuadrillaId,
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
        description: `Asignaste la tarea a ${cuadrillaNombre}.`,
      });
    } catch (err) {
      console.error('[AsignarSection] Error asignando tarea', err);
      toast({
        title: 'No se pudo asignar la tarea',
        description: 'Intentá nuevamente en unos minutos.',
        variant: 'destructive',
      });
    } finally {
      setAssigningBudgetId(null);
    }
  };

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

  const totalBudgets = budgets.length;
  const approvedBudgets = budgets.filter(
    (budget) => (budget.estado ?? '').toUpperCase() === 'APROBADO'
  ).length;
  const pendingBudgets = budgets.filter(
    (budget) => (budget.estado ?? '').toUpperCase() === 'PENDIENTE'
  ).length;

  const renderBudgetActions = (budget: RawPresupuesto) => {
    const status = (budget.estado ?? 'PENDIENTE').toUpperCase();
    return (
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          icon={<CheckCircle className="h-4 w-4" />}
          onClick={() => void handleUpdateBudgetStatus(budget.id, 'APROBADO')}
          disabled={updatingBudgetId === budget.id || status === 'APROBADO'}
        >
          Aprobar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<XCircle className="h-4 w-4" />}
          onClick={() => void handleUpdateBudgetStatus(budget.id, 'RECHAZADO')}
          disabled={updatingBudgetId === budget.id || status === 'RECHAZADO'}
        >
          Rechazar
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={
            assigningBudgetId === budget.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )
          }
          onClick={() => void handleAssignBudget(budget)}
          disabled={assigningBudgetId === budget.id}
        >
          Asignar
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tareas sin cuadrilla
            </p>
            <p className="text-2xl font-semibold text-slate-900">{tareasPendientes.length}</p>
            <p className="text-xs text-slate-500">
              {tareasSinPresupuesto.length} sin presupuestos recibidos
            </p>
          </div>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Solicitudes pendientes
            </p>
            <p className="text-2xl font-semibold text-slate-900">{pendingBudgets}</p>
            <p className="text-xs text-slate-500">
              Presupuestos esperando respuesta de cuadrillas
            </p>
          </div>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Presupuestos aprobados
            </p>
            <p className="text-2xl font-semibold text-slate-900">{approvedBudgets}</p>
            <p className="text-xs text-slate-500">
              Sobre un total de {totalBudgets} presupuestos registrados
            </p>
          </div>
        </Card>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Asigná por etapas</h2>
            <p className="text-sm text-slate-500">
              Visualizá cada etapa de la obra, solicitá presupuestos y confirmá la cuadrilla indicada.
            </p>
          </div>
          <Button variant="primary" icon={<PlusCircle className="h-4 w-4" />} onClick={() => handleOpenModal()}>
            Solicitar presupuesto
          </Button>
        </div>

        {stageBuckets.some((bucket) => bucket.tasks.length > 0) ? (
          <div className="space-y-6">
            {stageBuckets.map((bucket) => {
              if (bucket.tasks.length === 0) return null;

              return (
                <div
                  key={bucket.key}
                  className={`rounded-3xl border p-6 shadow-sm ${bucket.accent}`}
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{bucket.label}</h3>
                      <p className="text-sm text-slate-600">{bucket.description}</p>
                    </div>
                    <Badge className={bucket.badgeClass}>
                      {bucket.tasks.length} tarea{bucket.tasks.length === 1 ? '' : 's'} por asignar
                    </Badge>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {bucket.tasks.map((task) => {
                      const taskBudgets = budgetsByTask.get(task.id) ?? [];
                      const hayPresupuestos = taskBudgets.length > 0;
                      const estadoResponsable = task.responsable
                        ? `Asignada a ${task.responsable}`
                        : 'Sin asignar';

                      return (
                        <Card key={task.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="space-y-4 p-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h4 className="text-base font-semibold text-slate-900">{task.titulo}</h4>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <Badge variant="default">{bucket.label}</Badge>
                                  <span>{estadoResponsable}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => abrirModalAsignacion()}>
                                  Asignar manualmente
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleOpenModal(task.id)}>
                                  Pedir presupuesto
                                </Button>
                              </div>
                            </div>

                            {hayPresupuestos ? (
                              <div className="space-y-3">
                                {taskBudgets.map((budget) => {
                                  const vinculoId =
                                    linkKey === 'cuadrilla_id' ? budget.cuadrilla_id : budget.socio_id;
                                  const cuadrillaNombre =
                                    (vinculoId && cuadrillaMap.get(vinculoId)) ?? 'Sin cuadrilla';
                                  const estado = (budget.estado ?? 'PENDIENTE').toUpperCase();
                                  const montoFormateado =
                                    budget.monto !== null && budget.monto !== undefined
                                      ? new Intl.NumberFormat('es-AR', {
                                          style: 'currency',
                                          currency: budget.moneda ?? 'ARS',
                                        }).format(budget.monto ?? 0)
                                      : 'Monto no informado';

                                  return (
                                    <div
                                      key={budget.id}
                                      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                                    >
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">{cuadrillaNombre}</p>
                                          <p className="text-xs text-slate-500">{montoFormateado}</p>
                                          {budget.notas && (
                                            <p className="text-xs text-slate-500">{budget.notas}</p>
                                          )}
                                        </div>
                                        <Badge
                                          variant={
                                            estado === 'APROBADO'
                                              ? 'success'
                                              : estado === 'RECHAZADO'
                                              ? 'error'
                                              : 'warning'
                                          }
                                        >
                                          {estado}
                                        </Badge>
                                      </div>
                                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                                        {renderBudgetActions(budget)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                Aún no hay presupuestos registrados para esta tarea.
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No hay tareas pendientes de asignación"
            description="Cuando se creen nuevas tareas sin cuadrilla vas a poder gestionarlas desde acá."
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filtrar por etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las etapas</SelectItem>
              {STAGE_DEFINITIONS.map((stage) => (
                  <SelectItem key={stage.key} value={stage.key}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por tarea o cuadrilla"
                className="pl-9"
              />
            </div>
          </div>

          <Button variant="primary" icon={<PlusCircle className="h-4 w-4" />} onClick={() => handleOpenModal()}>
            Solicitar presupuesto
          </Button>
        </div>

        {filteredBudgets.length ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[140px_180px_1fr_120px_140px_200px] bg-slate-50 px-6 py-3 text-xs font-semibold uppercase text-slate-500 lg:grid">
              <span>Fecha</span>
              <span>Cuadrilla</span>
              <span>Tarea</span>
              <span>Etapa</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredBudgets.map((budget) => {
                const tarea = taskMap.get(budget.tarea_id);
                if (!tarea) return null;
                const fecha = formatDate(budget.created_at);
                const vinculoId =
                  (linkKey === 'cuadrilla_id' ? budget.cuadrilla_id : budget.socio_id) ?? '';
                const cuadrillaNombre = cuadrillaMap.get(vinculoId) ?? 'Sin cuadrilla asignada';
                const etapa = tarea.etapa ?? 'Sin etapa';
                const estado = (budget.estado ?? 'PENDIENTE').toUpperCase();
                const montoFormateado =
                  budget.monto !== null && budget.monto !== undefined
                    ? new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: budget.moneda ?? 'ARS',
                      }).format(budget.monto ?? 0)
                    : null;

                return (
                  <div
                    key={budget.id}
                    className="grid grid-cols-1 gap-4 px-6 py-4 text-sm text-slate-700 lg:grid-cols-[140px_180px_1fr_120px_140px_200px]"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{fecha}</p>
                      {budget.updated_at && (
                        <p className="text-xs text-slate-500">
                          Actualizado {formatDate(budget.updated_at)}
                        </p>
                      )}
                    </div>
                    <div className="font-medium text-slate-900">{cuadrillaNombre}</div>
                    <div>
                      <p className="font-medium text-slate-900">{tarea.titulo}</p>
                      {montoFormateado && (
                        <p className="text-xs text-slate-500">{montoFormateado}</p>
                      )}
                      {budget.notas && (
                        <p className="text-xs text-slate-500">{budget.notas}</p>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">{etapa ?? 'Sin etapa'}</div>
                    <div>
                      <Badge
                        variant={
                          estado === 'APROBADO'
                            ? 'success'
                            : estado === 'RECHAZADO'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {estado}
                      </Badge>
                    </div>
                    <div>{renderBudgetActions(budget)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No hay presupuestos registrados"
            description="Cuando solicites presupuestos a las cuadrillas los vas a ver acá."
          />
        )}
      </section>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar presupuesto</DialogTitle>
            <DialogDescription>
              Elegí una tarea pendiente y la cuadrilla a la que querés enviar la solicitud.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tarea
              </label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una tarea" />
                </SelectTrigger>
                <SelectContent>
                  {tareasPendientes.length === 0 ? (
                    <SelectItem value="" disabled>
                      No hay tareas disponibles
                    </SelectItem>
                  ) : (
                    tareasPendientes.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.titulo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Cuadrilla
              </label>
              <Select value={selectedCuadrilla} onValueChange={setSelectedCuadrilla}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una cuadrilla" />
                </SelectTrigger>
                <SelectContent>
                  {cuadrillas.length === 0 ? (
                    <SelectItem value="" disabled>
                      No hay cuadrillas disponibles
                    </SelectItem>
                  ) : (
                    cuadrillas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Monto estimado
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(event) => setMonto(event.target.value)}
                  placeholder="Ej: 120000"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Moneda
                </label>
                <Select value={moneda} onValueChange={setMoneda}>
                  <SelectTrigger>
                    <SelectValue placeholder="ARS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Notas adicionales
              </label>
              <textarea
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
                placeholder="Agregá contexto o requisitos específicos"
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={savingBudget}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreateBudget()}
              disabled={
                savingBudget ||
                !selectedTask ||
                !selectedCuadrilla ||
                !monto ||
                Number.isNaN(Number.parseFloat(monto))
              }
            >
              {savingBudget ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              <span>Enviar solicitud</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


