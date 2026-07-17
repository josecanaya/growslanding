import type { Metadata } from 'next';
import { ObraCheckRespuestaView } from '@/components/obra-check/ObraCheckRespuestaView';

export const metadata: Metadata = {
  title: 'Respuesta de presupuesto | Grows',
  robots: { index: false, follow: false },
};

export default async function ObraCheckRespuestaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="min-h-screen" style={{ background: '#F5F6F7' }}>
      <ObraCheckRespuestaView token={token} />
    </main>
  );
}
