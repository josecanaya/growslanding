'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { SlideToConfirm } from '@/components/socio/SlideToConfirm';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/grows/Badge';
import type { Database } from '@/lib/types/supabase.gen';
import { ordenarTareasPorPrecedencias } from '@/utils/ordenarTareasPorPrecedencias';

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
  elemento?: {
    cantidad: number | null;
    unidad: string | null;
  } | null;
};

export function AhoraSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareas, setTareas] = useState<SupabaseTarea[]>([]);
  const [orgIdResuelta, setOrgIdResuelta] = useState<string | null>(currentUser?.orgId ?? null);

  // Resolver org_id si no viene en currentUser
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
          .maybeSingle<{ org_id: string | null }>();

        if (tareaData?.org_id) {
          setOrgIdResuelta(tareaData.org_id);
        }
      } catch (err) {
        console.error('[AHORA] Error resolviendo org_id', err);
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
          ),
          elemento_id,
          elemento:elementos (
            cantidad,
            unidad
          )
        `;

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

        const { data, error: queryError } = await query;

        if (queryError) {
          console.error('[AHORA] Error consultando tareas', queryError?.message || queryError);
          setError('No se pudieron cargar tus tareas.');
          setTareas([]);
          return;
        }

        const tareasBase = (data as unknown as SupabaseTarea[]) ?? [];

        // Obtener precedencias para ordenar
        let precedencias: Array<{ tarea_id: string; depende_de: string | null }> = [];
        if (tareasBase.length > 0) {
          const ids = tareasBase.map((t) => t.id);
          const { data: precData } = await supabase
            .from('tarea_precedencias')
            .select('tarea_id, depende_de')
            .in('tarea_id', ids);

          precedencias = (precData || []) as Array<{ tarea_id: string; depende_de: string | null }>;
        }

        // Ordenar tareas por precedencias
        const tareasOrdenadas = ordenarTareasPorPrecedencias(tareasBase, precedencias);

        // Filtrar solo tareas pendientes o asignadas (para iniciar)
        const tareasParaIniciar = tareasOrdenadas.filter(
          (t) => 
            t.estado === 'pendiente' || 
            t.estado === 'ASIGNADA' || 
            t.estado?.toLowerCase() === 'asignada' ||
            !t.estado
        );

        setTareas(tareasParaIniciar);
      } catch (err) {
        console.error('[AHORA] Error cargando tareas', err);
        setError('Error al cargar las tareas.');
        setTareas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTareas();
  }, [currentUser, orgIdResuelta, supabase]);

  // Calcular progreso general (de TODAS las tareas, no solo las pendientes)
  const [progresoGeneral, setProgresoGeneral] = useState({ completadas: 0, total: 0, porcentaje: 0 });

  useEffect(() => {
    const calcularProgreso = async () => {
      if (!currentUser?.id) {
        setProgresoGeneral({ completadas: 0, total: 0, porcentaje: 0 });
        return;
      }
      
      const orgId = orgIdResuelta || currentUser.orgId;
      if (!orgId) {
        setProgresoGeneral({ completadas: 0, total: 0, porcentaje: 0 });
        return;
      }

      try {
        const { data: todasLasTareas } = await supabase
          .from('tareas')
          .select('id, estado, avance')
          .eq('org_id', orgId)
          .or(`responsable.eq.${currentUser.email || ''},responsable.ilike.%${currentUser.email || ''}%`);

        if (!todasLasTareas || todasLasTareas.length === 0) {
          setProgresoGeneral({ completadas: 0, total: 0, porcentaje: 0 });
          return;
        }

        const total = todasLasTareas.length;
        const completadas = todasLasTareas.filter(
          (t: any) => t.estado === 'finalizado' || t.estado === 'validado' || t.avance === 100
        ).length;
        const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
        
        setProgresoGeneral({ completadas, total, porcentaje });
      } catch (err) {
        console.error('[AHORA] Error calculando progreso:', err);
        setProgresoGeneral({ completadas: 0, total: 0, porcentaje: 0 });
      }
    };

    calcularProgreso();
  }, [currentUser, orgIdResuelta, supabase]);

  // Tarea actual (la primera pendiente/asignada)
  const tareaActual = tareas.length > 0 ? tareas[0] : null;
  const indiceTarea = tareas.findIndex((t) => t.id === tareaActual?.id) + 1;

  const handleIniciarTarea = async () => {
    if (!tareaActual || !currentUser) return;

    try {
      // Llamar al endpoint de transición para iniciar la tarea
      const response = await fetch(`/api/tareas/${tareaActual.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevo_estado: 'en_ejecucion',
          notas: 'Tarea iniciada desde la sección Ahora',
          checklist: [],
          has_nc: false,
          actor: {
            name: currentUser.name || currentUser.email || 'Socio',
            role: 'Socio',
            method: 'login',
          },
          media: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AHORA] Error al iniciar tarea:', errorData);
        setError(errorData.message || 'Error al iniciar la tarea');
        return;
      }

      // Recargar tareas después de iniciar
      const orgId = orgIdResuelta || currentUser.orgId;
      if (orgId) {
        // Refrescar la lista de tareas
        const { data } = await supabase
          .from('tareas')
          .select(`
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
            ),
            elemento_id,
            elemento:elementos (
              cantidad,
              unidad
            )
          `)
          .eq('org_id', orgId)
          .or(`responsable.eq.${currentUser.email || ''},responsable.ilike.%${currentUser.email || ''}%`)
          .order('created_at', { ascending: false });

        if (data) {
          const tareasBase = (data as unknown as SupabaseTarea[]) ?? [];
          
          // Obtener precedencias
          let precedencias: Array<{ tarea_id: string; depende_de: string | null }> = [];
          if (tareasBase.length > 0) {
            const ids = tareasBase.map((t) => t.id);
            const { data: precData } = await supabase
              .from('tarea_precedencias')
              .select('tarea_id, depende_de')
              .in('tarea_id', ids);
            precedencias = (precData || []) as Array<{ tarea_id: string; depende_de: string | null }>;
          }

          const tareasOrdenadas = ordenarTareasPorPrecedencias(tareasBase, precedencias);
          const tareasParaIniciar = tareasOrdenadas.filter(
            (t) => 
              t.estado === 'pendiente' || 
              t.estado === 'ASIGNADA' || 
              t.estado?.toLowerCase() === 'asignada' ||
              !t.estado
          );
          setTareas(tareasParaIniciar);
        }
        
        // Recalcular progreso después de iniciar
        const { data: todasLasTareas } = await supabase
          .from('tareas')
          .select('id, estado, avance')
          .eq('org_id', orgId)
          .or(`responsable.eq.${currentUser.email || ''},responsable.ilike.%${currentUser.email || ''}%`);

        if (todasLasTareas && todasLasTareas.length > 0) {
          const total = todasLasTareas.length;
          const completadas = todasLasTareas.filter(
            (t: any) => t.estado === 'finalizado' || t.estado === 'validado' || t.avance === 100
          ).length;
          const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
          setProgresoGeneral({ completadas, total, porcentaje });
        }
      }
    } catch (err) {
      console.error('[AHORA] Error al iniciar tarea', err);
      setError('Error al iniciar la tarea. Por favor, intenta nuevamente.');
    }
  };

  const getEstadoBadge = (estado: string | null) => {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower === 'pendiente' || estadoLower === 'asignada') {
      return { variant: 'warning' as const, label: 'Pendiente' };
    }
    if (estadoLower === 'en_progreso' || estadoLower.includes('ejecucion')) {
      return { variant: 'info' as const, label: 'En ejecución' };
    }
    if (estadoLower === 'finalizado') {
      return { variant: 'success' as const, label: 'Finalizada' };
    }
    if (estadoLower === 'validado') {
      return { variant: 'success' as const, label: 'Validada' };
    }
    return { variant: 'default' as const, label: estado || 'Sin estado' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6FA5] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] pb-8">
      {/* Progreso general */}
      <Card className="m-4 mb-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Progreso general</h2>
          <Progress value={progresoGeneral.porcentaje} className="h-3 mb-2" />
          <p className="text-sm text-gray-600">
            {progresoGeneral.completadas} de {progresoGeneral.total} tareas completadas
          </p>
        </CardContent>
      </Card>

      {/* Tarea actual */}
      {tareaActual ? (
        <Card className="m-4 mb-6">
          <CardContent className="pt-6">
            {/* Estado y badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
              <Badge {...getEstadoBadge(tareaActual.estado)} />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {tareaActual.title || 'Sin título'}
            </h1>

            {/* Descripción */}
            {tareaActual.descripcion && (
              <p className="text-gray-600 mb-4">{tareaActual.descripcion}</p>
            )}

            {/* Métricas */}
            {(tareaActual.elemento || (tareaActual.fecha_inicio_estimada && tareaActual.fecha_fin_estimada)) && (
              <div className="bg-[#4A6FA5] rounded-lg p-4 mb-4 text-white">
                {tareaActual.elemento?.cantidad && (
                  <p className="text-2xl font-bold mb-1">
                    {tareaActual.elemento.cantidad} {tareaActual.elemento.unidad || 'unidades'}
                  </p>
                )}
                {tareaActual.fecha_inicio_estimada && tareaActual.fecha_fin_estimada && (
                  <p className="text-sm opacity-90">
                    Duración estimada: {Math.ceil(
                      (new Date(tareaActual.fecha_fin_estimada).getTime() - 
                       new Date(tareaActual.fecha_inicio_estimada).getTime()) / 
                      (1000 * 60 * 60 * 24)
                    )} días ({Math.ceil(
                      (new Date(tareaActual.fecha_fin_estimada).getTime() - 
                       new Date(tareaActual.fecha_inicio_estimada).getTime()) / 
                      (1000 * 60 * 60)
                    )} h)
                  </p>
                )}
              </div>
            )}

            {/* Ubicación y tiempo */}
            <div className="space-y-2 mb-4">
              {tareaActual.obras?.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{tareaActual.obras.address}</span>
                </div>
              )}
              {tareaActual.fecha_inicio_estimada && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {Math.ceil(
                      (new Date(tareaActual.fecha_fin_estimada || Date.now()).getTime() - 
                       new Date(tareaActual.fecha_inicio_estimada).getTime()) / 
                      (1000 * 60 * 60)
                    )} horas
                  </span>
                </div>
              )}
            </div>

            {/* Requiere evidencia fotográfica */}
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <Camera className="h-4 w-4" />
              <span className="text-sm">Requiere evidencia fotográfica</span>
            </div>

            {/* Botón deslizable para iniciar */}
            <div className="mb-4">
              <SlideToConfirm
                onConfirm={handleIniciarTarea}
                label="Iniciar tarea"
                confirmLabel="Desliza para iniciar"
                variant="start"
              />
            </div>

            {/* Contador de tareas */}
            <p className="text-center text-sm text-gray-500">
              Tarea {indiceTarea} de {tareas.length}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="m-4 mb-6">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No hay tareas pendientes para iniciar</p>
          </CardContent>
        </Card>
      )}

      {/* Accesos directos */}
      <Card className="m-4">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Accesos directos</h2>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/socio/presupuestos')}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white text-xl font-bold hover:bg-red-600 transition-colors"
            >
              N
            </button>
            {/* Agregar más accesos directos según sea necesario */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

