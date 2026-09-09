'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { CLIENTE_NAV_ITEMS, isClienteNavItemActive } from '@/components/cliente/ClienteSidebar';

function iniciales(nombre: string | null | undefined, email: string | null | undefined): string {
  if (nombre?.trim()) {
    const p = nombre.trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase().slice(0, 2);
    return nombre.trim().slice(0, 2).toUpperCase();
  }
  if (email?.trim()) return email.trim().slice(0, 2).toUpperCase();
  return '??';
}

/**
 * Reemplaza el sidebar + header del cliente: un solo botón con el logo que abre
 * la navegación. Fuera de él, la pantalla queda libre para el contenido.
 */
export function ClienteLauncher({
  variant = 'floating',
}: {
  /** `floating` = botón fijo arriba a la izquierda; `inline` = se integra en una barra propia. */
  variant?: 'floating' | 'inline';
} = {}) {
  const pathname = usePathname() ?? '';
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  /** Cierra al navegar */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  /** Badge de notificaciones — mismo endpoint que usaba el sidebar. */
  useEffect(() => {
    if (!user?.orgId || !user?.id) {
      setNoLeidas(0);
      return;
    }
    const headers: Record<string, string> = {
      'x-organizacion-id': user.orgId,
      'x-usuario-id': user.id,
    };
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notificaciones?soloNoLeidas=1', { headers, cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (json.success && Array.isArray(json.data)) setNoLeidas(json.data.length);
      } catch {
        /* ignore */
      }
    };
    void fetchUnread();

    const onCustom = (e: Event) => {
      const ce = e as CustomEvent<{ rol?: string; count?: number }>;
      if (ce.detail?.rol === 'cliente' && typeof ce.detail.count === 'number') {
        setNoLeidas(ce.detail.count);
        return;
      }
      void fetchUnread();
    };
    window.addEventListener('grows:notificaciones-unread-count', onCustom);
    window.addEventListener('grows:presupuesto-respondido', onCustom);
    const interval = setInterval(fetchUnread, 60_000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('grows:notificaciones-unread-count', onCustom);
      window.removeEventListener('grows:presupuesto-respondido', onCustom);
    };
  }, [user?.orgId, user?.id]);

  const orgLabel = user?.orgName || 'Grows';

  return (
    <div
      ref={rootRef}
      className={cn('z-50', variant === 'floating' ? 'fixed left-4 top-4' : 'relative')}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Cerrar navegación' : 'Abrir navegación'}
        className={cn(
          'relative flex items-center justify-center rounded-lg text-[#15161A] transition',
          variant === 'floating'
            ? 'h-10 w-10 border border-[#E4E3DE] bg-white shadow-[0_1px_2px_rgba(21,22,26,0.04)] hover:bg-[#F6F5F1]'
            : 'h-8 w-8 hover:bg-[#F6F5F1]',
          open && 'bg-[#F1F0EB]',
        )}
      >
        {open ? (
          <X className="h-[18px] w-[18px] text-[#55565C]" strokeWidth={1.75} />
        ) : (
          <span className={variant === 'floating' ? 'text-lg font-bold tracking-tighter' : 'text-[15px] font-bold tracking-tighter'}>
            G.
          </span>
        )}
        {!open && noLeidas > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        ) : null}
      </button>

      {open ? (
        <nav className="absolute left-0 top-12 w-[260px] overflow-hidden rounded-xl border border-[#E4E3DE] bg-white shadow-[0_8px_24px_rgba(21,22,26,0.10),0_1px_2px_rgba(21,22,26,0.05)]">
          <div className="flex items-center gap-2.5 border-b border-[#E9E8E3] px-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0C1D36] text-[11px] font-bold text-white">
              {iniciales(user?.name, user?.email)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold text-[#15161A]">
                {user?.name || user?.email || 'Usuario'}
              </span>
              <span className="block truncate text-[10px] uppercase tracking-wide text-[#8B8C90]">
                {orgLabel}
              </span>
            </span>
          </div>

          <div className="py-1.5">
            {CLIENTE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isClienteNavItemActive(pathname, href);
              const badge = href === '/cliente/notificaciones' && noLeidas > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 text-[13px] transition',
                    active
                      ? 'bg-[#F1F0EB] font-semibold text-[#0C1D36]'
                      : 'text-[#55565C] hover:bg-[#F6F5F1] hover:text-[#15161A]',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="flex-1 truncate">{label}</span>
                  {badge ? (
                    <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                      {noLeidas > 9 ? '9+' : noLeidas}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-[#E9E8E3] px-3 py-2">
            <Link
              href="/cliente/cuenta"
              className="flex items-center gap-2.5 rounded-lg px-0 py-1 text-[12px] text-[#8B8C90] transition hover:text-[#15161A]"
            >
              <Settings className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              Ajustes
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
