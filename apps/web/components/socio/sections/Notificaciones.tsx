'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Bell } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { BaseCard, Button, EmptyState } from '@/components/ui/grows';
import { ListaNotificaciones, type NotificacionItem } from '@/components/cliente/mensajeria/ListaNotificaciones';

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
  const orgId = currentUser?.orgId ?? null;
  const socioId = currentUser?.id ?? null;

  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [cargando, setCargando] = useState(false);

  const headers = useMemo(() => {
    const base: Record<string, string> = {};
    if (orgId) base['x-organizacion-id'] = orgId;
    if (socioId) base['x-socio-id'] = socioId;
    return base;
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
  }, [fetchNotificaciones]);

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
    return { total, sinLeer, leidas };
  }, [notificaciones]);

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

      <BaseCard>
        {cargando ? (
          <div className="flex items-center justify-center py-12 text-growsTextMuted">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando notificaciones…
          </div>
        ) : notificaciones.length === 0 ? (
          <EmptyState
            title="No hay notificaciones"
            description="Te avisaremos cuando recibas novedades."
            icon={<Bell className="h-10 w-10 text-growsBlue" />}
          />
        ) : (
          <ListaNotificaciones items={notificaciones} onMarkAsRead={marcarComoLeida} />
        )}
      </BaseCard>
    </div>
  );
}