'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

import { PanelViewer } from '@/components/socio/PanelViewer';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { normalizeRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default function PanelPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('tareas');
  const [user, setUser] = useState({
    name: 'Juan Pérez',
    avatar: '👷',
    rating: 4.8,
    level: 'Oro',
  });

  const currentUser = useCurrentUser();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser?.name) {
      setUser((prev) => ({
        ...prev,
        name: currentUser.name ?? prev.name,
        avatar: currentUser.name
          ? currentUser.name.charAt(0).toUpperCase()
          : prev.avatar,
      }));
    }
  }, [currentUser?.name]);

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
    <Suspense fallback={<div>Cargando...</div>}>
      <PanelViewer activeSection={activeSection} user={user} />
    </Suspense>
  );
}

