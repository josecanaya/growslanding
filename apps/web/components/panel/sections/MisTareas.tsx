'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MapPin, 
  Calendar,
  Building2,
  TrendingUp,
  Loader2
} from 'lucide-react';
import type { Database } from '@/lib/types/supabase.gen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Tarea {
  id: string;
  title: string;
  descripcion: string | null;
  estado: string;
  responsable: string | null;
  prioridad: string | null;
  avance: number | null;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;
  cuadrilla_id: string | null;
  obra_id: string;
  elemento_id: string | null;
  elemento?: {
    id: string;
    nombre: string;
    categoria: string | null;
    subcategoria: string | null;
  } | null;
  obra?: {
    id: string;
    name: string;
    address: string | null;
  } | null;
  cuadrilla?: {
    id: string;
    nombre: string;
    especialidad: string | null;
  } | null;
}

interface Socio {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  rol: string;
}

interface MisTareasProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

export function MisTareas({ user }: MisTareasProps) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [socio, setSocio] = useState<Socio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  
  const supabase = createClientComponentClient<Database>();
  const currentUser = useCurrentUser();

  // Obtener socio_id desde el usuario autenticado
  useEffect(() => {
    const cargarSocioYTareas = async () => {
      console.log('[MIS_TAREAS] Iniciando carga, currentUser:', {
        isNull: currentUser === null,
        hasId: !!currentUser?.id,
        hasOrgId: !!currentUser?.orgId,
        email: currentUser?.email,
      });

      // Esperar a que useCurrentUser termine de cargar
      // Si currentUser es null, puede ser que aún esté cargando
      if (currentUser === null) {
        // No mostrar error todavía, puede estar cargando
        console.log('[MIS_TAREAS] currentUser es null, esperando...');
        setLoading(true);
        return;
      }

      if (!currentUser.id) {
        console.warn('[MIS_TAREAS] Usuario sin id');
        setLoading(false);
        setError('No estás autenticado. Por favor, inicia sesión nuevamente.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Si no hay orgId en currentUser, intentar obtenerlo desde la tabla socios
        let orgId = currentUser.orgId;
        if (!orgId && currentUser.email) {
          console.log('[MIS_TAREAS] 🔍 Buscando orgId en tabla socios...', {
            emailBuscado: currentUser.email,
            userId: currentUser.id,
          });
          
          // PRIMERO: Buscar TODOS los socios para ver qué hay disponible
          // Intentar con campos que sabemos que existen, y manejar errores si faltan campos
          let todosLosSocios: any[] = [];
          let errorTodos: any = null;
          
          // Intentar primero con campos básicos que sabemos que existen
          const { data: dataSocios, error: errorSocios } = await supabase
            .from('socios')
            .select('id, nombre, email, org_id, rol');
          
          if (errorSocios) {
            console.warn('[MIS_TAREAS] Error al obtener todos los socios (intentando campos básicos):', errorSocios);
            // Si falla, intentar solo con campos mínimos
            const { data: dataMinimos, error: errorMinimos } = await supabase
              .from('socios')
              .select('id, nombre, org_id');
            if (!errorMinimos && dataMinimos) {
              todosLosSocios = dataMinimos;
            } else {
              errorTodos = errorMinimos;
            }
          } else {
            todosLosSocios = dataSocios || [];
          }
          
          console.log('[MIS_TAREAS] 📋 Total de socios en la base de datos:', todosLosSocios?.length || 0);
          if (todosLosSocios && todosLosSocios.length > 0) {
            console.log('[MIS_TAREAS] 📋 Socios disponibles:', todosLosSocios.map((s: any) => ({
              id: s.id,
              nombre: s.nombre,
              email: s.email || '(sin email)',
              org_id: s.org_id || '(sin org_id)',
              rol: s.rol || '(sin rol)',
            })));
          } else if (errorTodos) {
            console.error('[MIS_TAREAS] ❌ Error al obtener socios:', errorTodos);
          }
          
          // Buscar directamente por email (campo que existe en la base de datos)
          let socioPorEmail = null;
          
          // PRIMERO: Buscar por email
          const { data: dataPorEmail, error: errorPorEmail } = await supabase
            .from('socios')
            .select('id, nombre, email, org_id, rol')
            .eq('email', currentUser.email)
            .maybeSingle();
          
          console.log('[MIS_TAREAS] 🔍 Búsqueda por email:', {
            emailBuscado: currentUser.email,
            resultado: dataPorEmail ? '✅ Encontrado' : '❌ No encontrado',
            error: errorPorEmail,
          });
          
          if (dataPorEmail && !errorPorEmail) {
            socioPorEmail = dataPorEmail;
            console.log('[MIS_TAREAS] ✅ Socio encontrado por email:', socioPorEmail);
          } else {
            
            // Si aún no se encontró, buscar sin importar mayúsculas/minúsculas en el campo email
            if (!socioPorEmail && todosLosSocios && todosLosSocios.length > 0) {
              socioPorEmail = todosLosSocios.find(
                (s: any) => 
                  (s.email && s.email.toLowerCase().trim() === currentUser.email?.toLowerCase().trim())
              );
              if (socioPorEmail) {
                console.log('[MIS_TAREAS] ✅ Socio encontrado por email (case-insensitive):', socioPorEmail);
              }
            }
          }
          
          if (socioPorEmail?.org_id) {
            orgId = socioPorEmail.org_id;
            console.log('[MIS_TAREAS] ✅✅ orgId encontrado desde socios:', orgId);
          } else {
            console.error('[MIS_TAREAS] ❌❌ No se encontró socio con org_id', {
              socioEncontrado: socioPorEmail,
              emailBuscado: currentUser.email,
              userId: currentUser.id,
              totalSocios: todosLosSocios?.length || 0,
            });
          }
        }

        if (!orgId) {
          console.warn('[MIS_TAREAS] No se pudo obtener orgId');
          setLoading(false);
          setError('No tienes una organización asignada. Por favor, contacta al administrador.');
          return;
        }

        // Buscar socio por user_id (si existe el campo) o por email
        let socioData: Socio | null = null;

        // Intentar buscar por user_id primero (si el campo existe)
        const { data: socioPorUserId, error: errorUserId } = await supabase
          .from('socios')
          .select('id, nombre, email, telefono, rol, user_id, org_id')
          .eq('org_id', orgId)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        // Si hay error por campo inexistente, ignorarlo y buscar por email
        if (socioPorUserId && !errorUserId) {
          socioData = socioPorUserId;
        } else {
                    // Buscar por email (fallback si no hay user_id o campo no existe)
                    if (currentUser.email) {
                      const { data: socioPorEmail, error: errorEmail } = await supabase
                        .from('socios')
                        .select('id, nombre, email, telefono, rol, user_id, org_id')
                        .eq('org_id', orgId)
                        .eq('email', currentUser.email)
                        .maybeSingle();

            if (socioPorEmail && !errorEmail) {
              socioData = socioPorEmail;

              // Si el socio no tiene user_id vinculado, intentar vincularlo automáticamente
              if (!socioPorEmail.user_id && currentUser.id) {
                try {
                  const vincularResponse = await fetch('/api/socios/vincular-usuario', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });

                  if (vincularResponse.ok) {
                    const vincularResult = await vincularResponse.json();
                    if (vincularResult.success) {
                      console.log('[INFO] Usuario vinculado correctamente al socio');
                      // Recargar socio con user_id actualizado
                      const { data: socioActualizado } = await supabase
                        .from('socios')
                        .select('id, nombre, email, telefono, rol, user_id')
                        .eq('id', socioData.id)
                        .single();
                      if (socioActualizado) {
                        socioData = socioActualizado;
                      }
                    }
                  } else {
                    console.warn('[WARNING] No se pudo vincular user_id, continuando sin vincular');
                  }
                } catch (vincularError) {
                  console.warn('[WARNING] Error al vincular user_id:', vincularError);
                  // Continuar sin vincular, el socio puede usar el sistema de todas formas
                }
              }
            }
          }
        }

        if (!socioData) {
          setError('No se encontró tu perfil de socio. Contacta al administrador para que te invite.');
          setLoading(false);
          return;
        }

        setSocio(socioData);

        // Llamar al endpoint para obtener tareas del socio
        console.log('[MIS_TAREAS] Llamando a endpoint:', {
          socio_id: socioData.id,
          org_id: currentUser.orgId,
          socio_nombre: socioData.nombre,
          socio_email: socioData.email,
        });

        const response = await fetch(`/api/socios/${socioData.id}/tareas`, {
          headers: {
            'x-organizacion-id': orgId,
            'x-usuario-id': currentUser.id,
          },
        });

        console.log('[MIS_TAREAS] Respuesta del endpoint:', {
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          console.error('[MIS_TAREAS] Error en respuesta:', errorData);
          throw new Error(errorData.error || `Error ${response.status}`);
        }

        const result = await response.json();
        console.log('[MIS_TAREAS] Resultado:', {
          success: result.success,
          total_tareas: result.data?.length || 0,
          meta: result.meta,
          tareas_ejemplo: result.data?.slice(0, 2),
        });

        if (result.success) {
          setTareas(result.data || []);
        } else {
          throw new Error(result.error || 'Error al obtener tareas');
        }
      } catch (err) {
        console.error('[ERROR_CARGAR_TAREAS]', err);
        setError(err instanceof Error ? err.message : 'Error al cargar tus tareas');
        setTareas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarSocioYTareas();
  }, [currentUser, supabase]);

  // Filtrar tareas por estado
  const tareasFiltradas = tareas.filter(tarea => {
    if (filtroEstado === 'todas') return true;
    
    const estadoNormalizado = (tarea.estado || '').toLowerCase();
    
    switch (filtroEstado) {
      case 'pendientes':
        return estadoNormalizado === 'pendiente';
      case 'en_curso':
        return estadoNormalizado === 'en_progreso' || estadoNormalizado === 'en curso';
      case 'finalizadas':
        return estadoNormalizado === 'finalizado' || estadoNormalizado === 'validado';
      default:
        return true;
    }
  });

  // Función para obtener color del estado
  const getEstadoColor = (estado: string) => {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower === 'pendiente') return 'bg-gray-100 text-gray-800';
    if (estadoLower === 'en_progreso' || estadoLower === 'en curso') return 'bg-blue-100 text-blue-800';
    if (estadoLower === 'finalizado' || estadoLower === 'validado') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Función para obtener color de prioridad
  const getPrioridadColor = (prioridad: string | null) => {
    if (!prioridad) return 'bg-gray-100 text-gray-800';
    const prioridadUpper = prioridad.toUpperCase();
    if (prioridadUpper === 'ALTA') return 'bg-red-100 text-red-800';
    if (prioridadUpper === 'MEDIA') return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  // Función para formatear estado
  const formatearEstado = (estado: string) => {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower === 'pendiente') return 'Pendiente';
    if (estadoLower === 'en_progreso' || estadoLower === 'en curso') return 'En curso';
    if (estadoLower === 'finalizado') return 'Finalizada';
    if (estadoLower === 'validado') return 'Validada';
    return estado || 'Sin estado';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando tus tareas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-red-900">Error</h2>
          </div>
          <p className="text-red-800 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis Tareas</h1>
        {socio && (
          <p className="text-gray-600">
            Tareas asignadas a {socio.nombre} ({socio.rol})
          </p>
        )}
      </div>

      {/* Filtros y estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las tareas</SelectItem>
                <SelectItem value="pendientes">Pendientes</SelectItem>
                <SelectItem value="en_curso">En curso</SelectItem>
                <SelectItem value="finalizadas">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-600">
            Mostrando {tareasFiltradas.length} de {tareas.length} tareas
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      {tareasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {tareas.length === 0 
              ? 'Aún no tenés tareas asignadas'
              : 'No hay tareas con este filtro'}
          </h2>
          <p className="text-gray-600">
            {tareas.length === 0
              ? 'Esperá que tu líder o cliente técnico te asigne una tarea.'
              : 'Cambiá el filtro para ver más tareas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tareasFiltradas.map((tarea) => (
            <Card key={tarea.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{tarea.title || 'Sin título'}</CardTitle>
                  <Badge className={getEstadoColor(tarea.estado)}>
                    {formatearEstado(tarea.estado)}
                  </Badge>
                </div>
                {tarea.descripcion && (
                  <p className="text-sm text-gray-600 line-clamp-2">{tarea.descripcion}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Obra */}
                {tarea.obra && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{tarea.obra.name}</span>
                  </div>
                )}

                {/* Elemento */}
                {tarea.elemento && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{tarea.elemento.nombre}</span>
                    {tarea.elemento.categoria && (
                      <Badge variant="outline" className="ml-2">
                        {tarea.elemento.categoria}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Cuadrilla */}
                {tarea.cuadrilla && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Cuadrilla: {tarea.cuadrilla.nombre}</span>
                  </div>
                )}

                {/* Prioridad */}
                {tarea.prioridad && (
                  <div className="flex items-center">
                    <Badge className={getPrioridadColor(tarea.prioridad)}>
                      Prioridad: {tarea.prioridad}
                    </Badge>
                  </div>
                )}

                {/* Avance */}
                {tarea.avance !== null && tarea.avance !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-semibold">{tarea.avance}%</span>
                    </div>
                    <Progress value={tarea.avance} className="h-2" />
                  </div>
                )}

                {/* Fechas */}
                {(tarea.fecha_inicio_estimada || tarea.fecha_fin_estimada) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      {tarea.fecha_inicio_estimada && (
                        <div>Inicio: {new Date(tarea.fecha_inicio_estimada).toLocaleDateString()}</div>
                      )}
                      {tarea.fecha_fin_estimada && (
                        <div>Fin estimado: {new Date(tarea.fecha_fin_estimada).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botón de acción (opcional para futuro) */}
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // TODO: Implementar modal para actualizar avance
                      console.log('Actualizar avance de tarea:', tarea.id);
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Actualizar avance
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

