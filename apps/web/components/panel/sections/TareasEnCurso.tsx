'use client';

import { useState } from 'react';
import { CheckCircle, Clock, MapPin, Calendar, CheckSquare, Paperclip, MessageCircle, Camera } from 'lucide-react';
import { SlideToConfirm } from '../SlideToConfirm';

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  etapa: 'Replanteo' | 'Ejecución' | 'Terminación';
  ubicacion: string;
  fechaInicio: string;
  duracionEstimada: string;
  estado: 'Pendiente' | 'En progreso' | 'Finalizada';
  requiereEvidencia: boolean;
  evidencia?: string;
}

interface TareasEnCursoProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

export function TareasEnCurso({ user }: TareasEnCursoProps) {
  const [tareas, setTareas] = useState<Tarea[]>([
    {
      id: '1',
      nombre: 'Replanteo de cimientos',
      descripcion: 'Marcar ubicación exacta de los cimientos según planos',
      etapa: 'Replanteo',
      ubicacion: 'Zona A - Fundación',
      fechaInicio: '2024-03-15',
      duracionEstimada: '2 horas',
      estado: 'Pendiente',
      requiereEvidencia: true
    },
    {
      id: '2',
      nombre: 'Excavación manual',
      descripcion: 'Excavar según profundidad y dimensiones especificadas',
      etapa: 'Ejecución',
      ubicacion: 'Zona A - Fundación',
      fechaInicio: '2024-03-15',
      duracionEstimada: '4 horas',
      estado: 'Pendiente',
      requiereEvidencia: true
    },
    {
      id: '3',
      nombre: 'Preparación de mezcla',
      descripcion: 'Preparar mezcla para cimientos según especificaciones técnicas',
      etapa: 'Ejecución',
      ubicacion: 'Zona A - Fundación',
      fechaInicio: '2024-03-15',
      duracionEstimada: '1 hora',
      estado: 'Pendiente',
      requiereEvidencia: true
    }
  ]);

  const [tareaActivaIndex, setTareaActivaIndex] = useState(0);
  const [mostrarCamara, setMostrarCamara] = useState(false);

  const tareaActiva = tareas[tareaActivaIndex];
  const tareasCompletadas = tareas.filter(t => t.estado === 'Finalizada').length;
  const progresoTotal = (tareasCompletadas / tareas.length) * 100;

  const handleIniciarTarea = () => {
    setTareas(prev => prev.map((tarea, index) => 
      index === tareaActivaIndex 
        ? { ...tarea, estado: 'En progreso' }
        : tarea
    ));
  };

  const handleFinalizarTarea = () => {
    if (tareaActiva.requiereEvidencia) {
      setMostrarCamara(true);
    } else {
      // Si no requiere evidencia, finalizar directamente
      finalizarTareaConEvidencia('sin-evidencia');
    }
  };

  const finalizarTareaConEvidencia = (evidenciaUrl: string) => {
    setTareas(prev => prev.map((tarea, index) => 
      index === tareaActivaIndex 
        ? { ...tarea, estado: 'Finalizada', evidencia: evidenciaUrl }
        : tarea
    ));
    
    // Avanzar a la siguiente tarea si existe
    if (tareaActivaIndex < tareas.length - 1) {
      setTareaActivaIndex(prev => prev + 1);
    }
    
    setMostrarCamara(false);
  };

  const getEstadoIcono = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return '⚪';
      case 'En progreso': return '🟡';
      case 'Finalizada': return '🟢';
      default: return '⚪';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'bg-gray-100 text-gray-800';
      case 'En progreso': return 'bg-yellow-100 text-yellow-800';
      case 'Finalizada': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Si no hay tarea activa, mostrar mensaje de finalización
  if (!tareaActiva) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Todas las tareas completadas!</h1>
          <p className="text-gray-600 mb-6">Has finalizado exitosamente todas las tareas asignadas.</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-600 mb-2">{tareasCompletadas}</div>
            <div className="text-sm text-green-700">Tareas completadas</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progreso general */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progreso general</span>
          <span>{Math.round(progresoTotal)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              backgroundColor: '#1A202C',
              width: `${progresoTotal}%` 
            }}
          ></div>
        </div>
        <div className="text-center text-sm text-gray-500 mt-1">
          {tareasCompletadas} de {tareas.length} tareas completadas
        </div>
      </div>

      {/* Tarea actual única */}
      <div className={`rounded-2xl shadow-lg border-2 p-6 transition-all duration-200 ${
        tareaActiva.estado === 'En progreso' 
          ? 'border-[#1A202C] bg-blue-50' 
          : tareaActiva.estado === 'Finalizada'
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}>
        {/* Header de la tarea */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <span className="text-3xl mr-3">{getEstadoIcono(tareaActiva.estado)}</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(tareaActiva.estado)}`}>
              {tareaActiva.estado}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {tareaActiva.nombre}
          </h1>
          <p className="text-gray-600 mb-4">{tareaActiva.descripcion}</p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
              <span>{tareaActiva.ubicacion}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-400" />
              <span>{tareaActiva.duracionEstimada}</span>
            </div>
          </div>
        </div>

        {/* Indicador de evidencia */}
        {tareaActiva.requiereEvidencia && (
          <div className="flex items-center justify-center mb-6" style={{ color: '#1A202C' }}>
            <Camera className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Requiere evidencia fotográfica</span>
          </div>
        )}

        {/* Botón deslizable según estado */}
        <div className="mb-6">
          {tareaActiva.estado === 'Pendiente' && (
            <SlideToConfirm
              onConfirm={handleIniciarTarea}
              label="Iniciar tarea"
              confirmLabel="Desliza para iniciar"
              variant="start"
            />
          )}
          
          {tareaActiva.estado === 'En progreso' && (
            <SlideToConfirm
              onConfirm={handleFinalizarTarea}
              label="Finalizar tarea"
              confirmLabel="Desliza para finalizar"
              variant="finish"
            />
          )}
          
          {tareaActiva.estado === 'Finalizada' && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold">Tarea completada</span>
              </div>
              {tareaActiva.evidencia && (
                <div className="flex items-center justify-center" style={{ color: '#1A202C' }}>
                  <Camera className="h-4 w-4 mr-1" />
                  <span className="text-sm">Evidencia subida</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Información de progreso */}
        <div className="text-center text-sm text-gray-500">
          Tarea {tareaActivaIndex + 1} de {tareas.length}
        </div>
      </div>

      {/* Accesos directos */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos directos</h2>
        <div className="grid grid-cols-3 gap-4">
          <button className="flex flex-col items-center space-y-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEEB70' }}>
              <CheckSquare className="h-6 w-6" style={{ color: '#1A202C' }} />
            </div>
            <span className="text-sm font-medium text-gray-700">Checklist</span>
          </button>
          
          <button className="flex flex-col items-center space-y-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#008080' }}>
              <Paperclip className="h-6 w-6" style={{ color: '#FFFFFF' }} />
            </div>
            <span className="text-sm font-medium text-gray-700">Evidencias</span>
          </button>
          
          <button className="flex flex-col items-center space-y-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1A202C' }}>
              <MessageCircle className="h-6 w-6" style={{ color: '#FFFFFF' }} />
            </div>
            <span className="text-sm font-medium text-gray-700">Chat</span>
          </button>
        </div>
      </div>

      {/* Resumen del día */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#1A202C' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#FFFFFF' }}>Resumen del día</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: '#FEEB70' }}>{tareasCompletadas}</div>
            <div className="text-sm" style={{ color: '#A0AEC0' }}>Tareas completadas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: '#FEEB70' }}>6h 45m</div>
            <div className="text-sm" style={{ color: '#A0AEC0' }}>Tiempo trabajado</div>
          </div>
        </div>
      </div>

      {/* Modal de cámara */}
      {mostrarCamara && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-xl font-semibold mb-2">Tomar evidencia</h2>
            <p className="text-gray-300 mb-4">Foto requerida para completar la tarea</p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  finalizarTareaConEvidencia('foto-evidencia.jpg');
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Tomar foto
              </button>
              <button
                onClick={() => setMostrarCamara(false)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}