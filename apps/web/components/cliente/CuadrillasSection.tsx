'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import type { Obra } from '@/types/obras';
import { TopStats } from '@/components/cuadrillas/TopStats';
import { CuadrillaDrawer } from '@/components/cuadrillas/CuadrillaDrawer';
import { AsignarModal } from '@/components/cuadrillas/AsignarModal';
import { VisorCuadrillasActivas } from '@/components/cuadrillas/VisorCuadrillasActivas';
import { VisorTareasEjecucion } from '@/components/cuadrillas/VisorTareasEjecucion';
import { VisorCumplimientoGeneral } from '@/components/cuadrillas/VisorCumplimientoGeneral';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { BaseCard, Button, EmptyState, SectionLayout } from '@/components/ui/grows';
import { useToast } from '@/components/ui/use-toast';
import { Building2, CheckCircle, ClipboardList, TrendingUp, UserCheck, Users, X, Trash2 } from 'lucide-react';
import { useSubscription } from '@/lib/subscriptions';
import { canUseFeature, usePlanGate } from '@/lib/permissions';
import { ObraCard } from '@/components/obras/ui/ObraCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Kanban } from '@/components/cuadrillas/Kanban';
import type { Especialidad } from '@/lib/types/cuadrillas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CuadrillasSectionProps {
  onNavigate?: (section: string) => void;
}

const TAB_ITEMS = [
  { id: 'asignadas', label: 'Asignadas', icon: Users },
  { id: 'disponibles', label: 'Disponibles', icon: ClipboardList },
  { id: 'invitaciones', label: 'Invitaciones', icon: CheckCircle },
  { id: 'evaluaciones', label: 'Evaluaciones', icon: TrendingUp },
  { id: 'resumen', label: 'Resumen', icon: Building2 },
] as const;

type TabValue = (typeof TAB_ITEMS)[number]['id'];

const ESPECIALIDADES: Especialidad[] = [
  'Albañilería / Estructura',
  'Yesería / Terminaciones',
  'Carpintería',
  'Plomería / Gas',
  'Electricidad',
  'Pintura',
];

export function CuadrillasSection({ onNavigate }: CuadrillasSectionProps) {
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const { cuadrillaSeleccionada, showDrawer, showModalAsignacion, fetchCuadrillas, cuadrillas, eliminarCuadrilla } = useCuadrillasStore();
  const cuadrillasStore = useCuadrillasStore.getState();
  const [visorActivo, setVisorActivo] = useState<'cuadrillas' | 'tareas' | 'cumplimiento' | null>(null);
  const [showModalInvitarSocio, setShowModalInvitarSocio] = useState(false);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loadingObras, setLoadingObras] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('asignadas');
  const [especialidadDisponible, setEspecialidadDisponible] = useState<Especialidad | null>(null);
  const [viewMode, setViewMode] = useState<'obras' | 'general'>('obras');
  const [statsExtras, setStatsExtras] = useState({ socios: 0, pendientes: 0 });
  const supabase = createClientComponentClient<Database>();
  const { planId } = useSubscription();
  const { verifyAccess } = usePlanGate();
  const canUseCuadrillas = canUseFeature(planId, 'cuadrillas');

  useEffect(() => {
    if (currentUser?.orgId) {
      fetchCuadrillas(currentUser.orgId);
    }
  }, [currentUser?.orgId, fetchCuadrillas]);

  useEffect(() => {
    const cargarStatsExtras = async () => {
      if (!currentUser?.orgId) {
        setStatsExtras({ socios: 0, pendientes: 0 });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('socios')
          .select('*')
          .eq('org_id', currentUser.orgId);

        if (error || !data) {
          setStatsExtras({ socios: 0, pendientes: 0 });
          return;
        }

        const total = data.length;
        const pendientes = data.filter((row: any) => {
          const estado = `${row?.status ?? row?.estado ?? ''}`.toLowerCase();
          return estado === 'pendiente' || estado === 'pending' || estado === 'invitado';
        }).length;

        setStatsExtras({ socios: total, pendientes });
      } catch (error) {
        console.warn('[CuadrillasSection] Error cargando stats de socios', error);
        setStatsExtras({ socios: 0, pendientes: 0 });
      }
    };

    cargarStatsExtras();
  }, [currentUser?.orgId, showModalInvitarSocio, supabase]);

  useEffect(() => {
    const cargarObras = async () => {
      if (!currentUser?.orgId) {
        setObras([]);
        setLoadingObras(false);
        return;
      }

      try {
        setLoadingObras(true);
        const { data, error } = await supabase
          .from('obras')
          .select('*')
          .eq('org_id', currentUser.orgId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[CuadrillasSection] Error cargando obras:', error);
          setObras([]);
          return;
        }

        const obrasFormateadas: Obra[] = ((data as any[]) || []).map((obra) => ({
          id: obra.id,
          nombre: obra.name || 'Sin nombre',
          cliente: obra.propietario || 'Sin cliente',
          localizacion: obra.address || 'Sin dirección',
          estado: obra.estado || 'ACTIVA',
          created_at: obra.created_at,
          fecha_inicio: obra.created_at,
          tipoObra: obra.tipo_obra || 'nueva',
          progreso: obra.progreso ?? 0,
        }));

        setObras(obrasFormateadas);
      } catch (error) {
        console.error('[CuadrillasSection] Excepción cargando obras:', error);
        setObras([]);
      } finally {
        setLoadingObras(false);
      }
    };

    cargarObras();
  }, [currentUser?.orgId, supabase]);

  const obrasActivas = useMemo(() => obras, [obras]);

  const selectedObraId = selectedObra?.id;

  const cuadrillasAsignadas = useMemo(() => {
    if (!selectedObraId) return [];
    
    // Buscar tareas de esta obra que tengan cuadrilla_id asignado
    // Las cuadrillas asignadas son aquellas que tienen al menos una tarea en esta obra
    return cuadrillas.filter((cuadrilla) => {
      // Verificar si esta cuadrilla tiene tareas asignadas en esta obra
      // Esto se hace buscando en las tareas que tienen cuadrilla_id igual al ID del socio
      // Por ahora, retornamos todas las cuadrillas y luego las filtraremos con un useEffect
      return true; // Temporal: se filtrará con useEffect
    });
  }, [cuadrillas, selectedObraId]);
  
  // Estado para almacenar las cuadrillas realmente asignadas a esta obra
  const [cuadrillasAsignadasReal, setCuadrillasAsignadasReal] = useState<typeof cuadrillas>([]);
  
  // useEffect para buscar las cuadrillas asignadas a esta obra
  useEffect(() => {
    const buscarCuadrillasAsignadas = async () => {
      if (!selectedObraId || !currentUser?.orgId) {
        setCuadrillasAsignadasReal([]);
        return;
      }
      
      try {
        // Buscar tareas de esta obra que tengan cuadrilla_id asignado
        const { data: tareasData, error: tareasError } = await supabase
          .from('tareas')
          .select('id, cuadrilla_id, obra_id')
          .eq('obra_id', selectedObraId)
          .eq('org_id', currentUser.orgId)
          .not('cuadrilla_id', 'is', null);
        
        if (tareasError) {
          console.error('[CuadrillasSection] Error buscando tareas asignadas:', tareasError);
          setCuadrillasAsignadasReal([]);
          return;
        }
        
        // Obtener los IDs únicos de las cuadrillas asignadas
        const cuadrillaIdsAsignadas = new Set(
          (tareasData || [])
            .map((t: any) => t.cuadrilla_id)
            .filter((id: string | null): id is string => id !== null)
        );
        
        // Filtrar las cuadrillas que están asignadas
        const asignadas = cuadrillas.filter((c) => cuadrillaIdsAsignadas.has(c.id));
        
        setCuadrillasAsignadasReal(asignadas);
      } catch (error) {
        console.error('[CuadrillasSection] Excepción buscando cuadrillas asignadas:', error);
        setCuadrillasAsignadasReal([]);
      }
    };
    
    buscarCuadrillasAsignadas();
  }, [selectedObraId, cuadrillas, currentUser?.orgId, supabase]);

  const cuadrillasDisponibles = useMemo(() => {
    return cuadrillas.filter((cuadrilla) => {
      const estado = `${cuadrilla.estado ?? ''}`.toLowerCase();
      const esDisponible = estado.includes('disponible');
      const sinObra = !cuadrilla.obraId;
      return esDisponible || sinObra;
    });
  }, [cuadrillas]);

  const filteredCuadrillas = useMemo(() => {
    if (!especialidadDisponible) {
      return cuadrillasDisponibles;
    }

    return cuadrillasDisponibles.filter((cuadrilla) => cuadrilla.especialidad === especialidadDisponible);
  }, [cuadrillasDisponibles, especialidadDisponible]);

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

  const handleOpenVisor = (visorType: 'cuadrillas' | 'tareas' | 'cumplimiento') => setVisorActivo(visorType);
  const handleCloseVisor = () => setVisorActivo(null);
  const handleSelectObra = (obra: Obra) => {
    setSelectedObra(obra);
    setActiveTab('asignadas');
    setViewMode('obras');
  };
  const handleBackToListado = () => setSelectedObra(null);
  const handleAsignarCuadrilla = (cuadrillaId: string) => {
    const cuadrilla = cuadrillas.find((item) => item.id === cuadrillaId);
    if (!cuadrilla) return;

    cuadrillasStore.seleccionarCuadrilla(cuadrilla);
    cuadrillasStore.abrirModalAsignacion();
  };

  const handlePedirPresupuesto = (cuadrillaId: string) => {
    const cuadrilla = cuadrillas.find((item) => item.id === cuadrillaId);
    if (!cuadrilla) {
      return;
    }

    toast({
      title: 'Pedir presupuesto',
      description: `Pronto vas a poder solicitar presupuesto directo a ${cuadrilla.nombre}. Te llevo al módulo de presupuestos.`,
    });

    onNavigate?.('presupuestos');
  };

  const handleEliminarCuadrilla = async (cuadrillaId: string) => {
    if (!currentUser?.orgId) {
      toast({
        title: 'Error',
        description: 'No estás autenticado',
        variant: 'destructive',
      });
      return;
    }

    const cuadrilla = cuadrillas.find((item) => item.id === cuadrillaId);
    if (!cuadrilla) {
      return;
    }

    // Confirmar eliminación
    if (!confirm(`¿Estás seguro de que querés eliminar la cuadrilla "${cuadrilla.nombre}"?`)) {
      return;
    }

    const success = await eliminarCuadrilla(cuadrillaId, currentUser.orgId);
    if (success) {
      toast({
        title: 'Cuadrilla eliminada',
        description: `La cuadrilla "${cuadrilla.nombre}" fue eliminada correctamente.`,
      });
      // Refrescar la lista
      await fetchCuadrillas(currentUser.orgId);
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cuadrilla. Intentá nuevamente.',
        variant: 'destructive',
      });
    }
  };

  const handleChangeViewMode = (mode: 'obras' | 'general') => {
    setViewMode(mode);
    if (mode === 'general') {
      setSelectedObra(null);
    }
  };

  const handleVerCuadrilla = (cuadrillaId: string) => {
    const cuadrilla = cuadrillas.find((item) => item.id === cuadrillaId);
    if (!cuadrilla) return;
    cuadrillasStore.seleccionarCuadrilla(cuadrilla);
    cuadrillasStore.abrirDrawer();
  };

  if (!canUseCuadrillas) {
    const handleClose = () => onNavigate?.('obras');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-neutral-950/60 px-6 backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(203,161,53,0.22),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(12,29,54,0.55),_transparent_55%)] opacity-80"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-neutral-200/25" aria-hidden="true" />
        <div className="relative max-w-md space-y-4 rounded-2xl border border-neutral-700/60 bg-neutral-900/80 p-8 text-center text-zinc-100 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleClose}
            className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white transition hover:bg-black/90"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#CBA135]/20 text-[#CBA135]">
            <UserCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-50">Gestión de cuadrillas en plan Starter</h1>
          <p className="text-sm text-zinc-200">
            Organizá tus equipos, gestioná asignaciones y controlá cargas operativas al activar el plan Starter o superior.
          </p>
          <button
            type="button"
            onClick={() => verifyAccess('cuadrillas', 'STARTER')}
            className="w-full rounded-xl bg-[#CBA135] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#d3ad45]"
          >
            Activar plan Starter
          </button>
        </div>
      </div>
    );
  }

  const progresoGeneral = selectedObra?.progreso ?? 0;
  const fechaInicio = selectedObra?.fecha_inicio || selectedObra?.created_at;
  const fechaInicioFormatted = fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-AR') : 'N/D';

  const renderGeneralGrid = () => {
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
          const cumplimiento = cuadrilla.kpi?.cumplimientoPct ?? 0;
          const estado = `${cuadrilla.estado ?? 'Sin estado'}`.toUpperCase();

          return (
            <BaseCard key={cuadrilla.id} title={cuadrilla.nombre} subtitle={cuadrilla.especialidad}>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-growsTextMuted">
                  <span>{integrantes} integrante{integrantes === 1 ? '' : 's'}</span>
                  <span className="rounded-grows-full bg-growsBlueLight/10 px-2 py-1 text-growsBlue">{estado}</span>
                </div>
                <p className="text-sm text-growsTextMuted">Cumplimiento promedio: {cumplimiento}%</p>
                <div className="flex gap-2 items-center">
                  <Button size="sm" variant="secondary" onClick={() => handleVerCuadrilla(cuadrilla.id)}>
                    Ver detalle
                  </Button>
                  <Button size="sm" onClick={() => handleAsignarCuadrilla(cuadrilla.id)}>
                    Asignar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleEliminarCuadrilla(cuadrilla.id)}
                    className="ml-auto"
                    title="Eliminar cuadrilla"
                  >
                    <Trash2 className="h-4 w-4" />
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
    : 'Gestión de Cuadrillas';

  const sectionSubtitle = viewMode === 'general'
    ? 'Explorá y gestioná todas tus cuadrillas desde un solo lugar'
    : 'Seleccioná una obra para ver y administrar sus cuadrillas';

  return (
    <>
      {!selectedObra ? (
        <SectionLayout title={sectionTitle} subtitle={sectionSubtitle}>
          <section className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-growsText">Panel General de Cuadrillas</h2>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleChangeViewMode(viewMode === 'general' ? 'obras' : 'general')}
                >
                  {viewMode === 'general' ? 'Ver por obra' : 'Ver todas'}
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
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-growsTextMuted">
                  Tenés {obrasActivas.length} obra{obrasActivas.length === 1 ? '' : 's'} disponibles
                </p>
              </div>

              {loadingObras ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <BaseCard key={`obra-loading-${index}`}>Cargando obras…</BaseCard>
                  ))}
                </div>
              ) : obrasActivas.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {obrasActivas.map((obra) => (
                    <ObraCard
                      key={obra.id}
                      obra={obra}
                      onView={() => handleSelectObra(obra)}
                      onEdit={() => undefined}
                      onDelete={() => undefined}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Todavía no cargaste obras"
                  description="Cuando generes tu primera obra, vas a poder gestionar sus cuadrillas desde acá."
                />
              )}
            </>
          )}
        </SectionLayout>
      ) : (
        <SectionLayout title="Gestión de Cuadrillas" subtitle="Administrá tus equipos por obra sin salir del panel">
          <BaseCard>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={handleBackToListado}>
                  ← Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold text-growsBlue">{selectedObra.nombre}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-growsTextMuted">
                    <span>Cliente: {selectedObra.cliente || 'Sin cliente'}</span>
                    <span>Tipo: {selectedObra.tipoObra ? selectedObra.tipoObra.toUpperCase() : 'N/D'}</span>
                    <span>Inicio: {fechaInicioFormatted}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-growsTextMuted">Progreso general</div>
                  <div className="text-lg font-bold text-growsBlue">{progresoGeneral}%</div>
                </div>
                <div className="h-2 w-20 rounded-full bg-grows-gray">
                  <div className="h-2 rounded-full bg-growsBlue transition-all duration-300" style={{ width: `${progresoGeneral}%` }} />
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard className="p-0">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
              <TabsList className="grid w-full grid-cols-5 rounded-t-grows-lg border-b border-grows-border bg-grows-surface/70">
                {TAB_ITEMS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`flex items-center justify-center gap-2 rounded-none px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-growsBlue/10 text-growsBlue shadow-inner'
                          : 'text-growsTextMuted hover:bg-grows-gray hover:text-growsBlue'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="asignadas" className="p-6">
                {cuadrillasAsignadasReal.length === 0 ? (
                  <EmptyState
                    title="Sin cuadrillas asignadas"
                    description="Aún no hay cuadrillas trabajando en esta obra."
                    icon={<Users className="h-12 w-12 text-growsBlue" />}
                  />
                ) : (
                  <section className="space-y-6">
                    <TopStats onOpenVisor={handleOpenVisor} />
                    <Kanban cuadrillas={cuadrillasAsignadasReal} />
                  </section>
                )}
              </TabsContent>
              <TabsContent value="disponibles" className="p-6">
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-growsText">Cuadrillas disponibles</h3>
                    <Select
                      value={especialidadDisponible ?? 'todas'}
                      onValueChange={(value) => {
                        if (value === 'todas') {
                          setEspecialidadDisponible(null);
                        } else {
                          setEspecialidadDisponible(value as Especialidad);
                        }
                      }}
                    >
                      <SelectTrigger className="w-56 border-grows-border">
                        <SelectValue placeholder="Todas las especialidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las especialidades</SelectItem>
                        {ESPECIALIDADES.map((esp) => (
                          <SelectItem key={esp} value={esp}>
                            {esp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredCuadrillas.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {filteredCuadrillas.map((cuadrilla) => {
                        const integrantesCount = cuadrilla.integrantes?.length ?? 0;
                        const cumplimiento = cuadrilla.kpi?.cumplimientoPct ?? 0;

                        return (
                          <BaseCard key={cuadrilla.id} title={cuadrilla.nombre} subtitle={cuadrilla.especialidad}>
                            <div className="space-y-2">
                              <p className="text-sm text-growsTextMuted">
                                {integrantesCount} integrante{integrantesCount === 1 ? '' : 's'} · {cumplimiento}% cumplimiento
                              </p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="secondary" className="border-grows-border" onClick={() => handleAsignarCuadrilla(cuadrilla.id)}>
                                  Asignar manualmente
                                </Button>
                                <Button size="sm" onClick={() => handlePedirPresupuesto(cuadrilla.id)}>
                                  Pedir presupuesto
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="danger" 
                                  onClick={() => handleEliminarCuadrilla(cuadrilla.id)}
                                  className="ml-auto"
                                  title="Eliminar cuadrilla"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </BaseCard>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      title="Sin cuadrillas disponibles"
                      description="No hay cuadrillas libres para esta especialidad."
                      icon={<Users className="h-10 w-10 text-growsBlue" />}
                    />
                  )}
                </section>
              </TabsContent>
              <TabsContent value="invitaciones" className="p-6">
                <BaseCard>Invitaciones pendientes de socios</BaseCard>
              </TabsContent>
              <TabsContent value="evaluaciones" className="p-6">
                <BaseCard>Evaluaciones y desempeño</BaseCard>
              </TabsContent>
              <TabsContent value="resumen" className="p-6">
                <BaseCard>Resumen general de cuadrillas</BaseCard>
              </TabsContent>
            </Tabs>
          </BaseCard>
        </SectionLayout>
      )}

      {visorActivo === 'cuadrillas' && <VisorCuadrillasActivas onClose={handleCloseVisor} />}
      {visorActivo === 'tareas' && <VisorTareasEjecucion onClose={handleCloseVisor} />}
      {visorActivo === 'cumplimiento' && <VisorCumplimientoGeneral onClose={handleCloseVisor} />}

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
    </>
  );
}

function ModalInvitarSocio({
  onClose,
  onInvitar,
}: {
  onClose: () => void;
  onInvitar: (socioData: { nombre: string; email?: string; telefono?: string; rol?: string; especialidad?: string }) => Promise<void>;
}) {
  const especialidades: string[] = ESPECIALIDADES;

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'constructor' as 'constructor' | 'lider' | 'socio',
    especialidad: '' as string,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-grows-lg bg-grows-surface p-6 shadow-grows-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-growsBlue">Invitar socio</h2>
          <button onClick={onClose} className="text-growsTextMuted hover:text-growsBlue" type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-growsBlue">Nombre completo *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
              className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-growsBlue"
              placeholder="Ej: Juan Pérez"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-growsBlue">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-growsBlue"
              placeholder="ejemplo@email.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-growsBlue">Teléfono</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
              className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-growsBlue"
              placeholder="+54 9 11 1234-5678"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-growsBlue">Rol</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData((prev) => ({ ...prev, rol: e.target.value as 'constructor' | 'lider' | 'socio' }))}
              className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-growsBlue"
              disabled={isSubmitting}
            >
              <option value="constructor">Constructor</option>
              <option value="lider">Líder de cuadrilla</option>
              <option value="socio">Socio</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-growsBlue">Especialidad</label>
            <select
              value={formData.especialidad}
              onChange={(e) => setFormData((prev) => ({ ...prev, especialidad: e.target.value }))}
              className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-growsBlue"
              disabled={isSubmitting}
            >
              <option value="">Seleccionar especialidad (opcional)</option>
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-growsTextMuted">
              Si seleccionás una especialidad y el rol es &quot;Líder de Cuadrilla&quot;, se creará automáticamente una cuadrilla.
            </p>
          </div>

          <p className="text-xs text-growsTextMuted">
            * Debe proporcionar email o teléfono. Se enviará un link de acceso para que el socio se registre.
          </p>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting || !formData.nombre || (!formData.email && !formData.telefono)}
            >
              {isSubmitting ? 'Enviando…' : 'Enviar invitación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

