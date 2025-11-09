'use client';

import { SectionLayout } from '@/components/ui/grows';
import { EtapasSection } from '@/components/cliente/EtapasSection';

export default function ClienteEtapasPage() {
  return (
    <SectionLayout
      title="Etapas del proyecto"
      subtitle="Seguimiento consolidado del avance por etapas en todas tus obras activas."
    >
      <EtapasSection />
    </SectionLayout>
  );
}
