'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  FileText,
  Image,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  Bell,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { SlideToConfirm } from '@/components/socio/SlideToConfirm';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/grows/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChecklistModal } from '@/components/socio/ChecklistModal';
import { MensajeriaSocio } from '@/components/socio/MensajeriaSocio';
import { ModalVerPlanos } from '@/components/socio/presupuestos/ModalVerPlanos';
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
  const [showPlanos, setShowPlanos] = useState(false);
  const [showEvidencias, setShowEvidencias] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isIniciando, setIsIniciando] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [tareasCompletadasHoy, setTareasCompletadasHoy] = useState(0);
  const [avanceDiario, setAvanceDiario] = useState(0);
  const [evidenciasFinales, setEvidenciasFinales] = useState<string[]>([]);
  const [jornadaActual, setJornadaActual] = useState<any>(null);
  const [subtareaActual, setSubtareaActual] = useState<any>(null);
  const [totalSubtareas, setTotalSubtareas] = useState(0);
  const [subtareasCompletadas, setSubtareasCompletadas] = useState(0);
  const [tareasProgramadasHoy, setTareasProgramadasHoy] = useState(0);
  const [showModalFinalizarSubtarea, setShowModalFinalizarSubtarea] = useState(false);

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
          // Incluir: ASIGNADA, pendiente, en_progreso, en_ejecucion
          const tareasParaIniciar = tareasOrdenadas.filter(
            (t) => {
              const estadoLower = (t.estado || '').toLowerCase();
              return estadoLower === 'asignada' || 
                     estadoLower === 'pendiente' ||
                     estadoLower === 'en_ejecucion' ||
                     estadoLower === 'en_progreso' ||
                     t.estado === 'ASIGNADA' ||
                     t.estado === 'PENDIENTE' ||
                     !t.estado;
            }
          );

        setTareas(tareasParaIniciar);

        // Detectar tareaId en query params o seleccionar automáticamente
        const tareaIdParam = searchParams?.get('tareaId');
        if (tareaIdParam && tareasParaIniciar.length > 0) {
          const index = tareasParaIniciar.findIndex(t => t.id === tareaIdParam);
          if (index >= 0) {
            setTareaActualIndex(index);
          }
        } else if (tareasParaIniciar.length > 0 && tareaActualIndex === 0) {
          // Selección automática: tarea con fecha más cercana o mayor prioridad
          const tareaSeleccionada = tareasParaIniciar.reduce((prev, current) => {
            const prevFecha = prev.fecha_inicio_estimada ? new Date(prev.fecha_inicio_estimada).getTime() : Infinity;
            const currentFecha = current.fecha_inicio_estimada ? new Date(current.fecha_inicio_estimada).getTime() : Infinity;
            if (currentFecha < prevFecha) return current;
            if (currentFecha === prevFecha && (current.prioridad === 'alta' || current.prioridad === 'ALTA')) return current;
            return prev;
          });
          const index = tareasParaIniciar.findIndex(t => t.id === tareaSeleccionada.id);
          if (index >= 0) {
            setTareaActualIndex(index);
          }
        }
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

        // Calcular progreso basado en tareas (las subtareas se actualizan en otro useEffect)
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

  // Actualizar progreso cuando cambian las subtareas
  useEffect(() => {
    if (totalSubtareas > 0) {
      const porcentaje = Math.round((subtareasCompletadas / totalSubtareas) * 100);
      setProgresoGeneral({ 
        completadas: subtareasCompletadas, 
        total: totalSubtareas, 
        porcentaje 
      });
    }
  }, [totalSubtareas, subtareasCompletadas]);

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

        // Primero obtener las tareas de la organización
        const { data: tareasOrg } = await supabase
          .from('tareas')
          .select('id')
          .eq('org_id', orgId);

        if (!tareasOrg || tareasOrg.length === 0) {
          setTareasCompletadasHoy(0);
          return;
        }

        const tareaIds = tareasOrg.map((t: any) => t.id);

        // Luego consultar eventos de esas tareas con nuevo_estado = 'finalizado'
        const { data: eventosHoy } = await supabase
          .from('eventos')
          .select('tarea_id')
          .in('tarea_id', tareaIds)
          .eq('nuevo_estado', 'finalizado')
          .gte('created_at', hoyISO);

        if (eventosHoy) {
          const tareasUnicas = new Set(eventosHoy.map((e: any) => e.tarea_id));
          setTareasCompletadasHoy(tareasUnicas.size);
        } else {
          setTareasCompletadasHoy(0);
        }
      } catch (err) {
        console.error('[AHORA] Error calculando tareas hoy:', err);
        setTareasCompletadasHoy(0);
      }
    };

    calcularTareasHoy();
  }, [currentUser, orgIdResuelta, supabase]);

  // Tarea actual (una a la vez, ordenada por CPM)
  const tareaActual = useMemo(() => {
    return tareas[tareaActualIndex] || null;
  }, [tareas, tareaActualIndex]);

  // Función para generar subtareas automáticamente si faltan
  const generarSubtareasParaTarea = async (tareaId: string) => {
    try {
      // Verificar si ya existen subtareas
      const { data: subtareasExistentes } = await (supabase as any)
        .from('tareas_subtareas')
        .select('id')
        .eq('tarea_id', tareaId)
        .limit(1);

      if (subtareasExistentes && subtareasExistentes.length > 0) {
        // Ya existen subtareas, no generar
        return;
      }

      // Obtener presupuesto de la tarea
      const { data: presupuesto, error: presupuestoError } = await (supabase as any)
        .from('tareas_presupuestos')
        .select('cantidad, unidad, dias_reales, notas')
        .eq('tarea_id', tareaId)
        .maybeSingle();

      if (presupuestoError || !presupuesto) {
        console.warn(`[GENERAR_SUBTAREAS] No se encontró presupuesto para tarea ${tareaId}`);
        return;
      }

      const { cantidad, unidad, dias_reales, notas } = presupuesto;
      
      // Intentar obtener dias_reales de notas si no viene directamente
      let dias = dias_reales;
      if (!dias && notas) {
        try {
          const notasParsed = typeof notas === 'string' ? JSON.parse(notas) : notas;
          dias = notasParsed?.dias_reales || notasParsed?.dias;
        } catch {
          // Si no se puede parsear, usar null
        }
      }
      
      if (!cantidad || !dias || dias <= 0) {
        console.warn(`[GENERAR_SUBTAREAS] Datos inválidos: cantidad=${cantidad}, dias_reales=${dias}`);
        return;
      }

      // Obtener fecha_inicio_estimada de la tarea
      const { data: tareaData } = await (supabase as any)
        .from('tareas')
        .select('fecha_inicio_estimada')
        .eq('id', tareaId)
        .maybeSingle();

      if (!tareaData?.fecha_inicio_estimada) {
        console.warn(`[GENERAR_SUBTAREAS] No se encontró fecha_inicio_estimada para tarea ${tareaId}`);
        return;
      }

      // Calcular rendimiento diario
      const rendimientoDiario = cantidad / dias;
      const subtareas: any[] = [];
      const fechaInicio = new Date(tareaData.fecha_inicio_estimada);
      fechaInicio.setHours(0, 0, 0, 0);

      // Generar subtareas para cada día
      for (let i = 1; i <= dias; i++) {
        const fechaSubtarea = new Date(fechaInicio);
        fechaSubtarea.setDate(fechaInicio.getDate() + (i - 1));
        
        subtareas.push({
          tarea_id: tareaId,
          orden: i,
          cantidad: rendimientoDiario,
          unidad: unidad || 'unidades',
          estado: 'pendiente',
          fecha: fechaSubtarea.toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        });
      }

      // Verificar si hay leftover
      const totalGenerado = rendimientoDiario * dias;
      if (totalGenerado < cantidad) {
        const leftover = cantidad - totalGenerado;
        const fechaFinal = new Date(fechaInicio);
        fechaFinal.setDate(fechaInicio.getDate() + dias);
        
        subtareas.push({
          tarea_id: tareaId,
          orden: dias + 1,
          cantidad: leftover,
          unidad: unidad || 'unidades',
          estado: 'pendiente',
          fecha: fechaFinal.toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        });
      }

      // Insertar subtareas masivamente
      const { error: insertError } = await (supabase as any)
        .from('tareas_subtareas')
        .insert(subtareas);

      if (insertError) {
        console.error('[GENERAR_SUBTAREAS] Error insertando subtareas:', insertError);
        return;
      }

      console.log(`[GENERAR_SUBTAREAS] Generadas ${subtareas.length} subtareas para tarea ${tareaId}`);
    } catch (err) {
      console.error('[GENERAR_SUBTAREAS] Error generando subtareas:', err);
    }
  };

  // Cargar jornada actual y subtarea activa
  useEffect(() => {
    const cargarJornadaYSubtarea = async () => {
      if (!currentUser?.id || !currentUser?.email) {
        setJornadaActual(null);
        setSubtareaActual(null);
        return;
      }

      const orgId = orgIdResuelta || currentUser.orgId;
      if (!orgId) return;

      try {
        // Obtener el socio_id desde la tabla socios usando el email del usuario
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (!socioData?.id) {
          console.warn('[AHORA] Socio no encontrado para email:', currentUser.email);
          setJornadaActual(null);
          setSubtareaActual(null);
          return;
        }

        const socioId = socioData.id;

        // Verificar si existe jornada para hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString().split('T')[0];

        const { data: jornadaData } = await (supabase as any)
          .from('jornadas_socio')
          .select('*')
          .eq('socio_id', socioId)
          .eq('fecha', hoyISO)
          .maybeSingle();

        setJornadaActual(jornadaData);

        // Autogenerar subtareas para tareas asignadas que no tienen subtareas
        if (tareas.length > 0) {
          for (const tarea of tareas) {
            if (tarea.estado === 'ASIGNADA' || tarea.estado?.toLowerCase() === 'asignada') {
              await generarSubtareasParaTarea(tarea.id);
            }
          }
        }

        // Buscar la primera subtarea pendiente de todas las tareas del socio (SIN filtrar por fecha)
        const { data: subtareaPendiente } = await (supabase as any)
          .from('tareas_subtareas')
          .select(`
            *,
            tareas:tareas (
              id,
              title,
              obra_id,
              estado,
              obras:obras (
                id,
                name,
                address
              )
            )
          `)
          .eq('estado', 'pendiente')
          .order('orden', { ascending: true })
          .limit(1);

        if (subtareaPendiente && subtareaPendiente.length > 0) {
          const subtarea = subtareaPendiente[0];
          setSubtareaActual(subtarea);
          
          // Cargar total de subtareas de esa tarea
          const { data: todasSubtareas } = await (supabase as any)
            .from('tareas_subtareas')
            .select('id, estado')
            .eq('tarea_id', subtarea.tarea_id);

          if (todasSubtareas) {
            setTotalSubtareas(todasSubtareas.length);
            const completadas = todasSubtareas.filter((s: any) => s.estado === 'finalizada').length;
            setSubtareasCompletadas(completadas);
          }

          // Actualizar tarea actual si es diferente
          if (subtarea.tareas) {
            const tareaEncontrada = tareas.find(t => t.id === subtarea.tareas.id);
            if (!tareaEncontrada && subtarea.tareas) {
              setTareas([subtarea.tareas as SupabaseTarea]);
              setTareaActualIndex(0);
            }
          }

          // Contar todas las subtareas pendientes (sin filtrar por fecha)
          const { data: todasSubtareasPendientes } = await (supabase as any)
            .from('tareas_subtareas')
            .select('id, estado')
            .eq('estado', 'pendiente');

          if (todasSubtareasPendientes) {
            setTareasProgramadasHoy(todasSubtareasPendientes.length);
            const { data: todasSubtareasFinalizadas } = await (supabase as any)
              .from('tareas_subtareas')
              .select('id, estado')
              .eq('estado', 'finalizada');
            
            if (todasSubtareasFinalizadas) {
              setTareasCompletadasHoy(todasSubtareasFinalizadas.length);
            }
          }
        } else {
          // No hay subtareas pendientes - buscar tareas asignadas (modo compatibilidad)
          setSubtareaActual(null);
          setTotalSubtareas(0);
          setSubtareasCompletadas(0);
          
          // Buscar tareas con estado ASIGNADA o pendiente
          const { data: tareasAsignadas } = await (supabase as any)
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
            .in('estado', ['ASIGNADA', 'asignada', 'pendiente', 'PENDIENTE'])
            .order('created_at', { ascending: false })
            .limit(1);

          if (tareasAsignadas && tareasAsignadas.length > 0) {
            const tareaAsignada = tareasAsignadas[0] as SupabaseTarea;
            // Buscar si esta tarea está en el array de tareas
            const index = tareas.findIndex(t => t.id === tareaAsignada.id);
            if (index >= 0) {
              setTareaActualIndex(index);
            } else {
              // Agregar la tarea al array
              setTareas([tareaAsignada, ...tareas]);
              setTareaActualIndex(0);
            }
            
            // Contar tareas asignadas y pendientes
            const { data: todasTareasAsignadas } = await (supabase as any)
              .from('tareas')
              .select('id, estado')
              .eq('org_id', orgId)
              .or(`responsable.eq.${currentUser.email || ''},responsable.ilike.%${currentUser.email || ''}%`)
              .in('estado', ['ASIGNADA', 'asignada', 'pendiente', 'PENDIENTE']);

            if (todasTareasAsignadas) {
              setTareasProgramadasHoy(todasTareasAsignadas.length);
              const { data: tareasCompletadas } = await (supabase as any)
                .from('tareas')
                .select('id, estado')
                .eq('org_id', orgId)
                .or(`responsable.eq.${currentUser.email || ''},responsable.ilike.%${currentUser.email || ''}%`)
                .in('estado', ['COMPLETADA', 'completada', 'finalizado', 'FINALIZADO']);
              
              if (tareasCompletadas) {
                setTareasCompletadasHoy(tareasCompletadas.length);
              }
            }
          } else {
            setTareasProgramadasHoy(0);
            setTareasCompletadasHoy(0);
          }
        }
      } catch (err) {
        console.error('[AHORA] Error cargando jornada y subtarea:', err);
      }
    };

    cargarJornadaYSubtarea();
  }, [currentUser, orgIdResuelta, supabase, tareas]);

  // Cargar avance diario y evidencias finales de la tarea actual
  useEffect(() => {
    const cargarAvanceYEvidencias = async () => {
      if (!tareaActual?.id || !currentUser?.id) {
        setAvanceDiario(0);
        setEvidenciasFinales([]);
        return;
      }

      const orgId = orgIdResuelta || currentUser.orgId;
      if (!orgId) return;

      try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString();

        // Buscar eventos de avance diario de hoy
        const { data: eventosAvance } = await supabase
          .from('eventos')
          .select('id, snapshot_json')
          .eq('tarea_id', tareaActual.id)
          .eq('nuevo_estado', 'en_ejecucion')
          .gte('created_at', hoyISO)
          .order('created_at', { ascending: false })
          .limit(1) as any;

        if (eventosAvance && eventosAvance.length > 0) {
          const snapshot = eventosAvance[0].snapshot_json as any;
          if (snapshot?.avance_diario !== undefined) {
            setAvanceDiario(snapshot.avance_diario);
          }
        }

        // Buscar evidencias finales de la tarea
        const { data: eventosFinal } = await supabase
          .from('eventos')
          .select('id')
          .eq('tarea_id', tareaActual.id)
          .eq('nuevo_estado', 'finalizado')
          .order('created_at', { ascending: false })
          .limit(1) as any;

        if (eventosFinal && eventosFinal.length > 0) {
          const { data: mediaData } = await supabase
            .from('media')
            .select('path, kind')
            .eq('evento_id', eventosFinal[0].id)
            .eq('kind', 'evidencia_final') as any;

          if (mediaData) {
            setEvidenciasFinales(mediaData.map((m: any) => m.path));
          }
        }
      } catch (err) {
        console.error('[AHORA] Error cargando avance y evidencias:', err);
      }
    };

    cargarAvanceYEvidencias();
  }, [tareaActual?.id, currentUser, orgIdResuelta, supabase]);

  const handleIniciarJornada = async () => {
    if (!currentUser?.id) return;

    // Requiere al menos una tarea o subtarea
    if (!subtareaActual && !tareaActual && tareas.length === 0) {
      setError('No hay tareas asignadas para iniciar jornada');
      return;
    }
    
    // Si no hay tarea seleccionada pero hay tareas, asegurar que se seleccione la primera
    if (!subtareaActual && !tareaActual && tareas.length > 0) {
      // Asegurar que el índice esté dentro del rango
      if (tareaActualIndex >= tareas.length || tareaActualIndex < 0) {
        setTareaActualIndex(0);
      }
      // Si aún no hay tareaActual después de ajustar el índice, puede ser un problema de timing
      // Continuar con la primera tarea disponible
    }

    setIsIniciando(true);
    
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyISO = hoy.toISOString().split('T')[0];
      const horaInicio = new Date().toISOString();

      // Obtener obra_id de la tarea o subtarea
      const obraId = subtareaActual?.tareas?.obra_id || 
                     subtareaActual?.tarea?.obra_id || 
                     tareaActual?.obra_id;
      
      if (!obraId) {
        setError('No se pudo determinar la obra');
        setIsIniciando(false);
        return;
      }

      // Obtener el socio_id desde la tabla socios usando el email del usuario
      if (!currentUser?.email) {
        setError('No se pudo obtener el email del usuario');
        setIsIniciando(false);
        return;
      }

      const { data: socioData, error: socioError } = await (supabase as any)
        .from('socios')
        .select('id')
        .eq('email', currentUser.email)
        .maybeSingle();

      if (socioError) {
        console.error('[AHORA] Error obteniendo socio:', socioError);
        setError('Error al obtener información del socio');
        setIsIniciando(false);
        return;
      }

      if (!socioData?.id) {
        console.error('[AHORA] Socio no encontrado para email:', currentUser.email);
        setError('No se encontró tu registro como socio. Contacta al administrador.');
        setIsIniciando(false);
        return;
      }

      const socioId = socioData.id;
      console.log('[AHORA] Socio encontrado:', { socio_id: socioId, email: currentUser.email });

      // Verificar si ya existe una jornada para hoy
      const { data: jornadaExistente, error: errorVerificar } = await (supabase as any)
        .from('jornadas_socio')
        .select('*')
        .eq('socio_id', socioId)
        .eq('fecha', hoyISO)
        .maybeSingle();

      if (errorVerificar) {
        console.error('[AHORA] Error verificando jornada existente:', errorVerificar);
        setError('Error al verificar jornada existente');
        setIsIniciando(false);
        return;
      }

      // Si ya existe una jornada, usarla
      if (jornadaExistente) {
        console.log('[AHORA] Jornada ya existe para hoy, usando la existente');
        setJornadaActual(jornadaExistente);
        setIsIniciando(false);
        return;
      }

      // Validar que todos los datos requeridos estén presentes
      if (!socioId) {
        setError('No se pudo obtener el ID del socio');
        setIsIniciando(false);
        return;
      }

      if (!obraId) {
        setError('No se pudo determinar la obra');
        setIsIniciando(false);
        return;
      }

      if (!hoyISO || !horaInicio) {
        setError('Error al obtener fecha u hora');
        setIsIniciando(false);
        return;
      }

      // Crear nueva jornada en jornadas_socio
      const insertData = {
        socio_id: socioId,
        obra_id: obraId,
        fecha: hoyISO,
        hora_inicio: horaInicio,
      };

      console.log('[AHORA] Intentando crear jornada con datos:', insertData);

      const { data: nuevaJornada, error: jornadaError } = await (supabase as any)
        .from('jornadas_socio')
        .insert(insertData)
        .select()
        .single();

      if (jornadaError) {
        // Mejorar el logging del error para obtener más información
        const errorInfo: any = {
          error: jornadaError,
          message: jornadaError?.message,
          details: jornadaError?.details,
          hint: jornadaError?.hint,
          code: jornadaError?.code,
        };
        
        // Si el error es un objeto, intentar serializarlo
        try {
          const errorString = JSON.stringify(jornadaError, null, 2);
          errorInfo.rawError = errorString;
        } catch (e) {
          errorInfo.rawError = String(jornadaError);
        }
        
        // Agregar información del contexto
        errorInfo.context = {
          socio_id: socioId,
          user_id: currentUser.id,
          user_email: currentUser.email,
          obra_id: obraId,
          fecha: hoyISO,
          hora_inicio: horaInicio,
        };
        
        console.error('[AHORA] Error creando jornada:', errorInfo);
        
        // Si el error es por constraint único (jornada ya existe), intentar cargarla
        if (jornadaError.code === '23505' || jornadaError.message?.includes('unique') || jornadaError.message?.includes('duplicate')) {
          console.log('[AHORA] Jornada ya existe (constraint), cargando la existente');
          const { data: jornadaData } = await (supabase as any)
            .from('jornadas_socio')
            .select('*')
            .eq('socio_id', socioId)
            .eq('fecha', hoyISO)
            .maybeSingle();
          
          if (jornadaData) {
            setJornadaActual(jornadaData);
            setIsIniciando(false);
            return;
          }
        }
        
        setError(`Error al iniciar la jornada: ${jornadaError.message || 'Error desconocido'}`);
        setIsIniciando(false);
        return;
      }

      // Usar la jornada recién creada
      if (nuevaJornada) {
        setJornadaActual(nuevaJornada);
      } else {
        // Si no viene en la respuesta, recargarla
        const { data: jornadaData } = await (supabase as any)
          .from('jornadas_socio')
          .select('*')
          .eq('socio_id', socioId)
          .eq('fecha', hoyISO)
          .maybeSingle();

        setJornadaActual(jornadaData);
      }
    } catch (err: any) {
      console.error('[AHORA] Error al iniciar jornada:', {
        error: err,
        message: err?.message,
        stack: err?.stack,
      });
      setError(`Error al iniciar la jornada: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsIniciando(false);
    }
  };

  const handleIniciarSubtarea = async () => {
    if (!subtareaActual || !currentUser) return;

    setIsIniciando(true);
    
    try {
      const horaInicio = new Date().toISOString();

      // Actualizar subtarea a en_progreso
      const { error: updateError } = await (supabase as any)
        .from('tareas_subtareas')
        .update({
          estado: 'en_progreso',
          hora_inicio: horaInicio,
        })
        .eq('id', subtareaActual.id);

      if (updateError) {
        console.error('[AHORA] Error iniciando subtarea:', updateError);
        setError('Error al iniciar la subtarea');
        setIsIniciando(false);
        return;
      }

      // Recargar subtarea
      const { data: subtareaData } = await (supabase as any)
        .from('tareas_subtareas')
        .select('*')
        .eq('id', subtareaActual.id)
        .maybeSingle();

      setSubtareaActual(subtareaData);
    } catch (err) {
      console.error('[AHORA] Error al iniciar subtarea', err);
      setError('Error al iniciar la subtarea. Por favor, intenta nuevamente.');
    } finally {
      setIsIniciando(false);
    }
  };

  // Función auxiliar para generar un beep simple
  const generarBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frecuencia del beep
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.warn('[AHORA] No se pudo generar beep:', err);
    }
  };

  const handleIniciarTarea = async () => {
    if (!tareaActual || !currentUser) return;

    setIsIniciando(true);
    
    // Efecto visual amarillo: tornar toda la pantalla amarilla
    const mainContainer = document.querySelector('.ahora-container') as HTMLElement;
    const htmlElement = document.documentElement;
    
    if (mainContainer) {
      mainContainer.classList.add('bg-yellow-200', 'transition-colors', 'duration-500');
    }
    if (htmlElement) {
      htmlElement.classList.add('bg-yellow-200', 'transition-colors', 'duration-500');
    }
    document.body.classList.add('bg-yellow-200', 'transition-colors', 'duration-500');
    
    // Reproducir sonido de inicio
    try {
      // Intentar usar el elemento de audio del layout
      const audioElement = document.getElementById('grows-notification-sound') as HTMLAudioElement;
      if (audioElement) {
        audioElement.volume = 0.7;
        audioElement.currentTime = 0;
        await audioElement.play().catch((err) => {
          console.warn('[AHORA] No se pudo reproducir el sonido del layout:', err);
          // Fallback: generar un beep simple
          generarBeep();
        });
      } else {
        // Fallback: generar un beep simple si no existe el elemento
        generarBeep();
      }
    } catch (err) {
      console.warn('[AHORA] Error al reproducir sonido:', err);
      // Fallback: generar un beep simple
      generarBeep();
    }
    
    // Mantener el efecto amarillo por 3 segundos
    setTimeout(() => {
      if (mainContainer) {
        mainContainer.classList.remove('bg-yellow-200');
        mainContainer.classList.add('bg-yellow-50', 'transition-colors', 'duration-1000');
      }
      if (htmlElement) {
        htmlElement.classList.remove('bg-yellow-200');
        htmlElement.classList.add('bg-yellow-50', 'transition-colors', 'duration-1000');
      }
      document.body.classList.remove('bg-yellow-200');
      document.body.classList.add('bg-yellow-50', 'transition-colors', 'duration-1000');
      
      // Remover completamente el efecto después de 2 segundos más
      setTimeout(() => {
        if (mainContainer) {
          mainContainer.classList.remove('bg-yellow-50');
        }
        if (htmlElement) {
          htmlElement.classList.remove('bg-yellow-50');
        }
        document.body.classList.remove('bg-yellow-50');
      }, 2000);
    }, 3000);

    try {
      // Actualizar tarea directamente: estado a "en_progreso", fecha_inicio_real y hora_inicio
      const ahora = new Date();
      const fechaInicioReal = ahora.toISOString().split('T')[0];
      const horaInicio = ahora.toISOString();

      const { error: updateError } = await (supabase as any)
        .from('tareas')
        .update({
          estado: 'en_progreso',
          fecha_inicio_real: fechaInicioReal,
          hora_inicio: horaInicio,
        })
        .eq('id', tareaActual.id);

      if (updateError) {
        console.error('[AHORA] Error iniciando tarea:', updateError);
        setError('Error al iniciar la tarea');
        setIsIniciando(false);
        return;
      }

      // Recargar tarea actualizada
      const orgIdRecargar = orgIdResuelta || currentUser.orgId;
      if (orgIdRecargar) {
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
            fecha_inicio_real,
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
          .eq('id', tareaActual.id)
          .maybeSingle();

        if (data) {
          const tareaActualizada = data as SupabaseTarea;
          const index = tareas.findIndex(t => t.id === tareaActualizada.id);
          if (index >= 0) {
            const nuevasTareas = [...tareas];
            nuevasTareas[index] = tareaActualizada;
            setTareas(nuevasTareas);
          }
        }
      }

      // Llamar al endpoint de transición para iniciar la tarea (para mantener compatibilidad con eventos)
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

  const handleFinalizarSubtarea = async (evidenciaUrl?: string, videoUrl?: string, problemas?: string) => {
    if (!subtareaActual || !currentUser) return;

    setIsFinalizando(true);
    
    try {
      const horaFin = new Date().toISOString();

      // Actualizar subtarea a finalizada
      const { error: updateError } = await (supabase as any)
        .from('tareas_subtareas')
        .update({
          estado: 'finalizada',
          hora_fin: horaFin,
          evidencia_url: evidenciaUrl || null,
          video_url: videoUrl || null,
          problemas: problemas || null,
        })
        .eq('id', subtareaActual.id);

      if (updateError) {
        console.error('[AHORA] Error finalizando subtarea:', updateError);
        setError('Error al finalizar la subtarea');
        setIsFinalizando(false);
        return;
      }

      // Verificar si todas las subtareas de la tarea están completadas
      const tareaId = subtareaActual.tarea_id || subtareaActual.tareas?.id;
      if (tareaId) {
        const { data: todasSubtareas } = await (supabase as any)
          .from('tareas_subtareas')
          .select('id, estado')
          .eq('tarea_id', tareaId);

        if (todasSubtareas) {
          const todasFinalizadas = todasSubtareas.every((s: any) => s.estado === 'finalizada');
          
          if (todasFinalizadas) {
            // Marcar tarea como COMPLETADA y enviar notificación
            await handleCompletarTarea();
          }
        }
      }

      // Buscar próxima subtarea pendiente de todas las tareas
      const { data: siguienteSubtarea } = await (supabase as any)
        .from('tareas_subtareas')
        .select(`
          *,
          tareas:tareas (
            id,
            title,
            obra_id,
            obras:obras (
              id,
              name,
              address
            )
          )
        `)
        .eq('estado', 'pendiente')
        .order('orden', { ascending: true })
        .limit(1);

      if (siguienteSubtarea && siguienteSubtarea.length > 0) {
        setSubtareaActual(siguienteSubtarea[0]);
        
        // Actualizar contadores
        const tareaIdNueva = siguienteSubtarea[0].tarea_id || siguienteSubtarea[0].tareas?.id;
        if (tareaIdNueva) {
          const { data: todasSubtareasNueva } = await (supabase as any)
            .from('tareas_subtareas')
            .select('id, estado')
            .eq('tarea_id', tareaIdNueva);

          if (todasSubtareasNueva) {
            setTotalSubtareas(todasSubtareasNueva.length);
            const completadas = todasSubtareasNueva.filter((s: any) => s.estado === 'finalizada').length;
            setSubtareasCompletadas(completadas);
          }
        }
      } else {
        // No hay más subtareas pendientes
        setSubtareaActual(null);
        setTotalSubtareas(0);
        setSubtareasCompletadas(0);
      }

      // Actualizar contador de tareas completadas hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyISO = hoy.toISOString().split('T')[0];
      const { data: subtareasHoy } = await (supabase as any)
        .from('tareas_subtareas')
        .select('id, estado, fecha')
        .eq('fecha', hoyISO);

      if (subtareasHoy) {
        const completadasHoy = subtareasHoy.filter((s: any) => s.estado === 'finalizada').length;
        setTareasCompletadasHoy(completadasHoy);
      }

      setShowModalFinalizarSubtarea(false);
    } catch (err) {
      console.error('[AHORA] Error al finalizar subtarea', err);
      setError('Error al finalizar la subtarea. Por favor, intenta nuevamente.');
    } finally {
      setIsFinalizando(false);
    }
  };

  const handleCompletarTarea = async () => {
    const tareaId = subtareaActual?.tarea_id || subtareaActual?.tareas?.id || tareaActual?.id;
    if (!tareaId || !currentUser) return;

    try {
      // Actualizar tarea principal a finalizado
      const { error: updateError } = await (supabase as any)
        .from('tareas')
        .update({ 
          estado: 'finalizado',
          fecha_fin_real: new Date().toISOString().split('T')[0],
        })
        .eq('id', tareaId);

      if (updateError) {
        console.error('[AHORA] Error completando tarea:', updateError);
        return;
      }

      // Enviar notificación al cliente técnico
      const orgId = orgIdResuelta || currentUser.orgId;
      if (orgId) {
        // Obtener obra_id de la tarea
        const { data: tareaData } = await (supabase as any)
          .from('tareas')
          .select('obra_id')
          .eq('id', tareaId)
          .maybeSingle();

        if (tareaData?.obra_id) {
          // Obtener owner_user_id de la organización
          const { data: orgData } = await (supabase as any)
            .from('organizaciones')
            .select('owner_user_id')
            .eq('id', orgId)
            .maybeSingle();

          if (orgData?.owner_user_id) {
            await (supabase as any)
              .from('notificaciones')
              .insert({
                titulo: 'Tarea completada',
                mensaje: `Todas las subtareas de la tarea han sido completadas`,
                tipo: 'avance',
                remitente_id: currentUser.id,
                destinatario_id: orgData.owner_user_id,
                org_id: orgId,
              });
          }
        }
      }
    } catch (err) {
      console.error('[AHORA] Error completando tarea:', err);
    }
  };

  const handleFinalizarTarea = async (fotoDataUrl?: string) => {
    if (!tareaActual || !currentUser) return;

    // Si hay subtareas, usar el flujo de subtareas
    if (subtareaActual) {
      await handleFinalizarSubtarea(fotoDataUrl);
      return;
    }

    // Validar que haya al menos una evidencia final
    if (evidenciasFinales.length === 0 && !fotoDataUrl) {
      setError('Para finalizar la tarea es necesario subir al menos una evidencia fotográfica.');
      return;
    }

    setIsFinalizando(true);
    
    // Efecto verde: agregar clase al body
    document.body.classList.add('bg-green-50');
    setTimeout(() => {
      document.body.classList.remove('bg-green-50');
    }, 2000);

    try {
      const media = fotoDataUrl ? [{
        kind: 'evidencia_final' as const,
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
            .select('id')
            .eq('tarea_id', tareaActual.id)
            .eq('nuevo_estado', 'finalizado')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle() as any;

          if (eventoData?.id) {
            // Obtener media de la tabla media relacionada con el evento
            const { data: mediaData } = await supabase
              .from('media')
              .select('path, kind')
              .eq('evento_id', eventoData.id)
              .limit(1)
              .maybeSingle() as any;

            if (mediaData?.path) {
              await supabase
                .from('tareas_evidencias')
                .insert({
                  tarea_id: tareaActual.id,
                  url: mediaData.path,
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
      
      // Primero obtener las tareas de la organización
      const { data: tareasOrg } = await supabase
        .from('tareas')
        .select('id')
        .eq('org_id', orgId || '');

      if (tareasOrg && tareasOrg.length > 0) {
        const tareaIds = tareasOrg.map((t: any) => t.id);
        
        // Luego consultar eventos de esas tareas con nuevo_estado = 'finalizado'
        const { data: eventosHoy } = await supabase
          .from('eventos')
          .select('tarea_id')
          .in('tarea_id', tareaIds)
          .eq('nuevo_estado', 'finalizado')
          .gte('created_at', hoyISO);
        
        if (eventosHoy) {
          const tareasUnicas = new Set(eventosHoy.map((e: any) => e.tarea_id));
          setTareasCompletadasHoy(tareasUnicas.size);
        }
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

  const handleIncrementarAvance = async (incremento: number) => {
    if (!tareaActual || !currentUser) return;

    const nuevoAvance = Math.min(100, Math.max(0, (tareaActual.avance || 0) + incremento));
    
    try {
      // Guardar avance diario como evento
      const orgId = orgIdResuelta || currentUser.orgId;
      if (!orgId) return;

      const response = await fetch(`/api/tareas/${tareaActual.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevo_estado: tareaActual.estado || 'en_ejecucion',
          notas: `Avance diario actualizado: ${nuevoAvance}%`,
          checklist: [],
          has_nc: false,
          actor: {
            name: currentUser.name || currentUser.email || 'Socio',
            role: 'Socio',
            method: 'login',
          },
          media: [],
          snapshot_json: {
            avance_diario: nuevoAvance,
            fecha_avance: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        setAvanceDiario(nuevoAvance);
        // Recargar tareas para actualizar el avance
        window.location.reload();
      }
    } catch (err) {
      console.error('[AHORA] Error al guardar avance:', err);
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

  // Obtener inicial del nombre
  const inicialNombre = currentUser?.name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'S';
  
  // Determinar texto del CTA principal
  const getCTAText = () => {
    if (subtareaActual) {
      // Flujo con subtareas
      if (!jornadaActual) return 'Iniciar jornada';
      if (subtareaActual.estado === 'pendiente') return 'Comenzar tarea';
      if (subtareaActual.estado === 'en_progreso') return 'Finalizar tarea';
      return 'Iniciar jornada';
    } else if (tareaActual) {
      // Modo compatibilidad: flujo con tarea completa
      if (!jornadaActual) return 'Iniciar jornada';
      if (!isTareaEnProgreso) return 'Comenzar tarea';
      return 'Finalizar tarea';
    } else if (tareas.length > 0) {
      // Si hay tareas pero no hay tarea seleccionada
      if (!jornadaActual) return 'Iniciar jornada';
      return 'Seleccionar tarea';
    } else if (jornadaActual && !jornadaActual.hora_fin) {
      // Si hay jornada activa pero no hay tareas visibles
      return 'Finalizar jornada';
    }
    return 'Iniciar jornada';
  };

  // Determinar función del CTA
  const handleCTAClick = () => {
    if (subtareaActual) {
      // Flujo con subtareas
      if (!jornadaActual) {
        handleIniciarJornada();
      } else if (subtareaActual.estado === 'pendiente') {
        handleIniciarSubtarea();
      } else if (subtareaActual.estado === 'en_progreso') {
        setShowModalFinalizarSubtarea(true);
      }
    } else if (tareaActual) {
      // Modo compatibilidad: flujo con tarea completa
      if (!jornadaActual) {
        handleIniciarJornada();
      } else if (!isTareaEnProgreso) {
        handleIniciarTarea();
      } else {
        handleFinalizarTarea();
      }
    } else if (tareas.length > 0 && !jornadaActual) {
      // Si hay tareas pero no hay tarea seleccionada y no hay jornada, iniciar jornada
      // Primero seleccionar la primera tarea si no hay ninguna seleccionada
      if (tareaActualIndex === 0 && tareas[0]) {
        handleIniciarJornada();
      }
    }
  };

  // Determinar si el CTA está deshabilitado
  const isCTADisabled = () => {
    // Habilitado si hay tarea, subtarea o tareas disponibles
    if (!subtareaActual && !tareaActual && tareas.length === 0) return true;
    // Si hay tareas pero no hay jornada, permitir iniciar jornada
    if (tareas.length > 0 && !jornadaActual && !subtareaActual && !tareaActual) return false;
    return isIniciando || isFinalizando;
  };


  return (
    <div className={`ahora-container min-h-screen bg-white pb-20 md:pb-8 transition-colors duration-500 ${isIniciando ? 'bg-yellow-200' : isFinalizando ? 'bg-green-50' : ''}`}>
      {/* Saludo dentro de la pantalla */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          HOLA, {currentUser?.name?.toUpperCase() || currentUser?.email?.split('@')[0]?.toUpperCase() || 'SOCIO'}
        </h1>
        <p className="text-base text-gray-600 mt-1">Tu jornada de hoy</p>
      </div>

      {/* 2. HERO PRINCIPAL - Card grande estilo mapa Uber */}
      {subtareaActual ? (
        <div className="mx-4 mt-4 mb-4">
          <Card className="rounded-2xl shadow-lg overflow-hidden">
            <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              {/* Estado */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${
                  subtareaActual.estado === 'en_progreso' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`}></div>
                <Badge variant={subtareaActual.estado === 'en_progreso' ? 'info' : 'warning'}>
                  {subtareaActual.estado === 'en_progreso' ? 'En curso' : 'Pendiente'}
                </Badge>
              </div>

              {/* Nombre de la tarea/subtarea */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {subtareaActual.tareas?.title || 'Tarea del día'}
              </h2>

              {/* Información principal */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <FileText className="h-4 w-4 text-[#276EF1]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cantidad</p>
                    <p className="font-semibold text-gray-900">
                      {subtareaActual.cantidad} {subtareaActual.unidad || 'unidades'}
                    </p>
                  </div>
                </div>

                {subtareaActual.tareas?.obras?.address && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <MapPin className="h-4 w-4 text-[#276EF1]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {subtareaActual.tareas.obras.address}
                      </p>
                    </div>
                  </div>
                )}

                {totalSubtareas > 0 && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <CheckCircle className="h-4 w-4 text-[#276EF1]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Avance del día</p>
                      <p className="font-semibold text-gray-900">
                        Subtarea {subtareaActual.orden} de {totalSubtareas}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : tareaActual ? (
        // Modo compatibilidad: mostrar tarea completa si no hay subtareas
        <div className="mx-4 mt-4 mb-4">
          <Card className="rounded-2xl shadow-lg overflow-hidden">
            <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              {/* Estado */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${
                  isTareaEnProgreso ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`}></div>
                <Badge variant={isTareaEnProgreso ? 'info' : 'warning'}>
                  {isTareaEnProgreso ? 'En curso' : 'Pendiente'}
                </Badge>
              </div>

              {/* Nombre de la tarea */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {tareaActual.title || 'Tarea del día'}
              </h2>

              {/* Información principal */}
              <div className="space-y-3 mb-4">
                {tareaActual.elemento?.cantidad && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <FileText className="h-4 w-4 text-[#276EF1]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cantidad</p>
                      <p className="font-semibold text-gray-900">
                        {tareaActual.elemento.cantidad} {tareaActual.elemento.unidad || 'unidades'}
                      </p>
                    </div>
                  </div>
                )}

                {tareaActual.obras?.address && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <MapPin className="h-4 w-4 text-[#276EF1]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {tareaActual.obras.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mx-4 mt-4 mb-4">
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay tareas asignadas</h2>
              <p className="text-gray-600">No tenés tareas asignadas en este momento</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. CTA PRINCIPAL - Botón gigante estilo Uber o SlideToConfirm */}
      {/* Mostrar botón si hay tareas, subtarea o tarea actual, O si hay jornada activa (para finalizar) */}
      {(subtareaActual || tareaActual || (tareas.length > 0 && !error) || (jornadaActual && !jornadaActual.hora_fin)) && (
        <div className="px-4 mb-4">
          {/* Si hay jornada pero la tarea no está iniciada, usar SlideToConfirm */}
          {jornadaActual && !subtareaActual && tareaActual && !isTareaEnProgreso ? (
            <SlideToConfirm
              onConfirm={handleIniciarTarea}
              label="Comenzar tarea"
              confirmLabel="Desliza para comenzar"
              disabled={isIniciando || isFinalizando}
              variant="start"
            />
          ) : (
            <button
              onClick={handleCTAClick}
              disabled={isCTADisabled()}
              className="w-full bg-[#276EF1] text-white py-5 px-6 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#1e5dd9] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isIniciando ? 'Iniciando...' : isFinalizando ? 'Finalizando...' : getCTAText()}
            </button>
          )}
        </div>
      )}

      {/* 4. BLOQUE GUÍA - Estadísticas (solo después de iniciar jornada) */}
      {jornadaActual && (
        <div className="px-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-4">
          {tareasProgramadasHoy > 0 ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tenés {tareasProgramadasHoy} {subtareaActual ? 'subtareas' : 'tareas'} pendientes</p>
                <p className="text-sm font-semibold text-green-600 mt-1">
                  Completaste {tareasCompletadasHoy} {subtareaActual ? 'subtareas' : 'tareas'}
                </p>
              </div>
              {tareasCompletadasHoy === tareasProgramadasHoy && tareasProgramadasHoy > 0 && (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <p className="text-sm text-gray-600">No hay tareas pendientes</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* 5. NOTIFICACIÓN DEL ESTADO - Banner */}
      {subtareaActual?.estado === 'finalizada' && (
        <div className="mx-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Subtarea finalizada. Comenzá la siguiente.
            </p>
          </div>
        </div>
      )}
      
      {!subtareaActual && tareasProgramadasHoy > 0 && (
        <div className="mx-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800 font-medium">
              Tenés tareas pendientes.
            </p>
          </div>
        </div>
      )}

      {/* Modales - Tarjetas (solo después de iniciar jornada) */}
      {jornadaActual && (
        <div className="px-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
          {/* Checklist */}
          <button
            onClick={() => setShowChecklist(true)}
            disabled={!(subtareaActual?.estado === 'en_progreso' || (tareaActual && isTareaEnProgreso))}
            className="flex flex-col items-center justify-center w-full h-24 rounded-2xl bg-yellow-50 hover:bg-yellow-100 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="w-12 h-12 rounded-full bg-yellow-200 flex items-center justify-center mb-2">
              <CheckSquare className="h-6 w-6 text-yellow-700" />
            </div>
            <span className="text-xs font-semibold text-yellow-900">Checklist</span>
          </button>

          {/* Planos */}
          <button
            onClick={() => {
              const obraId = subtareaActual?.tareas?.obra_id || tareaActual?.obra_id;
              if (obraId) {
                router.push(`/socio/planos/${obraId}`);
              } else {
                setShowPlanos(true);
              }
            }}
            disabled={!(subtareaActual?.estado === 'en_progreso' || (tareaActual && isTareaEnProgreso))}
            className="flex flex-col items-center justify-center w-full h-24 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-blue-700" />
            </div>
            <span className="text-xs font-semibold text-blue-900">Planos</span>
          </button>

          {/* Chat */}
          <button
            onClick={() => setShowChat(true)}
            disabled={!(subtareaActual?.estado === 'en_progreso' || (tareaActual && isTareaEnProgreso))}
            className="flex flex-col items-center justify-center w-full h-24 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mb-2">
              <MessageSquare className="h-6 w-6 text-gray-700" />
            </div>
            <span className="text-xs font-semibold text-gray-900">Chat</span>
          </button>

          {/* Evidencias */}
          <button
            onClick={() => setShowEvidencias(true)}
            disabled={!(subtareaActual?.estado === 'en_progreso' || (tareaActual && isTareaEnProgreso))}
            className="flex flex-col items-center justify-center w-full h-24 rounded-2xl bg-green-50 hover:bg-green-100 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center mb-2">
              <Camera className="h-6 w-6 text-green-700" />
            </div>
            <span className="text-xs font-semibold text-green-900">Evidencias</span>
          </button>
          </div>
        </div>
      )}

      {/* Botón Finalizar jornada - Solo si hay jornada activa */}
      {jornadaActual && !jornadaActual.hora_fin && (
        <div className="px-4 mb-4">
          <button
            onClick={async () => {
              if (!jornadaActual?.id) return;
              try {
                const { error } = await (supabase as any)
                  .from('jornadas_socio')
                  .update({ hora_fin: new Date().toISOString() })
                  .eq('id', jornadaActual.id);
                
                if (error) throw error;
                
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const hoyISO = hoy.toISOString().split('T')[0];
                const { data: jornadaData } = await (supabase as any)
                  .from('jornadas_socio')
                  .select('*')
                  .eq('socio_id', currentUser?.id)
                  .eq('fecha', hoyISO)
                  .maybeSingle();
                setJornadaActual(jornadaData);
              } catch (err) {
                console.error('[AHORA] Error finalizando jornada:', err);
                setError('Error al finalizar jornada');
              }
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Finalizar jornada
          </button>
        </div>
      )}


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

      {/* Modal Planos */}
      {showPlanos && tareaActual?.obra_id && (
        <ModalVerPlanos
          open={showPlanos}
          onClose={() => setShowPlanos(false)}
          obraId={tareaActual.obra_id}
        />
      )}

      {/* Modal Evidencias */}
      {showEvidencias && tareaActual && (
        <ModalEvidencias
          tareaId={tareaActual.id}
          obraId={tareaActual.obra_id || ''}
          subtareaId={subtareaActual?.id}
          onClose={() => setShowEvidencias(false)}
          onEvidenciaFinalSubida={() => {
            setEvidenciasFinales([...evidenciasFinales, 'nueva']);
          }}
          onFinalizarSubtarea={handleFinalizarSubtarea}
        />
      )}

      {/* Modal obligatorio para finalizar subtarea */}
      {showModalFinalizarSubtarea && subtareaActual && (
        <ModalFinalizarSubtarea
          subtareaId={subtareaActual.id}
          tareaId={subtareaActual.tarea_id || subtareaActual.tareas?.id}
          obraId={subtareaActual.tareas?.obra_id || tareaActual?.obra_id}
          onClose={() => setShowModalFinalizarSubtarea(false)}
          onFinalizar={handleFinalizarSubtarea}
        />
      )}

    </div>
  );
}

// Componente Modal de Evidencias
function ModalEvidencias({ 
  tareaId, 
  obraId,
  subtareaId,
  onClose, 
  onEvidenciaFinalSubida,
  onFinalizarSubtarea
}: { 
  tareaId: string; 
  obraId: string;
  subtareaId?: string;
  onClose: () => void; 
  onEvidenciaFinalSubida: () => void;
  onFinalizarSubtarea?: (evidenciaUrl?: string, videoUrl?: string, problemas?: string) => void;
}) {
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tipoEvidencia, setTipoEvidencia] = useState<'evidencia_parcial' | 'evidencia_final'>('evidencia_parcial');
  const [problemas, setProblemas] = useState('');
  const [evidenciaUrlActual, setEvidenciaUrlActual] = useState<string | null>(null);
  const [videoUrlActual, setVideoUrlActual] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    cargarEvidencias();
  }, [tareaId]);

  const cargarEvidencias = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tareas/${tareaId}/evidencias`);
      if (response.ok) {
        const data = await response.json();
        setEvidencias(data.data || []);
      }
    } catch (err) {
      console.error('[ModalEvidencias] Error cargando evidencias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, isCamera: boolean) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        
        // Subir foto usando el endpoint de transition
        const response = await fetch(`/api/tareas/${tareaId}/transition`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nuevo_estado: 'en_ejecucion', // Mantener estado actual
            notas: `Evidencia ${tipoEvidencia === 'evidencia_final' ? 'final' : 'parcial'} subida`,
            checklist: [],
            has_nc: false,
            actor: {
              name: 'Socio',
              role: 'Socio',
              method: 'login',
            },
            media: [{
              kind: tipoEvidencia,
              dataUrl,
            }],
          }),
        });

        if (response.ok) {
          const responseData = await response.json();
          // Obtener URL de la evidencia subida
          if (responseData.eventoId) {
            const { data: mediaData } = await (supabase as any)
              .from('media')
              .select('path')
              .eq('evento_id', responseData.eventoId)
              .limit(1)
              .maybeSingle();
            
            if (mediaData?.path) {
              const { data: { publicUrl } } = supabase.storage
                .from('evidencias')
                .getPublicUrl(mediaData.path);
              setEvidenciaUrlActual(publicUrl);
            }
          }
          
          await cargarEvidencias();
          if (tipoEvidencia === 'evidencia_final') {
            onEvidenciaFinalSubida();
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[ModalEvidencias] Error subiendo evidencia:', err);
    } finally {
      setUploading(false);
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        
        // Subir video al bucket evidencias_video
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidencias_video')
          .upload(`${tareaId}/${Date.now()}-${file.name}`, file);

        if (uploadError) {
          console.error('[ModalEvidencias] Error subiendo video:', uploadError);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('evidencias_video')
          .getPublicUrl(uploadData.path);

        setVideoUrlActual(publicUrl);
        await cargarEvidencias();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[ModalEvidencias] Error subiendo video:', err);
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Evidencias de la tarea
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Selector de tipo de evidencia */}
          <div className="flex gap-2">
            <Button
              variant={tipoEvidencia === 'evidencia_parcial' ? 'default' : 'outline'}
              onClick={() => setTipoEvidencia('evidencia_parcial')}
              className="flex-1"
            >
              Evidencia Parcial
            </Button>
            <Button
              variant={tipoEvidencia === 'evidencia_final' ? 'default' : 'outline'}
              onClick={() => setTipoEvidencia('evidencia_final')}
              className="flex-1"
            >
              Evidencia Final
            </Button>
          </div>

          {/* Botones de subida */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
              <Camera className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Tomar foto</span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileSelect(e, true)}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
              <Image className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Elegir de galería</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, false)}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
              <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Grabar video</span>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleVideoSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {/* TextArea para problemas */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reportar problemas (opcional)
            </label>
            <textarea
              value={problemas}
              onChange={(e) => setProblemas(e.target.value)}
              placeholder="Describe cualquier problema o incidencia encontrada..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>

          {/* Botón para finalizar subtarea si existe */}
          {subtareaId && onFinalizarSubtarea && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => {
                  onFinalizarSubtarea(evidenciaUrlActual || undefined, videoUrlActual || undefined, problemas || undefined);
                  onClose();
                }}
                className="w-full bg-[#4A6FA5] text-white hover:bg-[#3a5a8a]"
                disabled={uploading}
              >
                Finalizar subtarea con estos datos
              </Button>
            </div>
          )}

          {/* Lista de evidencias */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : evidencias.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No hay evidencias subidas aún
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {evidencias.map((evidencia: any) => (
                <div key={evidencia.id} className="relative group">
                  <img
                    src={evidencia.url}
                    alt={evidencia.descripcion || 'Evidencia'}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                      {evidencia.tipo === 'evidencia_final' ? 'Final' : 'Parcial'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente Modal obligatorio para finalizar subtarea
function ModalFinalizarSubtarea({
  subtareaId,
  tareaId,
  obraId,
  onClose,
  onFinalizar,
}: {
  subtareaId: string;
  tareaId?: string;
  obraId?: string;
  onClose: () => void;
  onFinalizar: (evidenciaUrl?: string, videoUrl?: string, problemas?: string) => Promise<void>;
}) {
  const [evidenciaUrl, setEvidenciaUrl] = useState<string | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [problemas, setProblemas] = useState('');
  const [uploading, setUploading] = useState(false);
  const [controlCalidad, setControlCalidad] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoGalleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, kind: 'evidencia_final' | 'video_final') => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);
      if (tareaId) formData.append('tareaId', tareaId);
      if (obraId) formData.append('obraId', obraId);

      const response = await fetch(`/api/upload/file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('[ModalFinalizarSubtarea] Error respuesta:', errorData);
        throw new Error(errorData.error || 'Error al subir archivo');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Error al subir archivo');
      }

      if (kind === 'evidencia_final') {
        setEvidenciaUrl(result.url);
      } else if (kind === 'video_final') {
        setVideoUrl(result.url);
      }
      
      // Recargar evidencias si estamos en el modal de evidencias
      // Esto se hace a través del callback onEvidenciaFinalSubida si existe
    } catch (err) {
      console.error('[ModalFinalizarSubtarea] Error subiendo archivo:', err);
      alert(err instanceof Error ? err.message : 'Error al subir archivo. Por favor, intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'evidencia_final');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'video_final');
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (videoGalleryInputRef.current) videoGalleryInputRef.current.value = '';
  };

  const handleConfirmar = async () => {
    if (!controlCalidad) {
      alert('Debés confirmar el control de calidad para finalizar la subtarea');
      return;
    }
    await onFinalizar(evidenciaUrl, videoUrl, problemas || undefined);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Finalizar subtarea
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Foto obligatoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de evidencia <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Tomar foto</span>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
                <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Elegir de galería</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {evidenciaUrl && (
              <div className="mt-2">
                <img src={evidenciaUrl} alt="Evidencia" className="w-full h-32 object-cover rounded-lg" />
              </div>
            )}
          </div>

          {/* Video opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video (opcional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Grabar video</span>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  capture="environment"
                  onChange={handleVideoSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
                <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Elegir video</span>
                <input
                  ref={videoGalleryInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {videoUrl && (
              <div className="mt-2">
                <video src={videoUrl} controls className="w-full h-32 object-cover rounded-lg" />
              </div>
            )}
          </div>

          {/* Texto de problemas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reportar problemas (opcional)
            </label>
            <textarea
              value={problemas}
              onChange={(e) => setProblemas(e.target.value)}
              placeholder="Describe cualquier problema o incidencia encontrada..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>

          {/* Check de control de calidad */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="control-calidad"
              checked={controlCalidad}
              onChange={(e) => setControlCalidad(e.target.checked)}
              className="w-4 h-4 text-[#4A6FA5] border-gray-300 rounded focus:ring-[#4A6FA5]"
            />
            <label htmlFor="control-calidad" className="text-sm text-gray-700">
              Confirmo que la subtarea cumple con los estándares de calidad <span className="text-red-500">*</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar} 
            disabled={uploading || !controlCalidad || !evidenciaUrl}
            className="bg-[#4A6FA5] hover:bg-[#3a5a8a]"
          >
            {uploading ? 'Subiendo...' : 'Finalizar subtarea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
