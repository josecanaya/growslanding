'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLIENTE_NAV_ITEMS, isClienteNavItemActive } from '@/components/cliente/ClienteSidebar';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

function iniciales(nombre: string | null | undefined, email: string | null | undefined): string {
  if (nombre?.trim()) {
    const p = nombre.trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase().slice(0, 2);
    return nombre.trim().slice(0, 2).toUpperCase();
  }
  if (email?.trim()) return email.trim().slice(0, 2).toUpperCase();
  return '??';
}

export function ClienteHeader() {
  const pathname = usePathname() ?? '';
  const user = useCurrentUser();
  const [obras, setObras] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let a = true;
    (async () => {
      try {
        const res = await fetch('/api/obras', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !a) return;
        const rows = Array.isArray(json.data) ? json.data : [];
        setObras(rows.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name || 'Obra' })));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      a = false;
    };
  }, []);

  const obraIdEnPath = useMemo(() => {
    const m = pathname.match(/^\/cliente\/obras\/([^/]+)/);
    if (!m?.[1] || m[1] === 'nueva') return null;
    return m[1];
  }, [pathname]);

  const nombreObraDesdeLista = obraIdEnPath
    ? obras.find((o) => o.id === obraIdEnPath)?.name
    : null;

  const title = useMemo(() => {
    if (pathname.startsWith('/cliente/dashboard')) return 'Grows Hub';
    if (pathname.startsWith('/cliente/obras/nueva')) return 'Nueva obra';
    if (pathname.includes('/timeline') && nombreObraDesdeLista) return nombreObraDesdeLista;
    if (obraIdEnPath && nombreObraDesdeLista) return nombreObraDesdeLista;
    if (pathname.startsWith('/cliente/obras')) return 'Obras';
    if (pathname.startsWith('/cliente/tareas/') && pathname.includes('/editor')) return 'Editor de planificación';
    if (pathname.startsWith('/cliente/tareas/') && !pathname.includes('/editor')) return 'Planificación de obra';
    if (pathname.startsWith('/cliente/tareas')) return 'Planificación de obra';
    if (pathname.startsWith('/cliente/validar')) return 'Validaciones';
    if (pathname.startsWith('/cliente/presupuesto')) return 'Presupuestos';
    if (pathname.startsWith('/cliente/agenda-socios')) return 'Agenda';
    if (pathname.startsWith('/cliente/cuadrillas')) return 'Cuadrillas y socios';
    if (pathname.startsWith('/cliente/notificaciones')) return 'Notificaciones';
    if (pathname.startsWith('/cliente/cuenta')) return 'Cuenta y plan';
    return 'Cliente';
  }, [pathname, obraIdEnPath, nombreObraDesdeLista]);

  const [obraSel, setObraSel] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (obras.length && !obraSel) {
      setObraSel(obras[0].id);
    }
  }, [obras, obraSel]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 md:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold tracking-tight text-sky-950">{title}</h1>
            <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-teal-800 sm:block">
              {user?.orgName || 'Organización'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {obras.length > 0 && (
            <label className="hidden items-center gap-2 sm:flex">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Obra</span>
              <select
                className="max-w-[200px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800"
                value={obraSel}
                onChange={(e) => setObraSel(e.target.value)}
              >
                {obras.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-xs font-bold text-white">
              {iniciales(user?.name, user?.email)}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="max-w-[140px] truncate text-xs font-semibold text-slate-900">
                {user?.name || user?.email || 'Usuario'}
              </p>
              <p className="max-w-[140px] truncate text-[10px] text-slate-500">{user?.role || '—'}</p>
            </div>
          </div>
        </div>
      </header>

      {mobileNav ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar menú"
            onClick={() => setMobileNav(false)}
          />
          <nav className="relative flex h-full w-72 flex-col gap-1 border-r border-slate-200 bg-slate-50 p-4 pt-14 shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              onClick={() => setMobileNav(false)}
            >
              Cerrar
            </button>
            {CLIENTE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isClienteNavItemActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileNav(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold',
                    active ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:bg-white/80'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </>
  );
}
