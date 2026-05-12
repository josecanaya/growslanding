'use client';

import { SectionHeader } from '@/components/cliente/SectionHeader';
import { ValidarSection } from '@/components/cliente/ValidarSection';

export default function ClienteValidarPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <SectionHeader
        eyebrow="Control de calidad"
        title="Validaciones pendientes"
        description="Las tareas se muestran cuando hay bloques en estado «para validar». Podés validar o rechazar cada bloque; los cambios se guardan en el servidor."
      />
      <ValidarSection />
    </div>
  );
}
