'use client';

import { Suspense } from 'react';
import { AhoraSection } from '@/components/socio/sections/AhoraSection';
import { AhoraJornadaActivaStitchMock } from '@/components/socio/ahora/AhoraJornadaActivaStitchMock';
import { USE_AHORA_STITCH_MOCK } from '@/lib/mocks/socioMockData';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

/** Con `USE_AHORA_STITCH_MOCK` (dev por defecto) solo se muestra la vista fija estilo Stitch; si no, la ejecución real. */
export default function AhoraPage() {
  if (USE_AHORA_STITCH_MOCK) {
    return <AhoraJornadaActivaStitchMock />;
  }

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
