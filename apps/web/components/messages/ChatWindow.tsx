'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';

interface Mensaje {
  id: string;
  contenido: string;
  remitente_id: string;
  destinatario_id: string;
  created_at: string;
  leido: boolean;
}

interface ChatWindowProps {
  mensajes: Mensaje[];
  loading: boolean;
  currentUserId: string;
  onMensajeLeido?: (mensajeId: string) => void;
}

/**
 * Ventana de chat que muestra los mensajes en burbujas
 */
export function ChatWindow({
  mensajes,
  loading,
  currentUserId,
  onMensajeLeido,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final (solo cuando se agregan nuevos mensajes)
  const prevMensajesLengthRef = useRef(mensajes.length);
  
  useEffect(() => {
    // Solo hacer scroll si hay nuevos mensajes
    if (mensajes.length > prevMensajesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevMensajesLengthRef.current = mensajes.length;
    }
  }, [mensajes.length]);

  // Marcar mensajes como leídos cuando se muestran (solo una vez por mensaje)
  const mensajesLeidosRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (onMensajeLeido) {
      mensajes.forEach((mensaje) => {
        if (
          mensaje.destinatario_id === currentUserId &&
          !mensaje.leido &&
          !mensajesLeidosRef.current.has(mensaje.id)
        ) {
          mensajesLeidosRef.current.add(mensaje.id);
          onMensajeLeido(mensaje.id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensajes.length, currentUserId]); // Solo cuando cambia la cantidad de mensajes

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando mensajes…
      </div>
    );
  }

  if (mensajes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Todavía no hay mensajes</p>
        <p className="text-sm text-gray-500 mt-1">
          Escribí tu primer mensaje para comenzar la conversación
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {mensajes.map((mensaje) => {
        const esPropio = mensaje.remitente_id === currentUserId;
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
              <p className="text-sm whitespace-pre-wrap break-words">{mensaje.contenido}</p>
              <span
                className={`mt-1 block text-xs ${
                  esPropio ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
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
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

