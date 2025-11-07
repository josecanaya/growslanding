'use client';

import { useRouter } from 'next/navigation';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import { WizardCrearObraLayout } from '@/components/obras/wizardNuevo/WizardCrearObraLayout';
// LEGACY: mantener referencia al wizard anterior.
// import { WizardCrearObraNuevo } from '@/components/cliente/WizardCrearObraNuevo';

export default function NuevaObraPage() {
  const router = useRouter();

  const handleSuccess = (obra: any) => {
    // Redirigir al listado de obras despuÃ©s de crear exitosamente
    router.push('/obras');
  };

  const handleCancel = () => {
    // Redirigir al listado de obras al cancelar
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
        <WizardCrearObraLayout 
          onComplete={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
