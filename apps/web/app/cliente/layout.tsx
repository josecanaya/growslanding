'use client';

import { ClienteShell } from '@/components/cliente/ClienteShell';

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return <ClienteShell>{children}</ClienteShell>;
}
