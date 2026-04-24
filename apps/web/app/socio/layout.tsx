'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Route } from 'next';

import { SocioHeader } from '@/components/socio/SocioHeader';
import { SocioTabBar } from '@/components/socio/SocioTabBar';
import { AhoraWorkNavProvider, useAhoraWorkNavOptional } from '@/components/socio/ahora/AhoraWorkNavContext';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { normalizeRole } from '@/lib/roles';
import { USE_AHORA_STITCH_MOCK } from '@/lib/mocks/socioMockData';

function SocioLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const ahoraNav = useAhoraWorkNavOptional();
  const isAhoraPage = pathname?.startsWith('/socio/ahora');
  const ahoraSoloVistaStitch = isAhoraPage && USE_AHORA_STITCH_MOCK;
  const hideTabByWorkSession = Boolean(ahoraSoloVistaStitch && ahoraNav?.hideBottomTabBar);
  const isHomePage =
    pathname === '/socio' ||
    pathname === '/socio/' ||
    pathname === '/socio/panel' ||
    pathname?.startsWith('/socio/panel/');

  useEffect(() => {
    if (!currentUser || currentUser.isDevUser) {
      return;
    }

    const normalized = normalizeRole(currentUser.role);
    if (normalized === 'CLIENTE_TECNICO' && !currentUser.orgId) {
      router.replace('/onboarding' as Route);
    }
  }, [currentUser, router]);

  return (
    <div
      className={
        ahoraSoloVistaStitch
          ? 'flex min-h-screen w-full flex-col bg-[#00174a] text-white'
          : 'flex min-h-screen w-full flex-col bg-stitch-surface font-stitch-body text-stitch-on-surface'
      }
    >
      {ahoraSoloVistaStitch ? null : <SocioHeader />}

      <main
        className={
          hideTabByWorkSession
            ? 'flex-1 overflow-y-auto pb-4 pt-0 sm:pb-6'
            : 'flex-1 overflow-y-auto pb-28 pt-0 sm:pb-32'
        }
      >
        {isAhoraPage || isHomePage ? (
          <div className="w-full">{children}</div>
        ) : (
          // Para otras páginas: max-width centrado
          <div className="mx-auto w-full max-w-2xl">
            {children}
          </div>
        )}
      </main>

      {!hideTabByWorkSession && <SocioTabBar />}
    </div>
  );
}

export default function SocioLayout({ children }: { children: React.ReactNode }) {
  return (
    <AhoraWorkNavProvider>
      <SocioLayoutInner>{children}</SocioLayoutInner>
    </AhoraWorkNavProvider>
  );
}

