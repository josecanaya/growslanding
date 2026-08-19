import { ProyectoVivoCanvas } from '@/components/cliente/proyecto-vivo/ProyectoVivoCanvas';
import { SectionHeader } from '@/components/cliente/SectionHeader';

export default async function ProyectoGrafoPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-2 py-2">
      <SectionHeader
        eyebrow="Horizonte"
        title="El proyecto"
        description="Preguntá. El horizonte solo anota un paso si lo escribís como verbo → estado."
      />
      <ProyectoVivoCanvas obraId={obraId} obraNombre="Proyecto" />
    </div>
  );
}
