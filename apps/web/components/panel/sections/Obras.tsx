'use client';

import { useState } from 'react';
import { MapPin, Calendar, Users, DollarSign, Eye, ArrowRight, Clock, CheckCircle } from 'lucide-react';

interface Obra {
  id: string;
  nombre: string;
  ubicacion: string;
  fechaInicio: string;
  duracion: string;
  presupuesto: string;
  estado: 'Disponible' | 'En evaluación' | 'Próxima';
  descripcion: string;
  especialidadRequerida: string;
  nivelRequerido: string;
}

interface ObrasProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

export function Obras({ user }: ObrasProps) {
  const [obras, setObras] = useState<Obra[]>([
    {
      id: '1',
      nombre: 'Casa Familiar Los Robles',
      ubicacion: 'San Isidro, Buenos Aires',
      fechaInicio: '2024-04-01',
      duracion: '3 meses',
      presupuesto: '$2,500,000',
      estado: 'Disponible',
      descripcion: 'Construcción de casa unifamiliar de 120m² con 3 dormitorios, cocina, living y garaje.',
      especialidadRequerida: 'Albañilería / Estructura',
      nivelRequerido: 'Oro'
    },
    {
      id: '2',
      nombre: 'Edificio Residencial Norte',
      ubicacion: 'Vicente López, Buenos Aires',
      fechaInicio: '2024-05-15',
      duracion: '8 meses',
      presupuesto: '$8,000,000',
      estado: 'En evaluación',
      descripcion: 'Construcción de edificio de 4 pisos con 16 departamentos, cocheras y amenities.',
      especialidadRequerida: 'Albañilería / Estructura',
      nivelRequerido: 'Platino'
    },
    {
      id: '3',
      nombre: 'Ampliación Comercial',
      ubicacion: 'Martínez, Buenos Aires',
      fechaInicio: '2024-06-01',
      duracion: '2 meses',
      presupuesto: '$1,200,000',
      estado: 'Próxima',
      descripcion: 'Ampliación de local comercial, construcción de 2 plantas adicionales.',
      especialidadRequerida: 'Albañilería / Estructura',
      nivelRequerido: 'Plata'
    },
    {
      id: '4',
      nombre: 'Refacción Integral',
      ubicacion: 'Olivos, Buenos Aires',
      fechaInicio: '2024-03-20',
      duracion: '1 mes',
      presupuesto: '$800,000',
      estado: 'Disponible',
      descripcion: 'Refacción completa de vivienda existente, incluye instalaciones y terminaciones.',
      especialidadRequerida: 'Yesería / Terminaciones',
      nivelRequerido: 'Oro'
    }
  ]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible': return 'bg-green-100 text-green-800';
      case 'En evaluación': return 'bg-yellow-100 text-yellow-800';
      case 'Próxima': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Disponible': return <CheckCircle className="h-4 w-4" />;
      case 'En evaluación': return <Clock className="h-4 w-4" />;
      case 'Próxima': return <Calendar className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const canApply = (obra: Obra) => {
    const userLevel = user.level;
    const requiredLevel = obra.nivelRequerido;
    
    const levelHierarchy = ['Bronce', 'Plata', 'Oro', 'Platino'];
    const userLevelIndex = levelHierarchy.indexOf(userLevel);
    const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);
    
    return userLevelIndex >= requiredLevelIndex && obra.estado === 'Disponible';
  };

  const handleApply = (obraId: string) => {
    console.log(`Aplicando a obra: ${obraId}`);
    // Aquí se implementaría la lógica para aplicar a la obra
  };

  const handleViewDetails = (obraId: string) => {
    console.log(`Ver detalles de obra: ${obraId}`);
    // Aquí se implementaría la lógica para ver detalles
  };

  return (
    <div className="space-y-4 bg-claro-fondo min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-8">
        <div>
          <h2 className="text-2xl font-bold text-oscuro">Oportunidades de Obras</h2>
          <p className="text-sm text-oscuro/70">
            {obras.length} obras disponibles
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-oscuro/70">Nivel actual</div>
          <div className="text-lg font-bold text-acento">{user.level}</div>
        </div>
      </div>

      {/* Lista vertical de obras */}
      <div className="space-y-8">
        {obras.map((obra) => (
          <div
            key={obra.id}
            className="bg-white rounded-xl shadow-sm border border-corporativo p-6 hover-sombra transition-smooth"
          >
            {/* Header de la obra */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-oscuro mb-1">
                  {obra.nombre}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
                    {getEstadoIcon(obra.estado)}
                    <span className="ml-1">{obra.estado}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Información de la obra */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-oscuro/70">
                <MapPin className="h-4 w-4 mr-2 text-primario" />
                <span>{obra.ubicacion}</span>
              </div>
              <div className="flex items-center text-sm text-oscuro/70">
                <Calendar className="h-4 w-4 mr-2 text-primario" />
                <span>Inicio: {new Date(obra.fechaInicio).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm text-oscuro/70">
                <Clock className="h-4 w-4 mr-2 text-primario" />
                <span>Duración: {obra.duracion}</span>
              </div>
              <div className="flex items-center text-sm text-oscuro/70">
                <DollarSign className="h-4 w-4 mr-2 text-primario" />
                <span>Presupuesto: {obra.presupuesto}</span>
              </div>
              <div className="flex items-center text-sm text-oscuro/70">
                <Users className="h-4 w-4 mr-2 text-primario" />
                <span>Especialidad: {obra.especialidadRequerida}</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="mb-4">
              <p className="text-sm text-oscuro/80 leading-relaxed">
                {obra.descripcion}
              </p>
            </div>

            {/* Requisitos */}
            <div className="bg-secundario border border-corporativo rounded-lg p-3 mb-4">
              <div className="text-sm text-oscuro/70 mb-1 font-medium">Requisitos:</div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secundario text-oscuro border border-corporativo">
                  Nivel: {obra.nivelRequerido}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secundario text-oscuro border border-corporativo">
                  {obra.especialidadRequerida}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewDetails(obra.id)}
                className="flex-1 flex items-center justify-center space-x-2 bg-secundario hover:bg-secundario/80 text-oscuro py-3 px-4 rounded-lg font-medium transition-smooth border border-corporativo"
              >
                <Eye className="h-4 w-4" />
                <span>Ver detalles</span>
              </button>
              
              {canApply(obra) ? (
                <button
                  onClick={() => handleApply(obra.id)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-primario hover-primario text-white py-3 px-4 rounded-lg font-medium transition-smooth"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Aplicar</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 flex items-center justify-center space-x-2 bg-secundario text-oscuro/50 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {obra.estado === 'En evaluación' ? 'En evaluación' : 
                     obra.estado === 'Próxima' ? 'Próxima' : 'No disponible'}
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de aplicaciones */}
      <div className="bg-secundario border border-corporativo rounded-lg p-4">
        <h3 className="font-semibold text-oscuro mb-2">Mis aplicaciones</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-oscuro/70">Aplicaciones enviadas</div>
            <div className="text-xl font-bold text-primario">3</div>
          </div>
          <div>
            <div className="text-oscuro/70">Obras asignadas</div>
            <div className="text-xl font-bold text-primario">1</div>
          </div>
        </div>
      </div>
    </div>
  );
}