'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, MapPin, Calendar, CheckSquare, Paperclip, MessageCircle, Camera } from 'lucide-react';
import { SlideToConfirm } from '../SlideToConfirm';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { tareasConstructivas } from '@/lib/tareas-construccion';
import { ChecklistModal } from '../ChecklistModal';
import type { ChecklistItem } from '@/data/checklists';

type ProduccionDiaria = {
  produccionDiaria: number;
  diasTotales: number;
  horasTotales: number;
  unidad: string | null;
};

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  etapa: 'Replanteo' | 'Ejecución' | 'Terminación';
  ubicacion: string;
  fechaInicio: string;
  duracionEstimada: string;
  estado: 'Pendiente' | 'En progreso' | 'Finalizada';
  requiereEvidencia: boolean;
  evidencia?: string;
  produccionDiaria?: number | null;
  produccionUnidad?: string | null;
  diasTotales?: number | null;
  horasTotales?: number | null;
}

interface TareasEnCursoProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

const HORAS_POR_DIA = 8;

function calcularProduccionDiariaDesdeElemento(t: any): ProduccionDiaria | null {
  const elementoCantidad = t.elemento?.cantidad;
  if (!elementoCantidad || elementoCantidad <= 0) return null;

  const tituloTarea = t.title?.toLowerCase().trim() || '';
  if (!tituloTarea) return null;

  // Buscar definición en el catálogo por nombre de tarea
  // Primero intentar coincidencia exacta
  let definicion = tareasConstructivas.find(tc =>
    tc.nombre.toLowerCase().trim() === tituloTarea
  );

  // Si no hay coincidencia exacta, buscar por inclusión (el título contiene el nombre o viceversa)
  if (!definicion) {
    definicion = tareasConstructivas.find(tc => {
      const nombreCat = tc.nombre.toLowerCase().trim();
      return tituloTarea.includes(nombreCat) || nombreCat.includes(tituloTarea);
    });
  }

  if (!definicion) return null;

  const horasTotales = definicion.coef_operativo * elementoCantidad;
  const diasTotales = Math.max(1, Math.ceil(horasTotales / HORAS_POR_DIA));
  const produccionDiaria = elementoCantidad / diasTotales;

  return {
    produccionDiaria,
    diasTotales,
    horasTotales,
    unidad: definicion.unidad ?? t.elemento?.unidad ?? null,
  };
}

export function TareasEnCurso({ user }: TareasEnCursoProps) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [iniciandoAnimacion, setIniciandoAnimacion] = useState(false);
  const [finalizandoAnimacion, setFinalizandoAnimacion] = useState(false);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistCompleto, setChecklistCompleto] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const supabase = createClientComponentClient();
  const currentUser = useCurrentUser();

  // Cargar tareas del usuario desde Supabase
  // Usar el mismo flujo que MisTareas para obtener tareas asignadas
  useEffect(() => {
    const cargarTareas = async () => {
      console.log('[TAREAS_EN_CURSO] Iniciando carga, currentUser:', {
        isNull: currentUser === null,
        hasId: !!currentUser?.id,
        hasOrgId: !!currentUser?.orgId,
        email: currentUser?.email,
      });

      // Esperar a que useCurrentUser termine de cargar
      if (currentUser === null) {
        // Aún está cargando, mantener loading
        console.log('[TAREAS_EN_CURSO] currentUser es null, esperando...');
        setLoading(true);
        return;
      }

      if (!currentUser.id) {
        console.warn('[TAREAS_EN_CURSO] Usuario sin id');
        setTareas([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Si no hay orgId en currentUser, intentar obtenerlo desde la tabla socios
        let orgId = currentUser.orgId;
        if (!orgId && currentUser.email) {
          console.log('[TAREAS_EN_CURSO] orgId no encontrado en currentUser, buscando en socios...', {
            email: currentUser.email,
          });
          
          // Buscar por email (campo que existe en la base de datos)
          let socioPorEmail = null;
          const { data: dataPorEmail, error: errorPorEmail } = await supabase
            .from('socios')
            .select('id, nombre, email, org_id, rol')
            .eq('email', currentUser.email)
            .maybeSingle();
          
          if (dataPorEmail && !errorPorEmail) {
            socioPorEmail = dataPorEmail;
            console.log('[TAREAS_EN_CURSO] ✅ Socio encontrado por email:', socioPorEmail);
          } else {
            console.warn('[TAREAS_EN_CURSO] No se encontró socio por email exacto, intentando búsqueda flexible...', {
              email: currentUser.email,
              error: errorPorEmail,
            });
            
            // Intentar buscar sin importar mayúsculas/minúsculas (buscar todos y filtrar)
            const { data: todosLosSocios, error: errorTodos } = await supabase
              .from('socios')
              .select('id, nombre, email, org_id, rol');
            
            if (todosLosSocios && !errorTodos) {
              socioPorEmail = todosLosSocios.find(
                (s: any) => s.email && s.email.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()
              );
              if (socioPorEmail) {
                console.log('[TAREAS_EN_CURSO] ✅ Socio encontrado por email (case-insensitive):', socioPorEmail);
              } else {
                console.warn('[TAREAS_EN_CURSO] ⚠️ No se encontró socio. Socios disponibles:', todosLosSocios.map((s: any) => ({
                  id: s.id,
                  nombre: s.nombre,
                  email: s.email || '(sin email)',
                  org_id: s.org_id || '(sin org_id)',
                })));
              }
            }
          }
          
          if (socioPorEmail?.org_id) {
            orgId = socioPorEmail.org_id;
            console.log('[TAREAS_EN_CURSO] ✅ orgId encontrado desde socios:', orgId);
          } else {
            console.warn('[TAREAS_EN_CURSO] ⚠️ Socio encontrado pero sin org_id:', socioPorEmail);
          }
        }

        if (!orgId) {
          console.warn('[TAREAS_EN_CURSO] No se pudo obtener orgId');
          setTareas([]);
          setLoading(false);
          return;
        }

        // Primero buscar el socio por email
        // El endpoint /api/socios/[id]/tareas busca tareas donde el socio es responsable
        // (por email en el campo responsable de la tabla tareas)
        let socioData: any = null;

        if (currentUser.email) {
          // Buscar por email (el campo user_id no existe en la tabla socios)
          // Primero intentar con org_id
          let { data: socioPorEmail, error: socioError } = await supabase
            .from('socios')
            .select('id, nombre, email, telefono, org_id, rol')
            .eq('org_id', orgId)
            .eq('email', currentUser.email)
            .maybeSingle();
          
          // Si no se encuentra con org_id, intentar sin org_id (por si hay inconsistencias)
          if (!socioPorEmail && !socioError) {
            console.log('[TAREAS_EN_CURSO] No se encontró con org_id, intentando sin org_id...');
            const resultSinOrg = await supabase
              .from('socios')
              .select('id, nombre, email, telefono, org_id, rol')
              .eq('email', currentUser.email)
              .maybeSingle();
            socioPorEmail = resultSinOrg.data;
            socioError = resultSinOrg.error;
          }
          
          if (socioError) {
            console.error('[TAREAS_EN_CURSO] Error al buscar socio por email:', socioError);
          } else if (socioPorEmail) {
            socioData = socioPorEmail;
            console.log('[TAREAS_EN_CURSO] Socio encontrado por email:', socioPorEmail.id);
          } else {
            console.warn('[TAREAS_EN_CURSO] No se encontró socio con email:', currentUser.email);
            // Si no se encuentra el socio, continuar con el fallback de buscar tareas por responsable
          }
        }

        let tareasFormateadas: Tarea[] = [];

        if (socioData) {
          // Si es socio, usar el endpoint de socios para obtener todas sus tareas
          console.log('[TAREAS_EN_CURSO] Socio encontrado, llamando endpoint:', socioData.id);
          
          try {
            const response = await fetch(`/api/socios/${socioData.id}/tareas`, {
              headers: {
                'x-organizacion-id': orgId,
              },
            });

            console.log('[TAREAS_EN_CURSO] Respuesta del endpoint:', response.status, response.ok);

            if (response.ok) {
              const result = await response.json();
              console.log('[TAREAS_EN_CURSO] Resultado del endpoint:', {
                success: result.success,
                dataLength: result.data?.length || 0,
              });
              
              if (result.success && result.data) {
              // Filtrar solo las que están en progreso o pendientes
              const tareasEnProgreso = result.data.filter((t: any) => 
                t.estado === 'en_progreso' || t.estado === 'en curso' || t.estado === 'pendiente'
              );
              
              tareasFormateadas = tareasEnProgreso.map((tarea: any) => {
                // Determinar etapa
                let etapa: 'Replanteo' | 'Ejecución' | 'Terminación' = 'Ejecución';
                const texto = `${tarea.descripcion || ''} ${tarea.title || ''}`.toLowerCase();
                if (texto.includes('replanteo') || texto.includes('marcar') || texto.includes('ubicación')) {
                  etapa = 'Replanteo';
                } else if (texto.includes('terminación') || texto.includes('acabado') || texto.includes('pintura')) {
                  etapa = 'Terminación';
                }

                // Calcular duración estimada
                let duracionEstimada = 'Sin estimación';
                if (tarea.fecha_inicio_estimada && tarea.fecha_fin_estimada) {
                  const inicio = new Date(tarea.fecha_inicio_estimada);
                  const fin = new Date(tarea.fecha_fin_estimada);
                  const horas = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60));
                  duracionEstimada = horas > 0 ? `${horas} horas` : 'Sin estimación';
                }

                // Calcular producción diaria
                const produccion = calcularProduccionDiariaDesdeElemento(tarea);

                return {
                  id: tarea.id,
                  nombre: tarea.title || 'Sin nombre',
                  descripcion: tarea.descripcion || '',
                  etapa,
                  ubicacion: tarea.obra?.address || tarea.obra?.name || 'Sin ubicación',
                  fechaInicio: tarea.fecha_inicio_estimada ? new Date(tarea.fecha_inicio_estimada).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  duracionEstimada,
                  estado: tarea.estado === 'en_progreso' || tarea.estado === 'en curso' ? 'En progreso' : 'Pendiente',
                  requiereEvidencia: true,
                  produccionDiaria: produccion?.produccionDiaria ?? null,
                  produccionUnidad: produccion?.unidad ?? null,
                  diasTotales: produccion?.diasTotales ?? null,
                  horasTotales: produccion?.horasTotales ?? null,
                };
              });
            } else {
              console.warn('[TAREAS_EN_CURSO] Endpoint retornó success=false o sin data:', result);
            }
          } else {
            const errorText = await response.text().catch(() => '');
            console.error('[TAREAS_EN_CURSO] Error en endpoint:', response.status, errorText);
          }
          } catch (fetchError) {
            console.error('[TAREAS_EN_CURSO] Error al llamar endpoint:', fetchError);
          }
        } else {
          // Si no se encontró el socio, buscar tareas por responsable directamente
          // Esto es un fallback para casos donde el usuario no es socio pero tiene tareas asignadas
          console.warn('[TAREAS_EN_CURSO] No se encontró socio, buscando tareas por responsable');
          const { data: tareasData, error: tareasError } = await supabase
            .from('tareas')
            .select(`
              id,
              title,
              descripcion,
              estado,
              responsable,
              fecha_inicio_estimada,
              fecha_fin_estimada,
              obra_id,
              obra:obras(name, address)
            `)
            .eq('org_id', orgId)
            .or(`responsable.eq.${currentUser.email || ''},responsable.ilike.%${currentUser.email || ''}%`)
            .in('estado', ['en_progreso', 'en curso', 'pendiente'])
            .order('created_at', { ascending: false });

          if (tareasError) {
            console.error('[TAREAS_EN_CURSO] Error cargando tareas por responsable:', tareasError);
            setTareas([]);
            return;
          }

          // Mapear tareas al formato esperado
          tareasFormateadas = (tareasData || []).map((tarea: any) => {
            // Determinar etapa (se puede mejorar con categoría del elemento)
            let etapa: 'Replanteo' | 'Ejecución' | 'Terminación' = 'Ejecución';
            const texto = `${tarea.descripcion || ''} ${tarea.title || ''}`.toLowerCase();
            if (texto.includes('replanteo') || texto.includes('marcar') || texto.includes('ubicación')) {
              etapa = 'Replanteo';
            } else if (texto.includes('terminación') || texto.includes('acabado') || texto.includes('pintura')) {
              etapa = 'Terminación';
            }

            // Calcular duración estimada
            let duracionEstimada = 'Sin estimación';
            if (tarea.fecha_inicio_estimada && tarea.fecha_fin_estimada) {
              const inicio = new Date(tarea.fecha_inicio_estimada);
              const fin = new Date(tarea.fecha_fin_estimada);
              const horas = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60));
              duracionEstimada = horas > 0 ? `${horas} horas` : 'Sin estimación';
            }

            // Calcular producción diaria
            const produccion = calcularProduccionDiariaDesdeElemento(tarea);

            return {
              id: tarea.id,
              nombre: tarea.title || 'Sin nombre',
              descripcion: tarea.descripcion || '',
              etapa,
              ubicacion: tarea.obra?.address || tarea.obra?.name || 'Sin ubicación',
              fechaInicio: tarea.fecha_inicio_estimada ? new Date(tarea.fecha_inicio_estimada).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              duracionEstimada,
              estado: tarea.estado === 'en_progreso' || tarea.estado === 'en curso' ? 'En progreso' : 'Pendiente',
              requiereEvidencia: true, // Por defecto requiere evidencia
              produccionDiaria: produccion?.produccionDiaria ?? null,
              produccionUnidad: produccion?.unidad ?? null,
              diasTotales: produccion?.diasTotales ?? null,
              horasTotales: produccion?.horasTotales ?? null,
            };
          });
        }

        setTareas(tareasFormateadas);
      } catch (error) {
        console.error('Error en cargarTareas:', error);
        setTareas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarTareas();
  }, [currentUser, supabase]);

  const [tareaActivaIndex, setTareaActivaIndex] = useState(0);

  // Calcular tarea activa antes de los returns condicionales
  const tareaActiva = tareas.length > 0 && tareaActivaIndex < tareas.length ? tareas[tareaActivaIndex] : null;

  // Verificar estado del checklist cuando cambia la tarea activa
  useEffect(() => {
    const verificarChecklist = async () => {
      if (!tareaActiva) {
        setChecklistCompleto(null);
        return;
      }

      try {
        const { data: eventosData } = await supabase
          .from('eventos')
          .select('checklist, created_at')
          .eq('tarea_id', tareaActiva.id)
          .not('checklist', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!eventosData || eventosData.length === 0) {
          // Si no hay checklist, considerar como no completo para forzar su creación
          setChecklistCompleto(false);
          return;
        }

        const checklist = eventosData[0].checklist;
        
        if (!Array.isArray(checklist) || checklist.length === 0) {
          setChecklistCompleto(false);
          return;
        }

        // Verificar si todos los items están completados
        const todosCompletos = checklist.every((item: any) => item.done === true);
        setChecklistCompleto(todosCompletos);
      } catch (error) {
        console.error('[CHECKLIST_STATUS] Error al verificar checklist:', error);
        setChecklistCompleto(null);
      }
    };

    verificarChecklist();
  }, [tareaActiva?.id, supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300 animate-spin" />
          <p className="text-gray-500">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  if (tareas.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No hay tareas en progreso</h1>
          <p className="text-gray-600">No tenés tareas asignadas actualmente en progreso</p>
        </div>
      </div>
    );
  }

  const tareasCompletadas = tareas.filter(t => t.estado === 'Finalizada').length;
  const progresoTotal = tareas.length > 0 ? (tareasCompletadas / tareas.length) * 100 : 0;

  const handleIniciarTarea = async () => {
    if (!tareaActiva || !currentUser) {
      console.error('[INICIAR_TAREA] Tarea o usuario no disponible');
      return;
    }

    try {
      // Obtener organizacionId desde currentUser o buscar desde socios
      let organizacionId = currentUser.orgId;
      
      if (!organizacionId && currentUser.email) {
        // Intentar obtener orgId desde la tabla socios
        const { data: socioData } = await supabase
          .from('socios')
          .select('org_id')
          .eq('email', currentUser.email)
          .maybeSingle();
        
        if (socioData?.org_id) {
          organizacionId = socioData.org_id;
        }
      }

      if (!organizacionId) {
        throw new Error('No se pudo obtener la organización');
      }

      // Obtener nombre del usuario (fallback a email si no hay nombre)
      const actorName = currentUser.name || currentUser.email || 'Socio';
      
      // Preparar payload según el schema del endpoint /transition
      // Nota: el endpoint espera 'en_ejecucion' (no 'en_progreso')
      // y actor como objeto con name, role, method
      const payload = {
        nuevo_estado: 'en_ejecucion' as const,
        actor: {
          name: actorName,
          role: 'Socio' as const,
          method: 'login' as const, // El schema solo acepta 'QR' | 'login' | 'PIN', usando 'login' para slide
        },
        checklist: [],
        has_nc: false,
        media: [],
        // notas es opcional, pero si se envía debe ser string (no null)
        // Omitimos el campo si no hay notas
      };

      // Primero verificar el estado actual de la tarea en Supabase
      const { data: tareaActual, error: tareaError } = await supabase
        .from('tareas')
        .select('id, title, estado, responsable')
        .eq('id', tareaActiva.id)
        .single();

      if (tareaError) {
        throw new Error(`Error al obtener tarea: ${tareaError.message}`);
      }

      console.log('[INICIAR_TAREA] Estado actual de la tarea:', {
        tareaId: tareaActiva.id,
        estadoActual: tareaActual?.estado,
        responsable: tareaActual?.responsable,
        estadoEsperado: 'pendiente',
        puedeTransicionar: tareaActual?.estado === 'pendiente' || tareaActual?.estado === null,
      });

      // Verificar que el estado actual permita la transición
      const estadoActual = tareaActual?.estado;
      if (estadoActual && estadoActual !== 'pendiente') {
        throw new Error(`La tarea está en estado '${estadoActual}' y no puede iniciarse. Debe estar en 'pendiente'.`);
      }

      // ✅ Validación de responsable: el backend ya valida que el usuario sea el responsable
      // No validamos más cuadrillas, quedan obsoletas.
      console.log('[INICIAR_TAREA] Validación de responsable se realiza en el backend');

      console.log('[INICIAR_TAREA] Enviando transición:', {
        tareaId: tareaActiva.id,
        organizacionId,
        estadoActual,
        payload,
      });

      // Llamar al endpoint /transition
      const response = await fetch(`/api/tareas/${tareaActiva.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizacion-id': organizacionId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Intentar obtener el mensaje de error detallado
        let errorMessage = `Error ${response.status}`;
        let bloqueos: any[] = [];
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          bloqueos = errorData.bloqueos || [];
          console.error('[INICIAR_TAREA] ❌ Error del servidor:', errorData);
          
          // Si hay bloqueos por tareas precedentes, mostrar información detallada
          if (bloqueos.length > 0) {
            const nombresBloqueos = bloqueos.map((b: any) => b.title || b.id || 'Tarea').join(', ');
            errorMessage = `No se puede iniciar esta tarea porque hay tareas precedentes que deben completarse primero.\n\nTareas pendientes:\n${nombresBloqueos}\n\nPor favor, completa esas tareas antes de iniciar esta.`;
          }
        } catch (e) {
          const textError = await response.text().catch(() => '');
          console.error('[INICIAR_TAREA] ❌ Error sin JSON:', textError);
          errorMessage = textError || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[INICIAR_TAREA] ✅ Transición exitosa:', result);

      // Actualizar estado local después de confirmar que se guardó en Supabase
      setTareas(prev => prev.map((tarea, index) => 
        index === tareaActivaIndex 
          ? { ...tarea, estado: 'En progreso' }
          : tarea
      ));

      // Activar animación de inicio de tarea
      setIniciandoAnimacion(true);
      setTimeout(() => setIniciandoAnimacion(false), 1200);

      // La tabla tareas se actualizó correctamente, avanzar al siguiente paso
      // (el estado local ya se actualizó arriba)

    } catch (error) {
      console.error('[INICIAR_TAREA] ❌ Error al iniciar tarea:', error);
      alert(`Error al iniciar la tarea: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleGuardarChecklist = async (items: ChecklistItem[]) => {
    if (!tareaActiva || !currentUser) {
      console.error('[GUARDAR_CHECKLIST] Tarea o usuario no disponible');
      return;
    }

    try {
      // Obtener organizacionId desde currentUser o buscar desde socios
      let organizacionId = currentUser.orgId;
      
      if (!organizacionId && currentUser.email) {
        const { data: socioData } = await supabase
          .from('socios')
          .select('org_id')
          .eq('email', currentUser.email)
          .maybeSingle();
        
        if (socioData?.org_id) {
          organizacionId = socioData.org_id;
        }
      }

      if (!organizacionId) {
        throw new Error('No se pudo obtener la organización');
      }

      // Obtener nombre del usuario (fallback a email si no hay nombre)
      const actorName = currentUser.name || currentUser.email || 'Socio';

      // Preparar payload - Usar el estado actual de la tarea
      // Si la tarea está en ejecución, mantener ese estado
      // Si está pendiente, puede iniciarse
      const estadoActual = tareaActiva.estado === 'En progreso' 
        ? 'en_ejecucion' 
        : tareaActiva.estado === 'Pendiente' 
        ? 'en_ejecucion' 
        : 'en_ejecucion'; // Por defecto en_ejecucion
      
      // Transformar items del checklist al formato esperado por el endpoint
      // El endpoint espera: { label: string, value: string }
      // Nosotros tenemos: { id: string, label: string, done: boolean }
      const checklistFormateado = items.map(item => ({
        label: item.label,
        value: item.done ? 'true' : 'false', // Convertir boolean a string
      }));
      
      const payload = {
        nuevo_estado: estadoActual as const,
        actor: {
          name: actorName,
          role: 'Socio' as const,
          method: 'login' as const,
        },
        checklist: checklistFormateado,
        has_nc: false,
        media: [],
      };

      console.log('[GUARDAR_CHECKLIST] Enviando checklist:', {
        tareaId: tareaActiva.id,
        organizacionId,
        itemsCount: items.length,
      });

      const response = await fetch(`/api/tareas/${tareaActiva.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizacion-id': organizacionId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('[GUARDAR_CHECKLIST] ❌ Error del servidor:', errorData);
          
          // Si hay detalles de validación, mostrarlos
          if (errorData.details && Array.isArray(errorData.details)) {
            const detalles = errorData.details.map((d: any) => 
              `${d.path?.join('.') || 'campo'}: ${d.message || 'error'}`
            ).join('\n');
            errorMessage = `Error de validación:\n${detalles}`;
          }
        } catch (e) {
          const textError = await response.text().catch(() => '');
          console.error('[GUARDAR_CHECKLIST] ❌ Error sin JSON:', textError);
          errorMessage = textError || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[GUARDAR_CHECKLIST] ✅ Checklist guardado:', result);

      // Actualizar estado del checklist
      // Verificar si todos los items están completados
      const todosCompletos = items.every(item => item.done === true);
      setChecklistCompleto(todosCompletos);

      // Cerrar modal
      setShowChecklist(false);

    } catch (error) {
      console.error('[GUARDAR_CHECKLIST] ❌ Error al guardar checklist:', error);
      throw error; // Re-lanzar para que el modal maneje el error
    }
  };

  // Convertir File a dataUrl (base64)
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Función para subir foto usando endpoint API (desde servidor)
  const uploadPhotoClient = async (dataUrl: string): Promise<{ path: string }> => {
    const response = await fetch('/api/upload/photo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dataUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status} al subir la imagen`);
    }

    const result = await response.json();
    if (!result.success || !result.path) {
      throw new Error('No se recibió el path de la imagen subida');
    }

    return { path: result.path };
  };

  // Función para validar que el checklist esté completo
  const validarChecklistCompleto = async (): Promise<{ valido: boolean; mensaje?: string }> => {
    if (!tareaActiva) {
      return { valido: false, mensaje: 'Tarea no disponible' };
    }

    try {
      // Obtener el checklist más reciente de la tarea desde eventos
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos')
        .select('checklist, created_at')
        .eq('tarea_id', tareaActiva.id)
        .not('checklist', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (eventosError) {
        console.error('[VALIDAR_CHECKLIST] Error al obtener eventos:', eventosError);
        // Si hay error, permitir finalizar (no bloquear por error técnico)
        return { valido: true };
      }

      // Si no hay checklist guardado, no validar (permitir finalizar)
      if (!eventosData || eventosData.length === 0) {
        console.log('[VALIDAR_CHECKLIST] No hay checklist guardado, permitiendo finalizar');
        return { valido: true };
      }

      const checklist = eventosData[0].checklist;
      
      // Verificar que sea un array válido
      if (!Array.isArray(checklist) || checklist.length === 0) {
        console.log('[VALIDAR_CHECKLIST] Checklist vacío, permitiendo finalizar');
        return { valido: true };
      }

      // Validar que todos los items estén completados
      const itemsIncompletos = checklist.filter((item: any) => !item.done);
      
      if (itemsIncompletos.length > 0) {
        const itemsPendientes = itemsIncompletos.map((item: any) => item.label || item.id).join(', ');
        return {
          valido: false,
          mensaje: `Debes completar todos los items del checklist antes de finalizar la tarea.\n\nItems pendientes:\n${itemsPendientes}\n\nPor favor, completa el checklist desde el botón "Checklist".`,
        };
      }

      return { valido: true };
    } catch (error) {
      console.error('[VALIDAR_CHECKLIST] Error al validar checklist:', error);
      // En caso de error, permitir finalizar (no bloquear por error técnico)
      return { valido: true };
    }
  };

  const handleFinalizarTarea = async () => {
    // Validar checklist antes de proceder
    const validacion = await validarChecklistCompleto();
    
    if (!validacion.valido) {
      alert(validacion.mensaje || 'Debes completar el checklist antes de finalizar la tarea.');
      // Abrir el modal de checklist para que el usuario lo complete
      setShowChecklist(true);
      return;
    }

    if (tareaActiva.requiereEvidencia) {
      // Abrir modal para subir evidencia
      setMostrarCamara(true);
      setImagenSeleccionada(null);
      setPreviewImagen(null);
    } else {
      // Si no requiere evidencia, finalizar directamente sin media
      finalizarTareaCompleta([]);
    }
  };

  const handleSeleccionarImagen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagenSeleccionada(file);
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImagen(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubirEvidencia = async () => {
    if (!imagenSeleccionada || !previewImagen) {
      alert('Por favor selecciona una imagen');
      return;
    }

    setSubiendoImagen(true);
    try {
      // Subir a Supabase Storage usando función cliente para obtener el path
      const { path } = await uploadPhotoClient(previewImagen);
      console.log('[FINALIZAR_TAREA] Imagen subida, path:', path);

      // Finalizar tarea con el path obtenido
      // El endpoint también necesita el dataUrl en el schema, así que lo enviamos también
      await finalizarTareaCompleta([{
        kind: 'foto',
        dataUrl: previewImagen, // Requerido por el schema del endpoint
        path: path, // Path obtenido de la subida
        idx: 0,
      }]);
    } catch (error) {
      console.error('[FINALIZAR_TAREA] Error al subir imagen:', error);
      alert(`Error al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setSubiendoImagen(false);
    }
  };

  const finalizarTareaCompleta = async (media: Array<{ kind: 'foto'; dataUrl: string; path?: string; idx: number }>) => {
    if (!tareaActiva || !currentUser) {
      console.error('[FINALIZAR_TAREA] Tarea o usuario no disponible');
      return;
    }

    // Validar checklist antes de finalizar (doble validación)
    const validacion = await validarChecklistCompleto();
    
    if (!validacion.valido) {
      alert(validacion.mensaje || 'Debes completar el checklist antes de finalizar la tarea.');
      // Abrir el modal de checklist para que el usuario lo complete
      setShowChecklist(true);
      return;
    }

    try {
      let organizacionId = currentUser.orgId;
      if (!organizacionId && currentUser.email) {
        const { data: socioData } = await supabase
          .from('socios')
          .select('org_id')
          .eq('email', currentUser.email)
          .maybeSingle();
        if (socioData?.org_id) {
          organizacionId = socioData.org_id;
        }
      }

      if (!organizacionId) {
        throw new Error('No se pudo obtener la organización');
      }

      const actorName = currentUser.name || currentUser.email || 'Socio';
      
      // Preparar payload según el schema del endpoint
      const payload = {
        nuevo_estado: 'finalizado' as const,
        actor: {
          name: actorName,
          role: 'Socio' as const,
          method: 'login' as const,
        },
        checklist: [],
        notas: '',
        has_nc: false,
        media: media.map(item => ({
          kind: item.kind,
          dataUrl: '', // El endpoint espera dataUrl pero usamos path, esto se maneja en el backend
          path: item.path,
          idx: item.idx,
        })),
      };

      // Si hay media, necesitamos convertir el path a dataUrl para el schema
      // Pero el backend espera dataUrl en el schema, así que necesitamos enviarlo
      // Por ahora, enviaremos el path y el backend deberá manejarlo
      // Revisando el schema del endpoint, veo que espera dataUrl, así que necesitamos ajustar
      
      console.log('[FINALIZAR_TAREA] Enviando transición:', {
        tareaId: tareaActiva.id,
        organizacionId,
        payload,
      });

      // Preparar media para el endpoint
      // El endpoint espera dataUrl y se encargará de subir la imagen
      const mediaPayload = media.length > 0
        ? media.map(item => ({
            kind: item.kind,
            dataUrl: item.dataUrl,
          }))
        : [];

      const response = await fetch(`/api/tareas/${tareaActiva.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizacion-id': organizacionId,
        },
        body: JSON.stringify({
          nuevo_estado: 'finalizado',
          actor: {
            name: actorName,
            role: 'Socio' as const,
            method: 'login' as const,
          },
          checklist: [],
          notas: '',
          has_nc: false,
          media: mediaPayload,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('[FINALIZAR_TAREA] ❌ Error del servidor:', errorData);
        } catch (e) {
          const textError = await response.text().catch(() => '');
          console.error('[FINALIZAR_TAREA] ❌ Error sin JSON:', textError);
          errorMessage = textError || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[FINALIZAR_TAREA] ✅ Transición exitosa:', result);

      // Actualizar estado local después de confirmar que se guardó en Supabase
      setTareas(prev => prev.map((tarea, index) => 
        index === tareaActivaIndex 
          ? { ...tarea, estado: 'Finalizada', evidencia: media.length > 0 ? media[0].path : undefined }
          : tarea
      ));

      // Activar animación de finalización de tarea (verde)
      setFinalizandoAnimacion(true);
      setTimeout(() => setFinalizandoAnimacion(false), 1200);
      
      // Avanzar a la siguiente tarea si existe
      if (tareaActivaIndex < tareas.length - 1) {
        setTareaActivaIndex(prev => prev + 1);
      }
      
      // Cerrar modal y limpiar estado
      setMostrarCamara(false);
      setImagenSeleccionada(null);
      setPreviewImagen(null);
      setSubiendoImagen(false);

    } catch (error) {
      console.error('[FINALIZAR_TAREA] ❌ Error al finalizar tarea:', error);
      alert(`Error al finalizar la tarea: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setSubiendoImagen(false);
    }
  };

  const getEstadoIcono = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return '⚪';
      case 'En progreso': return '🟡';
      case 'Finalizada': return '🟢';
      default: return '⚪';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-gray-100 text-gray-800';
      case 'En progreso': return 'bg-yellow-100 text-yellow-800';
      case 'Finalizada': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Si no hay tarea activa, mostrar mensaje de finalización
  if (!tareaActiva) {
    return (
      <div className={`space-y-6 ${iniciandoAnimacion ? 'iniciando-tarea' : ''} ${finalizandoAnimacion ? 'finalizando-tarea' : ''}`}>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Todas las tareas completadas!</h1>
          <p className="text-gray-600 mb-6">Has finalizado exitosamente todas las tareas asignadas.</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-600 mb-2">{tareasCompletadas}</div>
            <div className="text-sm text-green-700">Tareas completadas</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${iniciandoAnimacion ? 'iniciando-tarea' : ''} ${finalizandoAnimacion ? 'finalizando-tarea' : ''}`}>
      {/* Progreso general */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progreso general</span>
          <span>{Math.round(progresoTotal)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              backgroundColor: '#1A202C',
              width: `${progresoTotal}%` 
            }}
          ></div>
        </div>
        <div className="text-center text-sm text-gray-500 mt-1">
          {tareasCompletadas} de {tareas.length} tareas completadas
        </div>
      </div>

      {/* Tarea actual única */}
      <div className={`rounded-2xl shadow-lg border-2 p-6 transition-all duration-200 ${
        tareaActiva.estado === 'En progreso' 
          ? 'border-[#1A202C] bg-blue-50' 
          : tareaActiva.estado === 'Finalizada'
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}>
        {/* Header de la tarea */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <span className="text-3xl mr-3">{getEstadoIcono(tareaActiva.estado)}</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(tareaActiva.estado)}`}>
              {tareaActiva.estado}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {tareaActiva.nombre}
          </h1>
          <p className="text-gray-600 mb-4">{tareaActiva.descripcion}</p>
          
          {/* Producción diaria sugerida */}
          {tareaActiva.produccionDiaria && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">
                <span className="font-semibold text-blue-700">
                  {Math.round(tareaActiva.produccionDiaria)}{' '}
                  {tareaActiva.produccionUnidad ?? ''}
                </span>
              </p>
              {tareaActiva.diasTotales && (
                <p className="text-xs text-slate-500">
                  Duración estimada: {tareaActiva.diasTotales} días
                  {typeof tareaActiva.horasTotales === 'number'
                    ? ` (${tareaActiva.horasTotales.toFixed(1)} h)`
                    : null}
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
              <span>{tareaActiva.ubicacion}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-400" />
              <span>{tareaActiva.duracionEstimada}</span>
            </div>
          </div>
        </div>

        {/* Indicador de evidencia */}
        {tareaActiva.requiereEvidencia && (
          <div className="flex items-center justify-center mb-6" style={{ color: '#1A202C' }}>
            <Camera className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Requiere evidencia fotográfica</span>
          </div>
        )}

        {/* Botón deslizable según estado */}
        <div className="mb-6">
          {tareaActiva.estado === 'Pendiente' && (
            <SlideToConfirm
              onConfirm={handleIniciarTarea}
              label="Iniciar tarea"
              confirmLabel="Desliza para iniciar"
              variant="start"
            />
          )}
          
          {tareaActiva.estado === 'En progreso' && (
            <>
              {/* Indicador de checklist incompleto */}
              {checklistCompleto === false && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-yellow-800">
                    <CheckSquare className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      Debes completar el checklist antes de finalizar la tarea
                    </span>
                  </div>
                  <button
                    onClick={() => setShowChecklist(true)}
                    className="mt-2 w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Abrir Checklist
                  </button>
                </div>
              )}
              <SlideToConfirm
                onConfirm={handleFinalizarTarea}
                label="Finalizar tarea"
                confirmLabel="Desliza para finalizar"
                variant="finish"
              />
            </>
          )}
          
          {tareaActiva.estado === 'Finalizada' && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold">Tarea completada</span>
              </div>
              {tareaActiva.evidencia && (
                <div className="flex items-center justify-center" style={{ color: '#1A202C' }}>
                  <Camera className="h-4 w-4 mr-1" />
                  <span className="text-sm">Evidencia subida</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Información de progreso */}
        <div className="text-center text-sm text-gray-500">
          Tarea {tareaActivaIndex + 1} de {tareas.length}
        </div>
      </div>

      {/* Accesos directos */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos directos</h2>
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => {
              setShowChecklist(true);
            }}
            className="flex flex-col items-center space-y-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEEB70' }}>
              <CheckSquare className="h-6 w-6" style={{ color: '#1A202C' }} />
            </div>
            <span className="text-sm font-medium text-gray-700">Checklist</span>
          </button>
          
          <button 
            onClick={() => {
              // Navegar a la vista de evidencias
              router.push('/socio/evidencias');
            }}
            className="flex flex-col items-center space-y-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#008080' }}>
              <Paperclip className="h-6 w-6" style={{ color: '#FFFFFF' }} />
            </div>
            <span className="text-sm font-medium text-gray-700">Evidencias</span>
          </button>
          
          <button 
            onClick={() => {
              // Navegar a la sección de chat del panel de cliente
              // Si el usuario es CLIENTE_TECNICO, ir al dashboard de cliente
              // Si no, mostrar un mensaje informativo
              if (currentUser?.role === 'CLIENTE_TECNICO' || currentUser?.role === 'ADMIN') {
                router.push('/cliente/dashboard?section=chat');
              } else {
                alert('Chat: Esta funcionalidad está disponible para clientes técnicos. Si necesitás contactar con el equipo, hablá con tu líder.');
              }
            }}
            className="flex flex-col items-center space-y-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1A202C' }}>
              <MessageCircle className="h-6 w-6" style={{ color: '#FFFFFF' }} />
            </div>
            <span className="text-sm font-medium text-gray-700">Chat</span>
          </button>
        </div>
      </div>

      {/* Resumen del día */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#1A202C' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#FFFFFF' }}>Resumen del día</h3>
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color: '#FEEB70' }}>{tareasCompletadas}</div>
          <div className="text-sm" style={{ color: '#A0AEC0' }}>Tareas completadas</div>
        </div>
      </div>

      {/* Modal de checklist */}
      {showChecklist && tareaActiva && (
        <ChecklistModal
          tarea={tareaActiva}
          onClose={() => setShowChecklist(false)}
          onSave={handleGuardarChecklist}
        />
      )}

      {/* Modal de subir evidencia */}
      {mostrarCamara && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Subir evidencia</h2>
            <p className="text-gray-600 mb-6">Selecciona una imagen para completar la tarea</p>
            
            {/* Input de archivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSeleccionarImagen}
              className="hidden"
            />

            {/* Vista previa de imagen */}
            {previewImagen && (
              <div className="mb-6">
                <img
                  src={previewImagen}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col space-y-3">
              {!imagenSeleccionada ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Seleccionar imagen
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubirEvidencia}
                    disabled={subiendoImagen}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {subiendoImagen ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Finalizar tarea
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setImagenSeleccionada(null);
                      setPreviewImagen(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cambiar imagen
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setMostrarCamara(false);
                  setImagenSeleccionada(null);
                  setPreviewImagen(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}