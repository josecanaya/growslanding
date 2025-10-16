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
import { Button, SectionLayout } from '@/components/ui/grows';

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
    <div className="min-h-screen bg-grows-background flex">
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
              <SectionLayout
                title="Gestión de Cuadrillas"
                subtitle="Seleccioná una especialidad para ver sus cuadrillas"
              >
                {/* KPIs esenciales */}
                <TopStats onOpenVisor={handleOpenVisor} />

                {/* Grid de grupos */}
                <GruposGrid />

                {/* Bloque de alertas */}
                <AlertasBloque />
              </SectionLayout>
            )}

            {/* Vista de detalle (cuadrillas de una especialidad) */}
            {vistaDetalle && (
              <SectionLayout
                title={filtros.especialidad || 'Especialidad'}
                subtitle="Gestiona las cuadrillas de esta especialidad"
              >
                {/* Botón volver */}
                <Button
                  variant="ghost"
                  onClick={handleVolverAGrid}
                  className="mb-4"
                >
                  ← Volver a especialidades
                </Button>

                {/* KPIs esenciales */}
                <TopStats onOpenVisor={handleOpenVisor} />

                {/* Tablero Kanban (solo muestra la especialidad filtrada) */}
                <Kanban />
              </SectionLayout>
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
