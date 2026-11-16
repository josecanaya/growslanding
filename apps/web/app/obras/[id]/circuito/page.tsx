import type { Metadata } from 'next';
import CircuitoObra from '@/components/circuito/CircuitoObra';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Grows · Circuito de obra' };

export default async function CircuitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="mx-auto min-h-screen max-w-7xl bg-[#f5f7f4] px-5 py-8 text-[#19362d]"><CircuitoObra obraId={id} /></main>;
}
