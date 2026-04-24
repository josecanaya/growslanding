'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Loader2, Bell, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { BaseCard, Button, EmptyState } from '@/components/ui/grows';
import { ListaNotificaciones, type NotificacionItem } from '@/components/cliente/mensajeria/ListaNotificaciones';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { playNotificationFeedback } from '@/lib/ui/notificationFeedback';

interface NotificacionesProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

export function Notificaciones({ user }: NotificacionesProps) {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const orgIdFromUser = currentUser?.orgId ?? null;
  const [orgId, setOrgId] = useState<string | null>(orgIdFromUser);
  const [socioId, setSocioId] = useState<string | null>(null);
  const [loadingSocioId, setLoadingSocioId] = useState(true);
  const channelRef = useRef<any>(null);

  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Obtener orgId y socio_id desde email si orgId es null
  useEffect(() => {
    const obtenerOrgIdYSocioId = async () => {
      if (!currentUser?.email) {
        setLoadingSocioId(false);
        return;
      }

      setLoadingSocioId(true);
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
            console.log('[Notificaciones] OrgId y SocioId obtenidos desde socios:', { 
              orgId: orgIdActual, 
              socioId: socioData.id 
            });
          } else {
            console.error('[Notificaciones] Error al obtener orgId y socioId desde socios:', socioError);
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
            console.log('[Notificaciones] Socio ID obtenido:', data.id);
            setSocioId(data.id);
          } else {
            console.error('[Notificaciones] Error al obtener socio_id:', error);
            console.log('[Notificaciones] Datos recibidos:', data);
          }
        }
      } catch (error) {
        console.error('[Notificaciones] Error al obtener orgId y socioId:', error);
      } finally {
        setLoadingSocioId(false);
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

  const headers = useMemo(() => {
    const base: Record<string, string> = {};
    if (orgId) base['x-organizacion-id'] = orgId;
    if (socioId) base['x-socio-id'] = socioId;
    if (socioId) base['x-usuario-id'] = socioId;
    return base;
  }, [orgId, socioId]);

  // Cargar mensajes no leídos
  const fetchMensajesNoLeidos = useCallback(async () => {
    if (!orgId || !socioId || typeof window === 'undefined') {
      console.log('[Notificaciones] No se pueden cargar mensajes:', { orgId, socioId, hasWindow: typeof window !== 'undefined' });
      setMensajesNoLeidos(0);
      return;
    }

    try {
      const url = new URL('/api/mensajes', window.location.origin);
      url.searchParams.set('socio_id', socioId);

      console.log('[Notificaciones] Cargando mensajes:', { url: url.toString(), socioId, orgId });

      const res = await fetch(url.toString(), { 
        headers: { 'x-organizacion-id': orgId },
        cache: 'no-store' 
      });
      
      console.log('[Notificaciones] Respuesta del endpoint:', { status: res.status, ok: res.ok });
      
      const json = await res.json();
      console.log('[Notificaciones] Datos recibidos:', { success: json.success, dataLength: json.data?.length || 0 });
      
      if (json.success) {
        const mensajes = (json.data || []) as Array<{ destinatario_id: string; leido: boolean }>;
        console.log('[Notificaciones] Mensajes recibidos:', mensajes.length);
        console.log('[Notificaciones] Primeros mensajes:', mensajes.slice(0, 3));
        
        const noLeidos = mensajes.filter(
          (m) => m.destinatario_id === socioId && !m.leido
        );
        console.log('[Notificaciones] Mensajes no leídos:', noLeidos.length);
        setMensajesNoLeidos(noLeidos.length);
      } else {
        console.error('[Notificaciones] Error en la respuesta:', json.error);
      }
    } catch (error) {
      console.error('[Notificaciones] Error al cargar mensajes no leídos:', error);
    }
  }, [orgId, socioId]);

  const fetchNotificaciones = useCallback(async () => {
    if (!orgId || !socioId) {
      setNotificaciones([]);
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('/api/notificaciones', { headers, cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        // Función para normalizar el tipo a uno de los valores válidos
        const normalizarTipo = (tipo: any): NotificacionItem['tipo'] => {
          const tipoStr = String(tipo || '').toLowerCase();
          if (tipoStr === 'success' || tipoStr === 'exito' || tipoStr === 'aprobado') {
            return 'success';
          }
          if (tipoStr === 'warning' || tipoStr === 'advertencia' || tipoStr === 'rechazado') {
            return 'warning';
          }
          if (tipoStr === 'error' || tipoStr === 'error' || tipoStr === 'fallo') {
            return 'error';
          }
          // Por defecto, info
          return 'info';
        };

        const items: NotificacionItem[] = (json.data || []).map((item: any) => ({
          id: item.id,
          titulo: item.titulo || 'Notificación',
          mensaje: item.mensaje || item.descripcion || 'Sin detalle',
          tipo: normalizarTipo(item.tipo),
          fecha: item.created_at || item.fecha || new Date().toISOString(),
          leida: Boolean(item.leida),
          destinatario: user.name,
        }));
        setNotificaciones(items);
      }
    } catch (error) {
      console.error('[Socio Notificaciones] Error fetching notificaciones:', error);
    } finally {
      setCargando(false);
    }
  }, [headers, orgId, socioId, user.name]);

  useEffect(() => {
    fetchNotificaciones();
    fetchMensajesNoLeidos();
  }, [fetchNotificaciones, fetchMensajesNoLeidos]);

  // Realtime subscription para notificaciones
  useEffect(() => {
    if (!orgId || !socioId) return;

    const channel = supabase
      .channel(`notificaciones_${orgId}_${socioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `destinatario_id=eq.${socioId}`,
        },
        (payload) => {
          console.log('[Socio Notificaciones] Realtime event:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const nuevaNotif: NotificacionItem = {
              id: payload.new.id,
              titulo: payload.new.titulo || 'Notificación',
              mensaje: payload.new.mensaje || 'Sin detalle',
              tipo: (payload.new.tipo === 'presupuesto_aprobado' ? 'success' : 'info') as NotificacionItem['tipo'],
              fecha: payload.new.created_at || new Date().toISOString(),
              leida: Boolean(payload.new.leida),
              destinatario: user.name,
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
  }, [orgId, socioId, supabase, user.name]);

  const marcarComoLeida = async (id: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}/leida`, {
        method: 'PATCH',
        headers: {
          'x-organizacion-id': orgId || '',
          'x-usuario-id': socioId || '',
        },
      });
      
      const json = await response.json();
      if (json.success && json.data) {
        // Actualizar con la lista del servidor
        const items: NotificacionItem[] = (json.data || []).map((item: any) => ({
          id: item.id,
          titulo: item.titulo || 'Notificación',
          mensaje: item.mensaje || item.descripcion || 'Sin detalle',
          tipo: (item.tipo === 'presupuesto_aprobado' ? 'success' : 'info') as NotificacionItem['tipo'],
          fecha: item.created_at || item.fecha || new Date().toISOString(),
          leida: Boolean(item.leida),
          destinatario: user.name,
        }));
        setNotificaciones(items);
      } else {
        // Fallback: actualizar localmente
        setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)));
      }
    } catch (error) {
      console.error('[Socio Notificaciones] Error marcando notificación como leída:', error);
      // Fallback: actualizar localmente
      setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)));
    }
  };

  const marcarTodasComoLeidas = async () => {
    const pendientes = notificaciones.filter((n) => !n.leida);
    await Promise.all(pendientes.map((notif) => fetch(`/api/notificaciones/${notif.id}/leida`, { method: 'PATCH' })));
    setNotificaciones((prev) => prev.map((notif) => ({ ...notif, leida: true })));
  };

  const totales = useMemo(() => {
    const total = notificaciones.length;
    const sinLeer = notificaciones.filter((n) => !n.leida).length;
    const leidas = total - sinLeer;
    // Incluir mensajes no leídos en el total
    const totalConMensajes = total + mensajesNoLeidos;
    const sinLeerConMensajes = sinLeer + mensajesNoLeidos;
    return { 
      total: totalConMensajes, 
      sinLeer: sinLeerConMensajes, 
      leidas,
      mensajesNoLeidos 
    };
  }, [notificaciones, mensajesNoLeidos]);

  // Emitir custom event cuando cambia el contador de no leídas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('grows:notificaciones-unread-count', {
        detail: {
          rol: 'socio',
          count: totales.sinLeer,
        },
      }),
    );
  }, [totales.sinLeer]);

  return (
    <div className="space-y-5 font-stitch-body">
      <div className="border-b border-stitch-surface-container-high pb-4">
        <h1 className="font-stitch-headline text-xl font-extrabold tracking-tight text-stitch-primary">
          Notificaciones
        </h1>
        <p className="mt-0.5 text-sm text-stitch-on-surface/65">{totales.sinLeer} sin leer</p>
        {totales.sinLeer > 0 && (
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={marcarTodasComoLeidas}>
              Marcar todas como leídas
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-stitch-surface-container bg-stitch-surface-container-lowest p-3 text-center shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stitch-outline">Total</p>
          <p className="mt-1 font-stitch-headline text-lg font-bold text-stitch-primary">{totales.total}</p>
        </div>
        <div className="rounded-lg border border-stitch-surface-container bg-stitch-surface-container-lowest p-3 text-center shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stitch-outline">Sin leer</p>
          <p className="mt-1 font-stitch-headline text-lg font-bold text-stitch-error">{totales.sinLeer}</p>
        </div>
        <div className="rounded-lg border border-stitch-surface-container bg-stitch-surface-container-lowest p-3 text-center shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stitch-outline">Leídas</p>
          <p className="mt-1 font-stitch-headline text-lg font-bold text-stitch-tertiary">{totales.leidas}</p>
        </div>
      </div>

      {/* Sección de Mensajes */}
      {mensajesNoLeidos > 0 && (
        <BaseCard>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-growsText">
                  {mensajesNoLeidos} {mensajesNoLeidos === 1 ? 'mensaje sin leer' : 'mensajes sin leer'}
                </p>
                <p className="text-sm text-growsTextMuted">Tenés mensajes nuevos del equipo técnico</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/socio/mensajes')}
              variant="primary"
            >
              Ver mensajes
            </Button>
          </div>
        </BaseCard>
      )}

      <BaseCard>
        {loadingSocioId || cargando ? (
          <div className="flex items-center justify-center py-12 text-growsTextMuted">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando notificaciones…
          </div>
        ) : notificaciones.length === 0 && mensajesNoLeidos === 0 ? (
          <EmptyState
            title="No hay notificaciones"
            description="Te avisaremos cuando recibas novedades."
            icon={<Bell className="h-10 w-10 text-growsBlue" />}
          />
        ) : (
          <>
            {notificaciones.length > 0 && (
              <ListaNotificaciones items={notificaciones} onMarkAsRead={marcarComoLeida} />
            )}
          </>
        )}
      </BaseCard>
    </div>
  );
}
