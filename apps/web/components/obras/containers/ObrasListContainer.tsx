'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, AlertCircle, Save, X } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { DetalleObra } from '@/components/cliente/DetalleObra';
import type { LegajoDocumento } from '@/components/cliente/DetalleObra';
import { useUpgradeModal } from '@/components/subscriptions/UpgradeModal';
import { usePlanLimitGuard } from '@/lib/subscriptions';
import { Button, Card, SectionLayout } from '@/components/ui/grows';
import { Obra, ObraFormState, ObraStats, INITIAL_OBRA_FORM_STATE } from '@/types/obras';
import { ObraCard } from '../ui/ObraCard';
import { ObrasStatsRow } from '../ui/ObrasStatsRow';
import { EmptyState } from '../ui/EmptyState';

// ——— MOCKS: 3 obras fijas (desconectado de la base de datos). Eliminar cuando conectes Supabase. ———
const OBRAS_MOCK: Obra[] = [
  {
    id: 'demo-obra-1-casa-familiar',
    nombre: 'Casa Familiar – Juan Pérez',
    localizacion: 'Rosario',
    estado: 'En ejecución',
    created_at: new Date().toISOString(),
    fecha_inicio: '2026-03-01',
    fecha_inicio_estimada: '2026-03-01',
    fecha_final_estimada: '2026-06-30',
    tipoObra: 'nueva',
    progreso: 35,
    tareasActivas: 2,
    tareasCompletadas: 3,
    legajoTecnico: [],
  },
  {
    id: 'demo-obra-2-reforma-bano',
    nombre: 'Reforma Baño – María González',
    localizacion: 'Rosario',
    estado: 'Pendiente',
    created_at: new Date().toISOString(),
    fecha_inicio: '2026-04-15',
    fecha_inicio_estimada: '2026-04-15',
    tipoObra: 'reforma',
    progreso: 0,
    tareasActivas: 0,
    tareasCompletadas: 0,
    legajoTecnico: [],
  },
  {
    id: 'demo-obra-3-ampliacion-cocina',
    nombre: 'Ampliación Cocina – Carlos López',
    localizacion: 'Rosario',
    estado: 'Creada',
    created_at: new Date().toISOString(),
    tipoObra: 'ampliacion',
    progreso: 0,
    tareasActivas: 0,
    tareasCompletadas: 0,
    legajoTecnico: [],
  },
];

export function ObrasListContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const [obras, setObras] = useState<Obra[]>([]);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ObraFormState>(INITIAL_OBRA_FORM_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const upgradeModal = useUpgradeModal();
  const obrasLimitGuard = usePlanLimitGuard('obras');

  // Solo mocks: datos fijos en código (sin backend). Eliminar cuando conectes Supabase.
  const loadObras = useCallback(() => {
    setIsLoading(true);
    setObras(OBRAS_MOCK);
    setError(null);
    setIsLoading(false);
  }, []);

  // Cargar obras al montar y cuando cambia el orgId
  useEffect(() => {
    loadObras();
  }, [loadObras]);

  const searchParams = useSearchParams();
  
  // Recargar cuando se vuelve a esta página desde otra (ej: después de crear una obra)
  useEffect(() => {
    if (pathname === '/obras') {
      loadObras();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Seleccionar obra automáticamente si viene en query parameter
  useEffect(() => {
    const obraIdFromQuery = searchParams.get('obraId');
    if (obraIdFromQuery && obras.length > 0 && !selectedObra) {
      const obraToSelect = obras.find(obra => obra.id === obraIdFromQuery);
      if (obraToSelect) {
        setSelectedObra(obraToSelect);
        // Limpiar el query parameter después de seleccionar
        router.replace('/cliente/obras');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, obras, selectedObra, router]);

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
    // Demo video: tareas mock completas para el Resumen (obra Casa Familiar)
    const isDemoObra = selectedObra.id === 'demo-obra-1-casa-familiar';
    const tareasMock = isDemoObra
      ? [
          { id: 't1', nombre: 'Excavación de fundación', obraId: selectedObra.id, lider: 'Juan Pérez', fechaInicio: '2024-01-01', fechaFin: '2024-01-05', plantilla: 'Excavación', checklist: [], evidencias: [], estado: 'completada' as const, etapa: 'estructura' as const, precedencia: [], duracion: 5, esCritica: true, holgura: 0, earlyStart: 0, earlyFinish: 5, lateStart: 0, lateFinish: 5, tiempoTemprano: 0, tiempoTardio: 5, x: 100, y: 100 },
          { id: 't2', nombre: 'Hormigón de cimientos', obraId: selectedObra.id, lider: 'Juan Pérez', fechaInicio: '2024-01-08', fechaFin: '2024-01-12', plantilla: 'Estructura', checklist: [], evidencias: [], estado: 'completada' as const, etapa: 'estructura' as const, precedencia: [], duracion: 5, esCritica: true, holgura: 0, earlyStart: 5, earlyFinish: 10, lateStart: 5, lateFinish: 10, tiempoTemprano: 5, tiempoTardio: 10, x: 100, y: 150 },
          { id: 't3', nombre: 'Mampostería PB', obraId: selectedObra.id, lider: 'María López', fechaInicio: '2024-01-15', fechaFin: '2024-02-02', plantilla: 'Obra gris', checklist: [], evidencias: [], estado: 'completada' as const, etapa: 'obra_gris' as const, precedencia: [], duracion: 14, esCritica: true, holgura: 0, earlyStart: 10, earlyFinish: 24, lateStart: 10, lateFinish: 24, tiempoTemprano: 10, tiempoTardio: 24, x: 100, y: 200 },
          { id: 't4', nombre: 'Instalación eléctrica', obraId: selectedObra.id, lider: 'Carlos Rodríguez', fechaInicio: '2024-02-05', fechaFin: '2024-02-20', plantilla: 'Instalaciones', checklist: [], evidencias: [], estado: 'en_progreso' as const, etapa: 'terminaciones' as const, precedencia: [], duracion: 15, esCritica: false, holgura: 2, earlyStart: 24, earlyFinish: 39, lateStart: 26, lateFinish: 41, tiempoTemprano: 24, tiempoTardio: 41, x: 100, y: 250 },
          { id: 't5', nombre: 'Revoque grueso', obraId: selectedObra.id, lider: 'Juan Pérez', fechaInicio: '2024-02-10', fechaFin: '2024-02-28', plantilla: 'Obra gris', checklist: [], evidencias: [], estado: 'en_progreso' as const, etapa: 'obra_gris' as const, precedencia: [], duracion: 18, esCritica: true, holgura: 0, earlyStart: 24, earlyFinish: 42, lateStart: 24, lateFinish: 42, tiempoTemprano: 24, tiempoTardio: 42, x: 100, y: 300 },
          { id: 't6', nombre: 'Pintura interior', obraId: selectedObra.id, lider: 'Ana García', fechaInicio: '2024-03-01', fechaFin: '2024-03-15', plantilla: 'Terminaciones', checklist: [], evidencias: [], estado: 'pendiente' as const, etapa: 'terminaciones' as const, precedencia: [], duracion: 14, esCritica: false, holgura: 3, earlyStart: 42, earlyFinish: 56, lateStart: 45, lateFinish: 59, tiempoTemprano: 42, tiempoTardio: 59, x: 100, y: 350 },
          { id: 't7', nombre: 'Carpintería de aberturas', obraId: selectedObra.id, lider: 'Pedro Martínez', fechaInicio: '2024-03-10', fechaFin: '2024-03-25', plantilla: 'Terminaciones', checklist: [], evidencias: [], estado: 'pendiente' as const, etapa: 'terminaciones' as const, precedencia: [], duracion: 15, esCritica: false, holgura: 1, earlyStart: 42, earlyFinish: 57, lateStart: 43, lateFinish: 58, tiempoTemprano: 42, tiempoTardio: 58, x: 100, y: 400 },
        ]
      : [
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

    const estadoNormalizado =
      (selectedObra.estado?.toLowerCase() as 'activa' | 'pausada' | 'finalizada') || 'activa';

    const tareasActivasDemo = isDemoObra ? tareasMock.filter((t) => t.estado === 'en_progreso').length : 0;
    const tareasCompletadasDemo = isDemoObra ? tareasMock.filter((t) => t.estado === 'completada').length : 0;
    const progresoDemo = isDemoObra ? 35 : 0;

    const obraCompleta = {
      ...selectedObra,
      estado: estadoNormalizado,
      cliente: selectedObra.cliente || 'Cliente por defecto',
      tipoObra: selectedObra.tipoObra || 'nueva',
      fechaInicio: selectedObra.fecha_inicio || new Date().toISOString(),
      numeroPermiso: selectedObra.numeroPermiso || 'SIN-PERMISO',
      progreso: isDemoObra ? progresoDemo : (selectedObra.progreso || 0),
      tareasActivas: isDemoObra ? tareasActivasDemo : (selectedObra.tareasActivas || 0),
      tareasCompletadas: isDemoObra ? tareasCompletadasDemo : (selectedObra.tareasCompletadas || 0),
      legajoTecnico: (selectedObra.legajoTecnico as LegajoDocumento[] | undefined) || [],
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
      fecha_inicio_estimada: (obra as any).fecha_inicio_estimada ?? '',
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
