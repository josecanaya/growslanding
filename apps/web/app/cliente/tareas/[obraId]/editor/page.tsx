'use client';

import { useParams } from 'next/navigation';
import { CanvasObraEditor } from '@/components/cliente/canvas-editor/CanvasObraEditor';

export default function ClienteTareasObraEditorPage() {
  const params = useParams<{ obraId: string }>();
  const obraId = params?.obraId ?? 'obra-san-martin';
  return <CanvasObraEditor obraId={obraId} />;
}
