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
        title="El proyecto se habla"
        description="Chateá en Cursor. El MCP lee la inteligencia de construcción (grows-conocimiento). Este canvas es el horizonte: IDEA → transformación → estado. El front es libre; Grows da el marco y mide tokens."
      />
      <ProyectoVivoCanvas obraId={obraId} obraNombre="Proyecto" />
    </div>
  );
}
