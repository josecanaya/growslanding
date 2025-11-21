'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Bell, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { BaseCard, Button, EmptyState } from '@/components/ui/grows';
import { ListaNotificaciones, type NotificacionItem } from '@/components/cliente/mensajeria/ListaNotificaciones';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

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
        const items: NotificacionItem[] = (json.data || []).map((item: any) => ({
          id: item.id,
          titulo: item.titulo || 'Notificación',
          mensaje: item.mensaje || item.descripcion || 'Sin detalle',
          tipo: (item.tipo || 'info') as NotificacionItem['tipo'],
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

  const marcarComoLeida = async (id: string) => {
    try {
      await fetch(`/api/notificaciones/${id}/leida`, { method: 'PATCH' });
      setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)));
    } catch (error) {
      console.error('[Socio Notificaciones] Error marcando notificación como leída:', error);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-growsText">Notificaciones</h2>
          <p className="text-sm text-growsTextMuted">{totales.sinLeer} sin leer</p>
        </div>
        {totales.sinLeer > 0 && (
          <Button variant="secondary" onClick={marcarTodasComoLeidas}>
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <BaseCard title="Total" className="text-center">
          <p className="text-xl font-semibold text-growsBlue">{totales.total}</p>
        </BaseCard>
        <BaseCard title="Sin leer" className="text-center">
          <p className="text-xl font-semibold text-growsBlue">{totales.sinLeer}</p>
        </BaseCard>
        <BaseCard title="Leídas" className="text-center">
          <p className="text-xl font-semibold text-growsBlue">{totales.leidas}</p>
        </BaseCard>
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