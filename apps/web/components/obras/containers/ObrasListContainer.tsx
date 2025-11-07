'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, AlertCircle, Save, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { DetalleObra } from '@/components/cliente/DetalleObra';
import { useUpgradeModal } from '@/components/subscriptions/UpgradeModal';
import { usePlanLimitGuard } from '@/lib/subscriptions';
import { Button, Card, SectionLayout } from '@/components/ui/grows';
import { Obra, ObraFormState, ObraStats, INITIAL_OBRA_FORM_STATE } from '@/types/obras';
import { ObraCard } from '../ui/ObraCard';
import { ObrasStatsRow } from '../ui/ObrasStatsRow';
import { EmptyState } from '../ui/EmptyState';

const DEFAULT_OBRAS: Obra[] = [
  {
    id: '1',
    nombre: 'Obra de Prueba',
    localizacion: 'Ubicación de prueba',
    estado: 'ACTIVA',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    fecha_inicio: '2024-01-15',
    presupuesto: 100000,
    descripcion: 'Esta es una obra de prueba para desarrollo',
    cliente: 'Cliente de Prueba',
    tipoObra: 'nueva',
    numeroPermiso: 'PERM-001',
    progreso: 25,
    tareasActivas: 3,
    tareasCompletadas: 1,
    legajoTecnico: [],
  },
  {
    id: '2',
    nombre: 'Casa Barrio Norte',
    localizacion: 'Av. Rivadavia 1234, Rosario',
    estado: 'ACTIVA',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    fecha_inicio: '2024-03-01',
    presupuesto: 240000,
    descripcion: 'Vivienda unifamiliar - nueva. Flujo creado con el nuevo wizard.',
    cliente: 'María González',
    tipoObra: 'nueva',
    numeroPermiso: 'PERM-047',
    progreso: 12,
    tareasActivas: 1,
    tareasCompletadas: 0,
    legajoTecnico: [],
  },
];

export function ObrasListContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [obras, setObras] = useState<Obra[]>([]);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ObraFormState>(INITIAL_OBRA_FORM_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const upgradeModal = useUpgradeModal();
  const obrasLimitGuard = usePlanLimitGuard('obras');

  // Función para cargar obras (memoizada)
  const loadObras = useCallback(async () => {
    if (!currentUser?.orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('obras')
        .select('id, org_id, name, address, estado, created_at')
        .eq('org_id', currentUser.orgId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[LOAD_OBRAS_ERROR]', fetchError);
        setError('Error al cargar las obras');
        return;
      }

      // Mapear datos de Supabase al formato Obra
      const obrasMapeadas: Obra[] = (data || []).map((obra) => ({
        id: obra.id,
        nombre: obra.name || 'Sin nombre',
        localizacion: obra.address || '',
        estado: (obra.estado?.toUpperCase() as 'ACTIVA' | 'PAUSADA' | 'FINALIZADA' | 'CANCELADA') || 'ACTIVA',
        created_at: obra.created_at || new Date().toISOString(),
        fecha_inicio: undefined,
        presupuesto: undefined,
        descripcion: '',
        cliente: undefined,
        tipoObra: 'nueva',
        numeroPermiso: undefined,
        progreso: 0,
        tareasActivas: 0,
        tareasCompletadas: 0,
        legajoTecnico: [],
      }));

      setObras(obrasMapeadas);
    } catch (err) {
      console.error('[LOAD_OBRAS_ERROR]', err);
      setError('Error al cargar las obras');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.orgId, supabase]);

  // Cargar obras al montar y cuando cambia el orgId
  useEffect(() => {
    loadObras();
  }, [loadObras]);

  // Recargar cuando se vuelve a esta página desde otra (ej: después de crear una obra)
  useEffect(() => {
    if (pathname === '/obras') {
      loadObras();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const obrasFiltradas = obras;
  const stats = useMemo<ObraStats>(() => {
    const activas = obras.filter((obra) => obra.estado === 'ACTIVA').length;
    const pausadas = obras.filter((obra) => obra.estado === 'PAUSADA').length;
    const finalizadas = obras.filter((obra) => obra.estado === 'FINALIZADA').length;
    const canceladas = obras.filter((obra) => obra.estado === 'CANCELADA').length;

    return {
      total: obras.length,
      activas,
      pausadas,
      finalizadas,
      canceladas,
    };
  }, [obras]);



  if (isLoading) {
    return (
      <SectionLayout title="Cargando..." subtitle="Preparando tus obras">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse">
              <div className="mb-4 h-6 w-3/4 rounded bg-grows-neutral" />
              <div className="mb-2 h-4 w-1/2 rounded bg-grows-neutral" />
              <div className="h-4 w-2/3 rounded bg-grows-neutral" />
            </Card>
          ))}
        </div>
      </SectionLayout>
    );
  }

  if (selectedObra) {
    const tareasMock = [
      {
        id: 'tarea-1',
        nombre: 'Excavación de fundación',
        obraId: selectedObra.id,
        lider: 'Juan Pérez',
        fechaInicio: '2024-01-01',
        fechaFin: '2024-01-05',
        plantilla: 'Excavación',
        checklist: ['Replanteo', 'Excavación', 'Compactación'],
        evidencias: [],
        estado: 'pendiente' as const,
        etapa: 'estructura' as const,
        precedencia: [],
        duracion: 5,
        esCritica: true,
        holgura: 0,
        earlyStart: 0,
        earlyFinish: 5,
        lateStart: 0,
        lateFinish: 5,
        tiempoTemprano: 0,
        tiempoTardio: 5,
        x: 100,
        y: 100,
      },
    ];

    const obraCompleta = {
      ...selectedObra,
      cliente: selectedObra.cliente || 'Cliente por defecto',
      tipoObra: selectedObra.tipoObra || 'nueva',
      fechaInicio: selectedObra.fecha_inicio || new Date().toISOString(),
      numeroPermiso: selectedObra.numeroPermiso || 'SIN-PERMISO',
      progreso: selectedObra.progreso || 0,
      tareasActivas: selectedObra.tareasActivas || 0,
      tareasCompletadas: selectedObra.tareasCompletadas || 0,
      legajoTecnico: selectedObra.legajoTecnico || [],
      tareas: tareasMock,
      fechaFinEstimada: '2024-12-31',
    };

    return (
      <DetalleObra
        obra={obraCompleta}
        tareas={tareasMock}
        onVolver={handleCloseDetail}
        onActualizarTarea={handleUpdateTask}
        onCrearTarea={handleCreateTask}
        onCrearTareas={handleCreateTasks}
        onEliminarTarea={handleDeleteTask}
        onActualizarObra={handleUpdateObra}
      />
    );
  }

  return (
    <SectionLayout
      title="Obras"
      subtitle="Gestiona todas tus obras de construcción"
    >
      <div className="mb-6 flex justify-end gap-3">
        <button
          onClick={handleAddMock}
          className="rounded-md border border-grows-border bg-white px-4 py-2 text-sm font-semibold text-grows-primary hover:bg-grows-surface"
          type="button"
        >
          Agregar demo
        </button>
        <Button
          onClick={handleOpenWizard}
          variant="primary"
          size="lg"
          icon={<Plus className="h-5 w-5" />}
        >
          Crear Obra Completa
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-grows-lg border border-grows-error/30 bg-grows-error/10 p-4">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-grows-error" />
            <span className="font-medium text-grows-error">{error}</span>
          </div>
        </div>
      )}

      <ObrasStatsRow stats={stats} />

      {obrasFiltradas.length === 0 ? (
        <EmptyState
          primaryAction={handleOpenWizard}
          secondaryAction={handleOpenBasicModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {obrasFiltradas.map((obra) => (
            <ObraCard
              key={obra.id}
              obra={obra}
              onView={handleSelectObra}
              onEdit={handleEditObra}
              onDelete={handleDeleteObra}
            />
          ))}
        </div>
      )}

      {isModalOpen && renderModal()}
    </SectionLayout>
  );

  function handleOpenWizard() {
    if (obrasLimitGuard.shouldBlock(obras.length)) {
      upgradeModal.open({
        targetPlanId: obrasLimitGuard.upgradeTarget || 'STARTER',
        limitId: 'obras',
        source: 'obras-list',
        reason: 'Alcanzaste el límite de obras en tu plan actual.',
      });
      return;
    }
    router.push('/obras/nueva');
  }

  function handleOpenBasicModal() {
    setIsEditing(false);
    setFormState(INITIAL_OBRA_FORM_STATE);
    setIsModalOpen(true);
  }

  function handleAddMock() {
    const nuevaObra: Obra = {
      id: Date.now().toString(),
      nombre: 'Demo Wizard - Casa Moderna',
      localizacion: 'San Martín 550, Pueblo Esther',
      estado: 'ACTIVA',
      created_at: new Date().toISOString(),
      fecha_inicio: '2025-01-10',
      presupuesto: 180000,
      descripcion: 'Generada con el nuevo flujo (mock para pruebas visuales).',
      cliente: 'Cliente Demo',
      tipoObra: 'nueva',
      numeroPermiso: 'MOCK-2025',
      progreso: 8,
      tareasActivas: 0,
      tareasCompletadas: 0,
      legajoTecnico: [],
    };
    setObras((prev) => [nuevaObra, ...prev]);
  }

  function handleEditObra(obra: Obra) {
    setIsEditing(true);
    setFormState({
      nombre: obra.nombre,
      localizacion: obra.localizacion ?? '',
      fecha_inicio: obra.fecha_inicio ?? '',
      presupuesto: obra.presupuesto?.toString() ?? '',
      descripcion: obra.descripcion ?? '',
    });
    setIsModalOpen(true);
  }

  function handleSelectObra(obra: Obra) {
    setSelectedObra(obra);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setFormState(INITIAL_OBRA_FORM_STATE);
    setError(null);
  }

  function handleFormChange(field: keyof ObraFormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isEditing) {
        const obraIndex = obras.findIndex((item) => item.nombre === formState.nombre);
        if (obraIndex !== -1) {
          const obraActualizada: Obra = {
            ...obras[obraIndex],
            ...formState,
            presupuesto: formState.presupuesto ? parseFloat(formState.presupuesto) : undefined,
            updatedAt: new Date().toISOString(),
          };
          setObras((prev) =>
            prev.map((item) => (item.id === obraActualizada.id ? obraActualizada : item)),
          );
        }
      } else {
        const nuevaObra: Obra = {
          id: Date.now().toString(),
          nombre: formState.nombre,
          localizacion: formState.localizacion,
          estado: 'ACTIVA',
          created_at: new Date().toISOString(),
          fecha_inicio: formState.fecha_inicio,
          presupuesto: formState.presupuesto ? parseFloat(formState.presupuesto) : undefined,
          descripcion: formState.descripcion,
        };
        setObras((prev) => [...prev, nuevaObra]);
      }
      handleCloseModal();
    } catch (err) {
      setError('Error al guardar la obra');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDeleteObra(obra: Obra) {
    if (window.confirm(`¿Estás seguro de que querés eliminar la obra "${obra.nombre}"?`)) {
      setObras((prev) => prev.filter((item) => item.id !== obra.id));
    }
  }

  function handleCloseDetail() {
    setSelectedObra(null);
  }

  // LEGACY: mantener handlers de detalle hasta migrar a ObraDetailContainer.
  function handleUpdateTask(tarea: unknown) {
    console.log('Actualizar tarea:', tarea);
  }

  function handleCreateTask(tarea: unknown) {
    console.log('Crear tarea:', tarea);
  }

  function handleCreateTasks(tareas: unknown) {
    console.log('Crear tareas:', tareas);
  }

  function handleDeleteTask(tareaId: string) {
    console.log('Eliminar tarea:', tareaId);
  }

  function handleUpdateObra(obraActualizada: unknown) {
    console.log('Actualizar obra:', obraActualizada);
  }

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-grows-lg bg-grows-surface shadow-grows-lg">
          <div className="border-b border-grows-border p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-grows-primary">
                {isEditing ? 'Editar Obra' : 'Crear Nueva Obra'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-grows-text-secondary transition-colors hover:text-grows-primary"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-grows-primary">
                  Nombre de la obra *
                </label>
                <input
                  type="text"
                  required
                  value={formState.nombre}
                  onChange={handleFormChange('nombre')}
                  className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-grows-secondary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-grows-primary">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formState.localizacion}
                  onChange={handleFormChange('localizacion')}
                  className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-grows-secondary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-grows-primary">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={formState.fecha_inicio}
                  onChange={handleFormChange('fecha_inicio')}
                  className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-grows-secondary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-grows-primary">
                  Presupuesto
                </label>
                <input
                  type="number"
                  value={formState.presupuesto}
                  onChange={handleFormChange('presupuesto')}
                  className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-grows-secondary"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-grows-primary">
                Descripción
              </label>
              <textarea
                value={formState.descripcion}
                onChange={handleFormChange('descripcion')}
                rows={3}
                className="w-full rounded-grows-md border border-grows-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-grows-secondary"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="ghost" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Save className="h-4 w-4" />}
                loading={isLoading}
              >
                {isEditing ? 'Actualizar' : 'Crear'} Obra
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}