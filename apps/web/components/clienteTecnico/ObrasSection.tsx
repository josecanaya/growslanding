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
  MoreVertical, 
  Filter,
  X,
  Save,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { DetalleObra } from './DetalleObra';
import { useUpgradeModal } from '@/components/subscriptions/UpgradeModal';
import { usePlanLimitGuard } from '@/lib/subscriptions';
import { usePlanUsage } from '@/lib/subscriptions/use-plan-usage';
import { SUBSCRIPTION_UI_COPY } from '@/lib/subscriptions/texts';
import { Button, Card, Badge, SectionLayout } from '@/components/ui/grows';

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
  const getEstadoVariant = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return 'success';
      case 'PAUSADA':
        return 'warning';
      case 'FINALIZADA':
        return 'info';
      case 'CANCELADA':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getEstadoVariant(estado)}>
      {estado}
    </Badge>
  );
};

// Componente para mostrar una card de obra
const ObraCard = ({ 
  obra, 
  onEdit, 
  onDelete, 
  onView 
}: { 
  obra: Obra; 
  onEdit: (obra: Obra) => void; 
  onDelete: (obra: Obra) => void; 
  onView: (obra: Obra) => void; 
}) => {
  const formatearFechaCreacion = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const obtenerEstado = (estado: string) => {
    return estado || 'ACTIVA';
  };

  return (
    <Card
      onClick={() => onView(obra)}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(obra);
              }}
              icon={<Eye className="h-4 w-4" />}
            >
              Ver
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(obra);
              }}
              icon={<Edit3 className="h-4 w-4" />}
            >
              Editar
            </Button>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(obra);
            }}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Eliminar
          </Button>
        </div>
      }
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-grows-secondary/10 rounded-grows-md border border-grows-border">
            <Building2 className="h-5 w-5 text-grows-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-grows-primary">{obra.nombre}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <MapPin className="h-4 w-4 text-grows-text-secondary" />
              <span className="text-sm text-grows-text-secondary">
                {obra.localizacion?.trim() || "Sin ubicación"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <EstadoBadge estado={obtenerEstado(obra.estado)} />
          <div className="relative">
            <Button 
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="!p-1"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {obra.descripcion && (
        <p className="text-sm mb-4 line-clamp-2 text-grows-text-secondary">
          {obra.descripcion}
        </p>
      )}

      <div className="flex items-center justify-between text-sm mb-4 text-grows-text-secondary">
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>Creada: {formatearFechaCreacion(obra.created_at)}</span>
        </div>
        {obra.fecha_inicio && (
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Inicio: {formatearFechaCreacion(obra.fecha_inicio)}</span>
          </div>
        )}
      </div>
    </Card>
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
  const { usageSummary } = usePlanUsage();

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
      <SectionLayout title="Cargando..." subtitle="Preparando tus obras">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 bg-grows-neutral rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-grows-neutral rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-grows-neutral rounded w-2/3"></div>
            </Card>
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

  return (
    <SectionLayout
      title="Obras"
      subtitle="Gestiona todas tus obras de construcción"
    >
      {/* Botón de crear obra */}
      <div className="flex justify-end mb-6 gap-3">
        <Button variant="secondary" onClick={handleAddMock}>
          Agregar demo
        </Button>
        <Button
          onClick={abrirWizardCrear}
          variant="primary"
          size="lg"
          icon={<Plus className="h-5 w-5" />}
        >
          Crear Obra Completa
        </Button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 border border-grows-error/30 rounded-grows-lg p-4 bg-grows-error/10">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-grows-error" />
            <span className="text-grows-error font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card title="Total Obras" className="text-center">
          <div className="text-2xl font-bold text-grows-primary">{obras.length}</div>
        </Card>
        <Card title="Activas" className="text-center">
          <div className="text-2xl font-bold text-grows-secondary">{obras.filter(o => o.estado === 'ACTIVA').length}</div>
        </Card>
        <Card title="Pausadas" className="text-center">
          <div className="text-2xl font-bold text-grows-warning">{obras.filter(o => o.estado === 'PAUSADA').length}</div>
        </Card>
        <Card title="Finalizadas" className="text-center">
          <div className="text-2xl font-bold text-grows-primary">{obras.filter(o => o.estado === 'FINALIZADA').length}</div>
        </Card>
        <Card title="Canceladas" className="text-center">
          <div className="text-2xl font-bold text-grows-error">{obras.filter(o => o.estado === 'CANCELADA').length}</div>
        </Card>
      </div>


      {/* Lista de obras */}
      {obrasFiltradas.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="h-12 w-12 text-grows-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-grows-primary mb-2">
            No hay obras creadas
          </h3>
          <p className="text-grows-text-secondary mb-6">
            Comienza creando tu primera obra
          </p>
          {(
            <div className="flex items-center justify-center space-x-3">
              <Button
                onClick={abrirWizardCrear}
                variant="primary"
                size="lg"
                icon={<Plus className="h-5 w-5" />}
              >
                Crear Obra Completa
              </Button>
              <Button
                onClick={abrirModalCrear}
                variant="secondary"
                size="lg"
                icon={<Plus className="h-5 w-5" />}
              >
                Crear Básica
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Modal para crear/editar obra */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-grows-surface rounded-grows-lg shadow-grows-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-grows-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-grows-primary">
                  {isEditing ? 'Editar Obra' : 'Crear Nueva Obra'}
                </h2>
                <button
                  onClick={cerrarModal}
                  className="text-grows-text-secondary hover:text-grows-primary transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-grows-primary mb-1">
                    Nombre de la obra *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.nombre}
                    onChange={(e) => setFormState({...formState, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-grows-primary mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={formState.localizacion}
                    onChange={(e) => setFormState({...formState, localizacion: e.target.value})}
                    className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-grows-primary mb-1">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={formState.fecha_inicio}
                    onChange={(e) => setFormState({...formState, fecha_inicio: e.target.value})}
                    className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-grows-primary mb-1">
                    Presupuesto
                  </label>
                  <input
                    type="number"
                    value={formState.presupuesto}
                    onChange={(e) => setFormState({...formState, presupuesto: e.target.value})}
                    className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-grows-primary mb-1">
                  Descripción
                </label>
                <textarea
                  value={formState.descripcion}
                  onChange={(e) => setFormState({...formState, descripcion: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cerrarModal}
                >
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
      )}
    </SectionLayout>
  );
}
