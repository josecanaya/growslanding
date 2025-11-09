'use client';

import {SectionLayout} from '@/components/ui/grows';
import {PresupuestoSection} from '@/components/cliente/PresupuestoSection';

export default function ClientePresupuestoPage() {
  return (
    <SectionLayout
      title="Pedir presupuesto"
      subtitle="Seleccioná tareas sin asignar, pedí presupuesto a tus cuadrillas y seguí el estado de cada solicitud en tiempo real."
    >
      <PresupuestoSection />
    </SectionLayout>
  );
}
