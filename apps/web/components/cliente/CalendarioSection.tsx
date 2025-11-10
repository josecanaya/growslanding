'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users, X } from 'lucide-react';
import { Card, Button, Badge, SectionLayout } from '@/components/ui/grows';
import { useSubscription } from '@/lib/subscriptions';
import { canUseFeature, usePlanGate } from '@/lib/permissions';

interface EventoCalendario {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  tipo: 'obra' | 'reunion' | 'entrega' | 'otro';
  descripcion?: string;
  ubicacion?: string;
  participantes?: string[];
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
  prioridad: 'alta' | 'media' | 'baja';
}

const eventosMock: EventoCalendario[] = [
  {
    id: '1',
    titulo: 'Reunión de planificación - Casa Residencial Norte',
    fecha: '2024-01-25',
    hora: '09:00',
    tipo: 'reunion',
    descripcion: 'Reunión semanal para revisar el progreso del proyecto',
    ubicacion: 'Oficina Central',
    participantes: ['Carlos Pérez', 'María González', 'Roberto Silva'],
    completado: false
  },
  {
    id: '2',
    titulo: 'Entrega de materiales - Edificio Comercial Centro',
    fecha: '2024-01-26',
    hora: '14:00',
    tipo: 'entrega',
    descripcion: 'Entrega de materiales para la fase de estructura',
    ubicacion: 'Obra Edificio Comercial Centro',
    participantes: ['Proveedor ABC', 'Carlos Pérez'],
    completado: false
  },
  {
    id: '3',
    titulo: 'Inspección técnica - Villa Familiar Sur',
    fecha: '2024-01-28',
    hora: '10:00',
    tipo: 'obra',
    descripcion: 'Inspección técnica de la estructura completada',
    ubicacion: 'Obra Villa Familiar Sur',
    participantes: ['Inspector Municipal', 'Roberto Silva'],
    completado: false
  },
  {
    id: '4',
    titulo: 'Reunión cliente - Casa Residencial Norte',
    fecha: '2024-01-30',
    hora: '16:00',
    tipo: 'reunion',
    descripcion: 'Reunión con el cliente para mostrar avances',
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

interface CalendarioSectionProps {
  onNavigate?: (section: string) => void;
}

export function CalendarioSection({ onNavigate }: CalendarioSectionProps) {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventos] = useState<EventoCalendario[]>(eventosMock);
  const [tareas] = useState<TareaCalendario[]>(tareasCalendarioMock);
  const [vista, setVista] = useState<'semana' | 'mes' | 'timeline'>('semana');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const { planId } = useSubscription();
  const { verifyAccess } = usePlanGate();
  const canUseCalendario = canUseFeature(planId, 'calendario');
  const router = useRouter();

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
      const fecha = new Date(año, mes, -i);
      dias.push({
        fecha,
        esDelMesActual: false,
        esHoy: false,
        eventos: getEventosPorFecha(fecha.toISOString().split('T')[0]),
        tareas: getTareasPorFecha(fecha.toISOString().split('T')[0])
      });
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia);
      const hoy = new Date();
      const esHoy = fecha.toDateString() === hoy.toDateString();
      
      dias.push({
        fecha,
        esDelMesActual: true,
        esHoy,
        eventos: getEventosPorFecha(fecha.toISOString().split('T')[0]),
        tareas: getTareasPorFecha(fecha.toISOString().split('T')[0])
      });
    }
    
    // Completar la semana
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(año, mes + 1, i);
      dias.push({
        fecha,
        esDelMesActual: false,
        esHoy: false,
        eventos: getEventosPorFecha(fecha.toISOString().split('T')[0]),
        tareas: getTareasPorFecha(fecha.toISOString().split('T')[0])
      });
    }
    
    return dias;
  };

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const dias = generarDiasMes();
  const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const getTipoEventoVariant = (tipo: string) => {
    switch (tipo) {
      case 'obra': return 'info';
      case 'reunion': return 'success';
      case 'entrega': return 'warning';
      case 'otro': return 'default';
      default: return 'default';
    }
  };

  const getEstadoTareaVariant = (estado: string) => {
    switch (estado) {
      case 'completada': return 'success';
      case 'en_curso': return 'warning';
      case 'pendiente': return 'default';
      default: return 'default';
    }
  };

  if (!canUseCalendario) {
    const handleClose = () => {
      if (onNavigate) {
        onNavigate('obras');
        return;
      }
      router.push('/cliente/obras');
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-neutral-950/60 px-6 backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(203,161,53,0.22),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(12,29,54,0.55),_transparent_55%)] opacity-80"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-neutral-200/25" aria-hidden="true" />
        <div className="relative max-w-md space-y-4 rounded-2xl border border-neutral-700/60 bg-neutral-900/80 p-8 text-center text-zinc-100 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleClose}
            className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white transition hover:bg-black/90"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#CBA135]/20 text-[#CBA135]">
            <Calendar className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-50">Calendario disponible en plan PRO</h1>
          <p className="text-sm text-zinc-200">
            Programá hitos, recordatorios y sincronizá tareas entre equipos con el plan PRO o Enterprise.
          </p>
          <button
            type="button"
            onClick={() => verifyAccess('calendario', 'PRO')}
            className="w-full rounded-xl bg-[#CBA135] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#d3ad45]"
          >
            Activar plan PRO
          </button>
        </div>
      </div>
    );
  }

  return (
    <SectionLayout
      title="Calendario"
      subtitle="Organización cronológica interactiva"
    >
      {/* Controles de navegación */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-grows-secondary/10 rounded-grows-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-grows-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-grows-primary">{nombreMes}</h2>
              <p className="text-grows-text-secondary">Gestiona eventos y tareas</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Selector de vista */}
            <div className="flex bg-grows-neutral rounded-grows-lg p-1">
              {['semana', 'mes', 'timeline'].map(vistaOption => (
                <button
                  key={vistaOption}
                onClick={() => setVista(vistaOption as any)}
                  className={`px-3 py-1 text-sm rounded-grows-md transition-colors ${
                    vista === vistaOption
                      ? 'bg-grows-surface text-grows-primary shadow-grows-sm'
                      : 'text-grows-text-secondary hover:text-grows-primary'
                  }`}
                >
                  {vistaOption.charAt(0).toUpperCase() + vistaOption.slice(1)}
                </button>
              ))}
            </div>

            {/* Botón nuevo evento */}
            <Button
            onClick={() => {
              if (!verifyAccess('calendario', 'PRO')) return;
              setMostrarModalNuevo(true);
            }}
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
            >
              Nuevo Evento
            </Button>
          </div>
        </div>
      </Card>

      {/* Vista de calendario semanal */}
      {vista === 'semana' && (
        <Card title="Vista Semanal">
          <div className="grid grid-cols-7 gap-2">
            {diasSemana.map((dia) => (
              <div key={dia} className="p-3 text-center font-medium text-grows-text-secondary text-sm border-b border-grows-border">
                {dia}
              </div>
            ))}
            {dias.slice(0, 7).map((dia, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-3 border border-grows-border rounded-grows-md ${
                  dia.esHoy ? 'bg-grows-secondary/10 border-grows-secondary' : 'bg-grows-surface'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  dia.esHoy ? 'text-grows-primary font-bold' : 'text-grows-text-primary'
                }`}>
                  {dia.fecha.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dia.eventos.slice(0, 2).map((evento) => (
                    <Badge
                      key={evento.id}
                      variant={getTipoEventoVariant(evento.tipo)}
                      className="text-xs w-full justify-start"
                    >
                      {evento.titulo}
                    </Badge>
                  ))}
                  {dia.tareas.slice(0, 1).map((tarea) => (
                    <Badge
                      key={tarea.id}
                      variant={getEstadoTareaVariant(tarea.estado)}
                      className="text-xs w-full justify-start"
                    >
                      {tarea.nombre}
                    </Badge>
                  ))}
                  {(dia.eventos.length + dia.tareas.length) > 3 && (
                    <div className="text-xs text-grows-text-secondary">
                      +{(dia.eventos.length + dia.tareas.length) - 3} más
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Vista de calendario mensual */}
      {vista === 'mes' && (
        <Card title="Vista Mensual">
          <div className="grid grid-cols-7 gap-1">
            {diasSemana.map((dia) => (
              <div key={dia} className="p-3 text-center font-medium text-grows-text-secondary text-sm border-b border-grows-border">
                {dia}
              </div>
            ))}
            {dias.map((dia, index) => (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-grows-border ${
                  dia.esDelMesActual ? 'bg-grows-surface' : 'bg-grows-neutral/30'
                } ${dia.esHoy ? 'bg-grows-secondary/10' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  dia.esDelMesActual ? 'text-grows-text-primary' : 'text-grows-text-secondary'
                } ${dia.esHoy ? 'text-grows-primary font-bold' : ''}`}>
                  {dia.fecha.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dia.eventos.slice(0, 2).map((evento) => (
                    <div
                      key={evento.id}
                      className="text-xs p-1 rounded bg-grows-secondary/10 text-grows-primary truncate"
                    >
                      {evento.titulo}
                    </div>
                  ))}
                  {dia.tareas.slice(0, 1).map((tarea) => (
                    <div
                      key={tarea.id}
                      className="text-xs p-1 rounded bg-grows-primary/10 text-grows-primary truncate"
                    >
                      {tarea.nombre}
                    </div>
                  ))}
                  {(dia.eventos.length + dia.tareas.length) > 3 && (
                    <div className="text-xs text-grows-text-secondary">
                      +{(dia.eventos.length + dia.tareas.length) - 3} más
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de eventos próximos */}
      <Card title="Eventos Próximos">
        <div className="space-y-4">
          {eventos.slice(0, 5).map((evento) => (
            <div key={evento.id} className="flex items-center space-x-3 p-3 border border-grows-border rounded-grows-md">
              <div className="p-2 bg-grows-secondary/10 rounded-grows-md">
                <Calendar className="h-4 w-4 text-grows-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-grows-primary">{evento.titulo}</h4>
                <div className="flex items-center space-x-4 text-sm text-grows-text-secondary">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{evento.hora}</span>
                  </div>
                  {evento.ubicacion && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{evento.ubicacion}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={getTipoEventoVariant(evento.tipo)}>
                {evento.tipo}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal para nuevo evento */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-grows-surface rounded-grows-lg shadow-grows-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-grows-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-grows-primary">Nuevo Evento</h3>
                <button
                  onClick={() => setMostrarModalNuevo(false)}
                  className="text-grows-text-secondary hover:text-grows-primary transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-grows-text-secondary text-center py-8">
                Formulario de nuevo evento en desarrollo...
              </p>
              <div className="flex justify-end space-x-3">
                <Button variant="ghost" onClick={() => setMostrarModalNuevo(false)}>
                  Cancelar
                </Button>
                <Button variant="primary">
                  Crear Evento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionLayout>
  );
}