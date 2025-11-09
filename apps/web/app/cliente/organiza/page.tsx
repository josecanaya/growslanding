'use client';

import { SectionLayout } from '@/components/ui/grows';

export default function ClienteOrganizaPage() {
  return (
    <SectionLayout
      title="Organiza"
      subtitle="Pronto vas a estructurar la planificación completa desde un tablero centralizado."
    >
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center shadow-sm">
        <p className="text-sm text-slate-600">
          Estamos preparando herramientas para ordenar tus tareas, definir responsables y priorizar entregables en un solo lugar.
        </p>
      </div>
    </SectionLayout>
  );
}
