'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

import { TopBar } from '@/components/socio/TopBar';
import { logout } from '@/lib/auth';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ROLE_LABELS, normalizeRole } from '@/lib/roles';

export default function SocioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [user, setUser] = useState({
    name: 'Juan Pérez',
    avatar: '👷',
    rating: 4.8,
    level: 'Oro',
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedConnection = localStorage.getItem('isConnected');
    const savedBreak = localStorage.getItem('isOnBreak');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedConnection) {
      setIsConnected(JSON.parse(savedConnection));
    }
    if (savedBreak) {
      setIsOnBreak(JSON.parse(savedBreak));
    }
  }, []);

  const handleConnectionToggle = () => {
    const newConnection = !isConnected;
    setIsConnected(newConnection);
    localStorage.setItem('isConnected', JSON.stringify(newConnection));
  };

  const handleBreakToggle = () => {
    const newBreak = !isOnBreak;
    setIsOnBreak(newBreak);
    localStorage.setItem('isOnBreak', JSON.stringify(newBreak));
  };

  const handleLogout = useCallback(() => {
    logout({ router });
  }, [router]);

  const currentUser = useCurrentUser();

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

  const roleLabel = useMemo(() => {
    const normalized = normalizeRole(currentUser?.role);
    if (!normalized) {
      return 'Socio';
    }
    return ROLE_LABELS[normalized] ?? normalized;
  }, [currentUser?.role]);

  return (
    <div className="flex min-h-screen flex-col bg-grows-gray">
      <TopBar
        isConnected={isConnected}
        isOnBreak={isOnBreak}
        onConnectionToggle={handleConnectionToggle}
        onBreakToggle={handleBreakToggle}
        onLogout={handleLogout}
        user={user}
        roleLabel={roleLabel}
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="space-y-6 px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

