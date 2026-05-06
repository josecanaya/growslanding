'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Wallet, TrendingUp, User, LayoutGrid, Timer } from 'lucide-react';
import type { Route } from 'next';

/**
 * Barra inferior sobria (referencia stitch): cinco ítems iguales, sin FAB central.
 * La jornada se inicia o continúa desde /socio/ahora, no desde un botón flotante verde.
 */
export function SocioTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const isHomeActive = () =>
    pathname === '/socio' ||
    pathname === '/socio/' ||
    pathname === '/socio/panel' ||
    pathname?.startsWith('/socio/panel/');

  const isBilleteraActive =
    pathname === '/socio/billetera' || pathname?.startsWith('/socio/billetera/');
  const isAhoraActive = pathname === '/socio/ahora' || pathname?.startsWith('/socio/ahora/');
  const isOportunidadesActive =
    pathname === '/socio/oportunidades' || pathname?.startsWith('/socio/oportunidades/');
  const isCuentaActive = pathname === '/socio/cuenta' || pathname?.startsWith('/socio/cuenta/');

  const tabClass = (active: boolean) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors ${
      active ? 'text-[#163274]' : 'text-slate-400'
    }`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white md:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-label="Navegación principal"
    >
      <div className="flex w-full max-w-lg mx-auto items-stretch justify-around px-1 pt-1">
        <button
          type="button"
          onClick={() => router.push('/socio/panel')}
          className={tabClass(isHomeActive())}
          aria-label="Resumen"
        >
          <LayoutGrid className="h-[22px] w-[22px]" strokeWidth={1.75} />
          <span className="text-[9px] font-semibold uppercase tracking-wide">Resumen</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/socio/billetera')}
          className={tabClass(isBilleteraActive)}
          aria-label="Billetera"
        >
          <Wallet className="h-[22px] w-[22px]" strokeWidth={1.75} />
          <span className="text-[9px] font-semibold uppercase tracking-wide">Billetera</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/socio/ahora')}
          className={tabClass(isAhoraActive)}
          aria-label="Ahora · Jornada"
        >
          <Timer className="h-[22px] w-[22px]" strokeWidth={1.75} />
          <span className="text-[9px] font-semibold uppercase tracking-wide">Ahora</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/socio/oportunidades')}
          className={tabClass(isOportunidadesActive)}
          aria-label="Oportunidades"
        >
          <TrendingUp className="h-[22px] w-[22px]" strokeWidth={1.75} />
          <span className="max-w-full truncate text-center text-[9px] font-semibold uppercase tracking-wide">
            Oportun.
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/socio/cuenta' as Route)}
          className={tabClass(isCuentaActive)}
          aria-label="Cuenta"
        >
          <User className="h-[22px] w-[22px]" strokeWidth={1.75} />
          <span className="text-[9px] font-semibold uppercase tracking-wide">Cuenta</span>
        </button>
      </div>
    </nav>
  );
}
