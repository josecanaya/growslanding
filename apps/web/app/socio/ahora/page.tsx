'use client';

import { Suspense } from 'react';
import { AhoraSection } from '@/components/socio/sections/AhoraSection';

export const dynamic = 'force-dynamic';

// Ruta AHORA: vista de ejecución (iniciar/finalizar) separada de "Tareas".
export default function AhoraPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AhoraSection />
    </Suspense>
  );
}
