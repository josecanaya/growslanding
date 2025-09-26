'use client';

import { useState } from 'react';
import { Plus, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ModalCrearObra } from './modals/ModalCrearObra';
import { DetalleObra } from './index';

interface Obra {
  id: string;
  nombre: string;
  ubicacion: string;
  fechaInicio: string;
  fechaFin: string;
  progreso: number;
  tareasActivas: number;
  tareasCompletadas: number;
  estado: 'activa' | 'pausada' | 'finalizada';
}

interface Tarea {
  id: string;
  nombre: string;
  obraId: string;
  lider: string;
  fechaInicio: string;
  fechaFin: string;
  plantilla: string;
  checklist: string[];
  evidencias: string[];
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  precedencia: string[];
}

export function ObrasSection() {
  const [obras, setObras] = useState<Obra[]>([
    {
      id: '1',
      nombre: 'Casa Familiar - Villa Crespo',
      ubicacion: 'Villa Crespo, CABA',
      fechaInicio: '2024-08-15',
      fechaFin: '2024-12-15',
      progreso: 65,
      tareasActivas: 3,
      tareasCompletadas: 18,
      estado: 'activa'
    },
    {
      id: '2',
      nombre: 'Departamento - Palermo',
      ubicacion: 'Palermo, CABA',
      fechaInicio: '2024-10-01',
      fechaFin: '2025-02-01',
      progreso: 30,
      tareasActivas: 2,
      tareasCompletadas: 8,
      estado: 'activa'
    }
  ]);

  const [tareas, setTareas] = useState<Tarea[]>([
    {
      id: '1',
      nombre: 'Cimientos',
      obraId: '1',
      lider: 'Juan Pérez',
      fechaInicio: '2024-08-15',
      fechaFin: '2024-08-25',
      plantilla: 'estructura',
      checklist: ['Replanteo', 'Excavación', 'Hormigón', 'Finalización'],
      evidencias: [],
      estado: 'completada',
      etapa: 'estructura',
      precedencia: []
    },
    {
      id: '2',
      nombre: 'Paredes',
      obraId: '1',
      lider: 'María López',
      fechaInicio: '2024-08-26',
      fechaFin: '2024-09-10',
      plantilla: 'estructura',
      checklist: ['Replanteo', 'Mampostería', 'Finalización'],
      evidencias: [],
      estado: 'en_progreso',
      etapa: 'estructura',
      precedencia: ['1']
    },
    {
      id: '3',
      nombre: 'Techo',
      obraId: '1',
      lider: 'Carlos Rodríguez',
      fechaInicio: '2024-09-11',
      fechaFin: '2024-09-25',
      plantilla: 'estructura',
      checklist: ['Estructura metálica', 'Cubierta', 'Finalización'],
      evidencias: [],
      estado: 'pendiente',
      etapa: 'estructura',
      precedencia: ['2']
    }
  ]);

  const [showModalObra, setShowModalObra] = useState(false);
  const [showModalTarea, setShowModalTarea] = useState(false);
  const [notificaciones, setNotificaciones] = useState<string[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<Obra | null>(null);

  const handleCrearObra = (nuevaObra: Omit<Obra, 'id' | 'progreso' | 'tareasActivas' | 'tareasCompletadas' | 'estado'>) => {
    const obra: Obra = {
      ...nuevaObra,
      id: Date.now().toString(),
      progreso: 0,
      tareasActivas: 0,
      tareasCompletadas: 0,
      estado: 'activa'
    };
    setObras([...obras, obra]);
    setShowModalObra(false);
    
    // Notificación
    setNotificaciones(prev => [...prev, `Nueva obra creada: ${obra.nombre}`]);
    setTimeout(() => {
      setNotificaciones(prev => prev.slice(1));
    }, 5000);
  };

  const handleAsignarTarea = (nuevaTarea: Omit<Tarea, 'id' | 'estado' | 'evidencias'>) => {
    const tarea: Tarea = {
      ...nuevaTarea,
      id: Date.now().toString(),
      estado: 'pendiente',
      evidencias: []
    };
    setTareas([...tareas, tarea]);
    setShowModalTarea(false);

    // Actualizar obra
    setObras(obras.map(obra => 
      obra.id === nuevaTarea.obraId 
        ? { ...obra, tareasActivas: obra.tareasActivas + 1 }
        : obra
    ));

    // Notificación
    setNotificaciones(prev => [...prev, `Nueva tarea asignada: ${tarea.nombre}`]);
    setTimeout(() => {
      setNotificaciones(prev => prev.slice(1));
    }, 5000);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'bg-green-100 text-green-800';
      case 'pausada':
        return 'bg-yellow-100 text-yellow-800';
      case 'finalizada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <CheckCircle className="h-4 w-4" />;
      case 'pausada':
        return <Clock className="h-4 w-4" />;
      case 'finalizada':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Si hay una obra seleccionada, mostrar vista de detalle
  if (obraSeleccionada) {
    return (
      <DetalleObra 
        obra={obraSeleccionada}
        tareas={tareas.filter(t => t.obraId === obraSeleccionada.id)}
        onVolver={() => setObraSeleccionada(null)}
        onActualizarTarea={(tareaActualizada: Tarea) => {
          setTareas(tareas.map(t => t.id === tareaActualizada.id ? tareaActualizada : t));
          // Notificación de cambio de estado
          setNotificaciones(prev => [...prev, `Tarea "${tareaActualizada.nombre}" actualizada`]);
          setTimeout(() => {
            setNotificaciones(prev => prev.slice(1));
          }, 5000);
        }}
        onCrearTarea={(nuevaTarea: Omit<Tarea, 'id' | 'estado' | 'evidencias'>) => {
          const tarea: Tarea = {
            ...nuevaTarea,
            id: Date.now().toString(),
            estado: 'pendiente',
            evidencias: []
          };
          setTareas([...tareas, tarea]);
          
          // Actualizar obra
          setObras(obras.map(obra => 
            obra.id === nuevaTarea.obraId 
              ? { ...obra, tareasActivas: obra.tareasActivas + 1 }
              : obra
          ));

          // Notificación
          setNotificaciones(prev => [...prev, `Nueva tarea creada: ${tarea.nombre}`]);
          setTimeout(() => {
            setNotificaciones(prev => prev.slice(1));
          }, 5000);
        }}
        onEliminarTarea={(tareaId: string) => {
          const tareaEliminada = tareas.find(t => t.id === tareaId);
          setTareas(tareas.filter(t => t.id !== tareaId));
          
          // Actualizar obra
          if (tareaEliminada) {
            setObras(obras.map(obra => 
              obra.id === tareaEliminada.obraId 
                ? { 
                    ...obra, 
                    tareasActivas: Math.max(0, obra.tareasActivas - 1),
                    tareasCompletadas: tareaEliminada.estado === 'completada' 
                      ? Math.max(0, obra.tareasCompletadas - 1) 
                      : obra.tareasCompletadas
                  }
                : obra
            ));
          }

          // Notificación
          setNotificaciones(prev => [...prev, `Tarea "${tareaEliminada?.nombre}" eliminada`]);
          setTimeout(() => {
            setNotificaciones(prev => prev.slice(1));
          }, 5000);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Notificaciones */}
      {notificaciones.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notificaciones.map((notif, index) => (
            <div key={index} className="bg-primario text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{notif}</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="bg-claro px-6 py-4 border-b border-claro">
          <h2 className="text-xl font-semibold text-primario">Obras Activas</h2>
          <p className="text-sm text-primario/70">Gestiona tus obras y asigna tareas a los socios constructores</p>
        </div>
      </div>

      {/* Dashboard de Obras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {obras.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-primario/50 text-6xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-primario mb-2">No hay obras activas todavía</h3>
              <p className="text-primario/70 mb-6">Crea tu primera obra para comenzar a gestionar proyectos</p>
              <button
                onClick={() => setShowModalObra(true)}
                className="bg-primario text-white px-6 py-3 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200"
              >
                Crear Primera Obra
              </button>
            </div>
          </div>
        ) : (
          obras.map((obra) => (
            <div key={obra.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
              <div className="p-6">
                {/* Header de la obra */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primario mb-1">{obra.nombre}</h3>
                    <p className="text-sm text-primario/70 mb-2">{obra.ubicacion}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getEstadoColor(obra.estado)}`}>
                        {getEstadoIcon(obra.estado)}
                        <span className="capitalize">{obra.estado}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progreso */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-primario/70">Progreso General</span>
                    <span className="font-medium text-primario">{obra.progreso}%</span>
                  </div>
                  <div className="w-full bg-claro rounded-full h-2">
                    <div 
                      className="bg-primario h-2 rounded-full transition-all duration-300"
                      style={{ width: `${obra.progreso}%` }}
                    ></div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primario">{obra.tareasActivas}</div>
                    <div className="text-xs text-primario/70">Tareas Activas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-acento">{obra.tareasCompletadas}</div>
                    <div className="text-xs text-primario/70">Completadas</div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primario/70">Inicio:</span>
                    <span className="text-primario">{new Date(obra.fechaInicio).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primario/70">Fin estimado:</span>
                    <span className="text-primario">{new Date(obra.fechaFin).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>

                {/* Botón Ver Detalles */}
                <button 
                  onClick={() => setObraSeleccionada(obra)}
                  className="w-full bg-claro text-primario py-2 px-4 rounded-lg font-medium hover:bg-claro/80 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver Detalles</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowModalObra(true)}
          className="bg-primario text-white w-14 h-14 rounded-full shadow-lg hover:bg-primario/90 transition-all duration-200 flex items-center justify-center hover:scale-110"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Modales */}
      {showModalObra && (
        <ModalCrearObra
          onClose={() => setShowModalObra(false)}
          onSave={handleCrearObra}
        />
      )}
    </div>
  );
}
