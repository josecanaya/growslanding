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

        // Si no se encontró el socio por métodos tradicionales, buscar por nombre o contacto
        if (!socioData) {
          console.log('[MIS_TAREAS] No se encontró socio por user_id ni email, buscando por nombre/contacto...');
          
          // Buscar por nombre (coincidencia parcial)
          if (currentUser.name) {
            const { data: sociosPorNombre, error: errorNombre } = await supabase
              .from('socios')
              .select('id, nombre, email, telefono, rol, user_id, org_id')
              .eq('org_id', orgId)
              .ilike('nombre', `%${currentUser.name}%`)
              .limit(1);

            if (sociosPorNombre && sociosPorNombre.length > 0 && !errorNombre) {
              socioData = sociosPorNombre[0];
              console.log('[MIS_TAREAS] ✅ Socio encontrado por nombre:', socioData);
            }
          }

          // Si aún no se encontró, buscar por contacto (email o teléfono en campo contacto)
          if (!socioData && currentUser.email) {
            const { data: sociosPorContacto, error: errorContacto } = await supabase
              .from('socios')
              .select('id, nombre, email, telefono, rol, user_id, org_id, contacto')
              .eq('org_id', orgId)
              .eq('contacto', currentUser.email)
              .limit(1);

            if (sociosPorContacto && sociosPorContacto.length > 0 && !errorContacto) {
              socioData = sociosPorContacto[0];
              console.log('[MIS_TAREAS] ✅ Socio encontrado por contacto:', socioData);
            }
          }
        }

        // Si aún no se encontró el socio, intentar buscar tareas directamente para validar que el usuario tiene tareas
        // Si tiene tareas, significa que hay un socio (aunque no lo encontremos por los métodos tradicionales)
        if (!socioData) {
          console.log('[MIS_TAREAS] No se encontró socio, pero intentando buscar tareas directamente para validar...');
          
          // Buscar tareas por responsable (email o nombre del usuario)
          const condicionesTarea: string[] = [];
          if (currentUser.email) {
            condicionesTarea.push(`responsable.eq.${currentUser.email}`);
          }
          if (currentUser.name) {
            const nombrePrimeraPalabra = currentUser.name.split(' ')[0];
            condicionesTarea.push(`responsable.ilike.%${nombrePrimeraPalabra}%`);
          }

          if (condicionesTarea.length > 0) {
            const { data: tareasDirectas, error: errorTareas } = await supabase
              .from('tareas')
              .select('id, title, cuadrilla_id, responsable')
              .eq('org_id', orgId)
              .or(condicionesTarea.join(','))
              .limit(5);

            if (tareasDirectas && tareasDirectas.length > 0 && !errorTareas) {
              console.log('[MIS_TAREAS] ✅ Se encontraron tareas asignadas directamente:', {
                cantidad: tareasDirectas.length,
                tareas: tareasDirectas.map(t => ({ id: t.id, title: t.title, responsable: t.responsable })),
              });
              
              // Si tiene tareas, buscar el socio por cuadrilla o por responsable
              // Buscar en cuadrillas donde el encargado coincide con el usuario
              const { data: cuadrillas, error: errorCuadrillas } = await supabase
                .from('cuadrillas')
                .select('id, nombre, encargado, email_encargado')
                .eq('org_id', orgId);
              
              if (cuadrillas && !errorCuadrillas) {
                // Buscar cuadrilla donde el encargado coincide
                const cuadrillaCoincidente = cuadrillas.find(c => {
                  const encargadoLower = (c.encargado || '').toLowerCase();
                  const emailEncargado = (c.email_encargado || '').toLowerCase();
                  const usuarioEmail = (currentUser.email || '').toLowerCase();
                  const usuarioNombre = (currentUser.name || '').toLowerCase();
                  
                  return (
                    emailEncargado === usuarioEmail ||
                    encargadoLower.includes(usuarioNombre) ||
                    usuarioNombre.includes(encargadoLower)
                  );
                });

                if (cuadrillaCoincidente) {
                  // Buscar socio por cuadrilla usando cuadrilla_socios
                  const { data: relacionesSocio, error: errorRelaciones } = await supabase
                    .from('cuadrilla_socios')
                    .select('socio_id')
                    .eq('cuadrilla_id', cuadrillaCoincidente.id)
                    .eq('activo', true)
                    .limit(1);

                  if (relacionesSocio && relacionesSocio.length > 0 && !errorRelaciones) {
                    const socioIdEncontrado = relacionesSocio[0].socio_id;
                    const { data: socioEncontrado } = await supabase
                      .from('socios')
                      .select('id, nombre, email, telefono, rol, user_id, org_id')
                      .eq('id', socioIdEncontrado)
                      .eq('org_id', orgId)
                      .maybeSingle();

                    if (socioEncontrado) {
                      socioData = socioEncontrado;
                      console.log('[MIS_TAREAS] ✅ Socio encontrado por cuadrilla y relación:', socioData);
                    }
                  }
                }
              }

              // Si aún no encontramos el socio pero SÍ tiene tareas, buscar todos los socios de la org
              // y encontrar el que más probablemente sea el usuario (por nombre o email)
              if (!socioData) {
                const { data: todosLosSociosOrg, error: errorTodosSocios } = await supabase
                  .from('socios')
                  .select('id, nombre, email, telefono, rol, user_id, org_id')
                  .eq('org_id', orgId);

                if (todosLosSociosOrg && !errorTodosSocios) {
                  // Buscar el socio más probable basándose en nombre o email
                  const socioMasProbable = todosLosSociosOrg.find(s => {
                    const nombreSocio = (s.nombre || '').toLowerCase();
                    const emailSocio = (s.email || '').toLowerCase();
                    const usuarioNombre = (currentUser.name || '').toLowerCase();
                    const usuarioEmail = (currentUser.email || '').toLowerCase();
                    
                    // Coincidencia exacta de email
                    if (emailSocio && usuarioEmail && emailSocio === usuarioEmail) {
                      return true;
                    }
                    
                    // Coincidencia de primera palabra del nombre
                    if (nombreSocio && usuarioNombre) {
                      const primeraPalabraSocio = nombreSocio.split(' ')[0];
                      const primeraPalabraUsuario = usuarioNombre.split(' ')[0];
                      if (primeraPalabraSocio === primeraPalabraUsuario) {
                        return true;
                      }
                    }
                    
                    // Coincidencia parcial del nombre
                    if (nombreSocio && usuarioNombre) {
                      return nombreSocio.includes(usuarioNombre) || usuarioNombre.includes(nombreSocio);
                    }
                    
                    return false;
                  });

                  if (socioMasProbable) {
                    socioData = socioMasProbable;
                    console.log('[MIS_TAREAS] ✅ Socio encontrado por búsqueda probabilística:', socioData);
                  }
                }
              }
            }
          }
        }

        // Si aún no se encontró el socio PERO tenemos orgId, intentar obtener las tareas directamente
        // Esto puede funcionar si el usuario tiene tareas asignadas aunque no encontremos su perfil de socio
        if (!socioData) {
          console.warn('[MIS_TAREAS] ⚠️ No se encontró perfil de socio, pero intentando obtener tareas directamente...');
          
          // Intentar buscar tareas por responsable directamente
          const condicionesTarea: string[] = [];
          if (currentUser.email) {
            condicionesTarea.push(`responsable.eq.${currentUser.email}`);
          }
          if (currentUser.name) {
            const nombrePrimeraPalabra = currentUser.name.split(' ')[0];
            condicionesTarea.push(`responsable.ilike.%${nombrePrimeraPalabra}%`);
          }

          if (condicionesTarea.length > 0) {
            const { data: tareasDirectas, error: errorTareas } = await supabase
              .from('tareas')
              .select(`
                id,
                title,
                descripcion,
                estado,
                responsable,
                prioridad,
                avance,
                fecha_inicio_estimada,
                fecha_fin_estimada,
                fecha_inicio_real,
                fecha_fin_real,
                cuadrilla_id,
                obra_id,
                elemento_id,
                elemento:elementos(
                  id,
                  nombre,
                  categoria,
                  subcategoria
                ),
                obra:obras(
                  id,
                  name,
                  address
                ),
                cuadrilla:cuadrillas(
                  id,
                  nombre,
                  especialidad
                )
              `)
              .eq('org_id', orgId)
              .or(condicionesTarea.join(','))
              .order('created_at', { ascending: false });

            if (tareasDirectas && tareasDirectas.length > 0 && !errorTareas) {
              console.log('[MIS_TAREAS] ✅ Tareas encontradas directamente sin perfil de socio:', {
                cantidad: tareasDirectas.length,
              });
              
              // Si tiene tareas, crear un perfil de socio temporal o usar el primero de la org
              // Por ahora, crear un objeto socio temporal basado en el usuario actual
              socioData = {
                id: `temp-${currentUser.id}`,
                nombre: currentUser.name || currentUser.email || 'Socio',
                email: currentUser.email,
                telefono: null,
                rol: 'constructor',
              };
              
              setTareas(tareasDirectas);
              setSocio(socioData);
              setLoading(false);
              return; // Salir temprano ya que tenemos las tareas
            }
          }
        }

        // Si después de todos los intentos no encontramos el socio, mostrar error
        if (!socioData) {
          setError('No se encontró tu perfil de socio. Contacta al administrador para que te invite.');
          setLoading(false);
          return;
        }

        setSocio(socioData);

        // Llamar al endpoint para obtener tareas del socio
        console.log('[MIS_TAREAS] Llamando a endpoint:', {
          socio_id: socioData.id,
          org_id: orgId,
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
          
          // Si el error es 404 (socio no encontrado) pero tenemos tareas asignadas, 
          // intentar obtener tareas directamente como fallback
          if (response.status === 404) {
            console.log('[MIS_TAREAS] Endpoint retornó 404, pero intentando obtener tareas directamente...');
            
            const condicionesTarea: string[] = [];
            if (socioData.email) {
              condicionesTarea.push(`responsable.eq.${socioData.email}`);
            }
            if (socioData.nombre) {
              const nombrePrimeraPalabra = socioData.nombre.split(' ')[0];
              condicionesTarea.push(`responsable.ilike.%${nombrePrimeraPalabra}%`);
            }

            if (condicionesTarea.length > 0) {
              const { data: tareasFallback, error: errorFallback } = await supabase
                .from('tareas')
                .select(`
                  id,
                  title,
                  descripcion,
                  estado,
                  responsable,
                  prioridad,
                  avance,
                  fecha_inicio_estimada,
                  fecha_fin_estimada,
                  fecha_inicio_real,
                  fecha_fin_real,
                  cuadrilla_id,
                  obra_id,
                  elemento_id,
                  elemento:elementos(
                    id,
                    nombre,
                    categoria,
                    subcategoria
                  ),
                  obra:obras(
                    id,
                    name,
                    address
                  ),
                  cuadrilla:cuadrillas(
                    id,
                    nombre,
                    especialidad
                  )
                `)
                .eq('org_id', orgId)
                .or(condicionesTarea.join(','))
                .order('created_at', { ascending: false });

              if (tareasFallback && tareasFallback.length > 0 && !errorFallback) {
                console.log('[MIS_TAREAS] ✅ Tareas obtenidas directamente como fallback:', {
                  cantidad: tareasFallback.length,
                });
                setTareas(tareasFallback);
                setLoading(false);
                return; // Salir exitosamente
              }
            }
          }
          
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
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-red-900">Error</h2>
          </div>
          <p className="text-red-800 mb-4">{error}</p>
          {error.includes('perfil de socio') && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-red-300">
              <p className="text-sm text-red-700 mb-2">
                <strong>¿Qué significa esto?</strong>
              </p>
              <p className="text-sm text-red-600">
                Tu usuario no tiene un perfil de socio creado en el sistema. 
                Esto puede suceder si:
              </p>
              <ul className="text-sm text-red-600 mt-2 ml-4 list-disc">
                <li>No has sido invitado como socio constructor aún</li>
                <li>Tu perfil de socio no está vinculado a tu cuenta de usuario</li>
                <li>Tu organización no está configurada correctamente</li>
              </ul>
              <p className="text-sm text-red-700 mt-3">
                <strong>Acción requerida:</strong> Contactá al administrador de tu organización para que te invite como socio constructor.
              </p>
            </div>
          )}
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
            <Card key={tarea.id} className="hover:shadow-md transition-shadow !bg-white" style={{ backgroundColor: 'white' }}>
              <CardHeader className="!bg-white" style={{ backgroundColor: 'white' }}>
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
              <CardContent className="space-y-4 !bg-white" style={{ backgroundColor: 'white' }}>
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

