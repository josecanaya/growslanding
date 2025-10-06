'use client';

import { useRouter } from 'next/navigation';
import { SidebarClienteTecnico } from '@/components/clienteTecnico/SidebarClienteTecnico';
import { WizardCrearObraNuevo } from '@/components/clienteTecnico/wizard/WizardCrearObraNuevo';

export default function NuevaObraPage() {
  const router = useRouter();

  const handleSuccess = (obra: any) => {
    // Redirigir al dashboard de obras después de crear exitosamente
    router.push('/obras');
  };

  const handleCancel = () => {
    // Redirigir al dashboard de obras al cancelar
    router.push('/obras');
  };

  return (
    <div className="min-h-screen bg-secundario flex">
      {/* Sidebar */}
      <SidebarClienteTecnico 
        activeSection="obras"
        onSectionChange={(section) => {
          if (section !== 'obras') {
            router.push('/cliente-tecnico');
          } else {
            router.push('/obras');
          }
        }}
      />
      
      {/* Contenedor principal - Wizard */}
      <div className="flex-1 ml-[220px]">
        <WizardCrearObraNuevo 
          onComplete={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
