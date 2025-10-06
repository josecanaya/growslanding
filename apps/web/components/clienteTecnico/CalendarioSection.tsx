'use client';

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter, Clock, MapPin, Users } from 'lucide-react';

// Tipos de datos
interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  duracion: number; // en minutos
  tipo: 'reunion' | 'inspeccion' | 'entrega' | 'recordatorio';
  obra: string;
  participantes: string[];
  ubicacion?: string;
  completado: boolean;
}

interface TareaCalendario {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  obra: string;
  responsable: string;
  estado: 'pendiente' | 'en_curso' | 'completada';
  prioridad: 'baja' | 'media' | 'alta';
}

// Datos mock
const eventosMock: EventoCalendario[] = [
  {
    id: '1',
    titulo: 'Inspección eléctrica',
    descripcion: 'Revisión de instalaciones eléctricas en planta baja',
    fecha: '2024-01-28',
    hora: '09:00',
    duracion: 120,
    tipo: 'inspeccion',
    obra: 'Casa Residencial Norte',
    participantes: ['Carlos Pérez', 'Inspector Técnico'],
    ubicacion: 'Casa Residencial Norte - Planta Baja',
    completado: false
  },
  {
    id: '2',
    titulo: 'Entrega de materiales',
    descripcion: 'Llegada de materiales para pintura exterior',
    fecha: '2024-01-30',
    hora: '14:00',
    duracion: 60,
    tipo: 'entrega',
    obra: 'Villa Familiar Sur',
    participantes: ['Roberto Silva', 'Proveedor'],
    ubicacion: 'Villa Familiar Sur - Almacén',
    completado: false
  },
  {
    id: '3',
    titulo: 'Reunión de coordinación',
    descripcion: 'Seguimiento semanal del progreso de obra',
    fecha: '2024-02-01',
    hora: '10:00',
    duracion: 90,
    tipo: 'reunion',
    obra: 'Edificio Comercial Centro',
    participantes: ['María González', 'Cliente Técnico', 'Supervisor'],
    ubicacion: 'Oficina Central',
    completado: false
  }
];

const tareasCalendarioMock: TareaCalendario[] = [
  {
    id: '1',
    nombre: 'Instalación eléctrica planta baja',
    fechaInicio: '2024-01-25',
    fechaFin: '2024-02-05',
    obra: 'Casa Residencial Norte',
    responsable: 'Carlos Pérez',
    estado: 'en_curso',
    prioridad: 'alta'
  },
  {
    id: '2',
    nombre: 'Colocación de pisos',
    fechaInicio: '2024-02-01',
    fechaFin: '2024-02-15',
    obra: 'Casa Residencial Norte',
    responsable: 'María González',
    estado: 'pendiente',
    prioridad: 'media'
  },
  {
    id: '3',
    nombre: 'Pintura exterior',
    fechaInicio: '2024-01-20',
    fechaFin: '2024-01-30',
    obra: 'Villa Familiar Sur',
    responsable: 'Roberto Silva',
    estado: 'completada',
    prioridad: 'baja'
  }
];

export function CalendarioSection() {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventos] = useState<EventoCalendario[]>(eventosMock);
  const [tareas] = useState<TareaCalendario[]>(tareasCalendarioMock);
  const [vista, setVista] = useState<'semana' | 'mes' | 'timeline'>('semana');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

  // Navegación del calendario
  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    setFechaActual(prev => {
      const nuevaFecha = new Date(prev);
      if (direccion === 'anterior') {
        nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
      } else {
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      }
      return nuevaFecha;
    });
  };

  // Obtener eventos para una fecha específica
  const getEventosPorFecha = (fecha: string) => {
    return eventos.filter(evento => evento.fecha === fecha);
  };

  // Obtener tareas para una fecha específica
  const getTareasPorFecha = (fecha: string) => {
    return tareas.filter(tarea => 
      fecha >= tarea.fechaInicio && fecha <= tarea.fechaFin
    );
  };

  // Generar días del mes
  const generarDiasMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const dias = [];
    
    // Días del mes anterior
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = new Date(año, mes, -i);
      dias.push({ fecha: dia, esDelMes: false });
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia);
      dias.push({ fecha, esDelMes: true });
    }
    
    // Días del mes siguiente
    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = new Date(año, mes + 1, dia);
      dias.push({ fecha, esDelMes: false });
    }
    
    return dias;
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'reunion': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inspeccion': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'entrega': return 'bg-green-100 text-green-800 border-green-200';
      case 'recordatorio': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_curso': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const dias = generarDiasMes();
  const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
              <p className="text-gray-600">Organización cronológica interactiva</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Selector de vista */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['semana', 'mes', 'timeline'].map(vistaOption => (
                <button
                  key={vistaOption}
                  onClick={() => setVista(vistaOption as any)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    vista === vistaOption
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {vistaOption.charAt(0).toUpperCase() + vistaOption.slice(1)}
                </button>
              ))}
            </div>

            {/* Botón nuevo evento */}
            <button
              onClick={() => setMostrarModalNuevo(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Vista de calendario mensual */}
      {vista === 'mes' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Navegación del mes */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 capitalize">
                {nombreMes}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => cambiarMes('anterior')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setFechaActual(new Date())}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Hoy
                </button>
                <button
                  onClick={() => cambiarMes('siguiente')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid del calendario */}
          <div className="p-6">
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {/* Días de la semana */}
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
                <div key={dia} className="bg-gray-100 p-3 text-center text-sm font-medium text-gray-700">
                  {dia}
                </div>
              ))}
              
              {/* Días del mes */}
              {dias.map((dia, index) => {
                const fechaStr = dia.fecha.toISOString().split('T')[0];
                const eventosDia = getEventosPorFecha(fechaStr);
                const tareasDia = getTareasPorFecha(fechaStr);
                const esHoy = dia.fecha.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`bg-white p-2 min-h-[120px] ${
                      !dia.esDelMes ? 'text-gray-300' : 'text-gray-900'
                    } ${esHoy ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${esHoy ? 'text-blue-600' : ''}`}>
                      {dia.fecha.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {eventosDia.slice(0, 2).map(evento => (
                        <div
                          key={evento.id}
                          className={`text-xs p-1 rounded border ${getTipoColor(evento.tipo)}`}
                          title={evento.titulo}
                        >
                          {evento.hora} - {evento.titulo}
                        </div>
                      ))}
                      {eventosDia.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{eventosDia.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Vista de timeline */}
      {vista === 'timeline' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Timeline de Tareas</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {tareas.map(tarea => (
                <div key={tarea.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{tarea.nombre}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(tarea.estado)}`}>
                      {tarea.estado.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(tarea.fechaInicio).toLocaleDateString()} - {new Date(tarea.fechaFin).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {tarea.responsable}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {tarea.obra}
                    </span>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        tarea.estado === 'completada' ? 'bg-green-600' :
                        tarea.estado === 'en_curso' ? 'bg-blue-600' : 'bg-yellow-500'
                      }`}
                      style={{
                        width: tarea.estado === 'completada' ? '100%' :
                               tarea.estado === 'en_curso' ? '60%' : '20%'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vista de semana */}
      {vista === 'semana' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Vista Semanal</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-7 gap-4">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => {
                const fecha = new Date(fechaActual);
                fecha.setDate(fechaActual.getDate() - fechaActual.getDay() + index + 1);
                const fechaStr = fecha.toISOString().split('T')[0];
                const eventosDia = getEventosPorFecha(fechaStr);
                
                return (
                  <div key={dia} className="border border-gray-200 rounded-lg p-3">
                    <h3 className="font-semibold text-gray-900 mb-3">{dia}</h3>
                    <div className="space-y-2">
                      {eventosDia.map(evento => (
                        <div
                          key={evento.id}
                          className={`text-xs p-2 rounded border ${getTipoColor(evento.tipo)}`}
                        >
                          <div className="font-medium">{evento.titulo}</div>
                          <div className="text-xs opacity-75">{evento.hora}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo evento (placeholder) */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Nuevo Evento</h3>
            <p className="text-gray-600 mb-4">Modal de creación de evento (por implementar)</p>
            <button
              onClick={() => setMostrarModalNuevo(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
