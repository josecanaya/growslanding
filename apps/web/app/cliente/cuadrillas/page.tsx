'use client';

import React, { useState, useEffect } from 'react';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
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
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Button, SectionLayout } from '@/components/ui/grows';
import { UserCheck, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CuadrillasPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const { 
    cuadrillaSeleccionada, 
    showDrawer, 
    showModalAsignacion, 
    filtros, 
    setFiltros,
    fetchCuadrillas,
    cuadrillas,
    isLoading
  } = useCuadrillasStore();
  const cuadrillasStore = useCuadrillasStore();
  const [visorActivo, setVisorActivo] = useState<'cuadrillas' | 'tareas' | 'cumplimiento' | null>(null);
  const [vistaDetalle, setVistaDetalle] = useState(false);
  const [showModalInvitarSocio, setShowModalInvitarSocio] = useState(false);

  // Cargar cuadrillas desde Supabase al montar el componente
  useEffect(() => {
    if (currentUser?.orgId) {
      fetchCuadrillas(currentUser.orgId);
    }
  }, [currentUser?.orgId, fetchCuadrillas]);

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
      <SidebarClienteTecnico
        activeSection="cuadrillas"
        onSectionChange={(section) => {
          if (section === 'cuadrillas') {
            router.push('/cliente/cuadrillas' as Route);
            return;
          }

          router.push((`/cliente/dashboard?section=${section}`) as Route);
        }}
      />

      <div className="flex-1 ml-[220px] relative">
        {!visorActivo && (
          <SectionLayout
            title={vistaDetalle ? filtros.especialidad || 'Especialidad' : 'Gestión de Cuadrillas'}
            subtitle={vistaDetalle ? 'Gestioná las cuadrillas de esta especialidad' : 'Seleccioná una especialidad para ver sus cuadrillas'}
          >
            <div className="mb-4 flex justify-end">
              <Button
                variant={vistaDetalle ? 'ghost' : 'primary'}
                onClick={vistaDetalle ? handleVolverAGrid : () => setShowModalInvitarSocio(true)}
                className={vistaDetalle ? 'mb-0' : ''}
                icon={!vistaDetalle ? <UserCheck className="h-4 w-4" /> : undefined}
              >
                {vistaDetalle ? '← Volver a especialidades' : 'Invitar Socio'}
              </Button>
            </div>

            <TopStats onOpenVisor={handleOpenVisor} />
            {vistaDetalle ? <Kanban /> : <><GruposGrid /><AlertasBloque /></>}
          </SectionLayout>
        )}

        {visorActivo === 'cuadrillas' && (
          <VisorCuadrillasActivas onClose={handleCloseVisor} />
        )}
        {visorActivo === 'tareas' && (
          <VisorTareasEjecucion onClose={handleCloseVisor} />
        )}
        {visorActivo === 'cumplimiento' && (
          <VisorCumplimientoGeneral onClose={handleCloseVisor} />
        )}

        <CuadrillaDrawer cuadrilla={cuadrillaSeleccionada} />
        <AsignarModal />

        {showModalInvitarSocio && (
          <ModalInvitarSocio
            onClose={() => setShowModalInvitarSocio(false)}
            onInvitar={async (socioData) => {
              if (!currentUser?.orgId || !currentUser?.id) {
                toast({
                  title: 'Error',
                  description: 'No estás autenticado',
                });
                return;
              }

              try {
                const response = await fetch('/api/socios/invitar', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-organizacion-id': currentUser.orgId,
                    'x-usuario-id': currentUser.id,
                  },
                  body: JSON.stringify(socioData),
                });

                const result = await response.json();

                if (result.success) {
                  // Si se creó una cuadrilla, recargar la lista
                  if (result.data?.cuadrilla_id) {
                    await cuadrillasStore.fetchCuadrillas(currentUser.orgId);
                  }
                  
                  toast({
                    title: 'Socio invitado',
                    description: result.message || 'Se envió un link de acceso al socio.',
                  });
                  setShowModalInvitarSocio(false);
                } else {
                  toast({
                    title: 'Error',
                    description: result.error || 'No se pudo invitar al socio',
                  });
                }
              } catch (error) {
                console.error('[ERROR_INVITAR_SOCIO]', error);
                toast({
                  title: 'Error',
                  description: 'Error al invitar al socio',
                });
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// Componente Modal Invitar Socio
function ModalInvitarSocio({ onClose, onInvitar }: { 
  onClose: () => void; 
  onInvitar: (socioData: { nombre: string; email?: string; telefono?: string; rol?: string; especialidad?: string }) => Promise<void>;
}) {
  const especialidades: string[] = [
    'Albañilería / Estructura',
    'Yesería / Terminaciones',
    'Carpintería',
    'Plomería / Gas',
    'Electricidad',
    'Pintura'
  ];

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'constructor' as 'constructor' | 'lider' | 'socio',
    especialidad: '' as string
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || (!formData.email && !formData.telefono)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onInvitar({
        nombre: formData.nombre,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        rol: formData.rol,
        especialidad: formData.especialidad || undefined,
      });
    } catch (error) {
      console.error('[ERROR_MODAL_INVITAR_SOCIO]', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Invitar Socio</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Juan Pérez"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="ejemplo@email.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="+54 9 11 1234-5678"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isSubmitting}
              >
                <option value="constructor">Constructor</option>
                <option value="lider">Líder de Cuadrilla</option>
                <option value="socio">Socio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad
              </label>
              <select
                value={formData.especialidad}
                onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isSubmitting}
              >
                <option value="">Seleccionar especialidad (opcional)</option>
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Si seleccionás una especialidad y el rol es &quot;Líder de Cuadrilla&quot;, se creará automáticamente una cuadrilla.
              </p>
            </div>

            <p className="text-xs text-gray-500">
              * Debe proporcionar email o teléfono. Se enviará un link de acceso para que el socio se registre.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !formData.nombre || (!formData.email && !formData.telefono)}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

