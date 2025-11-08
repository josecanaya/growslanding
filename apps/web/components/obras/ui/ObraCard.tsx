import { MouseEvent } from 'react';
import {
  Building2,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  MapPin,
  MoreVertical,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui/grows';
import type { BadgeProps } from '@/components/ui/grows';
import { Obra } from '@/types/obras';

type ObraCardProps = {
  obra: Obra;
  onView: (obra: Obra) => void;
  onEdit: (obra: Obra) => void;
  onDelete: (obra: Obra) => void;
};

const estadoVariantMap: Record<string, BadgeProps['variant']> = {
  ACTIVA: 'success',
  PAUSADA: 'warning',
  FINALIZADA: 'info',
  CANCELADA: 'error',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getEstadoVariant(estado: string): BadgeProps['variant'] {
  return estadoVariantMap[estado] ?? 'default';
}

export function ObraCard({ obra, onView, onEdit, onDelete }: ObraCardProps) {
  const handleView = () => onView(obra);
  const handleViewClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onView(obra);
  };
  const handleEditClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onEdit(obra);
  };
  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete(obra);
  };
  const handleOverflowClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <Card
      onClick={handleView}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewClick}
              icon={<Eye className="h-4 w-4" />}
            >
              Ver
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              icon={<Edit3 className="h-4 w-4" />}
            >
              Editar
            </Button>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteClick}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Eliminar
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
                {obra.localizacion?.trim() || 'Sin ubicación'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getEstadoVariant(obra.estado)}>
            {obra.estado || 'ACTIVA'}
          </Badge>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOverflowClick}
              className="!p-1"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {obra.descripcion && (
        <p className="mb-4 line-clamp-2 text-sm text-grows-text-secondary">
          {obra.descripcion}
        </p>
      )}

      <div className="mb-4 flex items-center justify-between text-sm text-grows-text-secondary">
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>Creada: {formatDate(obra.created_at)}</span>
        </div>
        {obra.fecha_inicio && (
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Inicio: {formatDate(obra.fecha_inicio)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
