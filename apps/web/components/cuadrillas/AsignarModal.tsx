'use client';

import { useState, useEffect } from 'react';
import { X, Search, Filter, MapPin, Calendar } from 'lucide-react';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { useToast } from '@/components/ui/use-toast';

interface Obra {
  id: string;
  nombre: string;
  estado: string;
}

interface Tarea {
  id: string;
  nombre: string;
  obraId: string;
  etapa: string;
  estado: string;
  cuadrillaId?: string;
}

type SupabaseObraRecord = {
  id: string;
  name?: string | null;
  estado?: string | null;
};

type SupabaseTareaRecord = {
  id: string;
  title?: string | null;
  descripcion?: string | null;
  estado?: string | null;
  obra_id?: string | null;
  elemento_id?: string | null;
  cuadrilla_id?: string | null;
};

type SupabaseElementoRecord = {
  id: string;
  categoria?: string | null;
};

export function AsignarModal() {
  const { 
    showModalAsignacion, 
    cerrarModalAsignacion, 
    cuadrillaSeleccionada,
    asignarTarea 
  } = useCuadrillasStore();
  
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const [obras, setObras] = useState<Obra[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingObras, setLoadingObras] = useState(false);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [busquedaObra, setBusquedaObra] = useState('');
  const [busquedaTarea, setBusquedaTarea] = useState('');
  const [obraSeleccionada, setObraSeleccionada] = useState<string>('');
  const [etapaFiltro, setEtapaFiltro] = useState<string>('');
  const [tareaSeleccionada, setTareaSeleccionada] = useState<string>('');

  // Cargar obras desde Supabase cuando se abre el modal
  useEffect(() => {
    const cargarObras = async () => {
      if (!showModalAsignacion || !currentUser?.orgId) return;
      
      setLoadingObras(true);
      try {
        const { data, error } = await supabase
          .from('obras')
          .select('id, name, estado')
          .eq('org_id', currentUser.orgId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[ERROR_CARGAR_OBRAS]', error);
          toast({
            title: 'Error',
            description: 'No se pudieron cargar las obras',
            variant: 'destructive',
          });
        } else {
          const supabaseObras = (data ?? []) as SupabaseObraRecord[];
          setObras(
            supabaseObras.map(obra => ({
              id: obra.id,
              nombre: obra.name || 'Sin nombre',
              estado: obra.estado || 'activa',
            }))
          );
        }
      } catch (err) {
        console.error('[ERROR_CARGAR_OBRAS_EXCEPTION]', err);
      } finally {
        setLoadingObras(false);
      }
    };

    cargarObras();
  }, [showModalAsignacion, currentUser?.orgId, supabase, toast]);

  // Cargar tareas desde Supabase cuando se selecciona una obra
  useEffect(() => {
    const cargarTareas = async () => {
      if (!showModalAsignacion || !currentUser?.orgId) return;
      
      setLoadingTareas(true);
      try {
        // Primero intentar query simple sin joins para verificar permisos
        let query = supabase
          .from('tareas')
          .select('id, title, descripcion, estado, obra_id, elemento_id, cuadrilla_id')
          .eq('org_id', currentUser.orgId)
          .is('cuadrilla_id', null); // Solo tareas sin asignar

        // Filtrar por obra si está seleccionada
        if (obraSeleccionada) {
          query = query.eq('obra_id', obraSeleccionada);
        }

        // Excluir tareas finalizadas o validadas
        query = query.not('estado', 'eq', 'finalizado').not('estado', 'eq', 'validado');
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
          // Log detallado del error
          const errorInfo: any = {
            message: error?.message || 'Error desconocido',
            details: error?.details || null,
            hint: error?.hint || null,
            code: error?.code || null,
            errorObject: error,
            errorType: typeof error,
            errorKeys: error ? Object.keys(error) : [],
            orgId: currentUser.orgId,
            obraSeleccionada: obraSeleccionada || 'todas'
          };
          
          try {
            console.error('[ERROR_CARGAR_TAREAS]', JSON.stringify(errorInfo, null, 2));
          } catch (e) {
            console.error('[ERROR_CARGAR_TAREAS]', errorInfo);
          }

          // Si el error está vacío, puede ser un problema de permisos RLS
          if (error && Object.keys(error).length === 0) {
            console.warn('[ERROR_CARGAR_TAREAS] Error vacío - posible problema de permisos RLS');
          }

          toast({
            title: 'Error',
            description: 'No se pudieron cargar las tareas. Verifica los permisos.',
            variant: 'destructive',
          });
        } else {
          const supabaseTareas = (data ?? []) as SupabaseTareaRecord[];

          // Si hay datos, intentar obtener información adicional de elementos
          if (supabaseTareas.length > 0) {
            // Intentar obtener categorías de elementos (opcional, no crítico)
            const elementoIds = supabaseTareas
              .map(t => t.elemento_id)
              .filter((id): id is string => Boolean(id));
            let categoriasMap: Record<string, string> = {};
            
            if (elementoIds.length > 0) {
              try {
                const { data: elementosData } = await supabase
                  .from('elementos')
                  .select('id, categoria')
                  .in('id', elementoIds);
                
                if (elementosData) {
                  (elementosData as SupabaseElementoRecord[]).forEach(elem => {
                    if (elem.id) categoriasMap[elem.id] = elem.categoria || 'estructura';
                  });
                }
              } catch (e) {
                // Ignorar error al obtener categorías, usar default
                console.warn('[WARNING] No se pudieron obtener categorías de elementos');
              }
            }

            setTareas(supabaseTareas.map(tarea => ({
              id: tarea.id,
              nombre: tarea.title || 'Sin nombre',
              obraId: tarea.obra_id || '',
              etapa: categoriasMap[tarea.elemento_id ?? '']?.toLowerCase() || 'estructura',
              estado: tarea.estado || 'pendiente',
              cuadrillaId: tarea.cuadrilla_id || undefined
            })));
          } else {
            setTareas([]);
          }
        }
      } catch (err: any) {
        console.error('[ERROR_CARGAR_TAREAS_EXCEPTION]', {
          message: err?.message,
          stack: err?.stack,
          error: err
        });
        toast({
          title: 'Error',
          description: 'Error inesperado al cargar tareas',
          variant: 'destructive',
        });
      } finally {
        setLoadingTareas(false);
      }
    };

    cargarTareas();
  }, [showModalAsignacion, currentUser?.orgId, obraSeleccionada, supabase, toast]);

  if (!showModalAsignacion || !cuadrillaSeleccionada) return null;

  // Filtrar obras
  const obrasFiltradas = obras.filter(obra => 
    obra.nombre.toLowerCase().includes(busquedaObra.toLowerCase())
  );

  // Filtrar tareas
  const tareasFiltradas = tareas.filter(tarea => {
    const matchObra = obraSeleccionada ? tarea.obraId === obraSeleccionada : true;
    const matchBusqueda = tarea.nombre.toLowerCase().includes(busquedaTarea.toLowerCase());
    const matchEtapa = etapaFiltro ? tarea.etapa === etapaFiltro : true;
    const sinAsignar = !tarea.cuadrillaId; // Solo tareas sin asignar
    
    return matchObra && matchBusqueda && matchEtapa && sinAsignar;
  });

  const obraSeleccionadaData = obras.find(o => o.id === obraSeleccionada);

  const getEtapaColor = (etapa: string) => {
    const colores = {
      'estructura': 'bg-blue-100 text-blue-800',
      'obra_gris': 'bg-gray-100 text-gray-800',
      'terminaciones': 'bg-green-100 text-green-800'
    };
    return colores[etapa as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoColor = (estado: string) => {
    const colores = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'ASIGNADA': 'bg-blue-100 text-blue-800',
      'EN_EJECUCION': 'bg-purple-100 text-purple-800',
      'TERMINADA': 'bg-green-100 text-green-800',
      'VALIDADA': 'bg-indigo-100 text-indigo-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const handleAsignar = async () => {
    if (!tareaSeleccionada || !currentUser?.orgId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una tarea',
        variant: 'destructive',
      });
      return;
    }

    if (!cuadrillaSeleccionada?.id) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una cuadrilla',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Validar que el ID de la cuadrilla sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(cuadrillaSeleccionada.id)) {
        toast({
          title: 'Error',
          description: 'ID de cuadrilla inválido',
          variant: 'destructive',
        });
        return;
      }

      // Logs para debugging
      console.log('[ASIGNAR_TAREA] Asignando tarea a cuadrilla:', {
        tareaId: tareaSeleccionada,
        cuadrilla_id: cuadrillaSeleccionada.id,
        cuadrilla_nombre: cuadrillaSeleccionada.nombre,
        orgId: currentUser.orgId,
        usuarioId: currentUser.id,
      });

      // Llamar a la API para asignar la tarea a la cuadrilla
      const response = await fetch(`/api/tareas/${tareaSeleccionada}/asignar-cuadrilla`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizacion-id': currentUser.orgId,
          'x-usuario-id': currentUser.id,
        },
        body: JSON.stringify({
          cuadrilla_id: cuadrillaSeleccionada.id,
        }),
      });

      console.log('[ASIGNAR_TAREA] Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
      });

      // Clonar la respuesta para poder leerla múltiples veces si es necesario
      const contentType = response.headers.get('content-type');
      
      // Verificar status antes de procesar
      if (!response.ok) {
        // Si es JSON, parsearlo y mostrar el error
        if (contentType && contentType.includes('application/json')) {
          let errorData: any = {};
          try {
            const text = await response.clone().text();
            console.log('[ERROR_ASIGNAR_TAREA] Respuesta raw del servidor:', text);
            errorData = await response.json();
          } catch (parseError) {
            console.error('[ERROR_ASIGNAR_TAREA] Error al parsear JSON:', parseError);
            const text = await response.text();
            console.error('[ERROR_ASIGNAR_TAREA] Respuesta como texto:', text);
            errorData = { error: 'Error al procesar respuesta del servidor', raw: text };
          }
          
          console.error('[ERROR_ASIGNAR_TAREA] Error del servidor (completo):', {
            status: response.status,
            statusText: response.statusText,
            contentType,
            error: errorData.error,
            details: errorData.details,
            success: errorData.success,
            fullResponse: errorData,
            errorKeys: Object.keys(errorData),
          });
          
          // Construir mensaje de error más descriptivo
          const errorMessage = errorData.details 
            ? `${errorData.error || 'Error al asignar cuadrilla'}: ${errorData.details}`
            : errorData.error || `Error ${response.status}: ${response.statusText}`;
          
          // Mostrar toast con error específico
          toast({
            title: 'Error al asignar tarea',
            description: errorMessage,
            variant: 'destructive',
          });
          
          throw new Error(errorMessage);
        }
        
        // Si no es JSON, intentar leer como texto (clonar primero)
        const clonedResponse = response.clone();
        const text = await clonedResponse.text();
        console.error('[ERROR_ASIGNAR_TAREA] Respuesta no es JSON:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          bodyPreview: text.substring(0, 500),
          url: response.url
        });
        
        // Intentar extraer información útil del HTML si es posible
        let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        if (text.includes('Error')) {
          const match = text.match(/<title>(.*?)<\/title>/i);
          if (match) {
            errorMessage = match[1];
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Verificar que la respuesta sea JSON
      if (!contentType || !contentType.includes('application/json')) {
        const clonedResponse = response.clone();
        const text = await clonedResponse.text();
        console.error('[ERROR_ASIGNAR_TAREA] Respuesta no es JSON después de OK:', {
          status: response.status,
          contentType,
          bodyPreview: text.substring(0, 200)
        });
        throw new Error('La respuesta del servidor no es válida');
      }

      // Parsear JSON
      let result;
      try {
        result = await response.json();
      } catch (jsonError: any) {
        console.error('[ERROR_PARSE_JSON]', jsonError);
        throw new Error('Error al procesar respuesta del servidor');
      }

      if (result.success) {
        console.log('[ASIGNAR_TAREA] Asignación exitosa:', result.data);
        
        toast({
          title: 'Tarea asignada',
          description: result.message || `La tarea fue asignada correctamente a la cuadrilla ${cuadrillaSeleccionada.nombre}.`,
        });
        
        // Recargar tareas para actualizar la lista
        setTareas(prev => prev.filter(t => t.id !== tareaSeleccionada));
        
        // Reset form
        setObraSeleccionada('');
        setTareaSeleccionada('');
        setBusquedaObra('');
        setBusquedaTarea('');
        setEtapaFiltro('');
        
        cerrarModalAsignacion();
      } else {
        console.error('[ASIGNAR_TAREA] Error en respuesta:', result);
        toast({
          title: 'Error',
          description: result.error || 'No se pudo asignar la tarea',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('[ERROR_ASIGNAR_TAREA]', err);
      toast({
        title: 'Error',
        description: 'Error al asignar la tarea',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Asignar Tarea</h3>
            <p className="text-sm text-gray-600">
              Cuadrilla: {cuadrillaSeleccionada.nombre}
            </p>
          </div>
          <button
            onClick={cerrarModalAsignacion}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel izquierdo - Selección de obra */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Seleccionar Obra
              </h4>
              
              {/* Búsqueda de obra */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={busquedaObra}
                  onChange={(e) => setBusquedaObra(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar obra..."
                />
              </div>

              {/* Lista de obras */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingObras ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Cargando obras...
                  </div>
                ) : obrasFiltradas.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No hay obras disponibles
                  </div>
                ) : (
                  obrasFiltradas.map((obra) => (
                  <button
                    key={obra.id}
                    onClick={() => setObraSeleccionada(obra.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                      obraSeleccionada === obra.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{obra.nombre}</p>
                        <p className="text-sm text-gray-600">{obra.estado}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        obra.estado === 'ACTIVA' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {obra.estado}
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </div>

            {/* Panel derecho - Selección de tarea */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Seleccionar Tarea
              </h4>

              {/* Filtros de tarea */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={busquedaTarea}
                    onChange={(e) => setBusquedaTarea(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Buscar tarea..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={etapaFiltro}
                    onChange={(e) => setEtapaFiltro(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas las etapas</option>
                    <option value="estructura">Estructura</option>
                    <option value="obra_gris">Obra Gris</option>
                    <option value="terminaciones">Terminaciones</option>
                  </select>
                </div>
              </div>

              {/* Lista de tareas */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingTareas ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Cargando tareas...
                  </div>
                ) : tareasFiltradas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay tareas disponibles</p>
                    <p className="text-xs mt-1">Selecciona una obra para ver las tareas</p>
                  </div>
                ) : (
                  tareasFiltradas.map((tarea) => {
                  const obra = obras.find(o => o.id === tarea.obraId);
                  return (
                    <button
                      key={tarea.id}
                      onClick={() => setTareaSeleccionada(tarea.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                        tareaSeleccionada === tarea.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{tarea.nombre}</p>
                          <p className="text-xs text-gray-600 mt-1">{obra?.nombre}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEtapaColor(tarea.etapa)}`}>
                              {tarea.etapa}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(tarea.estado)}`}>
                              {tarea.estado}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
                )}
              </div>
            </div>
          </div>

          {/* Información de la asignación */}
          {tareaSeleccionada && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Resumen de Asignación</h5>
              {(() => {
                const tarea = tareas.find(t => t.id === tareaSeleccionada);
                const obra = obras.find(o => o.id === tarea?.obraId);
                return tarea ? (
                  <div className="text-sm text-blue-800">
                    <p><span className="font-medium">Cuadrilla:</span> {cuadrillaSeleccionada.nombre}</p>
                    <p><span className="font-medium">Obra:</span> {obra?.nombre}</p>
                    <p><span className="font-medium">Tarea:</span> {tarea.nombre}</p>
                    <p><span className="font-medium">Etapa:</span> {tarea.etapa}</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={cerrarModalAsignacion}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleAsignar}
            disabled={!tareaSeleccionada}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            Asignar Tarea
          </button>
        </div>
      </div>
    </div>
  );
}
