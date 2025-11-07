// LEGACY: mantener referencia, no borrar.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  Edit3,
  Trash2,
  Eye,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { DetalleObra } from '@/components/cliente/DetalleObra';
import { useUpgradeModal } from '@/components/subscriptions/UpgradeModal';
import { usePlanLimitGuard } from '@/lib/subscriptions';
import { SUBSCRIPTION_UI_COPY } from '@/lib/subscriptions/texts';
import { Button, SectionLayout } from '@/components/ui/grows';

// Tipos de datos
interface Obra {
  id: string;
  nombre: string;
  localizacion?: string;
  estado: string;
  created_at: string;
  updatedAt?: string;
  fecha_inicio?: string;
  presupuesto?: number;
  descripcion?: string;
  cliente?: string;
  tipoObra?: 'nueva' | 'reforma' | 'ampliacion';
  numeroPermiso?: string;
  progreso?: number;
  tareasActivas?: number;
  tareasCompletadas?: number;
  legajoTecnico?: any[];
}

interface FormState {
  nombre: string;
  localizacion: string;
  fecha_inicio: string;
  presupuesto: string;
  descripcion: string;
}

// Estado inicial del formulario
const initialFormState: FormState = {
  nombre: '',
  localizacion: '',
  fecha_inicio: '',
  presupuesto: '',
  descripcion: ''
};

// Componente para mostrar el estado de la obra usando el sistema GROWS
const EstadoBadge = ({ estado }: { estado: string }) => {
  const styles: Record<string, string> = {
    ACTIVA: 'bg-blue-50 text-[#0052CC] border-blue-200',
    PAUSADA: 'bg-amber-50 text-amber-600 border-amber-200',
    FINALIZADA: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    CANCELADA: 'bg-rose-50 text-rose-600 border-rose-200',
  };

  const badgeClasses = styles[estado] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClasses}`}>
      <span
        className={`h-2 w-2 rounded-full ${
          estado === 'PAUSADA'
            ? 'bg-amber-500'
            : estado === 'FINALIZADA'
            ? 'bg-emerald-500'
            : estado === 'CANCELADA'
            ? 'bg-rose-500'
            : 'bg-[#0052CC]'
        }`}
      />
      {estado}
    </span>
  );
};

// Componente para mostrar una card de obra
const ObraCard = ({
  obra,
  onEdit,
  onDelete,
  onView,
}: {
  obra: Obra;
  onEdit: (obra: Obra) => void;
  onDelete: (obra: Obra) => void;
  onView: (obra: Obra) => void;
}) => {
  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const estado = obra.estado || 'ACTIVA';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(obra)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView(obra);
        }
      }}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-2 text-[#0052CC]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{obra.nombre}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{obra.localizacion?.trim() || 'Sin ubicación definida'}</span>
            </div>
          </div>
        </div>
        <EstadoBadge estado={estado} />
      </div>

      {obra.descripcion && (
        <p className="mt-4 line-clamp-2 text-sm text-slate-600">{obra.descripcion}</p>
      )}

      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#0052CC]" />
          <span>Creada: {formatearFecha(obra.created_at)}</span>
        </div>
        {obra.fecha_inicio && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#0052CC]" />
            <span>Inicio: {formatearFecha(obra.fecha_inicio)}</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onView(obra);
            }}
            className="!rounded-lg !px-3 !py-1.5 !text-slate-600 hover:!bg-slate-100 hover:!text-slate-900"
            icon={<Eye className="h-4 w-4" />}
          >
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(obra);
            }}
            className="!rounded-lg !px-3 !py-1.5 !text-slate-600 hover:!bg-slate-100 hover:!text-slate-900"
            icon={<Edit3 className="h-4 w-4" />}
          >
            Editar
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(obra);
          }}
          className="!rounded-lg !px-3 !py-1.5 !text-rose-600 hover:!bg-rose-50"
          icon={<Trash2 className="h-4 w-4" />}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
};

// Componente principal
export default function ObrasSection() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [obras, setObras] = useState<Obra[]>([]);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hooks para suscripciones
  const upgradeModal = useUpgradeModal();
  const obrasLimitGuard = usePlanLimitGuard('obras');

  // Función para cargar obras desde Supabase
  const loadObras = useCallback(async () => {
    if (!currentUser?.orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('obras')
        .select('id, org_id, name, address, estado, created_at, propietario, tipo_obra')
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
        cliente: obra.propietario || undefined,
        tipoObra: obra.tipo_obra as 'nueva' | 'reforma' | 'ampliacion' || 'nueva',
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

  // Mostrar todas las obras (sin filtros)
  const obrasFiltradas = obras;

  // Funciones del modal
  const abrirModalCrear = () => {
    setIsEditing(false);
    setFormState(initialFormState);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (obra: Obra) => {
    setSelectedObra(obra);
    setIsEditing(true);
    setFormState({
      nombre: obra.nombre,
      localizacion: obra.localizacion || '',
      fecha_inicio: obra.fecha_inicio || '',
      presupuesto: obra.presupuesto?.toString() || '',
      descripcion: obra.descripcion || ''
    });
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setFormState(initialFormState);
    setError(null);
    // No limpiar selectedObra aquí porque puede estar siendo usado para mostrar el detalle
    // Se limpiará cuando se cierre el detalle
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!currentUser?.orgId) {
      setError('No se pudo identificar tu organización');
      setIsLoading(false);
      return;
    }

    try {
      if (isEditing) {
        // Actualizar obra existente
        if (!selectedObra) {
          setError('No se encontró la obra a actualizar');
          setIsLoading(false);
          return;
        }

        const { error: updateError } = await supabase
          .from('obras')
          .update({
            name: formState.nombre,
            address: formState.localizacion || null,
          })
          .eq('id', selectedObra.id)
          .eq('org_id', currentUser.orgId);

        if (updateError) {
          console.error('[UPDATE_OBRA_ERROR]', updateError);
          setError('Error al actualizar la obra');
          setIsLoading(false);
          return;
        }

        // Recargar obras después de actualizar
        await loadObras();
        cerrarModal();
      } else {
        // Crear nueva obra
        const { data, error: insertError } = await supabase
          .from('obras')
          .insert({
            org_id: currentUser.orgId,
            name: formState.nombre,
            address: formState.localizacion || null,
            estado: 'pendiente',
          })
          .select()
          .single();

        if (insertError) {
          console.error('[CREATE_OBRA_ERROR]', insertError);
          setError('Error al crear la obra');
          setIsLoading(false);
          return;
        }

        // Recargar obras después de crear
        await loadObras();
        cerrarModal();
      }
    } catch (err) {
      console.error('[SUBMIT_OBRA_ERROR]', err);
      setError('Error al guardar la obra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteObra = async (obra: Obra) => {
    if (!window.confirm(`¿Estás seguro de que querés eliminar la obra "${obra.nombre}"?`)) {
      return;
    }

    if (!currentUser?.orgId) {
      setError('No se pudo identificar tu organización');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('obras')
        .delete()
        .eq('id', obra.id)
        .eq('org_id', currentUser.orgId);

      if (deleteError) {
        console.error('[DELETE_OBRA_ERROR]', deleteError);
        setError('Error al eliminar la obra');
        setIsLoading(false);
        return;
      }

      // Recargar obras después de eliminar
      await loadObras();
    } catch (err) {
      console.error('[DELETE_OBRA_ERROR]', err);
      setError('Error al eliminar la obra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewObra = (obra: Obra) => {
    setSelectedObra(obra);
  };

  const abrirWizardCrear = () => {
    // Verificar límites de suscripción
    if (obrasLimitGuard.shouldBlock(obras.length)) {
      upgradeModal.open({
        targetPlanId: obrasLimitGuard.upgradeTarget || 'STARTER',
        limitId: 'obras',
        source: 'obras-section',
        reason: 'Alcanzaste el límite de obras en tu plan actual.',
      });
      return;
    }
    router.push('/obras/nueva');
  };


  function handleAddMock() {
    setObras(prev => ([
      {
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
        legajoTecnico: []
      },
      ...prev
    ]));
  }

  // Loading state
  if (isLoading) {
    return (
      <SectionLayout
        title="Cargando..."
        subtitle="Preparando tus obras"
        titleAlign="center"
        titleClassName="text-2xl font-semibold text-slate-900"
        subtitleClassName="text-sm text-slate-500"
        className="bg-[#F8FAFC]"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-6 w-3/4 animate-pulse rounded-full bg-slate-200/60" />
              <div className="mt-4 h-4 w-1/2 animate-pulse rounded-full bg-slate-200/50" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-slate-200/30" />
            </div>
          ))}
        </div>
      </SectionLayout>
    );
  }

  // Si hay una obra seleccionada, mostrar el detalle completo
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
        y: 100
      }
    ];

    const obraCompleta = {
      ...selectedObra,
      cliente: selectedObra.cliente || "Cliente por defecto",
      tipoObra: selectedObra.tipoObra || "nueva",
      fechaInicio: selectedObra.fecha_inicio || new Date().toISOString(),
      numeroPermiso: selectedObra.numeroPermiso || "SIN-PERMISO",
      progreso: selectedObra.progreso || 0,
      tareasActivas: selectedObra.tareasActivas || 0,
      tareasCompletadas: selectedObra.tareasCompletadas || 0,
      legajoTecnico: selectedObra.legajoTecnico || [],
      tareas: tareasMock,
      fechaFinEstimada: '2024-12-31'
    };

    return (
      <DetalleObra
        obra={obraCompleta}
        tareas={tareasMock}
        onVolver={() => setSelectedObra(null)}
        onActualizarTarea={(tarea) => {
          console.log('Actualizar tarea:', tarea);
        }}
        onCrearTarea={(tarea) => {
          console.log('Crear tarea:', tarea);
        }}
        onCrearTareas={(tareas) => {
          console.log('Crear tareas:', tareas);
        }}
        onEliminarTarea={(tareaId) => {
          console.log('Eliminar tarea:', tareaId);
        }}
        onActualizarObra={(obra) => {
          console.log('Actualizar obra:', obra);
        }}
      />
    );
  }

  const totalObras = obras.length;
  const totalActivas = obras.filter((o) => o.estado === 'ACTIVA').length;
  const totalPausadas = obras.filter((o) => o.estado === 'PAUSADA').length;
  const totalFinalizadas = obras.filter((o) => o.estado === 'FINALIZADA').length;
  const totalCanceladas = obras.filter((o) => o.estado === 'CANCELADA').length;

  return (
    <SectionLayout
      title="Obras"
      subtitle="Gestioná tus proyectos activos"
      titleAlign="center"
      titleClassName="text-2xl font-semibold text-slate-900"
      subtitleClassName="text-sm text-slate-500"
      className="bg-[#F8FAFC]"
    >
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-center text-sm text-slate-500 md:text-left">
          {totalObras > 0
            ? `Tenés ${totalObras} ${totalObras === 1 ? 'obra' : 'obras'} activas en tu cuenta.`
            : 'Aún no registraste obras en tu organización.'}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
          <Button
            variant="ghost"
            className="!border !border-slate-200 !bg-white !text-slate-600 hover:!bg-slate-100 hover:!text-slate-900 !rounded-xl"
            onClick={handleAddMock}
          >
            Agregar demo
          </Button>
          <Button
            onClick={abrirWizardCrear}
            variant="primary"
            size="lg"
            icon={<Plus className="h-5 w-5" />}
            className="!rounded-xl !bg-[#22C55E] !px-6 !py-3 !text-white hover:!bg-[#16A34A] focus:!ring-[#22C55E] focus:!ring-offset-2"
          >
            Crear obra
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[{
          label: 'Total de obras',
          value: totalObras,
        },
        {
          label: 'Activas',
          value: totalActivas,
        },
        {
          label: 'Pausadas',
          value: totalPausadas,
        },
        {
          label: 'Finalizadas',
          value: totalFinalizadas,
        },
        {
          label: 'Canceladas',
          value: totalCanceladas,
        }].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span className="text-sm font-medium text-slate-500">{label}</span>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {obrasFiltradas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#0052CC]">
            <Building2 className="h-7 w-7" />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-slate-900">No hay obras registradas</h3>
          <p className="mt-2 text-sm text-slate-500">Creá tu primera obra para empezar a planificar y asignar tareas.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={abrirWizardCrear}
              variant="primary"
              size="lg"
              icon={<Plus className="h-5 w-5" />}
              className="!rounded-xl !bg-[#22C55E] !px-6 !py-3 !text-white hover:!bg-[#16A34A] focus:!ring-[#22C55E] focus:!ring-offset-2"
            >
              Crear obra
            </Button>
            <Button
              onClick={abrirModalCrear}
              variant="ghost"
              size="lg"
              className="!rounded-xl !border !border-slate-200 !bg-white !text-slate-600 hover:!bg-slate-100"
              icon={<Plus className="h-5 w-5" />}
            >
              Crear rápida
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {obrasFiltradas.map((obra) => (
            <ObraCard
              key={obra.id}
              obra={obra}
              onEdit={abrirModalEditar}
              onDelete={handleDeleteObra}
              onView={handleViewObra}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {isEditing ? 'Editar obra' : 'Crear nueva obra'}
                </h2>
                <p className="text-sm text-slate-500">
                  Completá la información básica para administrar el proyecto.
                </p>
              </div>
              <button
                onClick={cerrarModal}
                type="button"
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="obra-nombre">
                    Nombre de la obra *
                  </label>
                  <input
                    id="obra-nombre"
                    type="text"
                    required
                    value={formState.nombre}
                    onChange={(event) => setFormState({ ...formState, nombre: event.target.value })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/40"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="obra-ubicacion">
                    Ubicación
                  </label>
                  <input
                    id="obra-ubicacion"
                    type="text"
                    value={formState.localizacion}
                    onChange={(event) => setFormState({ ...formState, localizacion: event.target.value })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/40"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="obra-fecha">
                    Fecha de inicio
                  </label>
                  <input
                    id="obra-fecha"
                    type="date"
                    value={formState.fecha_inicio}
                    onChange={(event) => setFormState({ ...formState, fecha_inicio: event.target.value })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/40"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="obra-presupuesto">
                    Presupuesto
                  </label>
                  <input
                    id="obra-presupuesto"
                    type="number"
                    value={formState.presupuesto}
                    onChange={(event) => setFormState({ ...formState, presupuesto: event.target.value })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/40"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="obra-descripcion">
                  Descripción
                </label>
                <textarea
                  id="obra-descripcion"
                  value={formState.descripcion}
                  onChange={(event) => setFormState({ ...formState, descripcion: event.target.value })}
                  rows={4}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/40"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="!rounded-xl !border !border-slate-200 !bg-white !px-5 !py-2.5 !text-slate-600 hover:!bg-slate-100"
                  onClick={cerrarModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="h-4 w-4" />}
                  loading={isLoading}
                  className="!rounded-xl !bg-[#22C55E] !px-5 !py-2.5 !text-white hover:!bg-[#16A34A] focus:!ring-[#22C55E] focus:!ring-offset-2"
                >
                  {isEditing ? 'Actualizar obra' : 'Crear obra'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SectionLayout>
  );
}
