'use client';

import { useState } from 'react';
import { Bell, Send, FileText, User, Calendar, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Tipos de datos
interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  fecha: string;
  leida: boolean;
  destinatario: string;
}

interface Informe {
  id: string;
  titulo: string;
  tipo: 'progreso' | 'problema' | 'completado' | 'solicitud';
  fecha: string;
  obra: string;
  estado: 'pendiente' | 'enviado' | 'leido';
}

// Datos mock
const notificacionesMock: Notificacion[] = [
  {
    id: '1',
    titulo: 'Tarea completada',
    mensaje: 'Carlos Pérez ha completado la instalación eléctrica en Casa Residencial Norte',
    tipo: 'success',
    fecha: '2024-01-25T10:30:00',
    leida: false,
    destinatario: 'Cliente Técnico'
  },
  {
    id: '2',
    titulo: 'Solicitud de presupuesto',
    mensaje: 'María González solicita presupuesto para materiales de pintura exterior',
    tipo: 'info',
    fecha: '2024-01-24T14:15:00',
    leida: true,
    destinatario: 'Cliente Técnico'
  },
  {
    id: '3',
    titulo: 'Problema reportado',
    mensaje: 'Se detectó un problema con la instalación de ventanas en Edificio Comercial Centro',
    tipo: 'warning',
    fecha: '2024-01-23T09:45:00',
    leida: false,
    destinatario: 'Cliente Técnico'
  }
];

const informesMock: Informe[] = [
  {
    id: '1',
    titulo: 'Informe de progreso - Semana 1',
    tipo: 'progreso',
    fecha: '2024-01-25',
    obra: 'Casa Residencial Norte',
    estado: 'enviado'
  },
  {
    id: '2',
    titulo: 'Reporte de problema - Instalación',
    tipo: 'problema',
    fecha: '2024-01-24',
    obra: 'Edificio Comercial Centro',
    estado: 'pendiente'
  },
  {
    id: '3',
    titulo: 'Solicitud de materiales',
    tipo: 'solicitud',
    fecha: '2024-01-23',
    obra: 'Villa Familiar Sur',
    estado: 'leido'
  }
];

export function NotificacionesSection() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(notificacionesMock);
  const [informes, setInformes] = useState<Informe[]>(informesMock);
  const [mostrarModalEmision, setMostrarModalEmision] = useState(false);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'enviado': return 'bg-blue-100 text-blue-800';
      case 'leido': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const marcarComoLeida = (id: string) => {
    setNotificaciones(prev => prev.map(notif => 
      notif.id === id ? { ...notif, leida: true } : notif
    ));
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
              <p className="text-gray-600">Emisión de informes y comunicación con obreros</p>
            </div>
          </div>
          
          <button
            onClick={() => setMostrarModalEmision(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="h-4 w-4 mr-2" />
            Emitir Informe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones recibidas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
              {notificacionesNoLeidas > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {notificacionesNoLeidas} sin leer
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay notificaciones</p>
                <p className="text-sm">Las notificaciones aparecerán aquí cuando lleguen</p>
              </div>
            ) : (
              notificaciones.map(notificacion => (
                <div
                  key={notificacion.id}
                  className={`p-4 border-l-4 ${getTipoColor(notificacion.tipo)} ${
                    !notificacion.leida ? 'bg-white' : 'bg-gray-50'
                  }`}
                  onClick={() => marcarComoLeida(notificacion.id)}
                >
                  <div className="flex items-start gap-3">
                    {getTipoIcon(notificacion.tipo)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notificacion.leida ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notificacion.titulo}
                        </p>
                        {!notificacion.leida && (
                          <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notificacion.mensaje}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notificacion.fecha).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Informes emitidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Informes Emitidos</h2>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {informes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay informes emitidos</p>
                <p className="text-sm">Los informes que emitas aparecerán aquí</p>
              </div>
            ) : (
              informes.map(informe => (
                <div key={informe.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-900">{informe.titulo}</h3>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {informe.obra}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(informe.fecha).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(informe.estado)}`}>
                      {informe.estado}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de emisión de informe (placeholder) */}
      {mostrarModalEmision && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Emitir Informe</h3>
            <p className="text-gray-600 mb-4">Modal de emisión de informes (por implementar)</p>
            <button
              onClick={() => setMostrarModalEmision(false)}
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
