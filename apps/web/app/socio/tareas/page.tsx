'use client';

import { Suspense } from 'react';
import { TareasEnCurso } from '@/components/socio/sections/TareasEnCurso';

export const dynamic = 'force-dynamic';

// Ruta TAREAS: vista agrupada por obra (pendientes y aprobadas) con acciones reducidas.
export default function TareasPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <TareasEnCurso />
    </Suspense>
  );
}
