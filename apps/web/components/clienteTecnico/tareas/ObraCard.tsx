'use client';

import { Building2, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/grows';

interface Obra {
  id: string;
  nombre: string;
  direccion: string;
  estado: 'activa' | 'pausada' | 'finalizada';
  avance: number; // porcentaje 0-100
  fechaInicio: string;
  fechaFin?: string;
  responsable: string;
  tareasTotal: number;
  tareasCompletadas: number;
}

interface ObraCardProps {
  obra: Obra;
  onVerTareas: (obraId: string) => void;
}

export function ObraCard({ obra, onVerTareas }: ObraCardProps) {
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
      footer={
        <Button
          variant="primary"
          size="sm"
          onClick={() => onVerTareas(obra.id)}
          icon={<ArrowRight className="h-4 w-4" />}
          className="w-full"
        >
          Ver tareas
        </Button>
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
        <div className="flex items-center space-x-2">
          <Badge variant={getEstadoVariant(obra.estado)}>
            {obra.estado.charAt(0).toUpperCase() + obra.estado.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-grows-primary">Progreso de tareas</span>
          <span className="text-sm text-grows-text-secondary">{obra.avance}%</span>
        </div>
        <div className="w-full rounded-full h-2 bg-grows-neutral">
          <div 
            className="h-2 rounded-full bg-grows-primary transition-all duration-300"
            style={{ width: `${obra.avance}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-grows-text-secondary">
          <span>{obra.tareasCompletadas} de {obra.tareasTotal} tareas</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm text-grows-text-secondary">
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>Inicio: {new Date(obra.fechaInicio).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Building2 className="h-4 w-4" />
          <span>{obra.responsable}</span>
        </div>
      </div>
    </Card>
  );
}
