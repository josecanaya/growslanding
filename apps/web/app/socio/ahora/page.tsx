'use client';

import { Suspense } from 'react';
import { TareasEnCurso } from '@/components/socio/sections/TareasEnCurso';

export const dynamic = 'force-dynamic';

// Ruta AHORA: vista de ejecución (iniciar/finalizar) separada de "Tareas".
export default function AhoraPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <TareasEnCurso />
    </Suspense>
  );
}
