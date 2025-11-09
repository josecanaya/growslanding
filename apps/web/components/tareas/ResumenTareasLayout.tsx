'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Clock4,
  FileText,
  LayoutDashboard,
  ListChecks,
  Timer,
} from 'lucide-react';

import { Button, Card } from '@/components/ui/grows';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { ObraResumen, TareaResumen } from '@/lib/supabase/tareasService';
import { fetchObraResumen, fetchTareasPorObra } from '@/lib/supabase/tareasService';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

type EstadoKey = 'pendiente' | 'en_progreso' | 'completada';
type TipoKey = 'campo' | 'tecnica' | 'administrativa' | 'otros';

const ESTADO_LABEL: Record<EstadoKey, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#facc15' },
  en_progreso: { label: 'En progreso', color: '#2563eb' },
  completada: { label: 'Completada', color: '#16a34a' },
};

const TIPO_CONFIG: Record<TipoKey, { label: string; description: string; color: string }> = {
  campo: {
    label: 'Tareas de Campo',
    description: 'Actividades operativas y en obra.',
    color: '#0057D8',
  },
  tecnica: {
    label: 'Tareas Técnicas',
    description: 'Coordinación, planos y soporte técnico.',
    color: '#64748B',
  },
  administrativa: {
    label: 'Tareas Administrativas',
    description: 'Documentación, permisos y gestiones.',
    color: '#00C896',
  },
  otros: {
    label: 'Otros',
    description: 'Tareas sin clasificación definida.',
    color: '#A855F7',
  },
};

function normalizarTipo(tipo: string | null | undefined): TipoKey {
  if (!tipo) return 'otros';
  const normalized = tipo.toLowerCase();
  if (normalized.includes('campo')) return 'campo';
  if (normalized.includes('tecn')) return 'tecnica';
  if (normalized.includes('admin')) return 'administrativa';
  return 'otros';
}

function normalizarEstado(estado: string | null | undefined): EstadoKey {
  switch ((estado ?? '').toLowerCase()) {
    case 'completada':
    case 'finalizada':
    case 'validada':
      return 'completada';
    case 'en_progreso':
    case 'en ejecucion':
    case 'en_ejecucion':
      return 'en_progreso';
    default:
      return 'pendiente';
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
}

type ResumenTareasLayoutProps = {
  initialObraId?: string | null;
};

export function ResumenTareasLayout({ initialObraId }: ResumenTareasLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = initialObraId ?? searchParams.get('obraId') ?? '';
  const currentUser = useCurrentUser();
  const orgId = currentUser?.orgId ?? null;

  const [loading, setLoading] = useState(false);
  const [obra, setObra] = useState<ObraResumen | null>(null);
  const [tareas, setTareas] = useState<TareaResumen[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!obraId || !orgId) return;

    const supabase = createClientComponentClient<Database>();

    console.info('[ResumenTareasLayout] Cargando resumen', { obraId, orgId });

    async function load() {
      try {
        setLoading(true);
        const [obraData, tareasData] = await Promise.all([
          fetchObraResumen(supabase, obraId, orgId),
          fetchTareasPorObra(supabase, obraId, orgId),
        ]);

        if (!mounted) return;
        setObra(obraData);
        setTareas(tareasData);
        setError(null);
      } catch (err) {
        console.error('[ResumenTareasLayout] Error cargando tareas', err);
        try {
          console.error('[ResumenTareasLayout] Error detallado', JSON.stringify(err, null, 2));
        } catch (jsonErr) {
          console.error('[ResumenTareasLayout] No se pudo serializar el error', jsonErr);
        }
        if (mounted) {
          const fallbackMessage =
            err && typeof err === 'object' && 'message' in err
              ? (err as { message?: string }).message || 'Error desconocido'
              : 'Error desconocido';
          setError(`Hubo un problema al cargar las tareas de la obra. ${fallbackMessage}`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [obraId, orgId]);

  const { total, pendientes, enProgreso, completadas } = useMemo(() => {
    const estados = tareas.reduce<Record<EstadoKey, number>>(
      (acc, tarea) => {
        const estado = normalizarEstado(tarea.estado);
        acc[estado] += 1;
        return acc;
      },
      { pendiente: 0, en_progreso: 0, completada: 0 },
    );

    return {
      total: tareas.length,
      pendientes: estados.pendiente,
      enProgreso: estados.en_progreso,
      completadas: estados.completada,
    };
  }, [tareas]);

  const progresoGeneral = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const tareasPorTipo = useMemo(() => {
    const agrupado = tareas.reduce<Record<TipoKey, { total: number; completadas: number }>>(
      (acc, tarea) => {
        const tipo = normalizarTipo(tarea.tipo);
        const estado = normalizarEstado(tarea.estado);

        if (!acc[tipo]) {
          acc[tipo] = { total: 0, completadas: 0 };
        }

        acc[tipo].total += 1;
        if (estado === 'completada') {
          acc[tipo].completadas += 1;
        }

        return acc;
      },
      {
        campo: { total: 0, completadas: 0 },
        tecnica: { total: 0, completadas: 0 },
        administrativa: { total: 0, completadas: 0 },
        otros: { total: 0, completadas: 0 },
      },
    );

    (Object.keys(agrupado) as TipoKey[]).forEach((key) => {
      if (agrupado[key].total === 0) {
        delete agrupado[key];
      }
    });

    return agrupado;
  }, [tareas]);

  const timeline = useMemo(() => {
    return [...tareas]
      .sort((a, b) => {
        const fechaA = a.fecha_fin_estimada ?? a.fecha_inicio_estimada ?? '';
        const fechaB = b.fecha_fin_estimada ?? b.fecha_inicio_estimada ?? '';
        return fechaB.localeCompare(fechaA);
      })
      .slice(0, 10);
  }, [tareas]);

  if (!obraId) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        <div className="mx-auto max-w-md space-y-4">
          <LayoutDashboard className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-800">Seleccioná una obra</h2>
          <p>
            Para ver el resumen de tareas necesitás elegir una obra. Desde el listado de tareas
            seleccioná una obra y volvé a esta pantalla.
          </p>
          <Button variant="primary" onClick={() => router.push('/cliente/tareas')}>
            Ir al listado de tareas
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        <div className="space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
          <p className="text-sm text-slate-500">Cargando resumen de tareas…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center text-amber-700 shadow-sm">
        <div className="space-y-4">
          <Activity className="mx-auto h-12 w-12" />
          <p>{error}</p>
          <Button variant="secondary" onClick={() => router.refresh()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (tareas.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        <div className="space-y-4">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-800">No hay tareas para esta obra</h2>
          <p>
            Todavía no se registraron tareas. Sumá tareas desde &quot;Ver todas las tareas&quot; o desde
            la sección de planificación.
          </p>
          <Button variant="primary" onClick={() => router.push('/cliente/tareas')}>
            Ver todas las tareas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {obra?.nombre ?? 'Obra sin nombre'}
                </h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  En progreso
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Cliente: {obra?.cliente ?? 'Sin asignar'} · Tipo:{' '}
                {obra?.tipo_obra ?? 'No especificado'}
              </p>
              <p className="text-xs text-slate-400">
                Inicio: {obra?.fecha_inicio ? formatDate(obra.fecha_inicio) : 'No definido'} ·{' '}
                Actualizado: {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-semibold text-blue-600">{progresoGeneral}%</div>
              <p className="text-sm text-slate-500">Progreso general de tareas</p>
            </div>
            <Button variant="primary" onClick={() => router.push(`/cliente/tareas?obraId=${obraId}`)}>
              Ver todas las tareas
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total de tareas</p>
              <p className="text-2xl font-semibold text-slate-800">{total}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-green-50 p-3 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Completadas</p>
              <p className="text-2xl font-semibold text-slate-800">{completadas}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">En progreso</p>
              <p className="text-2xl font-semibold text-slate-800">{enProgreso}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-500">
              <Clock4 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Pendientes</p>
              <p className="text-2xl font-semibold text-slate-800">{pendientes}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tipos de tareas */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Tipos de tareas</h3>
          <p className="text-sm text-slate-500">
            Distribución de tareas según su naturaleza y responsabilidad.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {(Object.keys(tareasPorTipo) as TipoKey[]).map((tipo) => {
            const config = TIPO_CONFIG[tipo];
            const stats = tareasPorTipo[tipo];
            const porcentaje =
              stats.total > 0 ? Math.round((stats.completadas / stats.total) * 100) : 0;

            return (
              <div
                key={tipo}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-800">{config.label}</h4>
                      <p className="text-sm text-slate-500">{config.description}</p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: config.color }}
                    >
                      {stats.total} tareas
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${porcentaje}%`, backgroundColor: config.color }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {stats.completadas} completadas · {stats.total - stats.completadas} restantes
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() =>
                    router.push(`/cliente/tareas?obraId=${obraId}&tipo=${tipo === 'otros' ? '' : tipo}`)
                  }
                >
                  Ver detalle
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Timeline de ejecución</h3>
          <p className="text-sm text-slate-500">
            Últimas actividades ordenadas por fecha estimada de ejecución.
          </p>
        </div>

        <div className="space-y-4">
          {timeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No hay tareas registradas para esta obra.
            </div>
          ) : (
            timeline.map((tarea) => {
              const estado = normalizarEstado(tarea.estado);
              const estadoConfig = ESTADO_LABEL[estado];

              return (
                <div
                  key={tarea.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {tarea.titulo ?? 'Tarea sin título'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Responsable: {tarea.responsable ?? 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-sm font-medium text-slate-600">
                      {formatDate(tarea.fecha_inicio_estimada) ||
                        formatDate(tarea.fecha_fin_estimada) ||
                        '--'}
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: estadoConfig.color }}
                    >
                      {estadoConfig.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


