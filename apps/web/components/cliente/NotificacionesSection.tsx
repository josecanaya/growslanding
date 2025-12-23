'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Bell, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge, Button } from '@/components/ui/grows';
import { ListaNotificaciones, type NotificacionItem } from '@/components/cliente/mensajeria/ListaNotificaciones';
import { ListaInformes, type InformeItem } from '@/components/cliente/mensajeria/ListaInformes';
import { ChatPorObra } from '@/components/messages/ChatPorObra';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { playNotificationFeedback } from '@/lib/ui/notificationFeedback';

// Tipos de datos
interface NotificacionesSectionProps {
  onNavigate?: (section: string) => void;
}

export function NotificacionesSection({ onNavigate }: NotificacionesSectionProps) {
  const currentUser = useCurrentUser();
  const orgId = currentUser?.orgId ?? null;
  const usuarioId = currentUser?.id ?? null;
  const supabase = createClientComponentClient<Database>();
  const channelRef = useRef<any>(null);

  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [informes] = useState<InformeItem[]>([]);
  const [mostrarModalEmision, setMostrarModalEmision] = useState(false);
  const [tabValue, setTabValue] = useState<'notificaciones' | 'informes' | 'mensajes'>('notificaciones');
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false);
  const router = useRouter();

  const headers = useMemo(() => {
    const base: Record<string, string> = {};
    if (orgId) base['x-organizacion-id'] = orgId;
    if (usuarioId) base['x-usuario-id'] = usuarioId;
    return base;
  }, [orgId, usuarioId]);

  const fetchNotificaciones = useCallback(async () => {
    if (!orgId) {
      setNotificaciones([]);
      return;
    }

    setCargandoNotificaciones(true);
    try {
      const res = await fetch('/api/notificaciones', { headers, cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        const items: NotificacionItem[] = (json.data || []).map((item: any) => ({
          id: item.id,
          titulo: item.titulo || 'Notificación',
          mensaje: item.mensaje || item.descripcion || 'Sin detalle',
          tipo: (item.tipo || 'info') as NotificacionItem['tipo'],
          fecha: item.created_at || item.fecha || new Date().toISOString(),
          leida: Boolean(item.leida),
          destinatario: item.destinatario || 'Vos',
        }));
        setNotificaciones(items);
      }
    } catch (error) {
      // Error fetching notificaciones - handled silently with empty state
    } finally {
      setCargandoNotificaciones(false);
    }
  }, [headers, orgId]);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  // Realtime subscription para notificaciones
  useEffect(() => {
    if (!orgId || !usuarioId) return;

    const channel = supabase
      .channel(`notificaciones_${orgId}_${usuarioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `destinatario_id=eq.${usuarioId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const nuevaNotif: NotificacionItem = {
              id: payload.new.id,
              titulo: payload.new.titulo || 'Notificación',
              mensaje: payload.new.mensaje || 'Sin detalle',
              tipo: (payload.new.tipo || 'info') as NotificacionItem['tipo'],
              fecha: payload.new.created_at || new Date().toISOString(),
              leida: Boolean(payload.new.leida),
              destinatario: 'Vos',
            };
            
            // Agregar con animación slide-in
            setNotificaciones((prev) => [nuevaNotif, ...prev]);

            // Reproducir feedback si la notificación no está leída y el documento está visible
            if (!payload.new.leida && typeof document !== 'undefined' && document.visibilityState === 'visible') {
              playNotificationFeedback();
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setNotificaciones((prev) =>
              prev.map((notif) =>
                notif.id === payload.new.id
                  ? {
                      ...notif,
                      leida: Boolean(payload.new.leida),
                    }
                  : notif
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotificaciones((prev) => prev.filter((notif) => notif.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [orgId, usuarioId, supabase]);

  const marcarComoLeida = async (id: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}/leida`, {
        method: 'PATCH',
        headers: {
          'x-organizacion-id': orgId || '',
          'x-usuario-id': usuarioId || '',
        },
      });
      
      const json = await response.json();
      if (json.success && json.data) {
        // Actualizar con la lista del servidor
        const items: NotificacionItem[] = (json.data || []).map((item: any) => ({
          id: item.id,
          titulo: item.titulo || 'Notificación',
          mensaje: item.mensaje || item.descripcion || 'Sin detalle',
          tipo: (item.tipo || 'info') as NotificacionItem['tipo'],
          fecha: item.created_at || item.fecha || new Date().toISOString(),
          leida: Boolean(item.leida),
          destinatario: item.destinatario || 'Vos',
        }));
        setNotificaciones(items);
      } else {
        // Fallback: actualizar localmente
        setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)));
      }
    } catch (error) {
      // Fallback: actualizar localmente
      setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)));
    }
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  // Emitir custom event cuando cambia el contador de no leídas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('grows:notificaciones-unread-count', {
        detail: {
          rol: 'cliente',
          count: notificacionesNoLeidas,
        },
      }),
    );
  }, [notificacionesNoLeidas]);

  const abrirModalInforme = () => {
    setMostrarModalEmision(true);
  };

  return (
    <section className="min-h-screen bg-grows-gray px-10 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-growsText">Mensajería e Informes</h2>
          <p className="text-sm text-growsTextMuted">Emisión de informes y comunicación con obreros</p>
        </div>
        <Button onClick={abrirModalInforme} icon={<Send className="h-4 w-4" />}>
          Emitir informe
        </Button>
      </div>

      <Tabs value={tabValue} onValueChange={(value) => setTabValue(value as typeof tabValue)}>
        <TabsList className="flex gap-4 border-b border-growsBorder bg-transparent p-0">
          <TabsTrigger value="notificaciones" className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm font-medium text-growsTextMuted data-[state=active]:border-growsBlue data-[state=active]:text-growsBlue">
            <span className="flex items-center gap-2">
              Notificaciones
              {notificacionesNoLeidas > 0 && (
                <Badge variant="info" size="sm" className="bg-growsBlue/10 text-growsBlue">
                  {notificacionesNoLeidas}
                </Badge>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="informes" className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm font-medium text-growsTextMuted data-[state=active]:border-growsBlue data-[state=active]:text-growsBlue">
            Informes
          </TabsTrigger>
          <TabsTrigger value="mensajes" className="rounded-none border-b-2 border-transparent px-0 pb-3 text-sm font-medium text-growsTextMuted data-[state=active]:border-growsBlue data-[state=active]:text-growsBlue">
            Mensajes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notificaciones" className="mt-6">
          {cargandoNotificaciones ? (
            <div className="flex items-center justify-center py-12 text-growsTextMuted">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-growsBlue border-t-transparent" />
              Cargando notificaciones…
            </div>
          ) : (
            <ListaNotificaciones items={notificaciones} onMarkAsRead={marcarComoLeida} />
          )}
        </TabsContent>

        <TabsContent value="informes" className="mt-6">
          <ListaInformes items={informes} />
        </TabsContent>

        <TabsContent value="mensajes" className="mt-6">
          <ChatPorObra role="cliente" />
        </TabsContent>
      </Tabs>

      {mostrarModalEmision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-grows-lg bg-growsSurface p-6 shadow-grows-lg">
            <h3 className="text-lg font-semibold text-growsBlue">Emitir informe</h3>
            <p className="mt-2 text-sm text-growsTextMuted">Este modal se integrará con el flujo de informes.</p>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setMostrarModalEmision(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
