'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Badge,
  Button,
  Card,
  EmptyState,
} from '@/components/ui/grows';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Database } from '@/lib/types/supabase.gen';
import { useToast } from '@/components/ui/use-toast';
import {
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Users,
  XCircle,
} from 'lucide-react';

const COMPLETED_STATES = new Set(['finalizado', 'validado']);

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

type ValidarSectionProps = {
  obraId?: string | null;
};

type RawTarea = Record<string, any> & {
  id: string;
  title?: string | null;
  descripcion?: string | null;
  estado?: string | null;
  obra_id: string;
  responsable?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  cuadrilla_id?: string | null;
  fecha_validacion?: string | null;
  validado_por?: string | null;
};

type ValidarTarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  obraId: string;
  obraNombre: string;
  responsable: string | null;
  cuadrillaNombre: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  evidenciaUrls: string[];
  rawEstado: string | null;
  hasFechaValidacion: boolean;
  hasValidadoPor: boolean;
};

type ObraItem = {
  id: string;
  nombre: string;
  count: number;
};

export function ValidarSection({ obraId }: ValidarSectionProps) {
  const currentUser = useCurrentUser();
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareas, setTareas] = useState<ValidarTarea[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentUser?.orgId) {
      setError('No se pudo identificar tu organización.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let tareasQuery = supabase
        .from('tareas')
        .select(
          'id, title, descripcion, estado, obra_id, responsable, fecha_inicio_real, fecha_fin_real, fecha_inicio, fecha_fin, cuadrilla_id, fecha_validacion, validado_por'
        )
        .eq('org_id', currentUser.orgId)
        .eq('estado', 'finalizado');

      if (obraId) {
        tareasQuery = tareasQuery.eq('obra_id', obraId);
      }

      const { data: rawTareas, error: tareasError } = await tareasQuery;

      if (tareasError) {
        throw tareasError;
      }

      const pendientes = (rawTareas ?? []).filter((row: RawTarea) => {
        if (row.fecha_validacion !== undefined) {
          return !row.fecha_validacion;
        }
        if (row.validado_por !== undefined) {
          return !row.validado_por;
        }
        // Si no hay campos de validación, mantener la tarea como pendiente
        return true;
      }) as RawTarea[];

      if (pendientes.length === 0) {
        setTareas([]);
        setObraSeleccionada(null);
        setLoading(false);
        return;
      }

      const obraIds = Array.from(new Set(pendientes.map((t) => t.obra_id)));
      const cuadrillaIds = Array.from(
        new Set(
          pendientes
            .map((t) => t.cuadrilla_id)
            .filter((value): value is string => Boolean(value))
        )
      );
      const tareaIds = pendientes.map((t) => t.id);

      const [{ data: obrasData }, { data: cuadrillasData }, { data: evidenciasData }] = await Promise.all([
        obraIds.length > 0
          ? supabase.from('obras').select('id, nombre').in('id', obraIds)
          : Promise.resolve({ data: [] }),
        cuadrillaIds.length > 0
          ? supabase.from('cuadrillas').select('id, nombre').in('id', cuadrillaIds)
          : Promise.resolve({ data: [] }),
        tareaIds.length > 0
          ? supabase
              .from('tareas_evidencias')
              .select('id, tarea_id, url, path')
              .in('tarea_id', tareaIds)
          : Promise.resolve({ data: [] }),
      ]);

      const obrasMap = new Map<string, string>(
        (obrasData ?? []).map((obra) => [obra.id as string, (obra as any).nombre ?? 'Obra sin nombre'])
      );

      const cuadrillaMap = new Map<string, string>(
        (cuadrillasData ?? []).map((c) => [c.id as string, (c as any).nombre ?? 'Cuadrilla sin nombre'])
      );

      const evidenciasMap = new Map<string, string[]>(
        (evidenciasData ?? []).reduce((acc, item) => {
          const tareaId = item.tarea_id as string;
          const url = (item as any).url ?? (item as any).path ?? '';
          if (!url) return acc;
          if (!acc.has(tareaId)) {
            acc.set(tareaId, [url]);
          } else {
            acc.get(tareaId)!.push(url);
          }
          return acc;
        }, new Map<string, string[]>())
      );

      const mapped: ValidarTarea[] = pendientes.map((row) => {
        const titulo =
          (row.title as string | null | undefined) ??
          (row.descripcion as string | null | undefined) ??
          'Tarea sin título';

        const hasFechaValidacion = Object.prototype.hasOwnProperty.call(row, 'fecha_validacion');
        const hasValidadoPor = Object.prototype.hasOwnProperty.call(row, 'validado_por');

        return {
          id: row.id,
          titulo,
          descripcion: (row.descripcion as string | null) ?? null,
          obraId: row.obra_id,
          obraNombre: obrasMap.get(row.obra_id) ?? 'Obra sin nombre',
          responsable: (row.responsable as string | null) ?? null,
          cuadrillaNombre: row.cuadrilla_id ? cuadrillaMap.get(row.cuadrilla_id) ?? null : null,
          fechaInicio: (row.fecha_inicio_real as string | null) ?? (row.fecha_inicio as string | null) ?? null,
          fechaFin: (row.fecha_fin_real as string | null) ?? (row.fecha_fin as string | null) ?? null,
          evidenciaUrls: evidenciasMap.get(row.id) ?? [],
          rawEstado: (row.estado as string | null) ?? null,
          hasFechaValidacion,
          hasValidadoPor,
        };
      });

      setTareas(mapped);
      setObraSeleccionada((prev) => {
        if (prev && mapped.some((t) => t.obraId === prev)) {
          return prev;
        }
        return mapped.length > 0 ? mapped[0].obraId : null;
      });
    } catch (err) {
      console.error('[ValidarSection] Error fetching data', err);
      setError('No se pudieron obtener las tareas pendientes de validación.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.orgId, obraId, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const obrasAgrupadas: ObraItem[] = useMemo(() => {
    const map = new Map<string, ObraItem>();
    for (const tarea of tareas) {
      if (!map.has(tarea.obraId)) {
        map.set(tarea.obraId, {
          id: tarea.obraId,
          nombre: tarea.obraNombre,
          count: 1,
        });
      } else {
        map.get(tarea.obraId)!.count += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tareas]);

  const tareasFiltradas = useMemo(() => {
    if (!obraSeleccionada) return [];
    return tareas.filter((t) => t.obraId === obraSeleccionada);
  }, [tareas, obraSeleccionada]);

  const handleValidar = useCallback(
    async (tareaId: string, accion: 'validar' | 'rechazar') => {
      if (!currentUser?.orgId) return;

      const tarea = tareas.find((t) => t.id === tareaId);
      if (!tarea) return;

      setProcessingId(tareaId);

      try {
        const payload: Record<string, any> = {
          estado: accion === 'validar' ? 'validado' : 'pendiente',
        };

        if (tarea.hasFechaValidacion) {
          payload.fecha_validacion = accion === 'validar' ? new Date().toISOString() : null;
        }

        if (tarea.hasValidadoPor) {
          payload.validado_por = accion === 'validar' ? currentUser.id : null;
        }

        const { error: updateError } = await supabase
          .from('tareas')
          .update(payload)
          .eq('id', tareaId)
          .eq('org_id', currentUser.orgId);

        if (updateError) {
          throw updateError;
        }

        setTareas((prev) => prev.filter((t) => t.id !== tareaId));
        toast({
          title: accion === 'validar' ? 'Tarea validada' : 'Tarea rechazada',
          description:
            accion === 'validar'
              ? 'El avance quedó registrado como validado.'
              : 'La tarea volvió al estado pendiente.',
        });
      } catch (err) {
        console.error('[ValidarSection] Error updating tarea', err);
        toast({
          title: 'No se pudo actualizar la tarea',
          description: 'Intentá nuevamente más tarde.',
          variant: 'destructive',
        });
      } finally {
        setProcessingId(null);
      }
    },
    [currentUser?.orgId, currentUser?.id, supabase, tareas, toast]
  );

  if (!currentUser?.orgId) {
    return (
      <EmptyState
        title="Iniciá sesión nuevamente"
        description="Necesitás una organización activa para validar tareas."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando tareas finalizadas…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-amber-200 bg-amber-50 text-amber-700">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">No pudimos cargar las tareas</h3>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (tareas.length === 0) {
    return (
      <EmptyState
        title="No hay tareas para validar"
        description="Cuando una cuadrilla finalice tareas pendientes vas a verlas acá."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full space-y-2 lg:w-64">
        <h3 className="text-sm font-semibold uppercase text-slate-500">Obras</h3>
        <div className="space-y-2">
          {obrasAgrupadas.map((obra) => {
            const isActive = obraSeleccionada === obra.id;
            return (
              <button
                key={obra.id}
                onClick={() => setObraSeleccionada(obra.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>{obra.nombre}</span>
                  <Badge
                    variant={isActive ? 'info' : 'default'}
                    className={isActive ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                  >
                    {obra.count}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">Tareas finalizadas pendientes de validación</p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex-1 space-y-4">
        {tareasFiltradas.length === 0 ? (
          <EmptyState
            title="No hay tareas pendientes"
            description="Esta obra no tiene tareas finalizadas a la espera de validación."
          />
        ) : (
          tareasFiltradas.map((tarea) => {
            const estadoLabel = tarea.rawEstado ? tarea.rawEstado.toUpperCase() : 'FINALIZADO';
            const fechas = `${formatDate(tarea.fechaInicio)} → ${formatDate(tarea.fechaFin)}`;

            return (
              <Card key={tarea.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info" className="border-blue-200 text-blue-700">
                        <Building2 className="mr-1 h-3 w-3" />
                        {tarea.obraNombre}
                      </Badge>
                      <Badge variant="default" className="border-slate-200 text-slate-600">
                        {estadoLabel}
                      </Badge>
                      {tarea.cuadrillaNombre && (
                        <Badge variant="success" className="border-emerald-200 text-emerald-600">
                          <Users className="mr-1 h-3 w-3" />
                          {tarea.cuadrillaNombre}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">{tarea.titulo}</h3>
                    {tarea.descripcion && (
                      <p className="text-sm text-slate-600">{tarea.descripcion}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {fechas}
                      </span>
                      {tarea.responsable && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" /> Responsable: {tarea.responsable}
                        </span>
                      )}
                    </div>

                    {tarea.evidenciaUrls.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-slate-500">Evidencias</p>
                        <div className="flex flex-wrap gap-2">
                          {tarea.evidenciaUrls.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                            >
                              <FileText className="h-3 w-3" /> Evidencia
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="primary"
                      disabled={processingId === tarea.id}
                      onClick={() => void handleValidar(tarea.id, 'validar')}
                    >
                      {processingId === tarea.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>Validar tarea</span>
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={processingId === tarea.id}
                      onClick={() => void handleValidar(tarea.id, 'rechazar')}
                    >
                      {processingId === tarea.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span>Rechazar</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
