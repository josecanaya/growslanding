import ObraWorkspace from '@/components/grows/ObraWorkspace';
import { notFound } from 'next/navigation';

export default async function ObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) notFound();
  return <ObraWorkspace obraId={id} />;
}
