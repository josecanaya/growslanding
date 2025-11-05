'use client';

import { useState } from 'react';
import { Building2, TrendingUp, Clock, MapPin, User, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, EmptyState, SectionLayout } from '@/components/ui/grows';

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
  const getEstadoVariant = (estado: string) => {
    switch (estado) {
      case 'activa': return 'success';
      case 'pausada': return 'warning';
      case 'finalizada': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card
      onClick={() => onVerPlanificacion(obra.id)}
      footer={
        <div className="flex justify-end">
          <Button variant="primary" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
            Ver planificación
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-grows-md border border-grows-border bg-grows-secondary/10 p-2">
            <Building2 className="h-5 w-5 text-grows-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-grows-primary">
              {obra.nombre}
            </h3>
            <div className="mt-1 flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-grows-text-secondary" />
              <span className="text-sm text-grows-text-secondary">
                {obra.direccion}
              </span>
            </div>
          </div>
        </div>
        <Badge variant={getEstadoVariant(obra.estado)}>
          {obra.estado}
        </Badge>
      </div>

      {/* Información del cliente */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-grows-text-secondary">
          <User className="h-4 w-4" />
          <span className="font-medium">Cliente:</span>
          <span>{obra.cliente}</span>
        </div>
      </div>

      {/* Progreso */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-grows-text-primary">Progreso general</span>
          <span className="text-sm text-grows-text-secondary">{obra.avance}%</span>
        </div>
        <div className="w-full bg-grows-neutral rounded-full h-2">
          <div 
            className="bg-grows-secondary h-2 rounded-full transition-all duration-300"
            style={{ width: `${obra.avance}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-grows-text-secondary">
          <span>{obra.tareasCompletadas} de {obra.tareasTotal} tareas</span>
        </div>
      </div>
    </Card>
  );
}

export default function TareasPage() {
  const router = useRouter();
  const [obras] = useState<Obra[]>(obrasMock);

  // Filtrar solo obras activas
  const obrasActivas = obras.filter(obra => obra.estado === 'activa');

  const handleVerPlanificacion = (obraId: string) => {
    router.push(`/cliente/tareas/${obraId}`);
  };

  return (
    <SectionLayout
      title="Gestión de Tareas"
      subtitle="Seleccioná una obra para ver su progreso y planificación"
    >
      {/* Grid de obras */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {obrasActivas.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No hay obras activas disponibles"
              description="Todas las obras están pausadas o finalizadas"
              icon={<Building2 className="h-16 w-16" />}
              action={
                <Button variant="primary">
                  Crear nueva obra
                </Button>
              }
            />
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
        <Card title="Resumen general">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-grows-primary">{obrasActivas.length}</div>
              <div className="text-sm text-grows-text-secondary">Obras activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-grows-secondary">
                {Math.round(obrasActivas.reduce((acc, obra) => acc + obra.avance, 0) / obrasActivas.length)}%
              </div>
              <div className="text-sm text-grows-text-secondary">Progreso promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-grows-primary">
                {obrasActivas.reduce((acc, obra) => acc + obra.tareasTotal, 0)}
              </div>
              <div className="text-sm text-grows-text-secondary">Total de tareas</div>
            </div>
          </div>
        </Card>
      )}
    </SectionLayout>
  );
}

