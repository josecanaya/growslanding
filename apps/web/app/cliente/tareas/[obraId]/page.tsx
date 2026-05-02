'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Entrada histórica / enlaces desde obra: redirige al editor de planificación (canvas).
 */
export default function ClienteTareasObraRedirectPage() {
  const router = useRouter();
  const params = useParams<{ obraId: string }>();
  const obraId = params?.obraId ?? '';

  useEffect(() => {
    if (!obraId) return;
    router.replace(`/cliente/tareas/${obraId}/editor`);
  }, [obraId, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4 text-center text-slate-600">
      <p className="text-sm font-medium">Abriendo el editor de planificación…</p>
    </div>
  );
}
