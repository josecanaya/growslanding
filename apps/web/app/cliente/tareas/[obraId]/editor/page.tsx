'use client';

import { notFound, useParams } from 'next/navigation';
import { CanvasObraEditor } from '@/components/cliente/canvas-editor/CanvasObraEditor';

export default function ClienteTareasObraEditorPage() {
  const params = useParams<{ obraId: string }>();
  const obraId = typeof params?.obraId === 'string' ? params.obraId : null;
  if (!obraId) notFound();

  return <CanvasObraEditor obraId={obraId} />;
}
