'use client';

import { SectionHeader } from '@/components/cliente/SectionHeader';
import { CuadrillaCard } from '@/components/cliente/CuadrillaCard';
import { MOCK_CUADRILLAS } from '@/lib/mocks/clienteMockData';

export default function CuadrillasPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Red de ejecución"
        title="Cuadrillas y socios"
        description="Disponibilidad, especialidad y reputación simulada. Sin llamadas a API."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_CUADRILLAS.map((c) => (
          <CuadrillaCard key={c.id} {...c} />
        ))}
      </div>
    </div>
  );
}
