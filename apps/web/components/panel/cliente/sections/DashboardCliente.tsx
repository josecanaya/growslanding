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
      titulo: 'Total Obras',
      valor: user.obrasActivas,
      icono: Building2,
      color: 'text-primario',
      cambio: '+1 esta semana',
      href: '/obras'
    },
    {
      titulo: 'Activas',
      valor: user.cuadrillasAsignadas,
      icono: Users,
      color: 'text-primario',
      cambio: '+2 este mes',
      href: '/obras?estado=activas'
    },
    {
      titulo: 'Pausadas',
      valor: 26,
      icono: CheckCircle,
      color: 'text-primario',
      cambio: '+5 esta semana',
      href: '/obras?estado=pausadas'
    },
    {
      titulo: 'Finalizadas',
      valor: '$7,450,000',
      icono: DollarSign,
      color: 'text-primario',
      cambio: '+12% vs mes anterior',
      href: '/obras?estado=finalizadas'
    }
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'En Progreso':
        return 'bg-secundario text-oscuro border border-[#dce3ea]';
      case 'Iniciando':
        return 'bg-secundario text-oscuro border border-[#dce3ea]';
      case 'Planificando':
        return 'bg-secundario text-oscuro border border-[#dce3ea]';
      default:
        return 'bg-secundario text-oscuro border border-[#dce3ea]';
    }
  };

  return (
    <div className="p-8 min-h-screen" style={{backgroundColor: '#eaf0f6'}}>
      {/* Header */}
      <div className="mt-10 mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{color: '#10161a'}}>Dashboard</h1>
        <p className="text-gray-600">Bienvenida, {user.name}. Aquí tienes un resumen de tus obras activas.</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {estadisticas.map((stat, index) => {
          const Icon = stat.icono;
          return (
            <a 
              key={index} 
              href={stat.href}
              className="rounded-xl p-6 cursor-pointer block transition-all duration-300 ease-in-out border"
              style={{
                backgroundColor: '#f5f7fa',
                borderColor: '#dce3ea'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(27, 38, 59, 0.1), 0 4px 6px -2px rgba(27, 38, 59, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-white" style={{color: '#1B263B'}}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm text-gray-500">{stat.cambio}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1" style={{color: '#10161a'}}>{stat.valor}</h3>
                <p className="text-gray-600 text-sm font-medium">{stat.titulo}</p>
              </div>
            </a>
          );
        })}
      </div>

      {/* Obras */}
      <div className="mb-10 mt-10">
        <div className="flex items-center justify-end mb-6">
          <button 
            className="text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out"
            style={{backgroundColor: '#1B263B'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#162033';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1B263B';
            }}
          >
            Crear Obra Completa
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {obras.map((obra) => (
            <div 
              key={obra.id} 
              className="bg-white rounded-xl p-6 transition-all duration-300 ease-in-out border"
              style={{borderColor: '#dce3ea'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(27, 38, 59, 0.1), 0 4px 6px -2px rgba(27, 38, 59, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2" style={{color: '#10161a'}}>{obra.nombre}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: '#f5f7fa',
                    color: '#10161a',
                    borderColor: '#dce3ea',
                    border: '1px solid'
                  }}
                >
                  {obra.estado}
                </span>
              </div>

              {/* Progreso */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progreso</span>
                  <span className="font-medium" style={{color: '#10161a'}}>{obra.progreso}%</span>
                </div>
                <div className="w-full rounded-full h-2" style={{backgroundColor: '#f5f7fa'}}>
                  <div 
                    className="h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ 
                      width: `${obra.progreso}%`,
                      backgroundColor: '#1B263B'
                    }}
                  ></div>
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Presupuesto:</span>
                  <span className="font-medium" style={{color: '#1B263B'}}>{obra.presupuesto}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tareas:</span>
                  <span className="font-medium" style={{color: '#10161a'}}>{obra.tareasCompletadas}/{obra.tareasTotal}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fin estimado:</span>
                  <span className="font-medium" style={{color: '#10161a'}}>{obra.fechaFin}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  className="flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ease-in-out border"
                  style={{
                    backgroundColor: '#f5f7fa',
                    color: '#10161a',
                    borderColor: '#dce3ea'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8ecf0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f7fa';
                  }}
                >
                  Ver Detalles
                </button>
                <button 
                  className="flex-1 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 ease-in-out"
                  style={{backgroundColor: '#1B263B'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#162033';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1B263B';
                  }}
                >
                  Gestionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6" style={{color: '#10161a'}}>Actividad Reciente</h2>
        <div 
          className="rounded-xl p-6 border"
          style={{
            backgroundColor: '#f5f7fa',
            borderColor: '#dce3ea'
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center border"
                style={{
                  backgroundColor: '#f5f7fa',
                  borderColor: '#dce3ea'
                }}
              >
                <CheckCircle className="h-5 w-5" style={{color: '#1B263B'}} />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{color: '#10161a'}}>Tarea completada: &quot;Replanteo de cimientos&quot;</p>
                <p className="text-gray-600 text-sm">Casa Familiar - Villa Crespo • Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center border"
                style={{
                  backgroundColor: '#f5f7fa',
                  borderColor: '#dce3ea'
                }}
              >
                <Users className="h-5 w-5" style={{color: '#1B263B'}} />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{color: '#10161a'}}>Nueva cuadrilla asignada</p>
                <p className="text-gray-600 text-sm">Departamento - Palermo • Hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center border"
                style={{
                  backgroundColor: '#f5f7fa',
                  borderColor: '#dce3ea'
                }}
              >
                <AlertCircle className="h-5 w-5" style={{color: '#1B263B'}} />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{color: '#10161a'}}>Material pendiente de aprobación</p>
                <p className="text-gray-600 text-sm">Oficinas - Microcentro • Hace 1 día</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
