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
  Image as ImageIcon,
  X,
  Camera,
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

type EvidenciaItem = {
  url: string;
  path: string;
  created_at?: string;
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
  evidencias: EvidenciaItem[];
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
    () => createClientComponentClient<Database>() as any,
    []
  );
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareas, setTareas] = useState<ValidarTarea[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; titulo: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!currentUser?.orgId) {
      setError('No se pudo identificar tu organización.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Obtener TODAS las tareas finalizadas o validadas (no filtrar por validación)
      let tareasQuery = supabase
        .from('tareas')
        .select(
          'id, title, descripcion, estado, obra_id, responsable, fecha_inicio_real, fecha_fin_real, fecha_inicio, fecha_fin, cuadrilla_id, fecha_validacion, validado_por'
        )
        .eq('org_id', currentUser.orgId)
        .in('estado', ['finalizado', 'validado', 'en_revision', 'pendiente']);

      if (obraId) {
        tareasQuery = tareasQuery.eq('obra_id', obraId);
      }

      const { data: rawTareas, error: tareasError } = await tareasQuery;

      if (tareasError) {
        throw tareasError;
      }

      // Separar en pendientes y validadas
      const todasLasTareas = (rawTareas ?? []) as RawTarea[];
      
      // Filtrar solo las que tienen evidencias o están finalizadas/validadas
      const tareasConEvidencias = todasLasTareas.filter((row: RawTarea) => {
        const estado = (row.estado ?? '').toLowerCase();
        return estado === 'finalizado' || estado === 'validado' || estado === 'en_revision';
      });

      const obraIds = Array.from(new Set(tareasConEvidencias.map((t) => t.obra_id)));
      const cuadrillaIds = Array.from(
        new Set(
          tareasConEvidencias
            .map((t) => t.cuadrilla_id)
            .filter((value): value is string => Boolean(value))
        )
      );
      const tareaIds = tareasConEvidencias.map((t) => t.id);

      // Obtener evidencias de tareas_evidencias y también de media (vía eventos)
      let evidenciasDirectas: any[] = [];
      let evidenciasMedia: any[] = [];
      let eventosConTareas: any[] = [];
      let obrasData: any[] = [];
      let cuadrillasData: any[] = [];

      if (tareaIds.length > 0) {
        // Primero obtener eventos para poder buscar media
        const { data: eventosData } = await supabase
          .from('eventos')
          .select('id, tarea_id')
          .in('tarea_id', tareaIds);
        
        eventosConTareas = eventosData ?? [];
        
        // Preparar queries en paralelo
        const queries: Promise<any>[] = [
          obraIds.length > 0
            ? supabase.from('obras').select('id, nombre').in('id', obraIds)
            : Promise.resolve({ data: [] }),
          cuadrillaIds.length > 0
            ? supabase.from('cuadrillas').select('id, nombre').in('id', cuadrillaIds)
            : Promise.resolve({ data: [] }),
          supabase
            .from('tareas_evidencias')
            .select('id, tarea_id, url, path, created_at')
            .in('tarea_id', tareaIds),
        ];

        // Si hay eventos, agregar query de media
        if (eventosConTareas.length > 0) {
          const eventoIds = eventosConTareas.map(e => e.id);
          queries.push(
            supabase
              .from('media')
              .select('id, evento_id, path, kind, created_at')
              .in('evento_id', eventoIds)
              .eq('kind', 'foto')
          );
        }

        const results = await Promise.all(queries);
        const [obrasResult, cuadrillasResult, evidenciasResult, mediaResult] = results;
        
        obrasData = (obrasResult as any).data ?? [];
        cuadrillasData = (cuadrillasResult as any).data ?? [];
        evidenciasDirectas = (evidenciasResult as any).data ?? [];
        if (mediaResult) {
          evidenciasMedia = (mediaResult as any).data ?? [];
        }
      } else {
        // Si no hay tareas, solo obtener obras y cuadrillas
        const [obrasResult, cuadrillasResult] = await Promise.all([
          obraIds.length > 0
            ? supabase.from('obras').select('id, nombre').in('id', obraIds)
            : Promise.resolve({ data: [] }),
          cuadrillaIds.length > 0
            ? supabase.from('cuadrillas').select('id, nombre').in('id', cuadrillaIds)
            : Promise.resolve({ data: [] }),
        ]);
        obrasData = (obrasResult as any).data ?? [];
        cuadrillasData = (cuadrillasResult as any).data ?? [];
      }

      const obraRows = ((obrasData ?? []) as unknown) as Array<{ id: string | null; nombre?: string | null }>;
      const obrasMap = new Map<string, string>();
      obraRows.forEach((obra) => {
        if (!obra.id) return;
        obrasMap.set(obra.id, obra.nombre ?? 'Obra sin nombre');
      });

      const cuadrillaRows = ((cuadrillasData ?? []) as unknown) as Array<{ id: string | null; nombre?: string | null }>;
      const cuadrillaMap = new Map<string, string>();
      cuadrillaRows.forEach((c) => {
        if (!c.id) return;
        cuadrillaMap.set(c.id, c.nombre ?? 'Cuadrilla sin nombre');
      });

      // Combinar evidencias de ambas fuentes
      const evidenciasMap = new Map<string, Array<{ url: string; path: string; created_at?: string }>>();
      
      // Procesar evidencias de tareas_evidencias
      evidenciasDirectas.forEach((item: any) => {
        const tareaId = item.tarea_id as string;
        const url = item.url ?? item.path ?? '';
        if (!url) return;
        if (!evidenciasMap.has(tareaId)) {
          evidenciasMap.set(tareaId, []);
        }
        evidenciasMap.get(tareaId)!.push({
          url,
          path: item.path ?? url,
          created_at: item.created_at,
        });
      });
      
      // Procesar evidencias de media (mapear evento_id -> tarea_id)
      if (evidenciasMedia.length > 0) {
        const eventoToTareaMap = new Map<string, string>();
        eventosConTareas.forEach((e: any) => {
          eventoToTareaMap.set(e.id, e.tarea_id);
        });
        
        evidenciasMedia.forEach((item: any) => {
          const tareaId = eventoToTareaMap.get(item.evento_id);
          if (!tareaId) return;
          const path = item.path ?? '';
          if (!path) return;
          
          // Generar URL p?blica desde Supabase Storage (bucket 'evidencias')
          let publicUrl = '';
          try {
            const { data: urlData } = supabase.storage.from('evidencias').getPublicUrl(path);
            publicUrl = urlData.publicUrl;
          } catch {
            // Si falla, usar el path como URL
            publicUrl = path;
          }
          
          if (!evidenciasMap.has(tareaId)) {
            evidenciasMap.set(tareaId, []);
          }
          evidenciasMap.get(tareaId)!.push({
            url: publicUrl,
            path,
            created_at: item.created_at,
          });
        });
      }

      const mapped: ValidarTarea[] = tareasConEvidencias.map((row) => {
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
          evidencias: evidenciasMap.get(row.id) ?? [],
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

  // Separar tareas en pendientes y validadas
  const tareasFiltradas = useMemo(() => {
    if (!obraSeleccionada) return { pendientes: [], validadas: [] };
    const filtradas = tareas.filter((t) => t.obraId === obraSeleccionada);
    
    const pendientes = filtradas.filter((t) => {
      const estado = (t.rawEstado ?? '').toLowerCase();
      // Una tarea es pendiente si NO está validada
      const estaValidada = estado === 'validado' || t.hasFechaValidacion || t.hasValidadoPor;
      return !estaValidada;
    });
    
    const validadas = filtradas.filter((t) => {
      const estado = (t.rawEstado ?? '').toLowerCase();
      // Una tarea está validada si tiene estado 'validado' o tiene fecha_validacion/validado_por
      return estado === 'validado' || t.hasFechaValidacion || t.hasValidadoPor;
    });
    
    return { pendientes, validadas };
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

        // Actualizar el estado local sin eliminar la tarea
        // La tarea se moverá automáticamente al bloque "Tareas validadas" gracias al useMemo
        setTareas((prev) =>
          prev.map((t) => {
            if (t.id === tareaId) {
              return {
                ...t,
                rawEstado: accion === 'validar' ? 'validado' : 'finalizado',
                hasFechaValidacion: accion === 'validar',
                hasValidadoPor: accion === 'validar',
              };
            }
            return t;
          })
        );
        
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

  // No mostrar empty state si hay tareas (aunque todas estén validadas)
  // El empty state se mostrará dentro de la sección si no hay ninguna tarea

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
                <p className="text-xs text-slate-500">Tareas finalizadas y validadas</p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex-1 space-y-6">
        {/* Tareas pendientes de validación */}
        {tareasFiltradas.pendientes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Tareas pendientes de validación ({tareasFiltradas.pendientes.length})
              </h2>
            </div>
            {tareasFiltradas.pendientes.map((tarea) => {
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

                    {tarea.evidencias.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-slate-500">Evidencias ({tarea.evidencias.length})</p>
                        <div className="grid grid-cols-3 gap-2">
                          {tarea.evidencias.map((evidencia, idx) => (
                            <button
                              key={`${evidencia.path}-${idx}`}
                              onClick={() => setImagenAmpliada({ url: evidencia.url, titulo: tarea.titulo })}
                              className="group relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 transition hover:border-blue-400 hover:shadow-md"
                            >
                              <img
                                src={evidencia.url}
                                alt={`Evidencia ${idx + 1} - ${tarea.titulo}`}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="12"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                                <Camera className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
                              </div>
                            </button>
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
            })}
          </div>
        )}

        {/* Tareas ya validadas */}
        {tareasFiltradas.validadas.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-green-700">
                Tareas ya validadas ({tareasFiltradas.validadas.length})
              </h2>
            </div>
            {tareasFiltradas.validadas.map((tarea) => {
              const estadoLabel = tarea.rawEstado ? tarea.rawEstado.toUpperCase() : 'VALIDADO';
              const fechas = `${formatDate(tarea.fechaInicio)} → ${formatDate(tarea.fechaFin)}`;

              return (
                <Card key={tarea.id} className="rounded-3xl border border-green-200 bg-green-50/30 shadow-sm">
                  <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info" className="border-blue-200 text-blue-700">
                          <Building2 className="mr-1 h-3 w-3" />
                          {tarea.obraNombre}
                        </Badge>
                        <Badge variant="success" className="border-green-200 text-green-700 bg-green-100">
                          <CheckCircle className="mr-1 h-3 w-3" />
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

                      {tarea.evidencias.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-slate-500">Evidencias ({tarea.evidencias.length})</p>
                          <div className="grid grid-cols-3 gap-2">
                            {tarea.evidencias.map((evidencia, idx) => (
                              <button
                                key={`${evidencia.path}-${idx}`}
                                onClick={() => setImagenAmpliada({ url: evidencia.url, titulo: tarea.titulo })}
                                className="group relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 transition hover:border-green-400 hover:shadow-md"
                              >
                                <img
                                  src={evidencia.url}
                                  alt={`Evidencia ${idx + 1} - ${tarea.titulo}`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="12"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                                  <Camera className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sin botones de acción para tareas validadas - solo lectura */}
                    <div className="flex items-center">
                      <Badge variant="success" className="border-green-300 text-green-800 bg-green-100">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Validado
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Mensaje si no hay tareas */}
        {tareasFiltradas.pendientes.length === 0 && tareasFiltradas.validadas.length === 0 && (
          <EmptyState
            title="No hay tareas para validar"
            description="Esta obra no tiene tareas finalizadas o validadas."
          />
        )}
      </section>

      {/* Modal de imagen ampliada */}
      {imagenAmpliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setImagenAmpliada(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]">
            <button
              onClick={() => setImagenAmpliada(null)}
              className="absolute -top-12 right-0 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="bg-white rounded-lg overflow-hidden">
              <img
                src={imagenAmpliada.url}
                alt={imagenAmpliada.titulo}
                className="w-full h-auto max-h-[80vh] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="16"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="p-4 bg-white border-t">
                <h3 className="font-semibold text-lg text-slate-900">{imagenAmpliada.titulo}</h3>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
