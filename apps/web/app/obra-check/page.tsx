import type { Metadata } from 'next';
import { ObraCheckWizard } from '@/components/obra-check/ObraCheckWizard';

export const metadata: Metadata = {
  title: 'Grows Obra Check — Armá y mandá el plan de tu obra gratis',
  description:
    'Subí tu cronograma, elegí un plan de la librería XML o escribí las tareas. Grows las ordena, arma bloques y te genera los mensajes de WhatsApp para tus contratistas. Gratis.',
};

// Ruta pública sin auth (el middleware no la intercepta).
export const dynamic = 'force-dynamic';

export default function ObraCheckPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F6F7' }}>
      <ObraCheckWizard />
    </div>
  );
}
