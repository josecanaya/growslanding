'use client';

import { SectionLayout } from '@/components/ui/grows';
import { ValidarSection } from '@/components/cliente/ValidarSection';

export default function ClienteValidarPage() {
  return (
    <SectionLayout
      title="Validar tareas"
      subtitle="Revisá evidencias, aprobá avances y registrá observaciones."
    >
      <ValidarSection />
    </SectionLayout>
  );
}
