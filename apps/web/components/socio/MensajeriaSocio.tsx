'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { useRouter } from 'next/navigation';
import { USE_MOCK_DATA, MOCK_MENSAJES_CHAT } from '@/lib/mocks/socioMockData';
import { useToast } from '@/components/ui/use-toast';

type Mensaje = {
  id: string;
  contenido: string;
  remitente_tipo: 'cliente' | 'socio';
  remitente_id: string;
  destinatario_tipo: 'cliente' | 'socio';
  destinatario_id: string;
  created_at: string;
  leido: boolean;
};

export function MensajeriaSocio() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();
  const [mensajes, setMensajes] = useState<Mensaje[]>(USE_MOCK_DATA ? MOCK_MENSAJES_CHAT as Mensaje[] : []);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [socioId, setSocioId] = useState<string | null>(USE_MOCK_DATA ? 'socio-1' : null);
  const [clienteId, setClienteId] = useState<string | null>(USE_MOCK_DATA ? 'cliente-1' : null);
  const [obraId, setObraId] = useState<string | null>(null);
  const [loadingSocio, setLoadingSocio] = useState(!USE_MOCK_DATA);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const orgIdFromUser = currentUser?.orgId ?? null;
  const [orgId, setOrgId] = useState<string | null>(orgIdFromUser);

  // Obtener orgId y socio_id desde email (omitir en demo)
  useEffect(() => {
    if (USE_MOCK_DATA) {
      setLoadingSocio(false);
      return;
    }
    const obtenerOrgIdYSocioId = async () => {
      if (!currentUser?.email) {
        setLoadingSocio(false);
        return;
      }

      setLoadingSocio(true);
      try {
        const supabaseAny = supabase as any;
        
        // Si orgId es null, intentar obtenerlo desde socios
        let orgIdActual = orgId;
        if (!orgIdActual) {
          const { data: socioData, error: socioError } = await supabaseAny
            .from('socios')
            .select('id, org_id')
            .eq('email', currentUser.email)
            .maybeSingle();

          if (!socioError && socioData) {
            orgIdActual = socioData.org_id;
            setOrgId(orgIdActual);
            setSocioId(socioData.id);
            console.log('[MensajeriaSocio] OrgId y SocioId obtenidos desde socios:', { 
              orgId: orgIdActual, 
              socioId: socioData.id 
            });
          } else {
            console.error('[MensajeriaSocio] Error al obtener orgId y socioId desde socios:', socioError);
          }
        } else {
          // Si orgId existe, solo obtener socioId
          const { data, error } = await supabaseAny
            .from('socios')
            .select('id')
            .eq('email', currentUser.email)
            .eq('org_id', orgIdActual)
            .maybeSingle();

          if (!error && data) {
            console.log('[MensajeriaSocio] Socio ID obtenido:', data.id);
            setSocioId(data.id);
          } else {
            console.error('[MensajeriaSocio] Error al obtener socio_id:', error);
            console.log('[MensajeriaSocio] Datos recibidos:', data);
          }
        }
      } catch (error) {
        console.error('[MensajeriaSocio] Error al obtener orgId y socioId:', error);
      } finally {
        setLoadingSocio(false);
      }
    };

    obtenerOrgIdYSocioId();
  }, [currentUser?.email, orgIdFromUser, supabase]);
  
  // Actualizar orgId cuando cambia orgIdFromUser
  useEffect(() => {
    if (orgIdFromUser) {
      setOrgId(orgIdFromUser);
    }
  }, [orgIdFromUser]);

  // Obtener cliente_id y obra_id desde las tareas del socio
  useEffect(() => {
    const obtenerClienteYObra = async () => {
      if (!orgId || !socioId) return;

      try {
        const supabaseAny = supabase as any;
        
        // Obtener una tarea del socio para derivar obra_id y cliente
        const { data: tareaData } = await supabaseAny
          .from('tareas')
          .select('obra_id, obra:obras(id, org_id)')
          .eq('org_id', orgId)
          .or(`responsable.ilike.%${currentUser?.email || ''}%`)
          .limit(1)
          .maybeSingle();

        if (tareaData?.obra_id) {
          setObraId(tareaData.obra_id);
        }

        // El cliente técnico es el owner de la organización
        // Por ahora, usamos org_id como referencia temporal
        // En producción, debería haber una relación explícita entre socio y cliente
        // O se podría obtener desde auth.users donde role = 'CLIENTE_TECNICO' y org_id = orgId
        setClienteId(orgId); // Temporal: usar org_id como referencia del cliente técnico
      } catch (error) {
        console.error('[MensajeriaSocio] Error al obtener cliente_id y obra_id:', error);
      }
    };

    obtenerClienteYObra();
  }, [orgId, socioId, currentUser?.email, supabase]);

  const headers = useMemo(() => {
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (orgId) baseHeaders['x-organizacion-id'] = orgId;
    if (socioId) baseHeaders['x-usuario-id'] = socioId;
    return baseHeaders;
  }, [orgId, socioId]);

  const fetchMensajes = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setMensajes(MOCK_MENSAJES_CHAT as Mensaje[]);
      setLoading(false);
      return;
    }
    if (!orgId || !socioId || typeof window === 'undefined') {
      setMensajes([]);
      return;
    }
    setLoading(true);
    try {
      const url = new URL('/api/mensajes', window.location.origin);
      url.searchParams.set('socio_id', socioId);
      // obra_id fue eliminado de la tabla mensajes

      console.log('[MensajeriaSocio] Llamando endpoint:', { 
        url: url.toString(), 
        socioId, 
        obraId, 
        orgId,
        headers: Object.keys(headers)
      });

      const res = await fetch(url.toString(), { 
        headers,
        cache: 'no-store' 
      });
      
      console.log('[MensajeriaSocio] Respuesta HTTP:', { status: res.status, ok: res.ok });
      
      const json = await res.json();
      console.log('[MensajeriaSocio] Respuesta del endpoint:', { 
        success: json.success, 
        dataLength: json.data?.length || 0,
        error: json.error 
      });
      
      if (json.success) {
        const data: Mensaje[] = (json.data || []) as Mensaje[];
        console.log('[MensajeriaSocio] Mensajes recibidos:', data.length);
        console.log('[MensajeriaSocio] Primeros mensajes:', data.slice(0, 3));
        
        // Mostrar TODOS los mensajes (leídos y no leídos)
        // Filtrar solo los mensajes donde el socio es remitente o destinatario
        const mensajesFiltrados = data.filter(
          (m) => m.remitente_id === socioId || m.destinatario_id === socioId
        );
        
        console.log('[MensajeriaSocio] Mensajes filtrados (remitente o destinatario):', mensajesFiltrados.length);
        
        // Ordenar por fecha (más antiguos primero, como un chat normal)
        const mensajesOrdenados = mensajesFiltrados.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        setMensajes(mensajesOrdenados);
        
        // Opcional: Marcar como leídos los mensajes donde el socio es destinatario
        // pero solo si el usuario está viendo la página (no automáticamente)
        const mensajesNoLeidos = mensajesFiltrados.filter(
          (m) => m.destinatario_id === socioId && !m.leido
        );
        console.log('[MensajeriaSocio] Mensajes no leídos:', mensajesNoLeidos.length);
        
        // Marcar como leídos en segundo plano (sin bloquear la UI)
        if (mensajesNoLeidos.length > 0) {
          // Hacer esto de forma asíncrona sin esperar
          Promise.all(
            mensajesNoLeidos.map((mensaje) =>
              fetch(`/api/mensajes/${mensaje.id}/leido`, {
                method: 'PATCH',
                headers,
              }).catch((error) => {
                console.error('[MensajeriaSocio] Error al marcar como leído:', error);
                return null;
              })
            )
          ).then(() => {
            // Recargar mensajes después de marcarlos como leídos
            fetch(url.toString(), { 
              headers,
              cache: 'no-store' 
            })
            .then(res => res.json())
            .then(jsonActualizado => {
              if (jsonActualizado.success) {
                const dataActualizada: Mensaje[] = (jsonActualizado.data || []) as Mensaje[];
                const mensajesFiltradosActualizados = dataActualizada.filter(
                  (m) => m.remitente_id === socioId || m.destinatario_id === socioId
                );
                const mensajesOrdenadosActualizados = mensajesFiltradosActualizados.sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                setMensajes(mensajesOrdenadosActualizados);
              }
            })
            .catch(error => {
              console.error('[MensajeriaSocio] Error al recargar mensajes:', error);
            });
          });
        }
      }
    } catch (error) {
      console.error('[MensajeriaSocio] Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  }, [headers, obraId, orgId, socioId]);

  useEffect(() => {
    fetchMensajes();
  }, [fetchMensajes]);

  // Recargar mensajes cuando el componente vuelve a estar visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socioId && orgId) {
        fetchMensajes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchMensajes, socioId, orgId]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleEnviar = async () => {
    const texto = nuevoMensaje.trim();
    if (USE_MOCK_DATA) {
      if (!texto) return;
      setEnviando(true);
      const nuevo: Mensaje = {
        id: `msg-${Date.now()}`,
        contenido: texto,
        remitente_tipo: 'socio',
        remitente_id: 'socio-1',
        destinatario_tipo: 'cliente',
        destinatario_id: 'cliente-1',
        created_at: new Date().toISOString(),
        leido: false,
      };
      setMensajes((prev) => [...prev, nuevo]);
      setNuevoMensaje('');
      toast({ title: 'Mensaje enviado (demo)', description: 'Sin conexión a base de datos.' });
      setEnviando(false);
      return;
    }
    if (!orgId || !socioId || !clienteId || !texto) return;
    setEnviando(true);
    try {
      const res = await fetch('/api/mensajes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          org_id: orgId,
          remitente_id: socioId,
          remitente_tipo: 'socio',
          destinatario_id: clienteId,
          destinatario_tipo: 'cliente',
          contenido: texto,
          tipo: 'chat',
          leido: false,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNuevoMensaje('');
        await fetchMensajes();
      } else {
        console.error('[MensajeriaSocio] Error al enviar mensaje:', json.error);
        alert(`Error al enviar mensaje: ${json.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('[MensajeriaSocio] Error al enviar mensaje:', error);
      alert('Error al enviar el mensaje. Por favor, intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleEnviar();
    }
  };

  if (loadingSocio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  if (!socioId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No se encontró tu perfil</h2>
          <p className="text-gray-600 mb-4">
            No se pudo encontrar tu perfil de socio. Asegurate de estar registrado correctamente.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
              <p className="text-sm text-gray-600 mt-1">Conversá con el equipo técnico</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMensajes()}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Recargar mensajes"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Actualizar</span>
                  </>
                )}
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
          {/* Lista de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-600">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando mensajes…
              </div>
            ) : mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Todavía no hay mensajes</p>
                <p className="text-sm text-gray-500 mt-1">Escribí tu primer mensaje para comenzar la conversación</p>
              </div>
            ) : (
              mensajes.map((mensaje) => {
                const esPropio = mensaje.remitente_id === socioId;
                return (
                  <div
                    key={mensaje.id}
                    className={`flex items-start gap-3 ${esPropio ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-4 py-2 ${
                        esPropio
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{mensaje.contenido}</p>
                      <span className={`mt-1 block text-xs ${esPropio ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(mensaje.created_at).toLocaleString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input para escribir */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(event) => setNuevoMensaje(event.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribí un mensaje…"
                disabled={enviando || !clienteId}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleEnviar}
                disabled={!nuevoMensaje.trim() || enviando || !clienteId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
