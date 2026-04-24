'use client';

import { useParams } from 'next/navigation';
import { ClienteCentroOperacionesView } from '@/components/cliente/obra/ClienteCentroOperacionesView';

export default function ClienteObraCentroPage() {
  const params = useParams<{ obraId: string }>();
  const obraId = params?.obraId ?? '';

  return <ClienteCentroOperacionesView obraId={obraId} />;
}
