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
  fetchCuadrillas: (orgId: string, obraId?: string) => Promise<void>;
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
    obraId: data.obra_id || null,
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

// Helper para determinar especialidad desde el rol del socio
function determinarEspecialidadDesdeRol(rol?: string): Especialidad | null {
  if (!rol) return null;
  const rolLower = rol.toLowerCase();
  
  // Mapeo de roles a especialidades
  if (rolLower.includes('albañil') || rolLower.includes('estructura') || rolLower.includes('constructor')) {
    return 'Albañilería / Estructura';
  }
  if (rolLower.includes('yesero') || rolLower.includes('terminacion')) {
    return 'Yesería / Terminaciones';
  }
  if (rolLower.includes('carpintero') || rolLower.includes('carpinteria')) {
    return 'Carpintería';
  }
  if (rolLower.includes('plomero') || rolLower.includes('gas')) {
    return 'Plomería / Gas';
  }
  if (rolLower.includes('electricista') || rolLower.includes('electricidad')) {
    return 'Electricidad';
  }
  if (rolLower.includes('pintor') || rolLower.includes('pintura')) {
    return 'Pintura';
  }
  
  return null;
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

  fetchCuadrillas: async (orgId: string, obraId?: string) => {
    if (!orgId) {
      set({ error: 'No hay organización seleccionada' });
      return;
    }

    set({ isLoading: true, error: null });
    const supabase = createClientComponentClient<Database>() as any;

    try {
      // Buscar cuadrillas desde la tabla socios filtrando por org_id
      // Solo seleccionar columnas que existen en la tabla socios (según schema: id, org_id, nombre, telefono, email, rol, created_at)
      let query = supabase
        .from('socios')
        .select('id, nombre, telefono, email, org_id, created_at, rol')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      const { data: sociosData, error: sociosError } = await query;

      // Log para debugging
      console.log('[FETCH_CUADRILLAS] Query ejecutado (desde socios):', {
        orgId,
        obraId: obraId || 'todas',
        hasError: !!sociosError,
        dataLength: sociosData?.length || 0,
        error: sociosError,
      });

      if (sociosError) {
        // Log detallado del error
        const errorInfo: any = {
          message: sociosError?.message || 'Error desconocido',
          details: sociosError?.details || null,
          hint: sociosError?.hint || null,
          code: sociosError?.code || null,
          errorObject: sociosError,
          errorType: typeof sociosError,
          errorKeys: sociosError ? Object.keys(sociosError) : [],
          orgId: orgId
        };
        
        try {
          console.error('[FETCH_CUADRILLAS_ERROR]', JSON.stringify(errorInfo, null, 2));
        } catch (e) {
          console.error('[FETCH_CUADRILLAS_ERROR]', errorInfo);
        }
        
        // Si el error es que la tabla no existe (42P01) o no hay permisos (PGRST116)
        // Retornar array vacío en lugar de mostrar error
        if (sociosError?.code === '42P01' || sociosError?.code === 'PGRST116' || 
            sociosError?.message?.includes('does not exist') ||
            sociosError?.message?.includes('permission denied')) {
          console.warn('[FETCH_CUADRILLAS] Tabla no existe o sin permisos, retornando array vacío');
          set({ cuadrillas: [], isLoading: false, error: null });
          return;
        }
        
        // Mensaje de error más descriptivo
        let errorMessage = 'Error al cargar cuadrillas desde socios';
        if (sociosError?.message) {
          errorMessage = sociosError.message;
        } else if (sociosError?.code === 'PGRST116') {
          errorMessage = 'No tienes permisos para ver socios. Verifica tu autenticación.';
        } else if (sociosError && Object.keys(sociosError).length === 0) {
          errorMessage = 'Error de permisos: Verifica que tengas acceso para ver socios en esta organización';
        }
        
        set({ error: errorMessage, isLoading: false });
        return;
      }

      // Si no hay datos pero tampoco hay error, puede ser que simplemente no haya socios
      if (!sociosData || sociosData.length === 0) {
        console.log('[FETCH_CUADRILLAS] No hay socios, retornando array vacío');
        set({ cuadrillas: [], isLoading: false });
        return;
      }

      console.log('[FETCH_CUADRILLAS] Socios recibidos:', {
        count: sociosData.length,
        orgId: orgId,
        socios: sociosData.map((s: any) => ({ 
          id: s.id, 
          nombre: s.nombre, 
          org_id: s.org_id,
          rol: s.rol,
          telefono: s.telefono,
          email: s.email
        }))
      });

      // Convertir socios a formato Cuadrilla
      // Cada socio se convierte en una cuadrilla individual
      const cuadrillasCompletas = sociosData.map((socio: any) => {
        // Determinar especialidad basada en el rol o usar una por defecto
        const especialidad = determinarEspecialidadDesdeRol(socio.rol) || 'Albañilería / Estructura';
        
        return {
          id: socio.id,
          nombre: socio.nombre || 'Sin nombre',
          encargado: socio.nombre || 'Sin encargado',
          telefono_encargado: socio.telefono || null,
          whatsapp_encargado: socio.telefono || null, // Usar telefono como whatsapp si no existe columna separada
          email_encargado: socio.email || null,
          foto_encargado: null,
          especialidad: especialidad,
          estado: 'Disponible', // Todos los socios se muestran como disponibles por defecto
          org_id: socio.org_id,
          obra_id: null, // Los socios no tienen obra_id directo, se asigna después
          created_at: socio.created_at,
          updated_at: socio.created_at,
        };
      }) as any[];

      // Cargar tareas para calcular KPIs
      // Buscar tareas asignadas a estos socios (usando socio_ids en lugar de cuadrilla_id)
      const socioIds = cuadrillasCompletas.map((c) => c.id);
      let tareasPorCuadrilla: Record<string, any[]> = {};

      if (socioIds.length > 0) {
        // Buscar tareas donde el socio_id esté en el array socio_ids
        const { data: tareasData, error: tareasError } = await supabase
          .from('tareas')
          .select('id, socio_ids, estado, avance')
          .eq('org_id', orgId);

        if (!tareasError && tareasData) {
          // Agrupar tareas por socio_id (cada socio puede tener múltiples tareas)
          tareasPorCuadrilla = (tareasData as any[]).reduce((acc: Record<string, any[]>, tarea: any) => {
            // socio_ids puede ser un array o un string
            const sociosEnTarea = Array.isArray(tarea.socio_ids) 
              ? tarea.socio_ids 
              : tarea.socio_ids 
                ? [tarea.socio_ids] 
                : [];
            
            sociosEnTarea.forEach((socioId: string) => {
              if (socioId && socioIds.includes(socioId)) {
                if (!acc[socioId]) {
                  acc[socioId] = [];
                }
                acc[socioId].push(tarea);
              }
            });
            
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
    const supabase = createClientComponentClient<Database>() as any;

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

      const { data, error } = (await supabase
        .from('cuadrillas')
        .insert([nuevaCuadrilla])
        .select()
        .single()) as { data: any; error: any };

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
    const supabase = createClientComponentClient<Database>() as any;
    try {
      console.log('[ELIMINAR_CUADRILLA] Eliminando socio:', { cuadrillaId, orgId });
      
      // Eliminar de la tabla socios (las cuadrillas ahora son socios)
      const { error } = await supabase
        .from('socios')
        .delete()
        .eq('id', cuadrillaId)
        .eq('org_id', orgId);

      if (error) {
        console.error('[ELIMINAR_CUADRILLA_ERROR]', error);
        set({ error: error.message, isLoading: false });
        return false;
      }
      
      console.log('[ELIMINAR_CUADRILLA] Socio eliminado exitosamente');
      
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