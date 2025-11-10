'use client';

import React, { useState } from 'react';
import { Cuadrilla, Especialidad, EstadoCuadrilla } from '@/lib/types/cuadrillas';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import {
  Users,
  Hammer,
  Paintbrush,
  Wrench,
  Zap,
  FlaskConical,
  Palette,
  Star,
  CheckCircle,
  AlertTriangle,
  Phone,
  MessageCircle,
  Mail,
  Eye,
  ClipboardList,
  Calendar,
  Building2,
  Shield,
  ChevronDown,
  ChevronUp,
  Clock,
  BadgeCheck,
  Trash2,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { BaseCard } from '@/components/ui/grows';
import { GROWS_TOKENS } from '@/lib/design-system/tokens';

interface CuadrillaCardProps {
  cuadrilla: Cuadrilla;
}

const EspecialidadIcon: React.FC<{ especialidad: Especialidad }> = ({ especialidad }) => {
  switch (especialidad) {
    case 'Albañilería / Estructura':
      return <Hammer className="h-4 w-4" />;
    case 'Yesería / Terminaciones':
      return <Paintbrush className="h-4 w-4" />;
    case 'Carpintería':
      return <Wrench className="h-4 w-4" />;
    case 'Plomería / Gas':
      return <FlaskConical className="h-4 w-4" />;
    case 'Electricidad':
      return <Zap className="h-4 w-4" />;
    case 'Pintura':
      return <Palette className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
};

const EstadoBadge: React.FC<{ estado: EstadoCuadrilla }> = ({ estado }) => {
  let colorClass = '';
  let icon: React.ReactNode = null;
  switch (estado) {
    case 'Disponible':
      colorClass = 'bg-green-100 text-green-800';
      icon = <CheckCircle className="h-3 w-3" />;
      break;
    case 'Ocupada':
      colorClass = 'bg-yellow-100 text-yellow-800';
      icon = <Clock className="h-3 w-3" />;
      break;
    case 'En obra':
      colorClass = 'bg-blue-100 text-blue-800';
      icon = <Building2 className="h-3 w-3" />;
      break;
    case 'Inactiva':
      colorClass = 'bg-gray-100 text-gray-800';
      icon = <AlertTriangle className="h-3 w-3" />;
      break;
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {icon}
      <span className="ml-1">{estado}</span>
    </span>
  );
};

export function CuadrillaCard({ cuadrilla }: CuadrillaCardProps) {
  const { seleccionarCuadrilla, abrirDrawer, abrirModalAsignacion, eliminarCuadrilla } = useCuadrillasStore();
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cuadrilla.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
  } as React.CSSProperties;

  const tieneAlertas =
    !cuadrilla.seguridadAlDia ||
    cuadrilla.integrantes.some((i) => !i.seguroVigente) ||
    cuadrilla.documentos.some((d) => !d.vigente);

  const getBorderColor = () => {
    if (tieneAlertas) return GROWS_TOKENS.colors.growsError;
    if (cuadrilla.cumplimientoTiempo >= 90) return GROWS_TOKENS.colors.growsBlue;
    if (cuadrilla.cumplimientoTiempo >= 75) return GROWS_TOKENS.colors.growsBlueLight;
    return GROWS_TOKENS.colors.growsBorder;
  };

  const handleEliminar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUser?.orgId) {
      toast({
        title: 'Error',
        description: 'No estás autenticado',
      });
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar la cuadrilla "${cuadrilla.nombre}"?`)) {
      return;
    }

    try {
      const exito = await eliminarCuadrilla(cuadrilla.id, currentUser.orgId);
      if (exito) {
        toast({
          title: 'Cuadrilla eliminada',
          description: 'La cuadrilla fue eliminada correctamente.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la cuadrilla',
        });
      }
    } catch (error) {
      console.error('[ERROR_ELIMINAR_CUADRILLA]', error);
      toast({
        title: 'Error',
        description: 'Error inesperado al eliminar la cuadrilla',
      });
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <BaseCard className="border-l-4 border-grows-border" style={{ borderLeftColor: getBorderColor() }}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-grows-lg bg-grows-gray p-2">
                <EspecialidadIcon especialidad={cuadrilla.especialidad} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-growsBlue">{cuadrilla.nombre}</h3>
                <p className="text-sm text-growsTextMuted">{cuadrilla.encargado}</p>
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <EstadoBadge estado={cuadrilla.estado} />
              <button
                onClick={handleEliminar}
                onMouseDown={(e) => e.stopPropagation()}
                className="rounded-grows-md p-1.5 transition-colors hover:bg-grows-blue-light/10"
                title="Eliminar cuadrilla"
                type="button"
              >
                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-growsTextMuted">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{cuadrilla.valoracionPromedio.toFixed(1)}/5</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-growsBlue" />
              <span>{cuadrilla.cumplimientoTiempo}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-growsBlueLight" />
              <span>{cuadrilla.obrasParticipadas} obras</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-growsTextMuted" />
              <span>{cuadrilla.integrantes.length} integrantes</span>
            </div>
          </div>

          <button
            className="flex w-full items-center justify-center text-growsTextMuted transition-colors hover:text-growsBlue"
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                <span className="text-sm">Ver menos</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                <span className="text-sm">Ver más detalles</span>
              </>
            )}
          </button>

          {isExpanded && (
            <div className="space-y-4 border-t border-grows-border pt-4">
              <div className="flex justify-center gap-3 text-xs font-medium text-growsTextMuted">
                {cuadrilla.whatsappEncargado && (
                  <a
                    href={`https://wa.me/${cuadrilla.whatsappEncargado}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-green-600 transition-colors hover:text-green-700"
                  >
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </a>
                )}
                {cuadrilla.telefonoEncargado && (
                  <a
                    href={`tel:${cuadrilla.telefonoEncargado}`}
                    className="flex items-center gap-1 text-growsBlue transition-colors hover:text-growsBlue/80"
                  >
                    <Phone className="h-3 w-3" />
                    Llamar
                  </a>
                )}
                {cuadrilla.emailEncargado && (
                  <a
                    href={`mailto:${cuadrilla.emailEncargado}`}
                    className="flex items-center gap-1 text-growsBlueLight transition-colors hover:text-growsBlueLight/80"
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </a>
                )}
              </div>

              <div className="flex items-center justify-center text-sm text-growsTextMuted">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{cuadrilla.antiguedad}</span>
              </div>

              <div className="flex items-center justify-center">
                {cuadrilla.seguridadAlDia ? (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-growsBlue">
                    <Shield className="h-4 w-4" />
                    Documentación al día
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Revisar documentación
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <button
                  onClick={() => {
                    seleccionarCuadrilla(cuadrilla);
                    abrirDrawer();
                  }}
                  className="flex items-center justify-center gap-2 rounded-grows-md bg-growsBlue px-3 py-2 text-white transition-colors duration-200 hover:bg-growsBlue/90"
                  type="button"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver detalle</span>
                </button>
                <button
                  onClick={() => {
                    seleccionarCuadrilla(cuadrilla);
                    abrirModalAsignacion();
                  }}
                  className="flex items-center justify-center gap-2 rounded-grows-md bg-grows-gray px-3 py-2 text-growsText transition-colors duration-200 hover:bg-grows-gray/80"
                  type="button"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>Asignar</span>
                </button>
              </div>

              {tieneAlertas && (
                <div className="flex items-center justify-center gap-2 border-t border-grows-border pt-3 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Revisar seguros o documentación</span>
                </div>
              )}
            </div>
          )}
        </div>
      </BaseCard>
    </div>
  );
}