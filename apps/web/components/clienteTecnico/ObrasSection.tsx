'use client';

import { useState, useEffect } from 'react';
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
  Search, 
  Filter,
  X,
  Save,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
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
  const [obras, setObras] = useState<Obra[]>([
    {
      id: "1",
      nombre: "Casa Familiar Los Robles",
      localizacion: "Av. Corrientes 1234, CABA",
      estado: "ACTIVA",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      fecha_inicio: "2024-01-15",
      presupuesto: 85000,
      descripcion: "Proyecto de casa familiar de dos plantas con jardín y garaje"
    },
    {
      id: "2", 
      nombre: "Edificio Residencial Norte",
      localizacion: "Calle Norte 567, CABA",
      estado: "PAUSADA",
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      fecha_inicio: "2024-02-01",
      presupuesto: 250000,
      descripcion: "Edificio de 6 plantas con 24 departamentos y amenities"
    },
    {
      id: "3",
      nombre: "Complejo Comercial Plaza Sur",
      localizacion: "Av. Santa Fe 2450, Palermo",
      estado: "FINALIZADA",
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      fecha_inicio: "2023-11-01",
      presupuesto: 180000,
      descripcion: "Centro comercial con 15 locales y estacionamiento"
    },
    {
      id: "4",
      nombre: "Torre Corporativa Microcentro",
      localizacion: "Av. 9 de Julio 1200, Microcentro",
      estado: "ACTIVA",
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      fecha_inicio: "2024-03-10",
      presupuesto: 450000,
      descripcion: "Torre de oficinas de 20 pisos con tecnología inteligente"
    },
    {
      id: "5",
      nombre: "Casa de Campo Estancia Verde",
      localizacion: "Ruta 9 km 45, Pilar",
      estado: "CANCELADA",
      created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      fecha_inicio: "2023-09-15",
      presupuesto: 120000,
      descripcion: "Casa de campo con piscina y quincho"
    },
    {
      id: "6",
      nombre: "Condominio Las Flores",
      localizacion: "Av. Libertador 3200, Vicente López",
      estado: "ACTIVA",
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      fecha_inicio: "2024-02-15",
      presupuesto: 320000,
      descripcion: "Complejo residencial de 4 torres con amenities premium"
    },
    {
      id: "7",
      nombre: "Refacción Hospital San Martín",
      localizacion: "Av. Córdoba 1800, Palermo",
      estado: "PAUSADA",
      created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      fecha_inicio: "2023-12-01",
      presupuesto: 180000,
      descripcion: "Refacción integral de hospital público"
    },
    {
      id: "8",
      nombre: "Escuela Técnica Industrial",
      localizacion: "Av. Rivadavia 4500, Caballito",
      estado: "FINALIZADA",
      created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      fecha_inicio: "2023-08-01",
      presupuesto: 280000,
      descripcion: "Construcción de escuela técnica con talleres especializados"
    },
    {
      id: "9",
      nombre: "Oficinas Empresariales Puerto Madero",
      localizacion: "Av. Alicia Moreau de Justo 1200, Puerto Madero",
      estado: "ACTIVA",
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      fecha_inicio: "2024-03-20",
      presupuesto: 520000,
      descripcion: "Edificio de oficinas clase A con certificación LEED"
    }
  ]);

  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hooks para suscripciones
  const { showUpgradeModal } = useUpgradeModal();
  const { checkLimit } = usePlanLimitGuard();
  const { usageSummary } = usePlanUsage();

  // Filtrar obras
  const obrasFiltradas = obras.filter(obra => {
    const matchesSearch = obra.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obra.localizacion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterEstado || obra.estado === filterEstado;
    return matchesSearch && matchesFilter;
  });

  // Funciones del modal
  const abrirModalCrear = () => {
    setIsEditing(false);
    setFormState(initialFormState);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (obra: Obra) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Actualizar obra existente
        const obraIndex = obras.findIndex(o => o.nombre === formState.nombre);
        if (obraIndex !== -1) {
          const obraActualizada = {
            ...obras[obraIndex],
            ...formState,
            presupuesto: formState.presupuesto ? parseFloat(formState.presupuesto) : undefined,
            updatedAt: new Date().toISOString()
          };
          setObras(prev => prev.map(o => o.id === obraActualizada.id ? obraActualizada : o));
        }
      } else {
        // Crear nueva obra
        const nuevaObra: Obra = {
          id: Date.now().toString(),
          nombre: formState.nombre,
          localizacion: formState.localizacion,
          estado: 'ACTIVA',
          created_at: new Date().toISOString(),
          fecha_inicio: formState.fecha_inicio,
          presupuesto: formState.presupuesto ? parseFloat(formState.presupuesto) : undefined,
          descripcion: formState.descripcion
        };
        setObras(prev => [...prev, nuevaObra]);
      }
      cerrarModal();
    } catch (err) {
      setError('Error al guardar la obra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteObra = (obra: Obra) => {
    if (window.confirm(`¿Estás seguro de que querés eliminar la obra "${obra.nombre}"?`)) {
      setObras(prev => prev.filter(o => o.id !== obra.id));
    }
  };

  const handleViewObra = (obra: Obra) => {
    setSelectedObra(obra);
  };

  const abrirWizardCrear = () => {
    // Verificar límites de suscripción
    if (!checkLimit('obras')) {
      showUpgradeModal();
      return;
    }
    router.push('/wizard/crear-obra');
  };

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
      tareas: tareasMock,
      progreso: 35,
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
      <div className="flex justify-end mb-6">
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

      {/* Filtros */}
      <Card title="Filtros" className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-grows-text-secondary" />
              <input
                type="text"
                placeholder="Buscar obras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-grows-border rounded-grows-md focus:ring-2 focus:ring-grows-secondary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterEstado === 'ACTIVA' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterEstado(filterEstado === 'ACTIVA' ? '' : 'ACTIVA')}
            >
              Activas
            </Button>
            <Button
              variant={filterEstado === 'PAUSADA' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterEstado(filterEstado === 'PAUSADA' ? '' : 'PAUSADA')}
            >
              Pausadas
            </Button>
            <Button
              variant={filterEstado === 'FINALIZADA' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterEstado(filterEstado === 'FINALIZADA' ? '' : 'FINALIZADA')}
            >
              Finalizadas
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de obras */}
      {obrasFiltradas.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="h-12 w-12 text-grows-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-grows-primary mb-2">
            {searchTerm || filterEstado ? 'No se encontraron obras' : 'No hay obras creadas'}
          </h3>
          <p className="text-grows-text-secondary mb-6">
            {searchTerm || filterEstado 
              ? 'Intenta ajustar los filtros de búsqueda' 
              : 'Comienza creando tu primera obra'
            }
          </p>
          {!searchTerm && !filterEstado && (
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