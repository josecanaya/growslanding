'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
import { BaseCard, Button, EmptyState, SectionLayout } from '@/components/ui/grows';
import { UserCheck, Users, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Cuadrilla } from '@/lib/types/cuadrillas';
import type { Database } from '@/lib/types/supabase.gen';

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
  const cuadrillasStore = useCuadrillasStore.getState();
  const [visorActivo, setVisorActivo] = useState<'cuadrillas' | 'tareas' | 'cumplimiento' | null>(null);
  const [vistaDetalle, setVistaDetalle] = useState(false);
  const [showModalInvitarSocio, setShowModalInvitarSocio] = useState(false);
  const [viewMode, setViewMode] = useState<'obras' | 'general'>('obras');
  const [statsExtras, setStatsExtras] = useState({ socios: 0, pendientes: 0 });

  // Cargar cuadrillas desde Supabase al montar el componente
  useEffect(() => {
    if (currentUser?.orgId) {
      fetchCuadrillas(currentUser.orgId);
    }
  }, [currentUser?.orgId, fetchCuadrillas]);

  useEffect(() => {
    if (!currentUser?.orgId) {
      setStatsExtras({ socios: 0, pendientes: 0 });
      return;
    }

    const supabase = createClientComponentClient<Database>() as any;

    const cargarStatsExtras = async () => {
      try {
        const { data, error } = await supabase
          .from('socios')
          .select('*')
          .eq('org_id', currentUser.orgId);

        if (!error && Array.isArray(data)) {
          const totalSocios = data.length;
          const pendientes = data.filter((row: any) => {
            const estado = `${row?.status ?? row?.estado ?? ''}`.toLowerCase();
            return estado === 'pendiente' || estado === 'pending' || estado === 'invitado';
          }).length;

          setStatsExtras({ socios: totalSocios, pendientes });
        } else {
          setStatsExtras({ socios: 0, pendientes: 0 });
        }
      } catch (error) {
        console.warn('[CuadrillasPage] Error cargando estadísticas de socios', error);
        setStatsExtras({ socios: 0, pendientes: 0 });
      }
    };

    cargarStatsExtras();
  }, [currentUser?.orgId, showModalInvitarSocio]);

  const handleOpenVisor = (visorType: 'cuadrillas' | 'tareas' | 'cumplimiento') => {
    setVisorActivo(visorType);
  };

  const handleCloseVisor = () => {
    setVisorActivo(null);
  };

  const stats = useMemo(() => {
    const normalizar = (estado?: string) => `${estado ?? ''}`.toLowerCase();

    const activas = cuadrillas.filter((cuadrilla) => {
      const estado = normalizar(cuadrilla.estado);
      return estado.includes('activa') || estado.includes('obra');
    }).length;

    const disponibles = cuadrillas.filter((cuadrilla) => {
      const estado = normalizar(cuadrilla.estado);
      return estado.includes('dispon') || !cuadrilla.obraId;
    }).length;

    return {
      activas,
      disponibles,
      pendientes: statsExtras.pendientes,
      socios: statsExtras.socios,
    };
  }, [cuadrillas, statsExtras]);

  const handleChangeViewMode = (mode: 'obras' | 'general') => {
    setViewMode(mode);

    if (mode === 'general') {
      setVistaDetalle(false);
      setFiltros({ especialidad: undefined });
    }
  };

  const handleVerCuadrilla = (cuadrilla: Cuadrilla) => {
    cuadrillasStore.seleccionarCuadrilla(cuadrilla);
    cuadrillasStore.abrirDrawer();
  };

  const handleAsignarCuadrilla = (cuadrilla: Cuadrilla) => {
    cuadrillasStore.seleccionarCuadrilla(cuadrilla);
    cuadrillasStore.abrirModalAsignacion();
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
      setViewMode('obras');
    }
  }, [filtros.especialidad]);

  const renderGeneralGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <BaseCard key={`cuadrilla-loading-${index}`}>
              <div className="h-20 animate-pulse rounded-grows-md bg-grows-neutral" />
            </BaseCard>
          ))}
        </div>
      );
    }

    if (cuadrillas.length === 0) {
      return (
        <EmptyState
          title="Todavía no cargaste cuadrillas"
          description="Cuando invites o registres cuadrillas, las vas a ver listadas acá."
          icon={<Users className="h-12 w-12 text-growsBlue" />}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cuadrillas.map((cuadrilla) => {
          const integrantes = cuadrilla.integrantes?.length ?? 0;
          const estado = `${cuadrilla.estado ?? 'Sin estado'}`;
          const cumplimiento = cuadrilla.kpi?.cumplimientoPct ?? 0;

          return (
            <BaseCard key={cuadrilla.id} title={cuadrilla.nombre} subtitle={cuadrilla.especialidad}>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-growsTextMuted">
                  <span>{integrantes} integrante{integrantes === 1 ? '' : 's'}</span>
                  <span className="rounded-grows-full bg-growsBlueLight/10 px-2 py-1 text-growsBlue">
                    {estado.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-growsTextMuted">
                  Cumplimiento promedio: {cumplimiento}%
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleVerCuadrilla(cuadrilla)}>
                    Ver detalle
                  </Button>
                  <Button size="sm" onClick={() => handleAsignarCuadrilla(cuadrilla)}>
                    Asignar
                  </Button>
                </div>
              </div>
            </BaseCard>
          );
        })}
      </div>
    );
  };

  const sectionTitle = viewMode === 'general'
    ? 'Todas las cuadrillas'
    : vistaDetalle
    ? filtros.especialidad || 'Especialidad'
    : 'Gestión de Cuadrillas';

  const sectionSubtitle = viewMode === 'general'
    ? 'Explorá todas las cuadrillas de tu organización'
    : vistaDetalle
    ? 'Gestioná las cuadrillas de esta especialidad'
    : 'Seleccioná una especialidad para ver sus cuadrillas';

  const toggleViewLabel = viewMode === 'general' ? 'Ver por especialidad' : 'Ver todas';
 
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
            title={sectionTitle}
            subtitle={sectionSubtitle}
          >
            <section className="mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-growsText">Panel General de Cuadrillas</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => handleChangeViewMode(viewMode === 'general' ? 'obras' : 'general')}>
                    {toggleViewLabel}
                  </Button>
                  <Button onClick={() => setShowModalInvitarSocio(true)} icon={<UserCheck className="h-4 w-4" />}>
                    Invitar socio
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <BaseCard title="Cuadrillas Activas">
                  <p className="text-2xl font-semibold text-growsBlue">{stats.activas}</p>
                </BaseCard>
                <BaseCard title="Disponibles">
                  <p className="text-2xl font-semibold text-growsBlue">{stats.disponibles}</p>
                </BaseCard>
                <BaseCard title="Invitaciones Pendientes">
                  <p className="text-2xl font-semibold text-growsBlue">{stats.pendientes}</p>
                </BaseCard>
                <BaseCard title="Socios Totales">
                  <p className="text-2xl font-semibold text-growsBlue">{stats.socios}</p>
                </BaseCard>
              </div>
            </section>

            {viewMode === 'general' ? (
              renderGeneralGrid()
            ) : (
              <>
                {vistaDetalle && (
                  <div className="mb-4 flex justify-end">
                    <Button variant="ghost" onClick={handleVolverAGrid}>
                      ← Volver a especialidades
                    </Button>
                  </div>
                )}

                <TopStats onOpenVisor={handleOpenVisor} />
                {vistaDetalle ? (
                  <Kanban />
                ) : (
                  <>
                    <GruposGrid />
                    <AlertasBloque />
                  </>
                )}
              </>
            )}
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

