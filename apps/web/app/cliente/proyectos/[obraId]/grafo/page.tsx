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
        eyebrow="Proyecto vivo"
        title="Grafo de transformaciones"
        description="IDEA → transformación → estado. Una sola fuente de verdad en canvas_nodes."
      />
      <ProyectoVivoCanvas obraId={obraId} obraNombre="Proyecto" />
    </div>
  );
}
