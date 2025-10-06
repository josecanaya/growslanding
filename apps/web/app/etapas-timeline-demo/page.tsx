'use client';

import { EtapasTimeline } from '@/components/EtapasTimeline';

// Datos de ejemplo para demostrar el componente
const tareasEjemplo = [
  // ESTRUCTURA
  {
    id: '1',
    nombre: 'Replanteo general de obra',
    descripcion: 'Marcación de ejes y niveles según planos',
    fechaInicio: '2024-01-15',
    fechaFin: '2024-01-17',
    estado: 'completada' as const,
    duracion: 3,
    etapa: 'estructura',
    esCritica: true
  },
  {
    id: '2',
    nombre: 'Excavación de bases',
    descripcion: 'Excavación manual y mecánica para fundaciones',
    fechaInicio: '2024-01-18',
    fechaFin: '2024-01-25',
    estado: 'completada' as const,
    duracion: 8,
    etapa: 'estructura',
    esCritica: true
  },
  {
    id: '3',
    nombre: 'Hormigón de cimientos',
    descripcion: 'Vaciado de hormigón armado para fundaciones',
    fechaInicio: '2024-01-26',
    fechaFin: '2024-01-28',
    estado: 'en_progreso' as const,
    duracion: 3,
    etapa: 'estructura',
    esCritica: true
  },
  {
    id: '4',
    nombre: 'Estructura de columnas',
    descripcion: 'Construcción de columnas de hormigón armado',
    fechaInicio: '2024-01-29',
    fechaFin: '2024-02-15',
    estado: 'pendiente' as const,
    duracion: 18,
    etapa: 'estructura',
    esCritica: true
  },

  // OBRA GRIS
  {
    id: '5',
    nombre: 'Mampostería de muros',
    descripcion: 'Construcción de muros de ladrillo',
    fechaInicio: '2024-02-16',
    fechaFin: '2024-03-10',
    estado: 'pendiente' as const,
    duracion: 23,
    etapa: 'obra_gris',
    esCritica: false
  },
  {
    id: '6',
    nombre: 'Instalaciones eléctricas básicas',
    descripcion: 'Tendido de caños y cables principales',
    fechaInicio: '2024-03-01',
    fechaFin: '2024-03-15',
    estado: 'pendiente' as const,
    duracion: 15,
    etapa: 'obra_gris',
    esCritica: false
  },
  {
    id: '7',
    nombre: 'Instalaciones sanitarias',
    descripcion: 'Tendido de caños de agua y desagües',
    fechaInicio: '2024-03-05',
    fechaFin: '2024-03-20',
    estado: 'pendiente' as const,
    duracion: 16,
    etapa: 'obra_gris',
    esCritica: false
  },

  // TERMINACIONES
  {
    id: '8',
    nombre: 'Revoque grueso y fino',
    descripcion: 'Aplicación de revoque en muros interiores',
    fechaInicio: '2024-03-21',
    fechaFin: '2024-04-10',
    estado: 'pendiente' as const,
    duracion: 21,
    etapa: 'terminaciones',
    esCritica: false
  },
  {
    id: '9',
    nombre: 'Pintura interior',
    descripcion: 'Aplicación de pintura en muros y cielorrasos',
    fechaInicio: '2024-04-11',
    fechaFin: '2024-04-25',
    estado: 'pendiente' as const,
    duracion: 15,
    etapa: 'terminaciones',
    esCritica: false
  },
  {
    id: '10',
    nombre: 'Pintura exterior',
    descripcion: 'Aplicación de pintura en fachada',
    fechaInicio: '2024-04-26',
    fechaFin: '2024-05-05',
    estado: 'pendiente' as const,
    duracion: 10,
    etapa: 'terminaciones',
    esCritica: false
  }
];

export default function EtapasTimelineDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Timeline de Etapas de Construcción
          </h1>
          <p className="text-gray-600">
            Haz clic en cada etapa para ver el timeline detallado de tareas
          </p>
        </div>
        
        <EtapasTimeline 
          tareas={tareasEjemplo}
          obraId="demo-obra-1"
        />
      </div>
    </div>
  );
}
