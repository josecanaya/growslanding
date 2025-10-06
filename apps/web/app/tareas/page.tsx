'use client';

import { useState } from 'react';
import { Building2, TrendingUp, Clock, MapPin, User, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Tipos de datos
interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  cliente: string;
  estado: 'activa' | 'pausada' | 'finalizada';
  avance: number;
  tareasTotal: number;
  tareasCompletadas: number;
  fechaInicio: string;
  responsable: string;
}

// Datos mock
const obrasMock: Obra[] = [
  {
    id: '1',
    nombre: 'Casa Residencial Norte',
    direccion: 'Av. Libertador 1234, CABA',
    cliente: 'Familia Rodríguez',
    estado: 'activa',
    avance: 65,
    tareasTotal: 12,
    tareasCompletadas: 8,
    fechaInicio: '2024-01-15',
    responsable: 'Carlos Pérez'
  },
  {
    id: '2',
    nombre: 'Edificio Comercial Centro',
    direccion: 'Corrientes 2500, CABA',
    cliente: 'Inmobiliaria Sur',
    estado: 'activa',
    avance: 30,
    tareasTotal: 18,
    tareasCompletadas: 5,
    fechaInicio: '2024-02-01',
    responsable: 'María González'
  },
  {
    id: '3',
    nombre: 'Villa Familiar Sur',
    direccion: 'Ruta 2 Km 45, Buenos Aires',
    cliente: 'Constructora Norte',
    estado: 'pausada',
    avance: 45,
    tareasTotal: 10,
    tareasCompletadas: 4,
    fechaInicio: '2023-11-01',
    responsable: 'Roberto Silva'
  }
];

interface ObraResumenCardProps {
  obra: Obra;
  onVerPlanificacion: (obraId: string) => void;
}

function ObraResumenCard({ obra, onVerPlanificacion }: ObraResumenCardProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800 border-green-200';
      case 'pausada': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'finalizada': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa': return <TrendingUp className="h-4 w-4" />;
      case 'pausada': return <Clock className="h-4 w-4" />;
      case 'finalizada': return <Building2 className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{obra.nombre}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin className="h-4 w-4" />
                <span>{obra.direccion}</span>
              </div>
            </div>
          </div>
          
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoColor(obra.estado)}`}>
            {getEstadoIcon(obra.estado)}
            {obra.estado.charAt(0).toUpperCase() + obra.estado.slice(1)}
          </span>
        </div>

        {/* Información del cliente */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span className="font-medium">Cliente:</span>
            <span>{obra.cliente}</span>
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso general</span>
            <span className="text-sm text-gray-600">{obra.avance}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${obra.avance}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>{obra.tareasCompletadas} de {obra.tareasTotal} tareas</span>
          </div>
        </div>

        {/* Botón de acción */}
        <button
          onClick={() => onVerPlanificacion(obra.id)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <span>Ver planificación</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function TareasPage() {
  const router = useRouter();
  const [obras] = useState<Obra[]>(obrasMock);

  // Filtrar solo obras activas
  const obrasActivas = obras.filter(obra => obra.estado === 'activa');

  const handleVerPlanificacion = (obraId: string) => {
    router.push(`/tareas/${obraId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1>
              <p className="text-gray-600 mt-1">Seleccioná una obra para ver su progreso y planificación</p>
            </div>
          </div>
        </div>

        {/* Grid de obras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {obrasActivas.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay obras activas disponibles</h3>
              <p className="text-gray-600">Todas las obras están pausadas o finalizadas</p>
            </div>
          ) : (
            obrasActivas.map(obra => (
              <ObraResumenCard
                key={obra.id}
                obra={obra}
                onVerPlanificacion={handleVerPlanificacion}
              />
            ))
          )}
        </div>

        {/* Estadísticas generales */}
        {obrasActivas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen general</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{obrasActivas.length}</div>
                <div className="text-sm text-gray-600">Obras activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(obrasActivas.reduce((acc, obra) => acc + obra.avance, 0) / obrasActivas.length)}%
                </div>
                <div className="text-sm text-gray-600">Progreso promedio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {obrasActivas.reduce((acc, obra) => acc + obra.tareasTotal, 0)}
                </div>
                <div className="text-sm text-gray-600">Total de tareas</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
