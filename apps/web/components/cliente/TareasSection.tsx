'use client';

import { useState, useEffect, useMemo } from 'react';
import { Building2, TrendingUp, Clock, MapPin, User, ArrowRight, Calendar, Plus, Eye, DollarSign, Users, CheckCircle, AlertCircle, Wrench, Paintbrush } from 'lucide-react';
import { TimelineInteractivo } from './TimelineInteractivo';
import { EditorVisualTareasN8N } from './EditorVisualTareasN8N';
import { useUpgradeModal } from '@/components/subscriptions/UpgradeModal';
import { usePlanLimitGuard } from '@/lib/subscriptions';
import { usePlanUsage } from '@/lib/subscriptions/use-plan-usage';
import { SUBSCRIPTION_UI_COPY } from '@/lib/subscriptions/texts';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

// Tipos de datos
interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente: string;
  estado: 'activa' | 'pausada' | 'finalizada';
  avance: number;
  tareasTotal: number;
  tareasCompletadas: number;
  fechaInicio: string;
  responsable: string;
}

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'Pendiente' | 'En curso' | 'Finalizada' | 'Aprobada';
  responsable: string;
  etapa: 'Estructura' | 'Obra gris' | 'Terminaciones' | 'Instalaciones';
  fechaInicio: string;
  fechaFin: string;
  prioridad: 'Baja' | 'Media' | 'Alta';
  presupuesto?: number;
}

// Función para calcular el progreso de una obra basado en tareas
const calcularProgreso = (tareasCompletadas: number, tareasTotal: number): number => {
  if (tareasTotal === 0) return 0;
  return Math.round((tareasCompletadas / tareasTotal) * 100);
};



interface ObraResumenCardProps {
  obra: Obra;
  onVerPlanificacion: (obraId: string) => void;
}

function ObraResumenCard({ obra, onVerPlanificacion }: ObraResumenCardProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': 
        return {
          backgroundColor: '#e8f5e8',
          color: '#2d5a2d',
          borderColor: '#a8d8a8'
        };
      case 'pausada': 
        return {
          backgroundColor: '#fffbf0',
          color: '#8b6914',
          borderColor: '#f4d03f'
        };
      case 'finalizada': 
        return {
          backgroundColor: '#f4e27e',
          color: '#1B263B',
          borderColor: '#d4af37'
        };
      default: 
        return {
          backgroundColor: '#f5f7fa',
          color: '#1B263B',
          borderColor: '#dce3ea'
        };
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa': return <TrendingUp className="h-4 w-4" />;
      case 'pausada': return <Clock className="h-4 w-4" />;
      case 'finalizada': return <Building2 className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  return (
    <div 
      className="bg-white rounded-xl border transition-all duration-300 hover:shadow-md"
      style={{borderColor: '#dce3ea'}}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(27, 38, 59, 0.1), 0 4px 6px -2px rgba(27, 38, 59, 0.05)';
        e.currentTarget.style.borderColor = '#1B263B';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#dce3ea';
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{backgroundColor: '#f5f7fa', border: '1px solid #dce3ea'}}
            >
              <Building2 className="h-6 w-6" style={{color: '#1B263B'}} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{color: '#10161a'}}>{obra.nombre}</h3>
              <div className="flex items-center gap-1 text-sm mt-1">
                <MapPin className="h-4 w-4" style={{color: '#5b5f6a'}} />
                <span style={{color: '#5b5f6a'}}>{obra.direccion}</span>
              </div>
            </div>
          </div>
          
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
            style={getEstadoColor(obra.estado)}
          >
            {getEstadoIcon(obra.estado)}
            {obra.estado.charAt(0).toUpperCase() + obra.estado.slice(1)}
          </span>
        </div>

        {/* Información del cliente */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" style={{color: '#5b5f6a'}} />
            <span className="font-medium" style={{color: '#5b5f6a'}}>Cliente:</span>
            <span style={{color: '#5b5f6a'}}>{obra.cliente}</span>
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{color: '#1B263B'}}>Progreso general</span>
            <span className="text-sm" style={{color: '#5b5f6a'}}>{obra.avance}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{backgroundColor: '#f5f7fa'}}>
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${obra.avance}%`,
                backgroundColor: '#1B263B'
              }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs" style={{color: '#5b5f6a'}}>
            <span>{obra.tareasCompletadas} de {obra.tareasTotal} tareas</span>
          </div>
        </div>

        {/* Botón de acción */}
        <button
          onClick={() => onVerPlanificacion(obra.id)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg transition-colors font-medium"
          style={{backgroundColor: '#1B263B'}}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#162033';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1B263B';
          }}
        >
          <span>Ver planificación</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type VistaTareas = 'lista-obras' | 'detalle-obra' | 'editor-gantt';
type TabPrincipal = 'resumen' | 'elementos' | 'tareas' | 'legajo';
type ModoTareas = 'lista' | 'timeline' | 'editor-visual';

export function TareasSection() {
  const [vistaActual, setVistaActual] = useState<VistaTareas>('lista-obras');
  const [obraSeleccionada, setObraSeleccionada] = useState<string>('');
  const [tabPrincipal, setTabPrincipal] = useState<TabPrincipal>('resumen');
  const [modoTareas, setModoTareas] = useState<ModoTareas>('lista');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);
  
  const supabase = createClientComponentClient();
  const currentUser = useCurrentUser();

  // Cargar obras desde Supabase
  useEffect(() => {
    const cargarObras = async () => {
      if (!currentUser?.orgId) {
        console.log('[TareasSection] No hay orgId disponible');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('[TareasSection] Cargando obras para orgId:', currentUser.orgId);
        
        // Obtener obras - usar los mismos nombres de columnas que funcionan en ObrasSection
        const { data: obrasData, error: obrasError } = await supabase
          .from('obras')
          .select('id, org_id, name, address, estado, created_at, propietario, tipo_obra')
          .eq('org_id', currentUser.orgId)
          .order('created_at', { ascending: false });

        // Verificar si hay error
        if (obrasError) {
          console.error('[TareasSection] Error cargando obras:', obrasError);
          console.error('[TareasSection] Detalles completos del error:', JSON.stringify(obrasError, null, 2));
          console.error('[TareasSection] Tipo de error:', typeof obrasError);
          console.error('[TareasSection] orgId del usuario:', currentUser.orgId);
          setObras([]);
          setLoading(false);
          return;
        }

        console.log('[TareasSection] Obras obtenidas:', obrasData?.length || 0);

        // Si no hay datos, simplemente no hay obras
        if (!obrasData || obrasData.length === 0) {
          console.log('[TareasSection] No hay obras disponibles para este usuario');
          setObras([]);
          setLoading(false);
          return;
        }

        // Obtener tareas para cada obra
        const obrasConTareas = await Promise.all(
          (obrasData || []).map(async (obra: any) => {
            const { data: tareasData, error: tareasError } = await supabase
              .from('tareas')
              .select('id, estado')
              .eq('obra_id', obra.id);

            if (tareasError) {
              console.error(`Error cargando tareas para obra ${obra.id}:`, tareasError);
              return { ...obra, tareas: [] };
            }

            return { ...obra, tareas: tareasData || [] };
          })
        );

        // Formatear obras con cálculos de progreso
        const obrasFormateadas: Obra[] = obrasConTareas.map((obra: any) => {
          const tareasTotal = obra.tareas?.length || 0;
          // Estados válidos: 'validado' o 'finalizado' (según schema de Supabase)
          const tareasCompletadas = obra.tareas?.filter((t: any) => {
            const estado = (t.estado || '').toLowerCase();
            return estado === 'validado' || estado === 'finalizado';
          }).length || 0;
          const avance = calcularProgreso(tareasCompletadas, tareasTotal);

          // Mapear nombres de columnas (name/address de Supabase a nombre/localizacion)
          return {
            id: obra.id,
            nombre: obra.name || obra.nombre || 'Sin nombre',
            direccion: obra.address || obra.localizacion || 'Sin dirección',
            cliente: obra.propietario || obra.cliente || 'Sin cliente',
            estado: (obra.estado?.toLowerCase() === 'activa' || obra.estado?.toUpperCase() === 'ACTIVA') ? 'activa' : 
                    (obra.estado?.toLowerCase() === 'pausada' || obra.estado?.toUpperCase() === 'PAUSADA') ? 'pausada' : 
                    (obra.estado?.toLowerCase() === 'finalizada' || obra.estado?.toUpperCase() === 'FINALIZADA') ? 'finalizada' : 'activa',
            avance,
            tareasTotal,
            tareasCompletadas,
            fechaInicio: obra.created_at || new Date().toISOString(),
            responsable: 'Responsable' // TODO: agregar cuando esté disponible en la BD
          };
        });

        setObras(obrasFormateadas);
      } catch (error) {
        console.error('Error en cargarObras:', error);
        setObras([]);
      } finally {
        setLoading(false);
      }
    };

    cargarObras();
  }, [currentUser?.orgId, supabase]);

  // Filtrar solo obras activas
  const obrasActivas = useMemo(() => {
    return obras.filter(obra => obra.estado === 'activa');
  }, [obras]);

  // Cargar tareas desde Supabase cuando se selecciona una obra
  useEffect(() => {
    const cargarTareas = async () => {
      if (!obraSeleccionada || !currentUser?.orgId) {
        setTareas([]);
        return;
      }

      try {
        setLoadingTareas(true);
        
        // Obtener tareas de la obra desde Supabase con join a elementos
        const { data: tareasData, error: tareasError } = await supabase
          .from('tareas')
          .select(`
            id,
            title,
            descripcion,
            estado,
            responsable,
            fecha_inicio,
            fecha_fin,
            fecha_inicio_estimada,
            fecha_fin_estimada,
            obra_id,
            elemento_id,
            prioridad,
            avance,
            created_at,
            elemento:elementos(id, nombre, categoria, subcategoria)
          `)
          .eq('obra_id', obraSeleccionada)
          .eq('org_id', currentUser.orgId)
          .order('created_at', { ascending: false });

        if (tareasError) {
          console.error('[TareasSection] Error cargando tareas:', tareasError);
          setTareas([]);
          return;
        }

        // Mapear tareas de Supabase al formato esperado
        const tareasFormateadas: Tarea[] = (tareasData || []).map((tarea: any) => {
          // Determinar etapa basándose en la categoría del elemento o inferir desde el texto
          let etapa: 'Estructura' | 'Obra gris' | 'Terminaciones' | 'Instalaciones' = 'Estructura';
          
          // Si hay información del elemento, usar su categoría
          const elemento = tarea.elemento || {};
          if (elemento.categoria) {
            const categoriaLower = elemento.categoria.toLowerCase();
            if (categoriaLower.includes('estructura') || categoriaLower.includes('fundación')) {
              etapa = 'Estructura';
            } else if (categoriaLower.includes('instalación') || categoriaLower.includes('sanitaria') || categoriaLower.includes('eléctrica')) {
              etapa = 'Instalaciones';
            } else if (categoriaLower.includes('muro') || categoriaLower.includes('revoque') || categoriaLower.includes('mampostería')) {
              etapa = 'Obra gris';
            } else if (categoriaLower.includes('pintura') || categoriaLower.includes('terminación') || categoriaLower.includes('acabado')) {
              etapa = 'Terminaciones';
            }
          }
          
          // Si no hay categoría, intentar inferir desde el texto
          if (etapa === 'Estructura' && !elemento.categoria) {
            const texto = `${tarea.descripcion || ''} ${tarea.title || ''}`.toLowerCase();
            if (texto.includes('revoque') || texto.includes('instalación') || texto.includes('mampostería')) {
              etapa = 'Obra gris';
            } else if (texto.includes('pintura') || texto.includes('terminación') || texto.includes('acabado')) {
              etapa = 'Terminaciones';
            } else if (texto.includes('estructura') || texto.includes('columna') || texto.includes('viga') || texto.includes('losa')) {
              etapa = 'Estructura';
            }
          }

          // Mapear estados de Supabase a estados del frontend
          let estado: 'Pendiente' | 'En curso' | 'Finalizada' | 'Aprobada' = 'Pendiente';
          const estadoSupabase = (tarea.estado || '').toLowerCase();
          if (estadoSupabase === 'validado' || estadoSupabase === 'finalizado') {
            estado = 'Finalizada';
          } else if (estadoSupabase === 'en_progreso' || estadoSupabase === 'en curso') {
            estado = 'En curso';
          } else if (estadoSupabase === 'pendiente') {
            estado = 'Pendiente';
          }

          // Mapear prioridad
          const prioridadMap: Record<string, 'Baja' | 'Media' | 'Alta'> = {
            'BAJA': 'Baja',
            'MEDIA': 'Media',
            'ALTA': 'Alta',
          };
          const prioridad = prioridadMap[tarea.prioridad?.toUpperCase() || 'MEDIA'] || 'Media';

          // Usar fecha_inicio_estimada si fecha_inicio no está disponible
          const fechaInicio = tarea.fecha_inicio || tarea.fecha_inicio_estimada;
          const fechaFin = tarea.fecha_fin || tarea.fecha_fin_estimada;

          return {
            id: tarea.id,
            nombre: tarea.title || 'Sin nombre',
            descripcion: tarea.descripcion || '',
            estado,
            responsable: tarea.responsable || 'Por asignar',
            etapa,
            fechaInicio: fechaInicio ? new Date(fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            fechaFin: fechaFin ? new Date(fechaFin).toISOString().split('T')[0] : '',
            prioridad,
            presupuesto: undefined,
            dependencias: [],
            // Información del elemento (si existe)
            elemento: elemento.nombre ? {
              id: elemento.id,
              nombre: elemento.nombre,
              categoria: elemento.categoria,
              subcategoria: elemento.subcategoria,
            } : undefined,
          };
        });

        setTareas(tareasFormateadas);
      } catch (error) {
        console.error('[TareasSection] Error en cargarTareas:', error);
        setTareas([]);
      } finally {
        setLoadingTareas(false);
      }
    };

    cargarTareas();
  }, [obraSeleccionada, currentUser?.orgId, supabase]);

  const handleVerPlanificacion = (obraId: string) => {
    setObraSeleccionada(obraId);
    setVistaActual('detalle-obra');
  };

  const handleVolverALista = () => {
    setVistaActual('lista-obras');
    setObraSeleccionada('');
  };

  const handleEditarGantt = () => {
    setVistaActual('editor-gantt');
  };

  const handleVolverADetalle = () => {
    setVistaActual('detalle-obra');
  };

  const obraActual = obras.find(o => o.id === obraSeleccionada);

  // Renderizar vista según el estado actual
  switch (vistaActual) {
    case 'detalle-obra':
      return (
        <div className="space-y-6">
          {/* Header principal como en Obras */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVolverALista}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="h-5 w-5 text-gray-600 rotate-180" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{obraActual?.nombre}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Cliente: {obraActual?.cliente}</span>
                    <span>Tipo: Nueva</span>
                    <span>Inicio: {new Date(obraActual?.fechaInicio || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Progreso General</div>
                  <div className="text-lg font-bold text-gray-900">{obraActual?.avance}%</div>
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${obraActual?.avance || 0}%` }}
                  ></div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Building2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs principales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'resumen', label: 'Resumen' },
                  { id: 'elementos', label: 'Elementos' },
                  { id: 'tareas', label: 'Tareas' },
                  { id: 'legajo', label: 'Legajo' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTabPrincipal(tab.id as TabPrincipal)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      tabPrincipal === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {tabPrincipal === 'resumen' && (
                <div className="space-y-6">
                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total</p>
                          <p className="text-2xl font-bold text-gray-900">{tareas.length}</p>
                        </div>
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Completadas</p>
                          <p className="text-2xl font-bold text-green-600">
                            {tareas.filter(t => t.estado === 'Finalizada' || t.estado === 'Aprobada').length}
                          </p>
                        </div>
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">En progreso</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {tareas.filter(t => t.estado === 'En curso').length}
                          </p>
                        </div>
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pendientes</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {tareas.filter(t => t.estado === 'Pendiente').length}
                          </p>
                        </div>
                        <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-yellow-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TIMELINE DE ETAPAS - NUEVO */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Timeline de Etapas de Construcción</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* ESTRUCTURA */}
                      <div 
                        className="border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        style={{backgroundColor: '#f0e0d6', borderColor: '#d4af37'}}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div 
                            className="p-3 text-white rounded-lg"
                            style={{backgroundColor: '#d4af37'}}
                          >
                            <Building2 className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold" style={{color: '#8b4513'}}>Estructura</h4>
                            <p className="text-sm" style={{color: '#5b5f6a'}}>Fundaciones, columnas, vigas</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span style={{color: '#5b5f6a'}}>Progreso</span>
                            <span className="font-bold" style={{color: '#8b4513'}}>
                              {Math.round((tareas.filter(t => t.etapa === 'Estructura' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Estructura').length, 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full rounded-full h-2" style={{backgroundColor: '#eaf0f6'}}>
                            <div 
                              className="h-2 rounded-full" 
                              style={{
                                width: `${Math.round((tareas.filter(t => t.etapa === 'Estructura' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Estructura').length, 1)) * 100)}%`,
                                backgroundColor: '#d4af37'
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs" style={{color: '#5b5f6a'}}>
                            <span>{tareas.filter(t => t.etapa === 'Estructura').length} tareas</span>
                            <span>{tareas.filter(t => t.etapa === 'Estructura' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length} completadas</span>
                          </div>
                        </div>
                      </div>

                      {/* OBRA GRIS */}
                      <div 
                        className="border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        style={{backgroundColor: '#f5f7fa', borderColor: '#dce3ea'}}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div 
                            className="p-3 text-white rounded-lg"
                            style={{backgroundColor: '#6b7280'}}
                          >
                            <Wrench className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold" style={{color: '#1B263B'}}>Obra Gris</h4>
                            <p className="text-sm" style={{color: '#5b5f6a'}}>Mampostería, instalaciones</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span style={{color: '#5b5f6a'}}>Progreso</span>
                            <span className="font-bold" style={{color: '#1B263B'}}>
                              {Math.round((tareas.filter(t => t.etapa === 'Obra gris' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Obra gris').length, 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full rounded-full h-2" style={{backgroundColor: '#eaf0f6'}}>
                            <div 
                              className="h-2 rounded-full" 
                              style={{
                                width: `${Math.round((tareas.filter(t => t.etapa === 'Obra gris' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Obra gris').length, 1)) * 100)}%`,
                                backgroundColor: '#6b7280'
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs" style={{color: '#5b5f6a'}}>
                            <span>{tareas.filter(t => t.etapa === 'Obra gris').length} tareas</span>
                            <span>{tareas.filter(t => t.etapa === 'Obra gris' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length} completadas</span>
                          </div>
                        </div>
                      </div>

                      {/* TERMINACIONES */}
                      <div 
                        className="border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        style={{backgroundColor: '#d4edda', borderColor: '#28a745'}}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div 
                            className="p-3 text-white rounded-lg"
                            style={{backgroundColor: '#28a745'}}
                          >
                            <Paintbrush className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold" style={{color: '#155724'}}>Terminaciones</h4>
                            <p className="text-sm" style={{color: '#5b5f6a'}}>Revoques, pintura, acabados</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span style={{color: '#5b5f6a'}}>Progreso</span>
                            <span className="font-bold" style={{color: '#155724'}}>
                              {Math.round((tareas.filter(t => t.etapa === 'Terminaciones' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Terminaciones').length, 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full rounded-full h-2" style={{backgroundColor: '#eaf0f6'}}>
                            <div 
                              className="h-2 rounded-full" 
                              style={{
                                width: `${Math.round((tareas.filter(t => t.etapa === 'Terminaciones' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length / Math.max(tareas.filter(t => t.etapa === 'Terminaciones').length, 1)) * 100)}%`,
                                backgroundColor: '#28a745'
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs" style={{color: '#5b5f6a'}}>
                            <span>{tareas.filter(t => t.etapa === 'Terminaciones').length} tareas</span>
                            <span>{tareas.filter(t => t.etapa === 'Terminaciones' && (t.estado === 'Finalizada' || t.estado === 'Aprobada')).length} completadas</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Interactivo */}
                  <div className="rounded-lg border p-6 h-full flex flex-col" style={{backgroundColor: '#ffffff', borderColor: '#dce3ea'}}>
                    <h3 className="text-lg font-semibold mb-6" style={{color: '#1B263B'}}>Timeline de Desarrollo</h3>
                    {loadingTareas ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">Cargando tareas...</p>
                      </div>
                    ) : tareas.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">No hay tareas para esta obra</p>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <TimelineInteractivo
                          tareas={tareas.map(tarea => ({
                            id: tarea.id,
                            nombre: tarea.nombre,
                            descripcion: tarea.descripcion,
                            fechaInicio: tarea.fechaInicio,
                            fechaFin: tarea.fechaFin,
                            progreso: tarea.estado === 'Finalizada' ? 100 : 
                                     tarea.estado === 'En curso' ? 50 : 
                                     tarea.estado === 'Aprobada' ? 100 : 0,
                            estado: tarea.estado === 'Finalizada' ? 'completada' :
                                   tarea.estado === 'En curso' ? 'en_progreso' :
                                   tarea.estado === 'Aprobada' ? 'completada' : 'pendiente',
                            lider: tarea.responsable,
                            costo: tarea.presupuesto,
                            etapa: tarea.etapa
                          }))}
                          onTareaClick={(tarea) => {
                            console.log('Tarea clickeada:', tarea);
                            // Aquí podrías abrir un modal o panel lateral
                          }}
                          onEditarPlanificacion={() => {
                            console.log('Editar planificación');
                            // Aquí podrías abrir el editor Gantt
                          }}
                          onVerDependencias={() => {
                            console.log('Ver dependencias');
                            // Aquí podrías mostrar las dependencias
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tabPrincipal === 'tareas' && (
                <div className="space-y-6">
                  {/* Header de Gestión de Tareas */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Gestión de Tareas</h2>
                    <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                      {[
                        { id: 'lista', label: 'Lista' },
                        { id: 'timeline', label: 'Timeline' },
                        { id: 'editor-visual', label: 'Editor Visual' }
                      ].map(modo => (
                        <button
                          key={modo.id}
                          onClick={() => setModoTareas(modo.id as ModoTareas)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            modoTareas === modo.id
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {modo.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contenido según el modo seleccionado */}
                  {modoTareas === 'lista' && (
                    <div className="space-y-4">
                      {/* Filtros */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
                          <div className="flex gap-2 bg-white rounded-lg p-1">
                            {['todos', 'pendiente', 'en_curso', 'finalizada', 'aprobada'].map(estado => (
                              <button
                                key={estado}
                                onClick={() => setFiltroEstado(estado)}
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                  filtroEstado === estado 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                {estado === 'todos' ? 'Todos' : 
                                 estado === 'en_curso' ? 'En curso' :
                                 estado.replace('_', ' ').charAt(0).toUpperCase() + estado.replace('_', ' ').slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Lista de tareas */}
                      <div className="space-y-4">
                        {loadingTareas ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">Cargando tareas...</p>
                          </div>
                        ) : tareas.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No hay tareas para esta obra</p>
                          </div>
                        ) : (
                          tareas.filter(tarea => 
                            filtroEstado === 'todos' || tarea.estado.toLowerCase().replace(' ', '_') === filtroEstado
                          ).map(tarea => (
                          <div key={tarea.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{tarea.nombre}</h3>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    tarea.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                    tarea.estado === 'En curso' ? 'bg-blue-100 text-blue-800' :
                                    tarea.estado === 'Finalizada' ? 'bg-green-100 text-green-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {tarea.estado}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    tarea.etapa === 'Estructura' ? 'bg-red-100 text-red-800' :
                                    tarea.etapa === 'Obra gris' ? 'bg-gray-100 text-gray-800' :
                                    tarea.etapa === 'Instalaciones' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {tarea.etapa}
                                  </span>
                                </div>
                                
                                <p className="text-gray-600 mb-3">{tarea.descripcion}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{tarea.responsable}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {new Date(tarea.fechaInicio).toLocaleDateString()} - {new Date(tarea.fechaFin).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {tarea.presupuesto && (
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4" />
                                      <span>${tarea.presupuesto.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Acciones */}
                              <div className="flex flex-wrap gap-2">
                                <button className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </button>
                                <button className="inline-flex items-center px-3 py-1.5 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Presupuesto
                                </button>
                                <button className="inline-flex items-center px-3 py-1.5 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                  <Users className="h-4 w-4 mr-1" />
                                  Asignar
                                </button>
                                {tarea.estado === 'Finalizada' && (
                                  <button className="inline-flex items-center px-3 py-1.5 text-sm text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Validar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                        )}
                      </div>
                    </div>
                  )}

                  {modoTareas === 'timeline' && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline de Tareas</h3>
                      {loadingTareas ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Cargando tareas...</p>
                        </div>
                      ) : tareas.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No hay tareas para esta obra</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tareas.map((tarea, index) => (
                          <div key={tarea.id} className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${
                                tarea.estado === 'Finalizada' ? 'bg-green-500' :
                                tarea.estado === 'En curso' ? 'bg-blue-500' :
                                'bg-gray-300'
                              }`}></div>
                              {index < tareas.length - 1 && <div className="w-px h-8 bg-gray-300 mt-2"></div>}
                            </div>
                            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{tarea.nombre}</h4>
                                  <p className="text-sm text-gray-600">{tarea.etapa}</p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  tarea.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                  tarea.estado === 'En curso' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {tarea.estado}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>
                      )}
                    </div>
                  )}

                  {modoTareas === 'editor-visual' && (
                    loadingTareas ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Cargando tareas...</p>
                      </div>
                    ) : tareas.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No hay tareas para esta obra</p>
                      </div>
                    ) : (
                      <EditorVisualTareasN8N
                        tareas={tareas.map(t => ({
                          ...t,
                          obraId: obraSeleccionada || '',
                          lider: t.responsable,
                          plantilla: '',
                          checklist: [],
                          evidencias: [],
                          estado: t.estado === 'Finalizada' || t.estado === 'Aprobada' ? 'completada' :
                                  t.estado === 'En curso' ? 'en_progreso' : 'pendiente',
                          etapa: t.etapa as 'estructura' | 'obra_gris' | 'terminaciones',
                          precedencia: t.dependencias || [],
                          duracion: 5,
                          esCritica: false,
                          holgura: 0,
                          earlyStart: 0,
                          earlyFinish: 0,
                          lateStart: 0,
                          lateFinish: 0,
                          x: 0,
                          y: 0,
                          dependencias: t.dependencias || []
                        }))}
                        etapa="estructura"
                        onActualizarTarea={() => {}}
                        onEliminarTarea={() => {}}
                        onCrearTarea={() => {}}
                      />
                    )
                  )}
                </div>
              )}

              {tabPrincipal === 'elementos' && (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Elementos</h3>
                  <p className="text-gray-600">Esta sección estará disponible próximamente</p>
                </div>
              )}

              {tabPrincipal === 'legajo' && (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Legajo</h3>
                  <p className="text-gray-600">Esta sección estará disponible próximamente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );

    case 'editor-gantt':
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVolverADetalle}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight className="h-5 w-5 text-gray-600 rotate-180" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Editor de Planificación (Gantt)</h1>
                  <p className="text-gray-600 mt-1">Arrastrá y conectá las tareas para crear el cronograma</p>
                </div>
              </div>
              
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <CheckCircle className="h-4 w-4 mr-2" />
                Guardar cambios
              </button>
            </div>
          </div>

          {/* Editor simplificado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editor Visual</h3>
            
            <div className="space-y-4">
              {tareas.map((tarea, index) => (
                <div
                  key={tarea.id}
                  className="relative p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{tarea.nombre}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>Responsable: {tarea.responsable}</span>
                        <span>Etapa: {tarea.etapa}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${
                        tarea.estado === 'Pendiente' ? 'bg-yellow-500' :
                        tarea.estado === 'En curso' ? 'bg-blue-500' :
                        tarea.estado === 'Finalizada' ? 'bg-green-500' :
                        'bg-purple-500'
                      }`}></div>
                    </div>
                  </div>
                  
                  {/* Barra de duración visual */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span>{tarea.fechaInicio}</span>
                      <span>→</span>
                      <span>{tarea.fechaFin}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          tarea.estado === 'Pendiente' ? 'bg-yellow-500' :
                          tarea.estado === 'En curso' ? 'bg-blue-500' :
                          tarea.estado === 'Finalizada' ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}
                        style={{ 
                          width: tarea.estado === 'Finalizada' || tarea.estado === 'Aprobada' ? '100%' : '60%'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default: // 'lista-obras'
      return (
        <div className="space-y-6" style={{backgroundColor: '#eaf0f6'}}>
          {/* Encabezado */}
          <div 
            className="bg-white rounded-xl shadow-sm border p-6"
            style={{borderColor: '#dce3ea'}}
          >
            <div className="flex items-center gap-3">
              <div 
                className="h-12 w-12 rounded-lg flex items-center justify-center"
                style={{backgroundColor: '#f5f7fa', border: '1px solid #dce3ea'}}
              >
                <Building2 className="h-6 w-6" style={{color: '#1B263B'}} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{color: '#10161a'}}>Gestión de Tareas</h1>
                <p className="mt-1" style={{color: '#5b5f6a'}}>Seleccioná una obra para ver su progreso y planificación</p>
              </div>
            </div>
          </div>

          {/* Grid de obras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {obrasActivas.length === 0 ? (
              <div 
                className="col-span-full bg-white rounded-xl shadow-sm border p-12 text-center"
                style={{borderColor: '#dce3ea'}}
              >
                <Building2 className="h-16 w-16 mx-auto mb-4" style={{color: '#dce3ea'}} />
                <h3 className="text-lg font-semibold mb-2" style={{color: '#1B263B'}}>No hay obras activas disponibles</h3>
                <p style={{color: '#5b5f6a'}}>Todas las obras están pausadas o finalizadas</p>
              </div>
            ) : (
              obrasActivas.map(obra => (
                <ObraResumenCard
                  key={obra.id}
                  obra={obra}
                  onVerPlanificacion={handleVerPlanificacion}
                />
              ))
            )}
          </div>

          {/* Estadísticas generales */}
          {obrasActivas.length > 0 && (
            <div 
              className="bg-white rounded-xl shadow-sm border p-6"
              style={{borderColor: '#dce3ea'}}
            >
              <h3 className="text-lg font-semibold mb-4" style={{color: '#1B263B'}}>Resumen general</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{color: '#1B263B'}}>{obrasActivas.length}</div>
                  <div className="text-sm" style={{color: '#5b5f6a'}}>Obras activas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{color: '#1B263B'}}>
                    {obrasActivas.length > 0 ? Math.round(obrasActivas.reduce((acc, obra) => acc + obra.avance, 0) / obrasActivas.length) : 0}%
                  </div>
                  <div className="text-sm" style={{color: '#5b5f6a'}}>Progreso promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{color: '#1B263B'}}>
                    {obrasActivas.reduce((acc, obra) => acc + obra.tareasTotal, 0)}
                  </div>
                  <div className="text-sm" style={{color: '#5b5f6a'}}>Total de tareas</div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
  }
}