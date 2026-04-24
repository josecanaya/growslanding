'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Building2,
  MapPin,
  Calendar,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  FileCheck2,
  Image as ImageIcon,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Button } from '@/components/ui/grows/Button';
import { Badge } from '@/components/ui/grows/Badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ordenarTareasPorPrecedencias } from '@/utils/ordenarTareasPorPrecedencias';
import { STITCH_INNER, StitchH2Page } from '@/components/socio/stitch/socioStitchUi';

type SupabaseTarea = {
  id: string;
  title: string | null;
  descripcion: string | null;
  estado: string | null;
  prioridad: string | null;
  avance: number | null;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  obra_id: string | null;
  responsable: string | null;
  obras?: {
    id: string;
    name: string | null;
    address: string | null;
  } | null;
};
type PrecedenciaRow = { id: string; tarea_id: string; depende_de: string | null };

type ObraGroup = {
  obraId: string;
  nombre: string;
  direccion: string | null;
  fechaInicio: string | null;
  tareas: SupabaseTarea[];
};

export function TareasEnCurso() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareas, setTareas] = useState<SupabaseTarea[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
  const [orgIdResuelta, setOrgIdResuelta] = useState<string | null>(currentUser?.orgId ?? null);

  const tareaEstadoLabel = (estado: string | null) => {
    const val = (estado || '').toLowerCase();
    if (val === 'pendiente') return 'Pendiente';
    if (val.includes('progreso') || val.includes('ejecucion')) return 'En ejecución';
    if (val === 'finalizado') return 'Finalizada';
    if (val === 'validado') return 'Validada';
    return estado || 'Sin estado';
  };

  const tareaEstadoBadge = (estado: string | null) => {
    const val = (estado || '').toLowerCase();
    if (val === 'pendiente') return 'bg-yellow-100 text-yellow-700';
    if (val.includes('progreso') || val.includes('ejecucion')) return 'bg-blue-100 text-blue-700';
    if (val === 'finalizado' || val === 'validado') return 'bg-green-100 text-green-700';
    return 'bg-slate-100 text-slate-700';
  };

  const SELECT_FIELDS = `
    id,
    title,
    descripcion,
    estado,
    prioridad,
    avance,
    fecha_inicio_estimada,
    fecha_fin_estimada,
    obra_id,
    responsable,
    obras (
      id,
      name,
      address
    )
  `;

  useEffect(() => {
    const obraIdQuery = searchParams.get('obra_id');
    if (obraIdQuery) setObraSeleccionada(obraIdQuery);
  }, [searchParams]);

  // Resolver org_id si no viene en currentUser (socio sin org asignada en auth)
  useEffect(() => {
    const resolverOrg = async () => {
      if (orgIdResuelta || !currentUser?.email) return;
      try {
        const supabaseAny = supabase as any;

        const { data: socioData } = await supabaseAny
          .from('socios')
          .select('org_id')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (socioData?.org_id) {
          setOrgIdResuelta(socioData.org_id);
          return;
        }

        const { data: tareaData } = await supabaseAny
          .from('tareas')
          .select('org_id')
          .or(`responsable.eq.${currentUser.email},responsable.ilike.%${currentUser.email}%`)
          .limit(1)
          .maybeSingle();

        if (tareaData?.org_id) {
          setOrgIdResuelta(tareaData.org_id);
        }
      } catch (err) {
        console.error('[TAREAS_EN_CURSO] Error resolviendo org_id', err);
      }
    };

    resolverOrg();
  }, [currentUser?.email, orgIdResuelta, supabase]);

  useEffect(() => {
    const fetchTareas = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        setError('No hay usuario activo.');
        return;
      }

      const orgId = orgIdResuelta || currentUser.orgId;
      if (!orgId) {
        setLoading(false);
        setError('No se pudo determinar tu organización.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('tareas')
          .select(SELECT_FIELDS)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false });

        if (currentUser.email) {
          query = query.or(
            `responsable.eq.${currentUser.email},responsable.ilike.%${currentUser.email}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          console.error('[TAREAS_EN_CURSO] Error consultando tareas', error?.message || error);
          setError('No se pudieron cargar tus tareas.');
          setTareas([]);
          return;
        }

        const tareasBase = (data as unknown as SupabaseTarea[]) ?? [];

        // Obtener precedencias para ordenar por CPM/topológico
        let precedencias: PrecedenciaRow[] = [];
        if (tareasBase.length > 0) {
          const ids = tareasBase.map((t) => t.id);
          const { data: precData, error: precError } = await supabase
            .from('tarea_precedencias')
            .select('id, tarea_id, depende_de')
            .in('tarea_id', ids);

          if (precError) {
            console.error(
              '[TAREAS_EN_CURSO] Error cargando precedencias',
              precError?.message || precError
            );
          } else {
            precedencias = (precData as PrecedenciaRow[]) ?? [];
          }
        }

        const tareasOrdenadas = ordenarTareasPorPrecedencias(
          tareasBase,
          precedencias.map((p) => ({ tarea_id: p.tarea_id, depende_de: p.depende_de || undefined }))
        );

        setError(null);
        setTareas(tareasOrdenadas);
      } catch (err) {
        console.error('[TAREAS_EN_CURSO] Error al cargar tareas', err);
        setError('No se pudieron cargar tus tareas.');
      } finally {
        setLoading(false);
      }
    };

    fetchTareas();
  }, [currentUser?.id, currentUser?.email, orgIdResuelta, supabase]);

  const tareasAgrupadas = useMemo<ObraGroup[]>(() => {
    const map = new Map<string, ObraGroup>();
    tareas.forEach((t) => {
      const obraId = t.obra_id || 'sin-obra';
      const obra = t.obras;
      const entry = map.get(obraId) ?? {
        obraId,
        nombre: obra?.name || 'Obra sin nombre',
        direccion: obra?.address ?? null,
        fechaInicio: null,
        tareas: [],
      };
      entry.tareas.push(t);
      map.set(obraId, entry);
    });
    return Array.from(map.values());
  }, [tareas]);

  const obrasOrdenadas = useMemo(
    () =>
      tareasAgrupadas.sort((a, b) =>
        (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' })
      ),
    [tareasAgrupadas]
  );

  const obraActiva = obrasOrdenadas.find((o) => o.obraId === obraSeleccionada) || null;

  if (loading) {
    return (
      <div className={STITCH_INNER}>
        <div className="rounded-xl border border-stitch-surface-container bg-stitch-surface-container-lowest p-6 text-center">
          <p className="text-sm text-stitch-on-surface/70">Cargando tareas asignadas…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={STITCH_INNER}>
        <div className="rounded-xl border border-red-200 bg-red-50/90 p-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (tareas.length === 0) {
    return (
      <div className={STITCH_INNER}>
        <div className="rounded-xl border border-dashed border-stitch-outline/30 bg-stitch-surface-container-lowest p-8 text-center">
          <CheckCircle className="mx-auto mb-3 h-8 w-8 text-stitch-outline" />
          <p className="text-sm text-stitch-on-surface/70">Aún no tenés tareas asignadas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={STITCH_INNER + ' space-y-4 font-stitch-body'}>
      {!obraActiva && (
        <div className="space-y-3">
          <StitchH2Page
            kicker="Tareas"
            title="Asignadas por obra"
            description="Elegí una obra para ver el detalle de cada tarea."
          />
          {obrasOrdenadas.map((obra) => (
            <div
              key={obra.obraId}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-stitch-surface-container bg-stitch-surface-container-lowest px-4 py-3 transition hover:bg-stitch-surface-container-low"
              onClick={() => setObraSeleccionada(obra.obraId)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-slate-600" />
                  <p className="truncate text-sm font-bold text-stitch-on-surface">
                    {obra.nombre}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stitch-on-surface/60">
                  {obra.direccion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {obra.direccion}
                    </span>
                  )}
                  {obra.fechaInicio && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {obra.fechaInicio}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-xs">
                  {obra.tareas.length} tarea{obra.tareas.length === 1 ? '' : 's'}
                </Badge>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {obraActiva && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setObraSeleccionada(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a obras
            </Button>
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-slate-900">{obraActiva.nombre}</h3>
              {obraActiva.direccion && (
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {obraActiva.direccion}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obraActiva.tareas.map((tarea) => (
              <Card key={tarea.id} className="border border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {tarea.title || 'Sin titulo'}
                      </p>
                      {tarea.descripcion && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {tarea.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={tareaEstadoBadge(tarea.estado)}>
                        {tareaEstadoLabel(tarea.estado)}
                      </Badge>
                      {tarea.estado?.toLowerCase() === 'validado' && (
                        <Badge variant="success" className="text-[11px] border-green-500 text-green-700">
                          100% completada
                        </Badge>
                      )}
                      {/* Mostrar crítico si llega metadata de CPM */}
                      {tarea as any /* placeholder to show critical if present */ && (tarea as any).esCritica && (
                        <Badge variant="error" className="text-[11px] border-red-500 text-red-700">
                          Camino crítico
                        </Badge>
                      )}
                    </div>
                  </div>

                  {tarea.prioridad && (
                    <Badge variant="default" className="text-xs">
                      Prioridad: {tarea.prioridad}
                    </Badge>
                  )}

                  {(tarea.fecha_inicio_estimada || tarea.fecha_fin_estimada) && (
                    <div className="text-xs text-slate-600 space-y-1">
                      {tarea.fecha_inicio_estimada && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Inicio: {new Date(tarea.fecha_inicio_estimada).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {tarea.fecha_fin_estimada && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Fin: {new Date(tarea.fecha_fin_estimada).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Progreso</span>
                      <span className="font-semibold">
                        {tarea.estado?.toLowerCase() === 'validado' ? '100%' : `${tarea.avance ?? 0}%`}
                      </span>
                    </div>
                    <Progress
                      value={tarea.estado?.toLowerCase() === 'validado' ? 100 : tarea.avance ?? 0}
                      className="h-2"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/socio/ahora?obra_id=${tarea.obra_id || ''}&tarea_id=${tarea.id}`)
                      }
                      disabled={tarea.estado?.toLowerCase() === 'validado'}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Hacer ahora
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/socio/evidencias?obra_id=${tarea.obra_id || ''}`)}
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Evidencias
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
