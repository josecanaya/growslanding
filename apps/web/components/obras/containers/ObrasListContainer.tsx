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
import { Obra, ObraFormState, ObraStats, ObraTimelineTask, INITIAL_OBRA_FORM_STATE } from '@/types/obras';
import { apiTareaToObraTimelineTask, type ApiTareaRow } from '@/lib/mappers/tarea-api-to-ui';
import { ObraCard } from '../ui/ObraCard';
import { ObrasStatsRow } from '../ui/ObrasStatsRow';
import { EmptyState } from '../ui/EmptyState';

type ObraConOrg = Obra & { orgId?: string };

function mapApiToObra(o: {
  id: string;
  name: string;
  address: string | null;
  estado: string | null;
  createdAt: string;
  orgId: string;
  _count?: { tareas?: number };
}): ObraConOrg {
  const est = String(o.estado || 'ACTIVA').toUpperCase();
  return {
    id: o.id,
    nombre: o.name,
    localizacion: o.address || '',
    estado: est,
    created_at: o.createdAt,
    fecha_inicio: o.createdAt?.split('T')[0],
    orgId: o.orgId,
    tipoObra: 'nueva',
    progreso: 0,
    tareasActivas: o._count?.tareas ?? 0,
    tareasCompletadas: 0,
    legajoTecnico: [],
  };
}

export function ObrasListContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const [obras, setObras] = useState<ObraConOrg[]>([]);
  const [selectedObra, setSelectedObra] = useState<ObraConOrg | null>(null);
  const [tareasDetalle, setTareasDetalle] = useState<ObraTimelineTask[]>([]);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingObraId, setEditingObraId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ObraFormState>(INITIAL_OBRA_FORM_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const upgradeModal = useUpgradeModal();
  const obrasLimitGuard = usePlanLimitGuard('obras');

  const loadObras = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/obras', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || 'No se pudieron cargar las obras');
        setObras([]);
        return;
      }
      const rows = Array.isArray(json.data) ? json.data : [];
      setObras(rows.map((row: any) => mapApiToObra(row)));
    } catch {
      setError('Error de red al cargar obras');
      setObras([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadObras();
  }, [loadObras, currentUser?.orgId]);

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
    const n = (s: string) => (s || '').toUpperCase();
    const activas = obras.filter((obra) => n(obra.estado) === 'ACTIVA').length;
    const pausadas = obras.filter((obra) => n(obra.estado) === 'PAUSADA').length;
    const finalizadas = obras.filter((obra) => n(obra.estado) === 'FINALIZADA').length;
    const canceladas = obras.filter((obra) => n(obra.estado) === 'CANCELADA').length;

    return {
      total: obras.length,
      activas,
      pausadas,
      finalizadas,
      canceladas,
    };
  }, [obras]);

  useEffect(() => {
    if (!selectedObra) {
      setTareasDetalle([]);
      return;
    }
    const orgId = selectedObra.orgId ?? currentUser?.orgId;
    if (!orgId) {
      setTareasDetalle([]);
      return;
    }
    let a = true;
    (async () => {
      setLoadingTareas(true);
      try {
        const res = await fetch(
          `/api/tareas?obra_id=${encodeURIComponent(selectedObra.id)}&org_id=${encodeURIComponent(orgId)}`,
          { cache: 'no-store' },
        );
        const json = await res.json().catch(() => ({}));
        if (!a) return;
        if (json.success && Array.isArray(json.data)) {
          setTareasDetalle(
            json.data.map((t: ApiTareaRow) => apiTareaToObraTimelineTask(t, selectedObra.id)),
          );
        } else {
          setTareasDetalle([]);
        }
      } catch {
        if (a) setTareasDetalle([]);
      } finally {
        if (a) setLoadingTareas(false);
      }
    })();
    return () => {
      a = false;
    };
  }, [selectedObra, currentUser?.orgId]);



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
    const tareasMock = tareasDetalle;
    const estadoNormalizado =
      (selectedObra.estado?.toLowerCase() as 'activa' | 'pausada' | 'finalizada') || 'activa';

    const tareasActivasC = tareasMock.filter((t) => t.estado === 'en_progreso').length;
    const tareasCompletadasC = tareasMock.filter((t) => t.estado === 'completada').length;
    const progresoCalc =
      tareasMock.length > 0 ? Math.min(100, Math.round((tareasCompletadasC / tareasMock.length) * 100)) : 0;

    const obraCompleta = {
      ...selectedObra,
      estado: estadoNormalizado,
      cliente: selectedObra.cliente || 'Cliente por defecto',
      tipoObra: selectedObra.tipoObra || 'nueva',
      fechaInicio: selectedObra.fecha_inicio || new Date().toISOString(),
      numeroPermiso: selectedObra.numeroPermiso || 'SIN-PERMISO',
      progreso: tareasMock.length ? progresoCalc : selectedObra.progreso || 0,
      tareasActivas: tareasMock.length ? tareasActivasC : selectedObra.tareasActivas || 0,
      tareasCompletadas: tareasMock.length ? tareasCompletadasC : selectedObra.tareasCompletadas || 0,
      legajoTecnico: (selectedObra.legajoTecnico as LegajoDocumento[] | undefined) || [],
      tareas: tareasMock,
      fechaFinEstimada: '2024-12-31',
    };

    if (loadingTareas && tareasDetalle.length === 0) {
      return (
        <SectionLayout title="Obra" subtitle="Cargando tareas…">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="animate-pulse">
                <div className="mb-4 h-6 w-3/4 rounded bg-grows-neutral" />
                <div className="h-4 w-2/3 rounded bg-grows-neutral" />
              </Card>
            ))}
          </div>
        </SectionLayout>
      );
    }

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
        onEliminarObra={handleDeleteObraFromDetail}
      />
    );
  }

  return (
    <SectionLayout
      title="Obras"
      subtitle="Gestiona todas tus obras de construcción"
    >
      <div className="mb-6 flex justify-end gap-3">
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
    setEditingObraId(null);
    setFormState(INITIAL_OBRA_FORM_STATE);
    setIsModalOpen(true);
  }

  function handleEditObra(obra: ObraConOrg) {
    setIsEditing(true);
    setEditingObraId(obra.id);
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

  function handleSelectObra(obra: ObraConOrg) {
    setSelectedObra(obra);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingObraId(null);
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
      if (isEditing && editingObraId) {
        const editing = obras.find((item) => item.id === editingObraId);
        if (editing) {
          const obraActualizada: ObraConOrg = {
            ...editing,
            nombre: formState.nombre,
            localizacion: formState.localizacion,
            presupuesto: formState.presupuesto ? parseFloat(formState.presupuesto) : undefined,
            descripcion: formState.descripcion,
            updatedAt: new Date().toISOString(),
          };
          setObras((prev) => prev.map((item) => (item.id === obraActualizada.id ? obraActualizada : item)));
        }
      } else {
        const nuevaObra: ObraConOrg = {
          id: Date.now().toString(),
          nombre: formState.nombre,
          localizacion: formState.localizacion,
          estado: 'ACTIVA',
          created_at: new Date().toISOString(),
          fecha_inicio: formState.fecha_inicio,
          presupuesto: formState.presupuesto ? parseFloat(formState.presupuesto) : undefined,
          descripcion: formState.descripcion,
          orgId: currentUser?.orgId ?? undefined,
          legajoTecnico: [],
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

  async function handleDeleteObra(obra: ObraConOrg) {
    if (
      !window.confirm(
        `¿Eliminar la obra "${obra.nombre}"? Se borrará en el servidor. Si hay tareas vinculadas, Supabase puede rechazar el borrado.`,
      )
    ) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obra.id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof json.error === 'string'
            ? json.error
            : typeof json.message === 'string'
              ? json.message
              : 'No se pudo eliminar la obra';
        setError(msg);
        return;
      }
      if (selectedObra?.id === obra.id) {
        setSelectedObra(null);
      }
      await loadObras();
    } catch {
      setError('Error de red al eliminar la obra');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDeleteObraFromDetail(obraId: string) {
    const obra = obras.find((o) => o.id === obraId);
    if (obra) {
      void handleDeleteObra(obra);
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
