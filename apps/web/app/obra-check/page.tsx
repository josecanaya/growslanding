import type { Metadata } from 'next';
import { ObraCheckWizard } from '@/components/obra-check/ObraCheckWizard';

export const metadata: Metadata = {
  title: 'Grows Obra Check — Pedí presupuestos de obra por WhatsApp gratis',
  description:
    'Subí tu cronograma o elegí un plan listo. Grows ordena las tareas, arma paquetes y te genera el link para pedir presupuestos a tus contratistas por WhatsApp. Gratis, sin instalar.',
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
