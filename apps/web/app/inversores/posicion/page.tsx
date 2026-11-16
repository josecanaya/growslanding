import type { Metadata } from 'next';
import Link from 'next/link';
import PosicionInversor from '@/components/circuito/PosicionInversor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Grows · Mi posición' };

export default function PosicionPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-6 bg-[#f5f7f4] px-5 py-8 text-[#19362d]">
      <Link href="/inversores" className="text-sm underline">← Descubrir obras</Link>
      <h1 className="text-3xl font-semibold">Mi posición y mis fondos</h1>
      <PosicionInversor />
    </main>
  );
}
