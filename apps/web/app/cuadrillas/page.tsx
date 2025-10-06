'use client';

import { SidebarClienteTecnico } from '@/components/clienteTecnico/SidebarClienteTecnico';
import { useState } from 'react';
import { TopStats } from '@/components/cuadrillas/TopStats';
import { Filters } from '@/components/cuadrillas/Filters';
import { Kanban } from '@/components/cuadrillas/Kanban';
import { CuadrillaDrawer } from '@/components/cuadrillas/CuadrillaDrawer';
import { AsignarModal } from '@/components/cuadrillas/AsignarModal';
import { VisorCuadrillasActivas } from '@/components/cuadrillas/VisorCuadrillasActivas';
import { VisorTareasEjecucion } from '@/components/cuadrillas/VisorTareasEjecucion';
import { VisorCumplimientoGeneral } from '@/components/cuadrillas/VisorCumplimientoGeneral';
import { VisorAlertasRiesgo } from '@/components/cuadrillas/VisorAlertasRiesgo';
import { TestVisor } from '@/components/cuadrillas/TestVisor';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { useRouter } from 'next/navigation';

export default function CuadrillasPage() {
  const router = useRouter();
  const { cuadrillaSeleccionada, showDrawer, showModalAsignacion } = useCuadrillasStore();
  const [visorActivo, setVisorActivo] = useState<'cuadrillas' | 'tareas' | 'cumplimiento' | 'alertas' | 'test' | null>(null);

  const handleOpenVisor = (visorType: 'cuadrillas' | 'tareas' | 'cumplimiento' | 'alertas' | 'test') => {
    setVisorActivo(visorType);
  };

  const handleCloseVisor = () => {
    setVisorActivo(null);
  };

  return (
    <div className="min-h-screen bg-secundario flex">
      {/* Sidebar */}
      <SidebarClienteTecnico 
        activeSection="cuadrillas"
        onSectionChange={(section) => {
          if (section !== 'cuadrillas') {
            router.push('/cliente-tecnico');
          }
        }}
      />
      
      {/* Contenedor principal */}
      <div className="flex-1 ml-[220px] relative">
        {/* Contenido normal (dashboard) */}
        {!visorActivo && (
          <div className="p-8">
            {/* Header simplificado */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Cuadrillas</h1>
                  <p className="text-gray-600 mt-1">
                    Organiza cuadrillas por especialidad y gestiona asignaciones
                  </p>
                </div>
                <button
                  onClick={() => handleOpenVisor('test')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  🧪 Probar Visor
                </button>
              </div>
            </div>

            {/* KPIs esenciales */}
            <TopStats onOpenVisor={handleOpenVisor} />

            {/* Filtros y búsqueda */}
            <Filters />

            {/* Tablero Kanban */}
            <Kanban />
          </div>
        )}

        {/* Visores de KPIs */}
        {visorActivo === 'cuadrillas' && (
          <VisorCuadrillasActivas onClose={handleCloseVisor} />
        )}
        {visorActivo === 'tareas' && (
          <VisorTareasEjecucion onClose={handleCloseVisor} />
        )}
        {visorActivo === 'cumplimiento' && (
          <VisorCumplimientoGeneral onClose={handleCloseVisor} />
        )}
        {visorActivo === 'alertas' && (
          <VisorAlertasRiesgo onClose={handleCloseVisor} />
        )}
        {visorActivo === 'test' && (
          <TestVisor onClose={handleCloseVisor} />
        )}

        {/* Drawer lateral para detalles */}
        <CuadrillaDrawer cuadrilla={cuadrillaSeleccionada} />

        {/* Modal de asignación */}
        <AsignarModal />
      </div>
    </div>
  );
}
