'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/subscriptions';
import { canUseFeature, usePlanGate } from '@/lib/permissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge, Button } from '@/components/ui/grows';
import { ListaNotificaciones, type NotificacionItem } from '@/components/cliente/mensajeria/ListaNotificaciones';
import { ListaInformes, type InformeItem } from '@/components/cliente/mensajeria/ListaInformes';
import { MensajeriaDirecta } from '@/components/cliente/mensajeria/MensajeriaDirecta';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

// Tipos de datos
interface NotificacionesSectionProps {
  onNavigate?: (section: string) => void;
}

const informesMock: InformeItem[] = [
  {
    id: '1',
    titulo: 'Informe de progreso - Semana 1',
    tipo: 'progreso',
    fecha: '2024-01-25',
    obra: 'Casa Residencial Norte',
    estado: 'enviado'
  },
  {
    id: '2',
    titulo: 'Reporte de problema - Instalación',
    tipo: 'problema',
    fecha: '2024-01-24',
    obra: 'Edificio Comercial Centro',
    estado: 'pendiente'
  },
  {
    id: '3',
    titulo: 'Solicitud de materiales',
    tipo: 'solicitud',
    fecha: '2024-01-23',
    obra: 'Villa Familiar Sur',
    estado: 'leido'
  }
];

export function NotificacionesSection({ onNavigate }: NotificacionesSectionProps) {
  const currentUser = useCurrentUser();
  const orgId = currentUser?.orgId ?? null;
  const usuarioId = currentUser?.id ?? null;

  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [informes] = useState<InformeItem[]>(informesMock);
  const [mostrarModalEmision, setMostrarModalEmision] = useState(false);
  const [tabValue, setTabValue] = useState<'notificaciones' | 'informes' | 'mensajes'>('notificaciones');
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false);
  const { planId } = useSubscription();
  const { verifyAccess } = usePlanGate();
  const canUseNotificaciones = canUseFeature(planId, 'notificaciones');
  const router = useRouter();

  const headers = useMemo(() => {
    const base: Record<string, string> = {};
    if (orgId) base['x-organizacion-id'] = orgId;
    if (usuarioId) base['x-socio-id'] = usuarioId;
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
      console.error('[NotificacionesSection] Error fetching notificaciones:', error);
    } finally {
      setCargandoNotificaciones(false);
    }
  }, [headers, orgId]);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  const marcarComoLeida = async (id: string) => {
    if (!verifyAccess('notificaciones', 'STARTER')) {
      return;
    }

    try {
      await fetch(`/api/notificaciones/${id}/leida`, { method: 'PATCH' });
      setNotificaciones((prev) => prev.map((notif) => (notif.id === id ? { ...notif, leida: true } : notif)));
    } catch (error) {
      console.error('[NotificacionesSection] Error marcando notificación como leída:', error);
    }
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  const abrirModalInforme = () => {
    if (!verifyAccess('notificaciones', 'STARTER')) return;
    setMostrarModalEmision(true);
  };

  if (!canUseNotificaciones) {
    const handleClose = () => {
      if (onNavigate) {
        onNavigate('obras');
        return;
      }
      router.push('/cliente/obras');
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-neutral-950/60 px-6 backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(203,161,53,0.22),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(12,29,54,0.55),_transparent_55%)] opacity-80"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-neutral-200/25" aria-hidden="true" />
        <div className="relative max-w-md space-y-4 rounded-2xl border border-neutral-700/60 bg-neutral-900/80 p-8 text-center text-zinc-100 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleClose}
            className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white transition hover:bg-black/90"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#CBA135]/20 text-[#CBA135]">
            <Bell className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-50">Notificaciones en plan Starter</h1>
          <p className="text-sm text-zinc-200">
            Enviá informes, alertas y notificaciones en vivo al subir a Starter o superior. Centralizá la comunicación de tus obras.
          </p>
          <button
            type="button"
            onClick={() => verifyAccess('notificaciones', 'STARTER')}
            className="w-full rounded-xl bg-[#CBA135] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#d3ad45]"
          >
            Activar plan Starter
          </button>
        </div>
      </div>
    );
  }

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
          <MensajeriaDirecta />
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
