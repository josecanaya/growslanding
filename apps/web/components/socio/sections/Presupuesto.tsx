'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface PresupuestoProps {
  user: User;
}

interface BudgetData {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  completedProjects: number;
  activeProjects: number;
  hourlyRate: number;
  hoursWorked: number;
}

interface Project {
  id: number;
  name: string;
  budget: number;
  earned: number;
  status: 'active' | 'completed' | 'pending';
  progress: number;
}

export function Presupuesto({ user }: PresupuestoProps) {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalEarnings: 125000,
    monthlyEarnings: 45000,
    pendingPayments: 15000,
    completedProjects: 8,
    activeProjects: 2,
    hourlyRate: 2500,
    hoursWorked: 180
  });

  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: 'Casa Familiar - San Isidro',
      budget: 45000,
      earned: 27000,
      status: 'active',
      progress: 60
    },
    {
      id: 2,
      name: 'Edificio Residencial - Palermo',
      budget: 120000,
      earned: 0,
      status: 'pending',
      progress: 0
    },
    {
      id: 3,
      name: 'Oficinas Corporativas - Puerto Madero',
      budget: 200000,
      earned: 200000,
      status: 'completed',
      progress: 100
    }
  ]);

  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef) {
      const ctx = canvasRef.getContext('2d');
      if (ctx) {
        // Limpiar canvas
        ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
        
        // Datos para el gráfico
        const data = [
          { label: 'Enero', value: 35000 },
          { label: 'Febrero', value: 42000 },
          { label: 'Marzo', value: 38000 },
          { label: 'Abril', value: 45000 },
          { label: 'Mayo', value: 48000 },
          { label: 'Junio', value: 45000 }
        ];
        
        const maxValue = Math.max(...data.map(d => d.value));
        const canvasWidth = canvasRef.width;
        const canvasHeight = canvasRef.height;
        const padding = 40;
        const chartWidth = canvasWidth - 2 * padding;
        const chartHeight = canvasHeight - 2 * padding;
        
        // Dibujar ejes
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvasHeight - padding);
        ctx.lineTo(canvasWidth - padding, canvasHeight - padding);
        ctx.stroke();
        
        // Dibujar barras
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;
        
        data.forEach((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = canvasHeight - padding - barHeight;
          
          // Barra
          ctx.fillStyle = '#f4e27e';
          ctx.fillRect(x, y, barWidth, barHeight);
          
          // Valor
          ctx.fillStyle = '#1B263B';
          ctx.font = '12px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(item.value.toLocaleString(), x + barWidth / 2, y - 5);
          
          // Etiqueta
          ctx.fillText(item.label, x + barWidth / 2, canvasHeight - padding + 15);
        });
      }
    }
  }, [canvasRef]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-dark mb-6">Presupuesto</h2>
      
      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-light rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark/70 text-sm">Ganancias Totales</p>
              <p className="text-2xl font-bold text-dark">${budgetData.totalEarnings.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-light rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark/70 text-sm">Este Mes</p>
              <p className="text-2xl font-bold text-dark">${budgetData.monthlyEarnings.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-light rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark/70 text-sm">Pagos Pendientes</p>
              <p className="text-2xl font-bold text-dark">${budgetData.pendingPayments.toLocaleString()}</p>
            </div>
            <Wallet className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-light rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark/70 text-sm">Tarifa por Hora</p>
              <p className="text-2xl font-bold text-dark">${budgetData.hourlyRate.toLocaleString()}</p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Gráfico de ganancias */}
      <div className="bg-white rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-dark mb-4">Ganancias por Mes</h3>
        <div className="flex justify-center">
          <canvas
            ref={setCanvasRef}
            width={600}
            height={300}
            className="border border-light rounded"
          />
        </div>
      </div>

      {/* Proyectos */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-dark mb-4">Proyectos</h3>
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-light rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-dark">{project.name}</h4>
                  <p className="text-sm text-dark/70">
                    ${project.earned.toLocaleString()} de ${project.budget.toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm text-dark/70 mb-1">
                  <span>Progreso</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark/70">
                  Restante: ${(project.budget - project.earned).toLocaleString()}
                </span>
                <span className="text-dark/70">
                  {project.status === 'completed' ? 'Completado' : 
                   project.status === 'active' ? 'En progreso' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-light rounded-lg p-4 text-center">
          <p className="text-dark/70 text-sm">Proyectos Completados</p>
          <p className="text-2xl font-bold text-dark">{budgetData.completedProjects}</p>
        </div>
        <div className="bg-light rounded-lg p-4 text-center">
          <p className="text-dark/70 text-sm">Proyectos Activos</p>
          <p className="text-2xl font-bold text-dark">{budgetData.activeProjects}</p>
        </div>
        <div className="bg-light rounded-lg p-4 text-center">
          <p className="text-dark/70 text-sm">Horas Trabajadas</p>
          <p className="text-2xl font-bold text-dark">{budgetData.hoursWorked}h</p>
        </div>
      </div>
    </div>
  );
}
