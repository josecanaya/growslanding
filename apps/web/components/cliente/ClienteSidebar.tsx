'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import {
  LayoutGrid,
  Building2,
  BadgeCheck,
  FileSpreadsheet,
  BookUser,
  Wallet,
  Bell,
  UserCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

/** Rutas bajo “Obras” (incluye planificación / tareas por obra). */
export function isClienteNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/cliente/dashboard') return false;
  if (href === '/cliente/obras') {
    return pathname.startsWith('/cliente/obras') ||
      pathname.startsWith('/cliente/tareas') ||
      pathname.startsWith('/cliente/proyectos');
  }
  return pathname.startsWith(href);
}

export const CLIENTE_NAV_ITEMS = [
  { href: '/cliente/dashboard' as Route, label: 'Canvas', icon: LayoutGrid },
  { href: '/cliente/obras' as Route, label: 'Proyectos', icon: Building2 },
  { href: '/cliente/validar' as Route, label: 'Validaciones', icon: BadgeCheck },
  { href: '/cliente/presupuesto' as Route, label: 'Presupuestos', icon: FileSpreadsheet },
  { href: '/cliente/billetera' as Route, label: 'Billetera', icon: Wallet },
  { href: '/cliente/agenda-socios' as Route, label: 'Agenda', icon: BookUser },
  { href: '/cliente/notificaciones' as Route, label: 'Notificaciones', icon: Bell },
  { href: '/cliente/cuenta' as Route, label: 'Cuenta', icon: UserCircle },
] as const;

export function ClienteSidebar({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'canvas';
}) {
  const pathname = usePathname() ?? '';
  const user = useCurrentUser();
  const orgLabel = user?.orgName || user?.orgId?.slice(0, 8) || 'Grows';
  const [notifNoLeidas, setNotifNoLeidas] = useState(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClientComponentClient>['channel']> | null>(null);
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);
  const canvas = variant === 'canvas';

  useEffect(() => {
    if (!user?.orgId || !user?.id) {
      setNotifNoLeidas(0);
      return;
    }

    const headers: Record<string, string> = {
      'x-organizacion-id': user.orgId,
      'x-usuario-id': user.id,
    };

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notificaciones?soloNoLeidas=1', {
          headers,
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (json.success && Array.isArray(json.data)) {
          setNotifNoLeidas(json.data.length);
        }
      } catch {
        /* ignore */
      }
    };

    void fetchUnread();

    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<{ rol?: string; count?: number }>;
      if (ce.detail?.rol === 'cliente' && typeof ce.detail.count === 'number') {
        setNotifNoLeidas(ce.detail.count);
        return;
      }
      void fetchUnread();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('grows:notificaciones-unread-count', onCustom);
      window.addEventListener('grows:presupuesto-respondido', onCustom);
    }
    const interval = setInterval(fetchUnread, 60_000);

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('grows:notificaciones-unread-count', onCustom);
        window.removeEventListener('grows:presupuesto-respondido', onCustom);
      }
    };
  }, [user?.orgId, user?.id]);

  useEffect(() => {
    if (!user?.orgId || !user?.id) return;

    const ch = supabase
      .channel(`cliente_sidebar_notif_${user.orgId}_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `destinatario_id=eq.${user.id}`,
        },
        () => {
          void (async () => {
            try {
              const res = await fetch('/api/notificaciones?soloNoLeidas=1', {
                headers: {
                  'x-organizacion-id': user.orgId!,
                  'x-usuario-id': user.id,
                },
                cache: 'no-store',
              });
              const json = await res.json().catch(() => ({}));
              if (json.success && Array.isArray(json.data)) {
                setNotifNoLeidas(json.data.length);
              }
            } catch {
              /* ignore */
            }
          })();
        },
      )
      .subscribe();

    channelRef.current = ch;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.orgId, user?.id, supabase]);

  return (
    <aside
      className={cn(
        'flex h-full w-[4.5rem] shrink-0 flex-col items-center border-r py-6',
        canvas
          ? 'border-white/10 bg-[var(--grows-canvas-blue,#0C1D36)]'
          : 'border-slate-200/80 bg-slate-50',
        className,
      )}
    >
      <Link
        href="/cliente/dashboard"
        className={cn(
          'mb-8 font-bold tracking-tighter',
          canvas ? 'text-white' : 'text-sky-950',
        )}
      >
        <span className="text-xl">G.</span>
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-6">
        {CLIENTE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isClienteNavItemActive(pathname, href);
          const showNotifBadge = href === '/cliente/notificaciones' && notifNoLeidas > 0;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'group relative flex h-11 w-11 items-center justify-center rounded-xl transition',
                canvas
                  ? active
                    ? 'bg-white/15 text-white shadow-sm after:absolute after:right-[-10px] after:h-7 after:w-1 after:rounded-l-full after:bg-white'
                    : 'text-white/45 hover:bg-white/10 hover:text-white'
                  : active
                    ? 'bg-white text-sky-700 shadow-sm after:absolute after:right-[-10px] after:h-7 after:w-1 after:rounded-l-full after:bg-sky-600'
                    : 'text-slate-400 hover:bg-white hover:text-sky-600',
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
              {showNotifBadge ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
                  {notifNoLeidas > 9 ? '9+' : notifNoLeidas}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col items-center gap-4">
        <span
          title={user?.orgName || ''}
          className={cn(
            'max-w-[3rem] truncate text-[9px] font-semibold uppercase leading-tight',
            canvas ? 'text-white/40' : 'text-slate-400',
          )}
        >
          {orgLabel}
        </span>
        <button
          type="button"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            canvas
              ? 'text-white/45 hover:bg-white/10 hover:text-white'
              : 'text-slate-400 hover:bg-white hover:text-sky-600',
          )}
          title="Ajustes"
        >
          <Settings className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
