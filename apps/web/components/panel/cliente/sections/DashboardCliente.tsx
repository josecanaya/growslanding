'use client';

import { Building2, Users, Calendar, TrendingUp, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  company: string;
  role: string;
  rating: number;
  level: string;
  obrasActivas: number;
  cuadrillasAsignadas: number;
}

interface DashboardClienteProps {
  user: User;
}

export function DashboardCliente({ user }: DashboardClienteProps) {
  const obras = [
    {
      id: '1',
      nombre: 'Casa Familiar - Villa Crespo',
      progreso: 65,
      estado: 'En Progreso',
      fechaInicio: '15 Ago 2024',
      fechaFin: '15 Dic 2024',
      presupuesto: '$2,450,000',
      cuadrillas: 2,
      tareasCompletadas: 18,
      tareasTotal: 28
    },
    {
      id: '2',
      nombre: 'Departamento - Palermo',
      progreso: 30,
      estado: 'Iniciando',
      fechaInicio: '1 Oct 2024',
      fechaFin: '1 Feb 2025',
      presupuesto: '$1,800,000',
      cuadrillas: 1,
      tareasCompletadas: 8,
      tareasTotal: 26
    },
    {
      id: '3',
      nombre: 'Oficinas - Microcentro',
      progreso: 0,
      estado: 'Planificando',
      fechaInicio: '15 Nov 2024',
      fechaFin: '15 Mar 2025',
      presupuesto: '$3,200,000',
      cuadrillas: 0,
      tareasCompletadas: 0,
      tareasTotal: 35
    }
  ];

  const estadisticas = [
    {
      titulo: 'Obras Activas',
      valor: user.obrasActivas,
      icono: Building2,
      color: 'text-blue-600',
      cambio: '+1 esta semana'
    },
    {
      titulo: 'Cuadrillas Asignadas',
      valor: user.cuadrillasAsignadas,
      icono: Users,
      color: 'text-green-600',
      cambio: '+2 este mes'
    },
    {
      titulo: 'Tareas Completadas',
      valor: 26,
      icono: CheckCircle,
      color: 'text-acento',
      cambio: '+5 esta semana'
    },
    {
      titulo: 'Presupuesto Total',
      valor: '$7,450,000',
      icono: DollarSign,
      color: 'text-primario',
      cambio: '+12% vs mes anterior'
    }
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'En Progreso':
        return 'bg-green-100 text-green-800';
      case 'Iniciando':
        return 'bg-blue-100 text-blue-800';
      case 'Planificando':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-oscuro mb-2">Dashboard</h1>
        <p className="text-oscuro/70">Bienvenida, {user.name}. Aquí tienes un resumen de tus obras activas.</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {estadisticas.map((stat, index) => {
          const Icon = stat.icono;
          return (
            <div key={index} className="bg-claro rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-white ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm text-oscuro/60">{stat.cambio}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-oscuro mb-1">{stat.valor}</h3>
                <p className="text-oscuro/70 text-sm">{stat.titulo}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Obras Activas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-oscuro">Obras Activas</h2>
          <button className="bg-primario text-white px-4 py-2 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200">
            Nueva Obra
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {obras.map((obra) => (
            <div key={obra.id} className="bg-white border border-claro rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-oscuro mb-2">{obra.nombre}</h3>
                  <div className="flex items-center space-x-4 text-sm text-oscuro/70">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{obra.fechaInicio}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{obra.cuadrillas} cuadrillas</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
                  {obra.estado}
                </span>
              </div>

              {/* Progreso */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-oscuro/70">Progreso</span>
                  <span className="font-medium text-oscuro">{obra.progreso}%</span>
                </div>
                <div className="w-full bg-claro rounded-full h-2">
                  <div 
                    className="bg-primario h-2 rounded-full transition-all duration-300"
                    style={{ width: `${obra.progreso}%` }}
                  ></div>
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-oscuro/70">Presupuesto:</span>
                  <span className="font-medium text-primario">{obra.presupuesto}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-oscuro/70">Tareas:</span>
                  <span className="font-medium text-oscuro">{obra.tareasCompletadas}/{obra.tareasTotal}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-oscuro/70">Fin estimado:</span>
                  <span className="font-medium text-oscuro">{obra.fechaFin}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-claro text-oscuro py-2 px-4 rounded-lg font-medium hover:bg-claro/80 transition-colors duration-200">
                  Ver Detalles
                </button>
                <button className="flex-1 bg-primario text-white py-2 px-4 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200">
                  Gestionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actividad Reciente */}
      <div>
        <h2 className="text-2xl font-bold text-oscuro mb-6">Actividad Reciente</h2>
        <div className="bg-claro rounded-xl p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-oscuro font-medium">Tarea completada: &quot;Replanteo de cimientos&quot;</p>
                <p className="text-oscuro/70 text-sm">Casa Familiar - Villa Crespo • Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-oscuro font-medium">Nueva cuadrilla asignada</p>
                <p className="text-oscuro/70 text-sm">Departamento - Palermo • Hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-oscuro font-medium">Material pendiente de aprobación</p>
                <p className="text-oscuro/70 text-sm">Oficinas - Microcentro • Hace 1 día</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
