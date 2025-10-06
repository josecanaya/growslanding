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
  BadgeCheck
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CuadrillaCardProps {
  cuadrilla: Cuadrilla;
}

const EspecialidadIcon: React.FC<{ especialidad: Especialidad }> = ({ especialidad }) => {
  switch (especialidad) {
    case 'Albañilería / Estructura': return <Hammer className="h-4 w-4" />;
    case 'Yesería / Terminaciones': return <Paintbrush className="h-4 w-4" />;
    case 'Carpintería': return <Wrench className="h-4 w-4" />;
    case 'Plomería / Gas': return <FlaskConical className="h-4 w-4" />;
    case 'Electricidad': return <Zap className="h-4 w-4" />;
    case 'Pintura': return <Palette className="h-4 w-4" />;
    default: return <Users className="h-4 w-4" />;
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
  const { seleccionarCuadrilla, abrirDrawer, abrirModalAsignacion } = useCuadrillasStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cuadrilla.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  // Calcular alertas críticas
  const tieneAlertas = !cuadrilla.seguridadAlDia || 
    cuadrilla.integrantes.some(i => !i.seguroVigente) || 
    cuadrilla.documentos.some(d => !d.vigente);

  const getBorderColorClass = () => {
    if (tieneAlertas) return 'border-red-400';
    if (cuadrilla.cumplimientoTiempo >= 90) return 'border-green-400';
    if (cuadrilla.cumplimientoTiempo >= 75) return 'border-yellow-400';
    return 'border-gray-200';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border-l-4 ${getBorderColorClass()} border cursor-grab active:cursor-grabbing transition-all duration-200 ease-in-out hover:shadow-md`}
    >
      {/* Header compacto */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <EspecialidadIcon especialidad={cuadrilla.especialidad} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{cuadrilla.nombre}</h3>
              <p className="text-sm text-gray-600">{cuadrilla.encargado}</p>
            </div>
          </div>
          <EstadoBadge estado={cuadrilla.estado} />
        </div>

        {/* Información esencial */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-gray-600">
            <Star className="h-4 w-4 text-yellow-500 mr-2" />
            <span>{cuadrilla.valoracionPromedio.toFixed(1)}/5</span>
          </div>
          <div className="flex items-center text-gray-600">
            <BadgeCheck className="h-4 w-4 text-green-500 mr-2" />
            <span>{cuadrilla.cumplimientoTiempo}%</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Building2 className="h-4 w-4 text-blue-500 mr-2" />
            <span>{cuadrilla.obrasParticipadas} obras</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 text-gray-500 mr-2" />
            <span>{cuadrilla.integrantes.length} integrantes</span>
          </div>
        </div>

        {/* Botón de expandir */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
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
      </div>

      {/* Contenido expandido */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Contacto rápido */}
          <div className="flex justify-center space-x-3 my-3">
            {cuadrilla.whatsappEncargado && (
              <a 
                href={`https://wa.me/${cuadrilla.whatsappEncargado}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-xs font-medium"
              >
                <MessageCircle className="h-3 w-3" />
                <span>WhatsApp</span>
              </a>
            )}
            {cuadrilla.telefonoEncargado && (
              <a 
                href={`tel:${cuadrilla.telefonoEncargado}`} 
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
              >
                <Phone className="h-3 w-3" />
                <span>Llamar</span>
              </a>
            )}
            {cuadrilla.emailEncargado && (
              <a 
                href={`mailto:${cuadrilla.emailEncargado}`} 
                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium"
              >
                <Mail className="h-3 w-3" />
                <span>Email</span>
              </a>
            )}
          </div>

          {/* Antigüedad */}
          <div className="flex items-center justify-center text-sm text-gray-600 mb-3">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{cuadrilla.antiguedad}</span>
          </div>

          {/* Estado de documentación */}
          <div className="flex items-center justify-center mb-3">
            {cuadrilla.seguridadAlDia ? (
              <span className="inline-flex items-center text-xs font-medium text-green-700">
                <Shield className="h-4 w-4 mr-1" />
                Documentación al día
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-medium text-red-700">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Revisar documentación
              </span>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                seleccionarCuadrilla(cuadrilla);
                abrirDrawer();
              }}
              className="flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200"
            >
              <Eye className="h-3 w-3" />
              <span>Ver Detalle</span>
            </button>
            <button
              onClick={() => {
                seleccionarCuadrilla(cuadrilla);
                abrirModalAsignacion();
              }}
              className="flex items-center justify-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200"
            >
              <ClipboardList className="h-3 w-3" />
              <span>Asignar</span>
            </button>
          </div>

          {/* Alertas */}
          {tieneAlertas && (
            <div className="mt-2 pt-2 border-t border-red-200 text-red-600 text-xs flex items-center justify-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Revisar seguros o documentación</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}