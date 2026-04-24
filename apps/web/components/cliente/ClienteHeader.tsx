'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { MOCK_USUARIO, MOCK_OBRAS, MOCK_ORGANIZACION, obraById } from '@/lib/mocks/clienteMockData';
import { cn } from '@/lib/utils';
import { CLIENTE_NAV_ITEMS } from '@/components/cliente/ClienteSidebar';

const titleFromPath = (path: string) => {
  if (path.startsWith('/cliente/dashboard')) return 'Grows Hub';
  if (path.startsWith('/cliente/obras/nueva')) return 'Nueva obra';
  if (path.startsWith('/cliente/obras/') && path.includes('/timeline')) return 'Línea de tiempo';
  const mCentro = path.match(/^\/cliente\/obras\/([^/]+)$/);
  if (mCentro?.[1] && mCentro[1] !== 'nueva') {
    return obraById(mCentro[1]).nombre;
  }
  if (path.startsWith('/cliente/obras')) return 'Obras';
  if (path.startsWith('/cliente/tareas/') && path.includes('/editor')) return 'Editor de planificación';
  if (path.startsWith('/cliente/tareas/')) return 'Tareas de la obra';
  if (path.startsWith('/cliente/tareas')) return 'Tareas';
  if (path.startsWith('/cliente/validar')) return 'Validaciones';
  if (path.startsWith('/cliente/presupuesto')) return 'Presupuestos';
  if (path.startsWith('/cliente/cuadrillas')) return 'Cuadrillas y socios';
  if (path.startsWith('/cliente/notificaciones')) return 'Notificaciones';
  if (path.startsWith('/cliente/cuenta')) return 'Cuenta y plan';
  return 'Cliente';
};

export function ClienteHeader() {
  const pathname = usePathname() ?? '';
  const title = useMemo(() => titleFromPath(pathname), [pathname]);
  const [obraSel, setObraSel] = useState(MOCK_OBRAS[0]?.id ?? '');
  const [mobileNav, setMobileNav] = useState(false);

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
              Prototipo UI · {MOCK_ORGANIZACION.plan}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-2 sm:flex">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Obra</span>
            <select
              className="max-w-[200px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800"
              value={obraSel}
              onChange={(e) => setObraSel(e.target.value)}
            >
              {MOCK_OBRAS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-xs font-bold text-white">
              {MOCK_USUARIO.iniciales}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="max-w-[140px] truncate text-xs font-semibold text-slate-900">{MOCK_USUARIO.nombre}</p>
              <p className="max-w-[140px] truncate text-[10px] text-slate-500">{MOCK_USUARIO.rolLabel}</p>
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
              const active =
                pathname === href || (href !== '/cliente/dashboard' && pathname.startsWith(href));
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
