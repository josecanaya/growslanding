import { redirect } from 'next/navigation';

export default async function ClienteObraCentroRedirectPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  redirect(`/cliente/tareas/${obraId}/editor`);
}
