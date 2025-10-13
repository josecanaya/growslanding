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
  estado: string;
  fecha_inicio: string;
  presupuesto: string;
  descripcion: string;
}

// Estados disponibles
const ESTADOS = ['ACTIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA'];

// Estado inicial del formulario
const initialFormState: FormState = {
  nombre: '',
  localizacion: '',
  estado: 'ACTIVA',
  fecha_inicio: '',
  presupuesto: '',
  descripcion: ''
};

// Componente para mostrar el estado de la obra
const EstadoBadge = ({ estado }: { estado: string }) => {
  const getEstadoStyles = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return {
          backgroundColor: '#e8f5e8',
          color: '#2d5a2d',
          borderColor: '#a8d8a8'
        };
      case 'PAUSADA':
        return {
          backgroundColor: '#fffbf0',
          color: '#8b6914',
          borderColor: '#f4d03f'
        };
      case 'FINALIZADA':
        return {
          backgroundColor: '#f4e27e',
          color: '#1B263B',
          borderColor: '#d4af37'
        };
      case 'CANCELADA':
        return {
          backgroundColor: '#ffeaea',
          color: '#8B0000',
          borderColor: '#ffb3b3'
        };
      default:
        return {
          backgroundColor: '#f5f7fa',
          color: '#1B263B',
          borderColor: '#dce3ea'
        };
    }
  };

  return (
    <span 
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
      style={getEstadoStyles(estado)}
    >
      {estado}
    </span>
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
    <div 
      className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer transition-all duration-300 ease-in-out"
      style={{borderColor: '#dce3ea'}}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(27, 38, 59, 0.1), 0 4px 6px -2px rgba(27, 38, 59, 0.05)';
        e.currentTarget.style.borderColor = '#1B263B';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#dce3ea';
      }}
      onClick={() => onView(obra)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white rounded-lg border" style={{borderColor: '#dce3ea'}}>
            <Building2 className="h-5 w-5" style={{color: '#1B263B'}} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{color: '#10161a'}}>{obra.nombre}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <MapPin className="h-4 w-4" style={{color: '#5b5f6a'}} />
              <span className="text-sm" style={{color: '#5b5f6a'}}>
                {obra.localizacion?.trim() || "Sin ubicación"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <EstadoBadge estado={obtenerEstado(obra.estado)} />
          <div className="relative">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-lg transition-all duration-300 ease-in-out"
              style={{color: '#5b5f6a'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f7fa';
                e.currentTarget.style.color = '#1B263B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#5b5f6a';
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {obra.descripcion && (
        <p className="text-sm mb-4 line-clamp-2" style={{color: '#5b5f6a'}}>
          {obra.descripcion}
        </p>
      )}

      <div className="flex items-center justify-between text-sm mb-4" style={{color: '#5b5f6a'}}>
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

      <div className="flex items-center justify-between pt-4 border-t" style={{borderColor: '#dce3ea'}}>
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(obra);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ease-in-out"
            style={{color: '#1B263B'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f7fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Eye className="h-4 w-4" />
            <span>Ver</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(obra);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ease-in-out"
            style={{color: '#1B263B'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f7fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Edit3 className="h-4 w-4" />
            <span>Editar</span>
          </button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(obra);
          }}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ease-in-out"
          style={{color: '#8B0000'}}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(139, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
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
      localizacion: "Av. Las Flores 3200, San Isidro",
      estado: "ACTIVA",
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      fecha_inicio: "2024-02-20",
      presupuesto: 320000,
      descripcion: "Conjunto de 4 casas dúplex con jardín común"
    },
    {
      id: "7",
      nombre: "Refacción Hospital San Martín",
      localizacion: "Av. Libertador 4800, Vicente López",
      estado: "PAUSADA",
      created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      fecha_inicio: "2024-01-05",
      presupuesto: 280000,
      descripcion: "Refacción integral de 3 pisos del hospital"
    },
    {
      id: "8",
      nombre: "Escuela Técnica Industrial",
      localizacion: "Calle Industrial 1500, La Matanza",
      estado: "FINALIZADA",
      created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      fecha_inicio: "2023-08-01",
      presupuesto: 190000,
      descripcion: "Construcción de escuela técnica con talleres especializados"
    },
    {
      id: "9",
      nombre: "Oficinas Empresariales Puerto Madero",
      localizacion: "Av. Alicia Moreau de Justo 1850, Puerto Madero",
      estado: "ACTIVA",
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      fecha_inicio: "2024-03-25",
      presupuesto: 380000,
      descripcion: "Complejo de oficinas clase A con vista al río"
    },
    {
      id: "10",
      nombre: "Residencial Universitario",
      localizacion: "Av. Córdoba 4200, Villa Crespo",
      estado: "PAUSADA",
      created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
      fecha_inicio: "2023-12-10",
      presupuesto: 220000,
      descripcion: "Residencia estudiantil con 150 habitaciones y servicios"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [formData, setFormData] = useState<FormState>({ ...initialFormState });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);

  // Cargar obras al montar el componente
  useEffect(() => {
    console.log('ObrasSection mounted');
  }, []);

  // Actualizar formulario cuando se edita una obra
  useEffect(() => {
    setFormData(mapObraToForm(editingObra));
  }, [editingObra]);

  // Función para cargar obras desde la API
  const cargarObras = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/obras");
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setObras(Array.isArray(data.obras) ? data.obras : []);
    } catch (err) {
      console.error("Error al cargar las obras:", err);
      // En caso de error, mostrar datos de ejemplo para que la aplicación funcione
      setObras([
        {
          id: "1",
          nombre: "Casa Familiar Los Robles",
          localizacion: "Av. Corrientes 1234, CABA",
          estado: "ACTIVA",
          created_at: new Date().toISOString(),
          fecha_inicio: "2024-01-15",
          presupuesto: 50000,
          descripcion: "Proyecto de casa familiar de dos plantas"
        },
        {
          id: "2", 
          nombre: "Edificio Residencial Norte",
          localizacion: "Calle Norte 567, CABA",
          estado: "PAUSADA",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          fecha_inicio: "2024-02-01",
          presupuesto: 150000,
          descripcion: "Edificio de 6 plantas con 24 departamentos"
        }
      ]);
      setError("Error al cargar desde la API. Mostrando datos de ejemplo.");
    } finally {
      setLoading(false);
    }
  };

  // Función para crear una nueva obra
  const crearObraEnBD = async (datos: FormState) => {
    try {
      setSaving(true);
      setError(null);
      const payload = mapFormToPayload(datos);
      const response = await fetch("/api/obras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organizacion-id": "demo-org",
          "x-usuario-id": "user-demo",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const nuevaObra = await response.json();
      setObras(prev => [nuevaObra, ...prev]);
      cerrarModal();
      setFormData({ ...initialFormState });
    } catch (err) {
      console.error("Error al crear la obra:", err);
      setError(err instanceof Error ? err.message : "Error al crear la obra");
    } finally {
      setSaving(false);
    }
  };

  // Función para actualizar una obra existente
  const actualizarObraEnBD = async (id: string, datos: FormState) => {
    try {
      setSaving(true);
      setError(null);
      const payload = mapFormToPayload(datos);
      const response = await fetch(`/api/obras/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-organizacion-id": "demo-org",
          "x-usuario-id": "user-demo",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const obraActualizada = await response.json();
      setObras(prev => prev.map(obra => obra.id === id ? obraActualizada : obra));
      cerrarModal();
      setFormData({ ...initialFormState });
    } catch (err) {
      console.error("Error al actualizar la obra:", err);
      setError(err instanceof Error ? err.message : "Error al actualizar la obra");
    } finally {
      setSaving(false);
    }
  };

  // Función para eliminar una obra
  const eliminarObraEnBD = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/obras/${id}`, {
        method: "DELETE",
        headers: {
          "x-organizacion-id": "demo-org",
          "x-usuario-id": "user-demo",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      setObras(prev => prev.filter(obra => obra.id !== id));
    } catch (err) {
      console.error("Error al eliminar la obra:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar la obra");
    }
  };

  // Funciones auxiliares
  const mapObraToForm = (obra: Obra | null): FormState => {
    if (!obra) return { ...initialFormState };
    return {
      nombre: obra.nombre || '',
      localizacion: obra.localizacion || '',
      estado: obra.estado || 'ACTIVA',
      fecha_inicio: obra.fecha_inicio ? obra.fecha_inicio.split('T')[0] : '',
      presupuesto: obra.presupuesto?.toString() || '',
      descripcion: obra.descripcion || ''
    };
  };

  const mapFormToPayload = (form: FormState) => {
    return {
      nombre: form.nombre.trim(),
      localizacion: form.localizacion.trim() || undefined,
      estado: form.estado,
      fecha_inicio: form.fecha_inicio ? new Date(form.fecha_inicio).toISOString() : undefined,
      presupuesto: form.presupuesto ? parseFloat(form.presupuesto) : undefined,
      descripcion: form.descripcion.trim() || undefined
    };
  };

  const toISOStringFromInput = (inputValue: string) => {
    if (!inputValue) return undefined;
    const date = new Date(inputValue);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  };

  // Handlers
  const abrirModalCrear = () => {
    setEditingObra(null);
    setFormData({ ...initialFormState });
    setIsModalOpen(true);
  };

  const abrirWizardCrear = () => {
    router.push('/obras/nueva');
  };


  const abrirModalEditar = (obra: Obra) => {
    setEditingObra(obra);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingObra(null);
    setFormData({ ...initialFormState });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingObra) {
      await actualizarObraEnBD(editingObra.id, formData);
    } else {
      await crearObraEnBD(formData);
    }
  };

  const handleDeleteObra = async (obra: Obra) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la obra "${obra.nombre}"?`)) {
      await eliminarObraEnBD(obra.id);
    }
  };

  const handleViewObra = (obra: Obra) => {
    setSelectedObra(obra);
  };

  // Filtrar obras
  const obrasFiltradas = obras.filter(obra => {
    const matchesSearch = searchTerm === '' || 
      obra.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.localizacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === '' || obra.estado === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  // Debug: Mostrar estado actual
  console.log('ObrasSection render - loading:', loading, 'obras:', obras.length, 'error:', error);

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{backgroundColor: '#eaf0f6'}}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 rounded w-48 mb-6" style={{backgroundColor: '#dce3ea'}}></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border" style={{borderColor: '#dce3ea'}}>
                  <div className="h-6 rounded w-3/4 mb-4" style={{backgroundColor: '#dce3ea'}}></div>
                  <div className="h-4 rounded w-1/2 mb-2" style={{backgroundColor: '#dce3ea'}}></div>
                  <div className="h-4 rounded w-2/3" style={{backgroundColor: '#dce3ea'}}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si hay una obra seleccionada, mostrar el detalle completo
  if (selectedObra) {
    // Mock de tareas para el detalle (en una app real, esto vendría de la API)
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

    // Mock de obra completa para el detalle
    const obraCompleta = {
      ...selectedObra,
      cliente: 'Cliente Demo',
      tipoObra: 'nueva' as const,
      fechaInicio: selectedObra.fecha_inicio || new Date().toISOString(),
      progreso: 0,
      etapa: 'estructura' as const,
      lider: 'Juan Pérez',
      tareasActivas: 1,
      tareasCompletadas: 0,
      legajoTecnico: [],
      estado: (selectedObra.estado === 'ACTIVA' ? 'activa' : 
               selectedObra.estado === 'PAUSADA' ? 'pausada' : 
               'finalizada') as 'activa' | 'pausada' | 'finalizada'
    };

    return (
      <DetalleObra
        obra={obraCompleta}
        tareas={tareasMock}
        onVolver={() => setSelectedObra(null)}
        onActualizarTarea={(tarea) => {
          console.log('Actualizar tarea:', tarea);
          // En una app real, esto llamaría a la API
        }}
        onCrearTarea={(tarea) => {
          console.log('Crear tarea:', tarea);
          // En una app real, esto llamaría a la API
        }}
        onCrearTareas={(tareas) => {
          console.log('Crear tareas:', tareas);
          // En una app real, esto llamaría a la API
        }}
        onEliminarTarea={(tareaId) => {
          console.log('Eliminar tarea:', tareaId);
          // En una app real, esto llamaría a la API
        }}
        onActualizarObra={(obra) => {
          console.log('Actualizar obra:', obra);
          // En una app real, esto llamaría a la API
        }}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#eaf0f6'}}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header del Dashboard */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold" style={{color: '#10161a'}}>Obras</h1>
              <p className="mt-1" style={{color: '#5b5f6a'}}>Gestiona todas tus obras de construcción</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={abrirWizardCrear}
                className="flex items-center space-x-2 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 ease-in-out shadow-sm"
                style={{backgroundColor: '#1B263B'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#162033';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1B263B';
                }}
              >
                <Plus className="h-5 w-5" />
                <span>Crear Obra Completa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
      {error && (
          <div 
            className="mb-6 border rounded-lg p-4"
            style={{
              backgroundColor: 'rgba(139, 0, 0, 0.1)',
              borderColor: 'rgba(139, 0, 0, 0.3)'
            }}
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" style={{color: '#8B0000'}} />
              <span style={{color: '#8B0000'}}>{error}</span>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <a 
            href="/obras"
            className="rounded-lg shadow-sm border p-6 cursor-pointer block transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: '#f5f7fa',
              borderColor: '#dce3ea'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(27, 38, 59, 0.1), 0 4px 6px -2px rgba(27, 38, 59, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-white">
                <Building2 className="h-6 w-6" style={{color: '#1B263B'}} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{color: '#5b5f6a'}}>Total Obras</p>
                <p className="text-2xl font-bold" style={{color: '#1B263B'}}>{obras.length}</p>
              </div>
            </div>
          </a>
          <a 
            href="/obras?estado=activas"
            className="rounded-lg shadow-sm border p-6 cursor-pointer block transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: '#f5f7fa',
              borderColor: '#dce3ea'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(27, 38, 59, 0.1), 0 4px 6px -2px rgba(27, 38, 59, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-white">
                <Building2 className="h-6 w-6" style={{color: '#1B263B'}} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{color: '#5b5f6a'}}>Activas</p>
                <p className="text-2xl font-bold" style={{color: '#1B263B'}}>{obras.filter(o => o.estado === 'ACTIVA').length}</p>
              </div>
            </div>
          </a>
          <a 
            href="/obras?estado=pausadas"
            className="rounded-lg shadow-sm border p-6 cursor-pointer block transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: '#f5f7fa',
              borderColor: '#dce3ea'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(27, 38, 59, 0.1), 0 4px 6px -2px rgba(27, 38, 59, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-white">
                <Building2 className="h-6 w-6" style={{color: '#1B263B'}} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{color: '#5b5f6a'}}>Pausadas</p>
                <p className="text-2xl font-bold" style={{color: '#1B263B'}}>{obras.filter(o => o.estado === 'PAUSADA').length}</p>
              </div>
            </div>
          </a>
          <a 
            href="/obras?estado=finalizadas"
            className="rounded-lg shadow-sm border p-6 cursor-pointer block transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: '#f5f7fa',
              borderColor: '#dce3ea'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(27, 38, 59, 0.1), 0 4px 6px -2px rgba(27, 38, 59, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-white">
                <CheckCircle className="h-6 w-6" style={{color: '#1B263B'}} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{color: '#5b5f6a'}}>Finalizadas</p>
                <p className="text-2xl font-bold" style={{color: '#1B263B'}}>{obras.filter(o => o.estado === 'FINALIZADA').length}</p>
              </div>
            </div>
          </a>
          <a 
            href="/obras?estado=canceladas"
            className="rounded-lg shadow-sm border p-6 cursor-pointer block transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: '#f5f7fa',
              borderColor: '#dce3ea'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(27, 38, 59, 0.1), 0 4px 6px -2px rgba(27, 38, 59, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-white">
                <XCircle className="h-6 w-6" style={{color: '#1B263B'}} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{color: '#5b5f6a'}}>Canceladas</p>
                <p className="text-2xl font-bold" style={{color: '#1B263B'}}>{obras.filter(o => o.estado === 'CANCELADA').length}</p>
              </div>
            </div>
          </a>
        </div>

        {/* Lista de obras */}
        {obrasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterEstado ? 'No se encontraron obras' : 'No hay obras creadas'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterEstado 
                ? 'Intenta ajustar los filtros de búsqueda' 
                : 'Comienza creando tu primera obra'
              }
            </p>
              {!searchTerm && !filterEstado && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={abrirWizardCrear}
                  className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  <Plus className="h-5 w-5" />
                  <span>Crear Obra Completa</span>
                </button>
                <button
                  onClick={abrirModalCrear}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  <Plus className="h-5 w-5" />
                  <span>Crear Básica</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {editingObra ? 'Editar Obra' : 'Crear Nueva Obra'}
                    </h2>
                  <p className="text-sm text-gray-600">
                      {editingObra ? 'Modifica los datos de la obra' : 'Completa los datos para crear una nueva obra'}
                  </p>
                  </div>
                </div>
                <button
                  onClick={cerrarModal}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Obra *
                </label>
                <input
                      type="text"
                  id="nombre"
                  value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Casa en Barrio Norte"
                  required
                />
              </div>

              <div>
                    <label htmlFor="localizacion" className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación
                </label>
                <input
                      type="text"
                  id="localizacion"
                  value={formData.localizacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, localizacion: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Av. Corrientes 1234, CABA"
                />
              </div>

              <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="estado"
                  value={formData.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {ESTADOS.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>

                <div>
                    <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio
                  </label>
                  <input
                      type="date"
                    id="fecha_inicio"
                    value={formData.fecha_inicio}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                    <label htmlFor="presupuesto" className="block text-sm font-medium text-gray-700 mb-2">
                      Presupuesto (USD)
                  </label>
                  <input
                      type="number"
                      id="presupuesto"
                      value={formData.presupuesto}
                      onChange={(e) => setFormData(prev => ({ ...prev, presupuesto: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 50000"
                      min="0"
                      step="0.01"
                  />
                </div>
              </div>

              <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                </label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe los detalles de la obra..."
                    rows={4}
                />
              </div>

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cerrarModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{editingObra ? 'Actualizar' : 'Crear'} Obra</span>
                      </>
                    )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

