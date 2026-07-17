import type { Metadata } from 'next';
import { ObraCheckInboxView } from '@/components/obra-check/ObraCheckInboxView';

export const metadata: Metadata = {
  title: 'Bandeja de presupuestos | Grows',
  robots: { index: false, follow: false },
};

export default async function ObraCheckInboxPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="min-h-screen" style={{ background: '#F5F6F7' }}>
      <ObraCheckInboxView token={token} />
    </main>
  );
}
