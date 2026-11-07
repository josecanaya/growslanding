'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { notFound, useParams } from 'next/navigation';
import { CanvasObraEditor } from '@/components/cliente/canvas-editor/CanvasObraEditor';

export default function ClienteTareasObraEditorPage() {
  const params = useParams<{ obraId: string }>();
  const obraId = typeof params?.obraId === 'string' ? params.obraId : null;
  if (!obraId) notFound();

  return <>
    <div className="border-b bg-[#f5f7f4] px-4 py-2 text-sm text-[#19362d]">
      <Link href={('/obras/' + obraId) as Route}>← Espacio de obra · agentes, presupuestos y publicación</Link>
    </div>
    <CanvasObraEditor obraId={obraId} />
  </>;
}
