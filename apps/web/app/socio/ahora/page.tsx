'use client';

import { Suspense } from 'react';
import { AhoraSection } from '@/components/socio/sections/AhoraSection';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Jornada operativa real (Supabase/API, checklist al iniciar, modales de evidencia).
 * La maqueta estilo Stitch vive solo en `/socio/ahora/demo` (antes se podía activar con env y tapaba esta pantalla).
 */
export default function AhoraPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-stitch-surface">
          <Loader2 className="h-8 w-8 animate-spin text-stitch-primary" />
        </div>
      }
    >
      <AhoraSection />
    </Suspense>
  );
}
