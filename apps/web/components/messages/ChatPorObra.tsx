'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { SelectObra } from './SelectObra';
import { SelectUsuario } from './SelectUsuario';
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';

interface Mensaje {
  id: string;
  contenido: string;
  remitente_id: string;
  destinatario_id: string;
  obra_id?: string | null;
  created_at: string;
  leido: boolean;
}

interface ChatPorObraProps {
  role: 'cliente' | 'socio';
}

/**
 * Componente principal de chat por obra y usuario
 * Integra SelectObra, SelectUsuario, ChatWindow y ChatInput
 */
export function ChatPorObra({ role }: ChatPorObraProps) {
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [obraId, setObraId] = useState<string | null>(null);
  const [destinatarioId, setDestinatarioId] = useState<string | null>(null);
  const [destinatarioTipo, setDestinatarioTipo] = useState<'cliente' | 'socio' | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Obtener currentUserId según el rol
  useEffect(() => {
    const obtenerUserId = async () => {
      if (!currentUser?.orgId) return;

      try {
        const supabaseAny = supabase as any;

        if (role === 'socio') {
          // Para socio: obtener socio_id
          const { data: socioData } = await supabaseAny
            .from('socios')
            .select('id')
            .eq('org_id', currentUser.orgId)
            .or(`email.eq.${currentUser.email},user_id.eq.${currentUser.id}`)
            .maybeSingle();

          if (socioData?.id) {
            setCurrentUserId(socioData.id);
          }
        } else {
          // Para cliente: usar org_id como referencia
          setCurrentUserId(currentUser.orgId);
        }
      } catch (error) {
        console.error('[ChatPorObra] Error obteniendo userId:', error);
      }
    };

    obtenerUserId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.orgId, currentUser?.email, currentUser?.id, role]);

  // Cargar mensajes cuando cambian obraId o destinatarioId
  const fetchMensajes = useCallback(async () => {
    if (!obraId || !destinatarioId || !currentUserId || !currentUser?.orgId) {
      setMensajes([]);
      return;
    }

    setLoading(true);
    try {
      const url = new URL('/api/mensajes', window.location.origin);
      url.searchParams.set('org_id', currentUser.orgId);
      url.searchParams.set('usuario_id', currentUserId);
      url.searchParams.set('obra_id', obraId);
      url.searchParams.set('destinatario_id', destinatarioId);

      const res = await fetch(url.toString(), {
        headers: {
          'x-organizacion-id': currentUser.orgId,
          'x-usuario-id': currentUserId,
        },
        cache: 'no-store',
      });

      const json = await res.json();
      if (json.success) {
        const data: Mensaje[] = (json.data || []) as Mensaje[];
        // Ordenar por fecha (más antiguos primero)
        const mensajesOrdenados = data.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMensajes(mensajesOrdenados);
      }
    } catch (error) {
      console.error('[ChatPorObra] Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  }, [obraId, destinatarioId, currentUserId, currentUser?.orgId]);

  useEffect(() => {
    // Solo cargar mensajes si tenemos todos los datos necesarios
    if (obraId && destinatarioId && currentUserId && currentUser?.orgId) {
      fetchMensajes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId, destinatarioId, currentUserId, currentUser?.orgId]);

  // Marcar mensaje como leído
  const handleMensajeLeido = async (mensajeId: string) => {
    try {
      await fetch(`/api/mensajes/${mensajeId}/leido`, {
        method: 'PATCH',
        headers: {
          'x-organizacion-id': currentUser?.orgId || '',
        },
      });
    } catch (error) {
      console.error('[ChatPorObra] Error marcando mensaje como leído:', error);
    }
  };

  // Enviar mensaje
  const handleEnviar = async (texto: string) => {
    if (!obraId || !destinatarioId || !currentUserId || !currentUser?.orgId) return;

    try {
      const res = await fetch('/api/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizacion-id': currentUser.orgId,
          'x-usuario-id': currentUserId,
        },
        body: JSON.stringify({
          org_id: currentUser.orgId,
          obra_id: obraId,
          remitente_id: currentUserId,
          remitente_tipo: role,
          destinatario_id: destinatarioId,
          destinatario_tipo: destinatarioTipo,
          contenido: texto,
          tipo: 'chat',
          leido: false,
        }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchMensajes();
        // TODO: Crear notificación para el destinatario
      } else {
        throw new Error(json.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('[ChatPorObra] Error enviando mensaje:', error);
      throw error;
    }
  };

  // Resetear destinatario cuando cambia la obra
  useEffect(() => {
    setDestinatarioId(null);
    setDestinatarioTipo(null);
    setMensajes([]);
  }, [obraId]);

  return (
    <div className="w-full px-4 py-6 space-y-4">
      {/* Selectores */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Elegir obra
          </label>
          <SelectObra value={obraId} onValueChange={setObraId} role={role} />
        </div>

        {obraId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Elegir usuario
            </label>
            <SelectUsuario
              obraId={obraId}
              value={destinatarioId}
              onValueChange={(id, tipo) => {
                setDestinatarioId(id);
                setDestinatarioTipo(tipo);
              }}
              role={role}
              currentUserId={currentUserId || ''}
            />
          </div>
        )}
      </div>

      {/* Chat */}
      {obraId && destinatarioId && currentUserId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
          <ChatWindow
            mensajes={mensajes}
            loading={loading}
            currentUserId={currentUserId}
            onMensajeLeido={handleMensajeLeido}
          />
          <ChatInput onEnviar={handleEnviar} disabled={loading} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">
            {!obraId
              ? 'Elegí una obra para comenzar'
              : !destinatarioId
              ? 'Elegí un usuario para comenzar la conversación'
              : 'Cargando...'}
          </p>
        </div>
      )}
    </div>
  );
}

