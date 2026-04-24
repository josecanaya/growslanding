'use client';

import { useMemo } from 'react';
import { CuentaSection } from '@/components/socio/sections/CuentaSection';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function CuentaPage() {
  const currentUser = useCurrentUser();

  const user = useMemo(
    () => ({
      name: currentUser?.name?.trim() || 'Socio',
      avatar: currentUser?.name?.trim()
        ? currentUser.name.trim().charAt(0).toUpperCase()
        : '👷',
      rating: 0,
      level: '—',
    }),
    [currentUser?.name],
  );

  return <CuentaSection user={user} />;
}
