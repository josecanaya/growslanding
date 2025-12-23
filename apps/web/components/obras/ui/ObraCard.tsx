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

// Función para formatear el título de la obra
// Convierte "casa familiar – nombre del dueño" a "Nombre del Dueño (Casa Familiar)"
function formatearTituloObra(nombre: string, cliente?: string, tipoObra?: string): string {
  // Si tenemos cliente y tipoObra separados, usarlos directamente
  if (cliente && tipoObra) {
    const tipoCapitalizado = tipoObra
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    const clienteCapitalizado = cliente
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return `${clienteCapitalizado} (${tipoCapitalizado})`;
  }

  // Si el nombre ya viene en formato "tipo – cliente", parsearlo
  if (nombre.includes('–') || nombre.includes('-')) {
    const partes = nombre.split(/[–-]/).map(p => p.trim());
    if (partes.length >= 2) {
      const tipo = partes[0];
      const clienteNombre = partes.slice(1).join(' ');
      const tipoCapitalizado = tipo
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      const clienteCapitalizado = clienteNombre
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return `${clienteCapitalizado} (${tipoCapitalizado})`;
    }
  }

  // Si no hay separador, intentar usar cliente y tipoObra si están disponibles
  if (cliente && tipoObra) {
    const tipoCapitalizado = tipoObra
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    const clienteCapitalizado = cliente
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return `${clienteCapitalizado} (${tipoCapitalizado})`;
  }

  // Si solo tenemos cliente, mostrar cliente primero
  if (cliente) {
    const clienteCapitalizado = cliente
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return tipoObra ? `${clienteCapitalizado} (${tipoObra})` : clienteCapitalizado;
  }

  // Fallback: capitalizar el nombre original
  return nombre
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function ObraCard({ obra, onView, onEdit, onDelete }: ObraCardProps) {
  const tituloFormateado = formatearTituloObra(obra.nombre, obra.cliente, obra.tipoObra);
  
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
      {/* Header con título y estado */}
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-grows-md border border-grows-border bg-grows-secondary/10 p-2 flex-shrink-0">
          <Building2 className="h-5 w-5 text-grows-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-lg font-semibold text-grows-primary break-words leading-tight flex-1">
              {tituloFormateado}
            </h3>
            <div className="flex items-center space-x-2 flex-shrink-0">
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
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-grows-text-secondary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-grows-text-secondary break-words line-clamp-2">
              {obra.localizacion?.trim() || 'Sin ubicación'}
            </span>
          </div>
        </div>
      </div>

      {obra.descripcion && (
        <p className="mb-4 line-clamp-2 text-sm text-grows-text-secondary">
          {obra.descripcion}
        </p>
      )}

      <div className="mb-4 flex flex-col gap-2 text-sm text-grows-text-secondary">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong className="text-grows-text">Inicio estimado:</strong>{' '}
            {obra.fecha_inicio_estimada
              ? new Date(obra.fecha_inicio_estimada).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })
              : '—'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong className="text-grows-text">Finalización estimada:</strong>{' '}
            {obra.fecha_final_estimada
              ? new Date(obra.fecha_final_estimada).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })
              : '—'}
          </span>
        </div>
      </div>
    </Card>
  );
}
