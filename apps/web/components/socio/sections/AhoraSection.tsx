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
  CheckSquare,
  Paperclip,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { SlideToConfirm } from '@/components/socio/SlideToConfirm';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/grows/Badge';
import { ChecklistModal } from '@/components/socio/ChecklistModal';
import { MensajeriaSocio } from '@/components/socio/MensajeriaSocio';
import type { Database } from '@/lib/types/supabase.gen';
import { ordenarTareasPorPrecedencias } from '@/utils/ordenarTareasPorPrecedencias';
import type { ChecklistItem } from '@/data/checklists';

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
  const [tareaActualIndex, setTareaActualIndex] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isIniciando, setIsIniciando] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [tareasCompletadasHoy, setTareasCompletadasHoy] = useState(0);

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
          .maybeSingle();

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

        // Obtener precedencias para ordenar por CPM
        let precedencias: Array<{ tarea_id: string; depende_de?: string }> = [];
        if (tareasBase.length > 0) {
          const ids = tareasBase.map((t) => t.id);
          const { data: precData } = await supabase
            .from('tarea_precedencias')
            .select('tarea_id, depende_de')
            .in('tarea_id', ids);

          precedencias = (precData || []).map((p: { tarea_id: string; depende_de: string | null }) => ({
            tarea_id: p.tarea_id,
            depende_de: p.depende_de ?? undefined,
          }));
        }

        // Ordenar tareas por precedencias (CPM)
        const tareasOrdenadas = ordenarTareasPorPrecedencias(tareasBase, precedencias);

        // Filtrar solo tareas pendientes o asignadas (para iniciar)
        const tareasParaIniciar = tareasOrdenadas.filter(
          (t) => 
            t.estado === 'pendiente' || 
            t.estado === 'ASIGNADA' || 
            t.estado?.toLowerCase() === 'asignada' ||
            t.estado?.toLowerCase() === 'en_ejecucion' ||
            t.estado?.toLowerCase() === 'en_progreso' ||
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

  // Calcular tareas completadas hoy
  useEffect(() => {
    const calcularTareasHoy = async () => {
      if (!currentUser?.id) {
        setTareasCompletadasHoy(0);
        return;
      }

      const orgId = orgIdResuelta || currentUser.orgId;
      if (!orgId) {
        setTareasCompletadasHoy(0);
        return;
      }

      try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString();

        const { data: eventosHoy } = await supabase
          .from('eventos')
          .select('tarea_id')
          .eq('org_id', orgId)
          .eq('tipo_evento', 'TAREA_FINALIZADA')
          .gte('created_at', hoyISO);

        if (eventosHoy) {
          const tareasUnicas = new Set(eventosHoy.map((e: any) => e.tarea_id));
          setTareasCompletadasHoy(tareasUnicas.size);
        }
      } catch (err) {
        console.error('[AHORA] Error calculando tareas hoy:', err);
      }
    };

    calcularTareasHoy();
  }, [currentUser, orgIdResuelta, supabase]);

  // Tarea actual (una a la vez, ordenada por CPM)
  const tareaActual = useMemo(() => {
    return tareas[tareaActualIndex] || null;
  }, [tareas, tareaActualIndex]);

  const handleIniciarTarea = async () => {
    if (!tareaActual || !currentUser) return;

    setIsIniciando(true);
    
    // Efecto amarillo: agregar clase al body y al contenedor principal
    const mainContainer = document.querySelector('.ahora-container') as HTMLElement;
    if (mainContainer) {
      mainContainer.classList.add('bg-yellow-50', 'transition-colors', 'duration-1000');
    }
    document.body.classList.add('bg-yellow-50');
    
    setTimeout(() => {
      if (mainContainer) {
        mainContainer.classList.remove('bg-yellow-50');
      }
      document.body.classList.remove('bg-yellow-50');
    }, 2000);

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
          checklist: checklistItems.map(item => ({
            id: item.id,
            label: item.label,
            checked: item.done,
          })),
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
        setIsIniciando(false);
        return;
      }

      // Recargar tareas después de iniciar
      const orgId = orgIdResuelta || currentUser.orgId;
      if (orgId) {
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
          
          let precedencias: Array<{ tarea_id: string; depende_de?: string }> = [];
          if (tareasBase.length > 0) {
            const ids = tareasBase.map((t) => t.id);
            const { data: precData } = await supabase
              .from('tarea_precedencias')
              .select('tarea_id, depende_de')
              .in('tarea_id', ids);
            precedencias = (precData || []).map((p: { tarea_id: string; depende_de: string | null }) => ({
              tarea_id: p.tarea_id,
              depende_de: p.depende_de ?? undefined,
            }));
          }

          const tareasOrdenadas = ordenarTareasPorPrecedencias(tareasBase, precedencias);
          const tareasParaIniciar = tareasOrdenadas.filter(
            (t) => 
              t.estado === 'pendiente' || 
              t.estado === 'ASIGNADA' || 
              t.estado?.toLowerCase() === 'asignada' ||
              t.estado?.toLowerCase() === 'en_ejecucion' ||
              t.estado?.toLowerCase() === 'en_progreso' ||
              !t.estado
          );
          setTareas(tareasParaIniciar);
        }
      }
    } catch (err) {
      console.error('[AHORA] Error al iniciar tarea', err);
      setError('Error al iniciar la tarea. Por favor, intenta nuevamente.');
    } finally {
      setIsIniciando(false);
    }
  };

  const handleFinalizarTarea = async (fotoDataUrl?: string) => {
    if (!tareaActual || !currentUser) return;

    setIsFinalizando(true);
    
    // Efecto verde: agregar clase al body
    document.body.classList.add('bg-green-50');
    setTimeout(() => {
      document.body.classList.remove('bg-green-50');
    }, 2000);

    try {
      const media = fotoDataUrl ? [{
        kind: 'foto' as const,
        dataUrl: fotoDataUrl,
      }] : [];

      const response = await fetch(`/api/tareas/${tareaActual.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevo_estado: 'finalizado',
          notas: 'Tarea finalizada desde la sección Ahora',
          checklist: checklistItems.map(item => ({
            id: item.id,
            label: item.label,
            checked: item.done,
          })),
          has_nc: false,
          actor: {
            name: currentUser.name || currentUser.email || 'Socio',
            role: 'Socio',
            method: 'login',
          },
          media,
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        let responseText = '';
        try {
          responseText = await response.text();
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
            } catch {
              errorData = { message: responseText };
            }
          } else {
            errorData = { message: `Error ${response.status}: ${response.statusText}` };
          }
        } catch (parseError) {
          errorData = { message: `Error ${response.status}: ${response.statusText}` };
        }
        console.error('[AHORA] Error al finalizar tarea:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          responseText
        });
        setError(errorData.message || `Error ${response.status}: ${response.statusText}`);
        setIsFinalizando(false);
        return;
      }

      // Si hay media en el evento, también crear registro en tareas_evidencias
      if (tareaActual.id) {
        try {
          const { data: eventoData } = await supabase
            .from('eventos')
            .select('id, media')
            .eq('tarea_id', tareaActual.id)
            .eq('tipo_evento', 'TAREA_FINALIZADA')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle() as any;

          if (eventoData?.media && Array.isArray(eventoData.media) && eventoData.media.length > 0) {
            const mediaItem = eventoData.media[0];
            if (mediaItem.path) {
              await supabase
                .from('tareas_evidencias')
                .insert({
                  tarea_id: tareaActual.id,
                  url: mediaItem.path,
                  tipo: 'foto',
                  descripcion: 'Evidencia fotográfica de finalización',
                } as any);
            }
          }
        } catch (evidenciaError) {
          console.error('[AHORA] Error al crear evidencia:', evidenciaError);
          // No bloquear el flujo si falla la creación de evidencia
        }
      }

      // Recargar tareas
      const orgId = orgIdResuelta || currentUser.orgId;
      if (orgId) {
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
          
          let precedencias: Array<{ tarea_id: string; depende_de?: string }> = [];
          if (tareasBase.length > 0) {
            const ids = tareasBase.map((t) => t.id);
            const { data: precData } = await supabase
              .from('tarea_precedencias')
              .select('tarea_id, depende_de')
              .in('tarea_id', ids);
            precedencias = (precData || []).map((p: { tarea_id: string; depende_de: string | null }) => ({
              tarea_id: p.tarea_id,
              depende_de: p.depende_de ?? undefined,
            }));
          }

          const tareasOrdenadas = ordenarTareasPorPrecedencias(tareasBase, precedencias);
          const tareasParaIniciar = tareasOrdenadas.filter(
            (t) => 
              t.estado === 'pendiente' || 
              t.estado === 'ASIGNADA' || 
              t.estado?.toLowerCase() === 'asignada' ||
              t.estado?.toLowerCase() === 'en_ejecucion' ||
              t.estado?.toLowerCase() === 'en_progreso' ||
              !t.estado
          );
          setTareas(tareasParaIniciar);
          setTareaActualIndex(0); // Volver a la primera tarea
        }
      }

      // Recalcular tareas completadas hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyISO = hoy.toISOString();
      const { data: eventosHoy } = await supabase
        .from('eventos')
        .select('tarea_id')
        .eq('org_id', orgId || '')
        .eq('tipo_evento', 'TAREA_FINALIZADA')
        .gte('created_at', hoyISO);
      if (eventosHoy) {
        const tareasUnicas = new Set(eventosHoy.map((e: any) => e.tarea_id));
        setTareasCompletadasHoy(tareasUnicas.size);
      }

      // Recalcular progreso general
      const { data: todasLasTareas } = await supabase
        .from('tareas')
        .select('id, estado, avance')
        .eq('org_id', orgId || '')
        .or(`responsable.eq.${currentUser.email || ''},responsable.ilike.%${currentUser.email || ''}%`);

      if (todasLasTareas && todasLasTareas.length > 0) {
        const total = todasLasTareas.length;
        const completadas = todasLasTareas.filter(
          (t: any) => t.estado === 'finalizado' || t.estado === 'validado' || t.avance === 100
        ).length;
        const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
        setProgresoGeneral({ completadas, total, porcentaje });
      }
    } catch (err: any) {
      console.error('[AHORA] Error al finalizar tarea', err);
      setError(err?.message || 'Error al finalizar la tarea. Por favor, intenta nuevamente.');
    } finally {
      setIsFinalizando(false);
      // Remover efecto verde después de 2 segundos
      setTimeout(() => {
        const mainContainer = document.querySelector('.ahora-container') as HTMLElement;
        if (mainContainer) {
          mainContainer.classList.remove('bg-green-50');
        }
        document.body.classList.remove('bg-green-50');
      }, 2000);
    }
  };

  const handleSaveChecklist = async (items: ChecklistItem[]) => {
    setChecklistItems(items);
    // Guardar en eventos si la tarea está iniciada
    if (tareaActual && (tareaActual.estado?.toLowerCase() === 'en_ejecucion' || tareaActual.estado?.toLowerCase() === 'en_progreso')) {
      try {
        await fetch(`/api/tareas/${tareaActual.id}/transition`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nuevo_estado: tareaActual.estado,
            notas: 'Checklist actualizado',
            checklist: items.map(item => ({
              id: item.id,
              label: item.label,
              checked: item.done,
            })),
            has_nc: false,
            actor: {
              name: currentUser?.name || currentUser?.email || 'Socio',
              role: 'Socio',
              method: 'login',
            },
            media: [],
          }),
        });
      } catch (err) {
        console.error('[AHORA] Error al guardar checklist:', err);
      }
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

  const isTareaEnProgreso = tareaActual?.estado?.toLowerCase() === 'en_ejecucion' || 
                            tareaActual?.estado?.toLowerCase() === 'en_progreso';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#4A6FA5] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  if (error && !tareaActual) {
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
    <div className={`ahora-container min-h-screen bg-[#f5f7fa] pb-8 transition-colors duration-1000 ${isIniciando ? 'bg-yellow-50' : isFinalizando ? 'bg-green-50' : ''}`}>
      {/* Progreso general */}
      <Card className="m-4 mb-6 rounded-2xl shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Progreso general</h2>
            <span className="text-sm font-bold text-[#4A6FA5]">{progresoGeneral.porcentaje}%</span>
          </div>
          <Progress value={progresoGeneral.porcentaje} className="h-2 mb-2" />
          <p className="text-xs text-gray-600">
            {progresoGeneral.completadas} de {progresoGeneral.total} tareas completadas
          </p>
        </CardContent>
      </Card>

      {/* Tarea actual */}
      {tareaActual ? (
        <Card className="m-4 mb-6 rounded-2xl shadow-sm">
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

            {/* Botón deslizable para iniciar o finalizar */}
            <div className="mb-4">
              {!isTareaEnProgreso ? (
                <SlideToConfirm
                  onConfirm={handleIniciarTarea}
                  label="Iniciar tarea"
                  confirmLabel="Desliza para iniciar"
                  variant="start"
                  disabled={isIniciando}
                />
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Finalizar tarea</h3>
                  <SlideToConfirm
                    onConfirm={() => handleFinalizarTarea()}
                    label="Finalizar tarea"
                    confirmLabel="Desliza para finalizar"
                    variant="finish"
                    disabled={isFinalizando}
                  />
                </div>
              )}
            </div>

            {/* Contador de tareas */}
            <p className="text-center text-sm text-gray-500 mb-4">
              Tarea {tareaActualIndex + 1} de {tareas.length}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="m-4 mb-6 rounded-2xl shadow-sm">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No hay tareas pendientes para iniciar</p>
          </CardContent>
        </Card>
      )}

      {/* Accesos directos */}
      <Card className="m-4 mb-6 rounded-2xl shadow-sm">
        <CardContent className="pt-4 pb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Accesos directos</h2>
          <div className="flex gap-3">
            {/* Checklist */}
            <button
              onClick={() => setShowChecklist(true)}
              className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-yellow-100 hover:bg-yellow-200 transition-colors shadow-sm"
              disabled={!tareaActual}
            >
              <CheckSquare className="h-6 w-6 text-yellow-700 mb-1" />
              <span className="text-[10px] font-medium text-yellow-900">Checklist</span>
            </button>

            {/* Chat */}
            <button
              onClick={() => setShowChat(true)}
              className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-gray-800 hover:bg-gray-900 transition-colors shadow-sm"
              disabled={!tareaActual}
            >
              <MessageSquare className="h-6 w-6 text-white mb-1" />
              <span className="text-[10px] font-medium text-white">Chat</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen del día */}
      <Card className="m-4 bg-gray-800 text-white rounded-2xl shadow-sm">
        <CardContent className="pt-4 pb-4">
          <h2 className="text-base font-semibold mb-3">Resumen del día</h2>
          <div className="text-center">
            <p className="text-5xl font-bold text-yellow-400 mb-1">{tareasCompletadasHoy}</p>
            <p className="text-xs text-gray-300">Tareas completadas</p>
          </div>
        </CardContent>
      </Card>

      {/* Modales */}
      {showChecklist && tareaActual && (
        <ChecklistModal
          tarea={{ id: tareaActual.id, nombre: tareaActual.title || '', title: tareaActual.title || '' }}
          onClose={() => setShowChecklist(false)}
          onSave={handleSaveChecklist}
        />
      )}

      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Chat</h2>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MensajeriaSocio />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
