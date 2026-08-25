import { redirect } from 'next/navigation';

/** El chat vive dentro del Organizar; no hay otro canvas. */
export default async function ProyectoGrafoPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  redirect(`/cliente/tareas/${obraId}/editor`);
}
