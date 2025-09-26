'use client';

import { Building2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface ObrasProps {
  user: User;
}

interface Obra {
  id: number;
  title: string;
  client: string;
  location: string;
  status: 'completed' | 'active' | 'pending';
  progress: number;
  tasks: Task[];
}

interface Task {
  id: number;
  title: string;
  status: 'completed' | 'active' | 'pending';
  dueDate: string;
}

export function Obras({ user }: ObrasProps) {
  const obras: Obra[] = [
    {
      id: 1,
      title: 'Casa Familiar - San Isidro',
      client: 'María González',
      location: 'San Isidro, Buenos Aires',
      status: 'active',
      progress: 65,
      tasks: [
        { id: 1, title: 'Replanteo de cimientos', status: 'completed', dueDate: '2024-01-10' },
        { id: 2, title: 'Ejecución de estructura', status: 'active', dueDate: '2024-01-25' },
        { id: 3, title: 'Instalaciones', status: 'pending', dueDate: '2024-02-10' },
        { id: 4, title: 'Terminaciones', status: 'pending', dueDate: '2024-02-25' },
      ]
    },
    {
      id: 2,
      title: 'Edificio Residencial - Palermo',
      client: 'Constructora ABC',
      location: 'Palermo, Buenos Aires',
      status: 'pending',
      progress: 0,
      tasks: [
        { id: 1, title: 'Replanteo de cimientos', status: 'pending', dueDate: '2024-02-01' },
        { id: 2, title: 'Ejecución de estructura', status: 'pending', dueDate: '2024-02-15' },
        { id: 3, title: 'Instalaciones', status: 'pending', dueDate: '2024-03-01' },
        { id: 4, title: 'Terminaciones', status: 'pending', dueDate: '2024-03-15' },
      ]
    },
    {
      id: 3,
      title: 'Oficinas Corporativas - Puerto Madero',
      client: 'Empresa XYZ',
      location: 'Puerto Madero, Buenos Aires',
      status: 'completed',
      progress: 100,
      tasks: [
        { id: 1, title: 'Replanteo de cimientos', status: 'completed', dueDate: '2023-12-01' },
        { id: 2, title: 'Ejecución de estructura', status: 'completed', dueDate: '2023-12-15' },
        { id: 3, title: 'Instalaciones', status: 'completed', dueDate: '2024-01-01' },
        { id: 4, title: 'Terminaciones', status: 'completed', dueDate: '2024-01-15' },
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-dark mb-6">Obras</h2>
      
      <div className="space-y-6">
        {obras.map((obra) => (
          <div key={obra.id} className="bg-light rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-dark">{obra.title}</h3>
                  <p className="text-dark/70">{obra.client}</p>
                  <p className="text-sm text-dark/60">{obra.location}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(obra.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(obra.status)}`}>
                  {obra.status === 'completed' ? 'Completada' : 
                   obra.status === 'active' ? 'Activa' : 'Pendiente'}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-dark/70 mb-2">
                <span>Progreso general</span>
                <span>{obra.progress}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${obra.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-dark mb-3">Timeline de tareas:</h4>
              {obra.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 px-3 bg-white rounded">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(task.status)}
                    <span className="text-dark">{task.title}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${getTaskStatusColor(task.status)}`}>
                      {task.status === 'completed' ? 'Completada' : 
                       task.status === 'active' ? 'En curso' : 'Pendiente'}
                    </span>
                    <span className="text-sm text-dark/60">{task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
