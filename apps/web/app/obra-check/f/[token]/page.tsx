import type { Metadata } from 'next';
import { ContractorFormPage } from '@/components/obra-check/ContractorFormPage';

export const metadata: Metadata = {
  title: 'Confirmar datos | Grows Obra Check',
  description: 'Confirmá tus datos de contacto para el trabajo de obra.',
  robots: { index: false, follow: false },
};

export default async function ObraCheckFormRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="min-h-screen" style={{ background: '#F5F6F7' }}>
      <ContractorFormPage token={token} />
    </main>
  );
}
