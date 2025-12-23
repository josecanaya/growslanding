'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Route } from 'next';

import { SocioHeader } from '@/components/socio/SocioHeader';
import { SocioTabBar } from '@/components/socio/SocioTabBar';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { normalizeRole } from '@/lib/roles';

export default function SocioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const isAhoraPage = pathname?.startsWith('/socio/ahora');
  const isHomePage = pathname === '/socio' || pathname === '/socio/';

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
    <div className="w-full flex flex-col min-h-screen bg-[#F7F7F7]">
      {/* Header GROWS fijo - siempre visible */}
      <SocioHeader />

      {/* Contenido principal con padding para header y footer */}
      <main className="flex-1 overflow-y-auto pt-[70px] pb-[90px]">
        {isAhoraPage || isHomePage ? (
          // Para /socio/ahora y /socio (HOME): sin max-width, full width
          <div className="w-full">
            {children}
          </div>
        ) : (
          // Para otras páginas: max-width centrado
          <div className="max-w-[480px] mx-auto w-full">
            {children}
          </div>
        )}
      </main>

      {/* TabBar fijo - siempre visible */}
      <SocioTabBar />
    </div>
  );
}

