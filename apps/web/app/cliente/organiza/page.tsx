'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Ruta legacy que ahora redirige al panel principal.
 * La pestaña Organiza vive dentro de /cliente/dashboard.
 */
export default function LegacyOrganizaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cliente/dashboard?section=tareas&tab=organiza');
  }, [router]);

  return null;
}

