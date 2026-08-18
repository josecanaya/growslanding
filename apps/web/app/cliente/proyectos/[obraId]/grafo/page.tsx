import { ProyectoVivoCanvas } from '@/components/cliente/proyecto-vivo/ProyectoVivoCanvas';
import { SectionHeader } from '@/components/cliente/SectionHeader';

export default async function ProyectoGrafoPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader
        eyebrow="Horizonte"
        title="Hablá el proyecto"
        description="Cada mensaje es una transformación. El canvas de tiempo (CPM) es otra lente, no el teclado."
      />
      <ProyectoVivoCanvas obraId={obraId} obraNombre="Proyecto" />
    </div>
  );
}
