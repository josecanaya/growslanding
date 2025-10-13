'use client';

import React, { useState, useEffect } from 'react';
import { SidebarClienteTecnico } from '@/components/clienteTecnico/SidebarClienteTecnico';
import { TopStats } from '@/components/cuadrillas/TopStats';
import { GruposGrid } from '@/components/cuadrillas/GruposGrid';
import { AlertasBloque } from '@/components/cuadrillas/AlertasBloque';
import { Kanban } from '@/components/cuadrillas/Kanban';
import { CuadrillaDrawer } from '@/components/cuadrillas/CuadrillaDrawer';
import { AsignarModal } from '@/components/cuadrillas/AsignarModal';
import { VisorCuadrillasActivas } from '@/components/cuadrillas/VisorCuadrillasActivas';
import { VisorTareasEjecucion } from '@/components/cuadrillas/VisorTareasEjecucion';
import { VisorCumplimientoGeneral } from '@/components/cuadrillas/VisorCumplimientoGeneral';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { useRouter } from 'next/navigation';

export default function CuadrillasPage() {
  const router = useRouter();
  const { cuadrillaSeleccionada, showDrawer, showModalAsignacion, filtros, setFiltros } = useCuadrillasStore();
  const [visorActivo, setVisorActivo] = useState<'cuadrillas' | 'tareas' | 'cumplimiento' | null>(null);
  const [vistaDetalle, setVistaDetalle] = useState(false);

  const handleOpenVisor = (visorType: 'cuadrillas' | 'tareas' | 'cumplimiento') => {
    setVisorActivo(visorType);
  };

  const handleCloseVisor = () => {
    setVisorActivo(null);
  };

  // Detectar cuando se filtra por especialidad para mostrar vista detalle
  const handleVolverAGrid = () => {
    setVistaDetalle(false);
    setFiltros({ especialidad: undefined });
  };

  // Efecto para detectar cambio de filtro de especialidad
  useEffect(() => {
    if (filtros.especialidad) {
      setVistaDetalle(true);
    }
  }, [filtros.especialidad]);

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
          <>
            {/* Vista de Grid (grupos) */}
            {!vistaDetalle && (
              <div className="p-8" style={{ backgroundColor: '#eaf0f6' }}>
                {/* Header simplificado */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold" style={{ color: '#10161a' }}>Gestión de Cuadrillas</h1>
                      <p className="mt-1" style={{ color: '#5b5f6a' }}>
                        Seleccioná una especialidad para ver sus cuadrillas
                      </p>
                    </div>
                  </div>
                </div>

                {/* KPIs esenciales */}
                <TopStats onOpenVisor={handleOpenVisor} />

                {/* Grid de grupos */}
                <GruposGrid />

                {/* Bloque de alertas */}
                <AlertasBloque />
              </div>
            )}

            {/* Vista de detalle (cuadrillas de una especialidad) */}
            {vistaDetalle && (
              <div className="p-8">
                {/* Header con botón volver */}
                <div className="mb-6">
                  <button
                    onClick={handleVolverAGrid}
                    className="mb-4 flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    style={{
                      backgroundColor: '#f5f7fa',
                      color: '#1B263B',
                      border: '1px solid #dce3ea'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e8ecf0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f7fa';
                    }}
                  >
                    <span>←</span>
                    <span>Volver a especialidades</span>
                  </button>

                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{filtros.especialidad}</h1>
                      <p className="text-gray-600 mt-1">
                        Gestiona las cuadrillas de esta especialidad
                      </p>
                    </div>
                  </div>
                </div>

                {/* KPIs esenciales */}
                <TopStats onOpenVisor={handleOpenVisor} />

                {/* Tablero Kanban (solo muestra la especialidad filtrada) */}
                <Kanban />
              </div>
            )}
          </>
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

        {/* Drawer lateral para detalles */}
        <CuadrillaDrawer cuadrilla={cuadrillaSeleccionada} />

        {/* Modal de asignación */}
        <AsignarModal />
      </div>
    </div>
  );
}
