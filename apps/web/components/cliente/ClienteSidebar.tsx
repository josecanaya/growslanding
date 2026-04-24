'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Building2,
  ClipboardList,
  BadgeCheck,
  FileSpreadsheet,
  Users,
  Bell,
  UserCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_ORGANIZACION } from '@/lib/mocks/clienteMockData';

export const CLIENTE_NAV_ITEMS = [
  { href: '/cliente/dashboard' as Route, label: 'Hub', icon: LayoutGrid },
  { href: '/cliente/obras' as Route, label: 'Obras', icon: Building2 },
  { href: '/cliente/tareas' as Route, label: 'Tareas', icon: ClipboardList },
  { href: '/cliente/validar' as Route, label: 'Validar', icon: BadgeCheck },
  { href: '/cliente/presupuesto' as Route, label: 'Presupuesto', icon: FileSpreadsheet },
  { href: '/cliente/cuadrillas' as Route, label: 'Cuadrillas', icon: Users },
  { href: '/cliente/notificaciones' as Route, label: 'Alertas', icon: Bell },
  { href: '/cliente/cuenta' as Route, label: 'Cuenta', icon: UserCircle },
] as const;

export function ClienteSidebar({ className }: { className?: string }) {
  const pathname = usePathname() ?? '';

  return (
    <aside
      className={cn(
        'flex h-full w-[4.5rem] shrink-0 flex-col items-center border-r border-slate-200/80 bg-slate-50 py-6',
        className
      )}
    >
      <Link href="/cliente/dashboard" className="mb-8 font-bold tracking-tighter text-sky-950">
        <span className="text-xl">G.</span>
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-6">
        {CLIENTE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/cliente/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'group relative flex h-11 w-11 items-center justify-center rounded-xl transition',
                active
                  ? 'bg-white text-sky-700 shadow-sm after:absolute after:right-[-10px] after:h-7 after:w-1 after:rounded-l-full after:bg-sky-600'
                  : 'text-slate-400 hover:bg-white hover:text-sky-600'
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col items-center gap-4">
        <span
          title={MOCK_ORGANIZACION.nombre}
          className="max-w-[3rem] truncate text-[9px] font-semibold uppercase leading-tight text-slate-400"
        >
          {MOCK_ORGANIZACION.plan}
        </span>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-sky-600"
          title="Ajustes (mock)"
        >
          <Settings className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
