'use client';

import React from 'react';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { Cuadrilla, Especialidad } from '@/lib/types/cuadrillas';
import { 
  X, 
  Users, 
  Hammer, 
  Paintbrush, 
  Wrench, 
  Zap, 
  FlaskConical, 
  Palette,
  CheckCircle,
  Clock,
  Building2,
  AlertTriangle,
  Phone,
  MessageCircle,
  Mail,
  ClipboardList,
  Calendar,
  Star,
  Shield
} from 'lucide-react';

interface VisorCuadrillasActivasProps {
  onClose: () => void;
}

const EspecialidadIcon: React.FC<{ especialidad: Especialidad }> = ({ especialidad }) => {
  switch (especialidad) {
    case 'Albañilería / Estructura': return <Hammer className="h-5 w-5" />;
    case 'Yesería / Terminaciones': return <Paintbrush className="h-5 w-5" />;
    case 'Carpintería': return <Wrench className="h-5 w-5" />;
    case 'Plomería / Gas': return <FlaskConical className="h-5 w-5" />;
    case 'Electricidad': return <Zap className="h-5 w-5" />;
    case 'Pintura': return <Palette className="h-5 w-5" />;
    default: return <Users className="h-5 w-5" />;
  }
};

const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => {
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

export function VisorCuadrillasActivas({ onClose }: VisorCuadrillasActivasProps) {
  const { cuadrillas, seleccionarCuadrilla, abrirModalAsignacion } = useCuadrillasStore();

  // Agrupar cuadrillas por especialidad
  const cuadrillasPorEspecialidad = cuadrillas.reduce((acc, cuadrilla) => {
    if (!acc[cuadrilla.especialidad]) {
      acc[cuadrilla.especialidad] = [];
    }
    acc[cuadrilla.especialidad].push(cuadrilla);
    return acc;
  }, {} as Record<Especialidad, Cuadrilla[]>);

  const especialidades: Especialidad[] = [
    'Albañilería / Estructura',
    'Yesería / Terminaciones',
    'Carpintería',
    'Plomería / Gas',
    'Electricidad',
    'Pintura'
  ];

  const cuadrillasActivas = cuadrillas.filter(c => c.estado === 'Disponible' || c.estado === 'En obra');
  const cuadrillasDisponibles = cuadrillas.filter(c => c.estado === 'Disponible');

  return (
    <div className="absolute inset-0 bg-white z-40 overflow-y-auto">
      {/* Header fijo */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cuadrillas Activas</h1>
            <p className="text-gray-600 mt-1">
              {cuadrillasActivas.length} cuadrillas activas • {cuadrillasDisponibles.length} disponibles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-8">
        {/* Resumen ejecutivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-blue-900">{cuadrillasActivas.length}</p>
                <p className="text-blue-700">Cuadrillas Activas</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-green-900">{cuadrillasDisponibles.length}</p>
                <p className="text-green-700">Disponibles</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-yellow-900">
                  {cuadrillasActivas.length - cuadrillasDisponibles.length}
                </p>
                <p className="text-yellow-700">En Obra</p>
              </div>
            </div>
          </div>
        </div>

        {/* Listado por especialidad */}
        <div className="space-y-6">
          {especialidades.map(especialidad => {
            const cuadrillasEspecialidad = cuadrillasPorEspecialidad[especialidad] || [];
            const activasEspecialidad = cuadrillasEspecialidad.filter(c => c.estado === 'Disponible' || c.estado === 'En obra');
            
            if (activasEspecialidad.length === 0) return null;

            return (
              <div key={especialidad} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header de especialidad */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <EspecialidadIcon especialidad={especialidad} />
                      <h3 className="text-lg font-semibold text-gray-900">{especialidad}</h3>
                      <span className="text-sm text-gray-500">({activasEspecialidad.length} activas)</span>
                    </div>
                  </div>
                </div>

                {/* Cards de cuadrillas */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activasEspecialidad.map(cuadrilla => (
                      <div key={cuadrilla.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        {/* Header de cuadrilla */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">{cuadrilla.nombre}</h4>
                          <EstadoBadge estado={cuadrilla.estado} />
                        </div>

                        {/* Encargado */}
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">Encargado</p>
                          <p className="font-medium text-gray-900">{cuadrilla.encargado}</p>
                        </div>

                        {/* Información clave */}
                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                          <div className="flex items-center text-gray-600">
                            <Star className="h-4 w-4 text-yellow-500 mr-2" />
                            <span>{cuadrilla.valoracionPromedio.toFixed(1)}/5</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{cuadrilla.integrantes.length} integrantes</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Building2 className="h-4 w-4 text-blue-500 mr-2" />
                            <span>{cuadrilla.obrasParticipadas} obras</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{cuadrilla.antiguedad}</span>
                          </div>
                        </div>

                        {/* Estado de documentación */}
                        <div className="mb-4">
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

                        {/* Contacto rápido */}
                        <div className="flex space-x-2 mb-4">
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

                        {/* Acción principal */}
                        <button
                          onClick={() => {
                            seleccionarCuadrilla(cuadrilla);
                            abrirModalAsignacion();
                          }}
                          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          <ClipboardList className="h-4 w-4" />
                          <span>Asignar a Obra</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensaje si no hay cuadrillas activas */}
        {cuadrillasActivas.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cuadrillas activas</h3>
            <p className="text-gray-600">Todas las cuadrillas están inactivas o no disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
