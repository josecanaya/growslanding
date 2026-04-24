'use client';

import { SectionHeader } from '@/components/cliente/SectionHeader';
import { PresupuestoCard } from '@/components/cliente/PresupuestoCard';
import { MOCK_PRESUPUESTOS, obraById } from '@/lib/mocks/clienteMockData';

export default function ClientePresupuestoPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Compras"
        title="Presupuestos"
        description="Solicitudes y respuestas simuladas por obra y cuadrilla."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_PRESUPUESTOS.map((p) => (
          <div key={p.id}>
            <PresupuestoCard
              titulo={p.titulo}
              cuadrilla={p.cuadrilla}
              estado={p.estado}
              monto={p.monto}
              enviado={p.enviado}
            />
            <p className="mt-2 text-xs text-slate-500">Obra: {obraById(p.obraId).nombre}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
