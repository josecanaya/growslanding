'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

type Item = {
  id: string;
  titulo: string;
  cuerpo: string;
  fecha: string;
  leida: boolean;
};

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function ClienteNotificacionesPage() {
  const user = useCurrentUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = useMemo(() => {
    const base: Record<string, string> = {};
    if (user?.orgId) base['x-organizacion-id'] = user.orgId;
    if (user?.id) base['x-usuario-id'] = user.id;
    return base;
  }, [user?.orgId, user?.id]);

  const fetchN = useCallback(async () => {
    if (!user?.orgId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/notificaciones', { headers, cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        setItems(
          json.data.map((n: any) => ({
            id: String(n.id),
            titulo: n.titulo || 'Notificación',
            cuerpo: n.mensaje || n.descripcion || n.cuerpo || '',
            fecha: n.created_at || n.fecha || new Date().toISOString(),
            leida: Boolean(n.leida),
          })),
        );
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [headers, user?.orgId]);

  useEffect(() => {
    fetchN();
  }, [fetchN]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionHeader
        eyebrow="Centro de avisos"
        title="Notificaciones"
        description="Eventos de la organización: validaciones, presupuestos e hitos."
      />
      {loading ? (
        <p className="text-sm text-slate-600">Cargando…</p>
      ) : !user?.orgId ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Necesitás una organización asignada en la sesión para ver notificaciones.
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">No hay notificaciones.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex gap-3 rounded-xl border border-slate-200/90 p-4 ${
                n.leida ? 'bg-white' : 'bg-sky-50/80'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{n.titulo}</p>
                <p className="text-sm text-slate-600">{n.cuerpo}</p>
                <p className="mt-1 text-xs text-slate-400">{formatFecha(n.fecha)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
