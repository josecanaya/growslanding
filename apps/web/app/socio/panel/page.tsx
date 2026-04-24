'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

import { SocioPanelDashboard } from '@/components/socio/panel/SocioPanelDashboard';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { normalizeRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default function PanelPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();

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
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">
          Cargando panel…
        </div>
      }
    >
      <SocioPanelDashboard />
    </Suspense>
  );
}
