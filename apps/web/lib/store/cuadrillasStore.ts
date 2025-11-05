'use client';

import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { Cuadrilla, Especialidad, EstadoCuadrilla, FiltrosCuadrillas, Obra, Tarea, Integrante } from '../types/cuadrillas';

interface CuadrillasState {
  cuadrillas: Cuadrilla[];
  obras: Obra[];
  tareas: Tarea[];
  filtros: FiltrosCuadrillas;
  cuadrillaSeleccionada: Cuadrilla | null;
  showDrawer: boolean;
  showModalAsignacion: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  fetchCuadrillas: (orgId: string) => Promise<void>;
  crearCuadrilla: (cuadrillaData: Partial<Cuadrilla>, orgId: string) => Promise<Cuadrilla | null>;
  eliminarCuadrilla: (cuadrillaId: string, orgId: string) => Promise<boolean>;
  setFiltros: (filtros: Partial<FiltrosCuadrillas>) => void;
  moverCuadrilla: (cuadrillaId: string, nuevaEspecialidad: Especialidad) => void;
  seleccionarCuadrilla: (cuadrilla: Cuadrilla | null) => void;
  abrirDrawer: () => void;
  cerrarDrawer: () => void;
  abrirModalAsignacion: () => void;
  cerrarModalAsignacion: () => void;
  asignarTarea: (cuadrillaId: string, tareaId: string) => void;
  actualizarCuadrilla: (cuadrillaId: string, updates: Partial<Cuadrilla>) => void;
}

// Helper para mapear datos de Supabase a Cuadrilla
function mapearCuadrillaDesdeSupabase(data: any): Cuadrilla {
  // Mapear integrantes (desde cuadrilla_socios o cuadrilla_integrantes)
  const integrantes: Integrante[] = (data.socios || data.integrantes || []).map((s: any) => ({
    id: s.socio?.id || s.id || '',
    nombre: s.socio?.nombre || s.nombre || '',
    rol: s.rol || s.rol_en_cuadrilla || '',
    telefono: s.socio?.telefono || s.telefono || '',
    whatsapp: s.socio?.whatsapp || s.whatsapp || '',
    email: s.socio?.email || s.email || '',
    dni: s.socio?.dni || s.dni || '',
    fechaIngreso: s.fecha_ingreso || '',
    seguroVigente: s.socio?.seguro_vigente || s.seguro_vigente || false,
  }));

  // Valores por defecto para campos calculados
  const antiguedad = calcularAntiguedad(data.created_at);
  const obrasParticipadas = data.obras_participadas || 0;
  const valoracionPromedio = data.valoracion_promedio || 0;
  const cumplimientoTiempo = data.cumplimiento_tiempo || 0;
  const seguridadAlDia = data.seguridad_al_dia || false;

  return {
    id: data.id,
    nombre: data.nombre,
    encargado: data.encargado,
    telefonoEncargado: data.telefono_encargado || undefined,
    whatsappEncargado: data.whatsapp_encargado || undefined,
    emailEncargado: data.email_encargado || undefined,
    fotoEncargado: data.foto_encargado || undefined,
    especialidad: data.especialidad as Especialidad,
    estado: (data.estado || 'Disponible') as EstadoCuadrilla,
    antiguedad,
    valoracionPromedio: Number(valoracionPromedio),
    obrasParticipadas,
    cumplimientoTiempo,
    seguridadAlDia,
    integrantes,
    documentos: data.documentos || [],
    kpi: {
      tareasAsignadas: 0, // Se calculará desde tareas
      tareasEnEjecucion: 0,
      tareasTerminadas: 0,
      cumplimientoPct: 0,
    },
    feedback: data.feedback || [],
    badges: data.badges || [],
    asignaciones: [],
  };
}

function calcularAntiguedad(createdAt: string): string {
  if (!createdAt) return 'Nueva';
  const fecha = new Date(createdAt);
  const ahora = new Date();
  const años = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24 * 365));
  if (años === 0) return 'Menos de un año';
  if (años === 1) return '1 año';
  return `${años} años`;
}

export const useCuadrillasStore = create<CuadrillasState>((set, get) => ({
  cuadrillas: [],
  obras: [],
  tareas: [],
  filtros: {},
  cuadrillaSeleccionada: null,
  showDrawer: false,
  showModalAsignacion: false,
  isLoading: false,
  error: null,

  fetchCuadrillas: async (orgId: string) => {
    if (!orgId) {
      set({ error: 'No hay organización seleccionada' });
      return;
    }

    set({ isLoading: true, error: null });
    const supabase = createClientComponentClient<Database>();

    try {
      // Query inicial: incluir todos los campos que podrían existir en un solo select
      // Si algún campo no existe, Supabase lo ignorará pero no fallará
      const { data: cuadrillasData, error: cuadrillasError } = await supabase
        .from('cuadrillas')
        .select('id, nombre, encargado, especialidad, estado, org_id, obra_id, created_at, updated_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (cuadrillasError) {
        // Log detallado del error
        const errorInfo: any = {
          message: cuadrillasError?.message || 'Error desconocido',
          details: cuadrillasError?.details || null,
          hint: cuadrillasError?.hint || null,
          code: cuadrillasError?.code || null,
          errorObject: cuadrillasError,
          errorType: typeof cuadrillasError,
          errorKeys: cuadrillasError ? Object.keys(cuadrillasError) : [],
          orgId: orgId
        };
        
        try {
          console.error('[FETCH_CUADRILLAS_ERROR]', JSON.stringify(errorInfo, null, 2));
        } catch (e) {
          console.error('[FETCH_CUADRILLAS_ERROR]', errorInfo);
        }
        
        // Mensaje de error más descriptivo
        let errorMessage = 'Error al cargar cuadrillas';
        if (cuadrillasError?.message) {
          errorMessage = cuadrillasError.message;
        } else if (cuadrillasError?.code === 'PGRST116') {
          errorMessage = 'No tienes permisos para ver cuadrillas. Verifica tu autenticación.';
        } else if (cuadrillasError && Object.keys(cuadrillasError).length === 0) {
          errorMessage = 'Error de permisos: Verifica que tengas acceso para ver cuadrillas en esta organización';
        }
        
        set({ error: errorMessage, isLoading: false });
        return;
      }

      // Si no hay datos pero tampoco hay error, puede ser que simplemente no haya cuadrillas
      if (!cuadrillasData) {
        set({ cuadrillas: [], isLoading: false });
        return;
      }

      // Usar directamente los datos obtenidos sin queries adicionales
      // Las queries opcionales a campos/tablas que no existen causan errores 400/404
      // Por ahora, solo usamos los campos básicos que sabemos que existen
      const cuadrillasCompletas = cuadrillasData || [];

      // Cargar tareas para calcular KPIs
      const cuadrillaIds = cuadrillasCompletas.map(c => c.id);
      let tareasPorCuadrilla: Record<string, any[]> = {};

      if (cuadrillaIds.length > 0) {
        const { data: tareasData, error: tareasError } = await supabase
          .from('tareas')
          .select('id, cuadrilla_id, estado, avance')
          .eq('org_id', orgId)
          .in('cuadrilla_id', cuadrillaIds);

        if (!tareasError && tareasData) {
          // Agrupar tareas por cuadrilla_id
          tareasPorCuadrilla = tareasData.reduce((acc: Record<string, any[]>, tarea) => {
            if (tarea.cuadrilla_id) {
              if (!acc[tarea.cuadrilla_id]) {
                acc[tarea.cuadrilla_id] = [];
              }
              acc[tarea.cuadrilla_id].push(tarea);
            }
            return acc;
          }, {});
        } else if (tareasError) {
          console.warn('[FETCH_TAREAS_FOR_KPI_WARNING]', tareasError);
        }
      }

      // Mapear cuadrillas y calcular KPIs desde tareas reales
      const cuadrillasMapeadas: Cuadrilla[] = cuadrillasCompletas.map(cuadrilla => {
        const cuadrillaMapeada = mapearCuadrillaDesdeSupabase(cuadrilla);
        const tareas = tareasPorCuadrilla[cuadrilla.id] || [];
        
        // Calcular KPIs desde tareas reales
        const tareasAsignadas = tareas.length;
        const tareasEnEjecucion = tareas.filter(t => 
          t.estado === 'en_progreso' || t.estado === 'en curso'
        ).length;
        const tareasTerminadas = tareas.filter(t => 
          t.estado === 'finalizado' || t.estado === 'validado'
        ).length;
        const cumplimientoPct = tareasAsignadas > 0 
          ? Math.round((tareasTerminadas / tareasAsignadas) * 100)
          : 0;

        return {
          ...cuadrillaMapeada,
          kpi: {
            tareasAsignadas,
            tareasEnEjecucion,
            tareasTerminadas,
            cumplimientoPct,
          },
        };
      });

      set({ cuadrillas: cuadrillasMapeadas, isLoading: false });
    } catch (err) {
      console.error('[FETCH_CUADRILLAS_EXCEPTION]', err);
      set({ error: 'Error inesperado al cargar cuadrillas', isLoading: false });
    }
  },

  crearCuadrilla: async (cuadrillaData: Partial<Cuadrilla>, orgId: string) => {
    if (!orgId) {
      set({ error: 'No hay organización seleccionada' });
      return null;
    }

    set({ isLoading: true, error: null });
    const supabase = createClientComponentClient<Database>();

    try {
      // Validar campos requeridos
      if (!cuadrillaData.nombre || !cuadrillaData.encargado || !cuadrillaData.especialidad) {
        const missingFields = [];
        if (!cuadrillaData.nombre) missingFields.push('nombre');
        if (!cuadrillaData.encargado) missingFields.push('encargado');
        if (!cuadrillaData.especialidad) missingFields.push('especialidad');
        set({ error: `Campos requeridos faltantes: ${missingFields.join(', ')}`, isLoading: false });
        return null;
      }

      // Solo insertar los campos mínimos - el resto lo completará el encargado
      // Solo incluir campos que existen en la tabla de Supabase
      const nuevaCuadrilla: any = {
        org_id: orgId,
        obra_id: null, // Por defecto null, se puede asignar después
        nombre: cuadrillaData.nombre,
        encargado: cuadrillaData.encargado,
        especialidad: cuadrillaData.especialidad,
        estado: 'Disponible', // Siempre 'Disponible' al crear
        // Campos que NO se completan aquí (los completará el encargado):
        // telefono_encargado, whatsapp_encargado, email_encargado, foto_encargado
        // Estos quedan como NULL y el encargado los actualizará desde su app
        // Nota: valoracion_promedio, obras_participadas, cumplimiento_tiempo, seguridad_al_dia
        // pueden no existir en la tabla o tener valores por defecto, no los incluimos en el insert
      };

      console.log('[CREAR_CUADRILLA] Intentando crear:', { nuevaCuadrilla, orgId });

      // Verificar que orgId es válido
      if (!orgId || typeof orgId !== 'string') {
        console.error('[CREAR_CUADRILLA_ERROR] orgId inválido:', orgId);
        set({ error: 'ID de organización inválido', isLoading: false });
        return null;
      }

      const { data, error } = await supabase
        .from('cuadrillas')
        .insert([nuevaCuadrilla])
        .select()
        .single();

      // Verificar si hay error - incluso si el objeto está vacío
      if (error || (error !== null && Object.keys(error).length === 0)) {
        // Log detallado del error
        const errorInfo: any = {
          message: error?.message || 'Error desconocido',
          details: error?.details || null,
          hint: error?.hint || null,
          code: error?.code || null,
          errorObject: error,
          errorType: typeof error,
          errorKeys: error ? Object.keys(error) : [],
          payload: nuevaCuadrilla,
          orgId: orgId
        };
        
        // Intentar serializar el error completo
        try {
          console.error('[CREAR_CUADRILLA_ERROR] Error completo:', JSON.stringify(errorInfo, null, 2));
        } catch (e) {
          console.error('[CREAR_CUADRILLA_ERROR] Error al serializar:', errorInfo);
        }
        
        // Intentar obtener más información del error
        let errorMessage = 'Error al crear la cuadrilla';
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.details) {
          errorMessage = error.details;
        } else if (error?.code) {
          errorMessage = `Error ${error.code}: No se pudo crear la cuadrilla`;
        } else if (error && Object.keys(error).length === 0) {
          errorMessage = 'Error de permisos: Verifica que tengas acceso para crear cuadrillas en esta organización';
        }
        
        set({ 
          error: errorMessage, 
          isLoading: false 
        });
        return null;
      }

      if (!data) {
        console.error('[CREAR_CUADRILLA_ERROR] No se recibió data después del insert');
        set({ error: 'No se recibió respuesta del servidor', isLoading: false });
        return null;
      }

      console.log('[CREAR_CUADRILLA] Cuadrilla creada exitosamente:', data);

      // Si hay integrantes, insertarlos en cuadrilla_socios o cuadrilla_integrantes
      if (cuadrillaData.integrantes && cuadrillaData.integrantes.length > 0) {
        // Intentar insertar en cuadrilla_socios primero
        const integrantesData = cuadrillaData.integrantes.map(integrante => ({
          cuadrilla_id: data.id,
          socio_id: integrante.id || null,
          rol: integrante.rol || '',
          fecha_ingreso: integrante.fechaIngreso || new Date().toISOString().split('T')[0],
          activo: true,
        }));

        const { error: integrantesError } = await supabase
          .from('cuadrilla_socios')
          .insert(integrantesData);

        if (integrantesError) {
          console.warn('[CREAR_INTEGRANTES_WARNING]', integrantesError);
          // Si falla, intentar con cuadrilla_integrantes
          const integrantesDataAlt = cuadrillaData.integrantes.map(integrante => ({
            cuadrilla_id: data.id,
            nombre: integrante.nombre || '',
            rol: integrante.rol || '',
            telefono: integrante.telefono || null,
            whatsapp: integrante.whatsapp || null,
            email: integrante.email || null,
            dni: integrante.dni || null,
            seguro_vigente: integrante.seguroVigente || false,
            fecha_ingreso: integrante.fechaIngreso || new Date().toISOString().split('T')[0],
            activo: true,
          }));

          const { error: integrantesErrorAlt } = await supabase
            .from('cuadrilla_integrantes')
            .insert(integrantesDataAlt);

          if (integrantesErrorAlt) {
            console.warn('[CREAR_INTEGRANTES_ALT_WARNING]', integrantesErrorAlt);
          }
        }
      }

      // Refrescar la lista
      await get().fetchCuadrillas(orgId);
      set({ isLoading: false });
      
      return mapearCuadrillaDesdeSupabase(data);
    } catch (err: any) {
      console.error('[CREAR_CUADRILLA_EXCEPTION]', {
        error: err,
        message: err?.message,
        stack: err?.stack
      });
      set({ 
        error: err?.message || 'Error inesperado al crear cuadrilla', 
        isLoading: false 
      });
      return null;
    }
  },

  eliminarCuadrilla: async (cuadrillaId: string, orgId: string) => {
    set({ isLoading: true, error: null });
    const supabase = createClientComponentClient<Database>();
    try {
      const { error } = await supabase
        .from('cuadrillas')
        .delete()
        .eq('id', cuadrillaId)
        .eq('org_id', orgId);

      if (error) {
        console.error('[ELIMINAR_CUADRILLA_ERROR]', error);
        set({ error: error.message, isLoading: false });
        return false;
      }
      
      // Actualizar el estado local eliminando la cuadrilla
      set((state) => ({
        cuadrillas: state.cuadrillas.filter((c) => c.id !== cuadrillaId),
        isLoading: false,
      }));
      
      return true;
    } catch (err: any) {
      console.error('[ELIMINAR_CUADRILLA_EXCEPTION]', err);
      set({ error: err.message || 'Error inesperado al eliminar cuadrilla', isLoading: false });
      return false;
    }
  },

  setFiltros: (nuevosFiltros) => {
    set((state) => ({
      filtros: { ...state.filtros, ...nuevosFiltros }
    }));
  },

  moverCuadrilla: (cuadrillaId, nuevaEspecialidad) => {
    set((state) => ({
      cuadrillas: state.cuadrillas.map(cuadrilla =>
        cuadrilla.id === cuadrillaId
          ? { ...cuadrilla, especialidad: nuevaEspecialidad }
          : cuadrilla
      )
    }));
  },

  seleccionarCuadrilla: (cuadrilla) => {
    set({ cuadrillaSeleccionada: cuadrilla });
  },

  abrirDrawer: () => {
    set({ showDrawer: true });
  },

  cerrarDrawer: () => {
    set({ showDrawer: false });
  },

  abrirModalAsignacion: () => {
    set({ showModalAsignacion: true });
  },

  cerrarModalAsignacion: () => {
    set({ showModalAsignacion: false });
  },

  asignarTarea: async (cuadrillaId: string, tareaId: string) => {
    // Esta función se implementará en el componente que llama a la API
    // Por ahora, solo actualiza el estado local
    set((state) => ({
      tareas: state.tareas.map(tarea =>
        tarea.id === tareaId
          ? { ...tarea, cuadrillaId, estado: 'ASIGNADA' as const }
          : tarea
      ),
      cuadrillas: state.cuadrillas.map(cuadrilla =>
        cuadrilla.id === cuadrillaId
          ? { 
              ...cuadrilla, 
              kpi: { 
                ...cuadrilla.kpi, 
                tareasAsignadas: cuadrilla.kpi.tareasAsignadas + 1 
              }
            }
          : cuadrilla
      )
    }));
  },

  actualizarCuadrilla: (cuadrillaId, updates) => {
    set((state) => ({
      cuadrillas: state.cuadrillas.map(cuadrilla =>
        cuadrilla.id === cuadrillaId
          ? { ...cuadrilla, ...updates }
          : cuadrilla
      )
    }));
  }
}));