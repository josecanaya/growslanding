'use client';

import { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Clock, Users, Calendar, Award } from 'lucide-react';

interface Notificacion {
  id: string;
  tipo: 'info' | 'warning' | 'success' | 'error';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  accion?: string;
}

interface NotificacionesProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

export function Notificaciones({ user }: NotificacionesProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([
    {
      id: '1',
      tipo: 'success',
      titulo: 'Tarea completada',
      mensaje: 'La tarea "Replanteo de cimientos" ha sido completada exitosamente.',
      fecha: '2024-03-15T10:30:00',
      leida: false,
      accion: 'Ver detalles'
    },
    {
      id: '2',
      tipo: 'warning',
      titulo: 'Documento próximo a vencer',
      mensaje: 'El certificado de capacitación vence en 15 días.',
      fecha: '2024-03-15T09:15:00',
      leida: false,
      accion: 'Renovar'
    },
    {
      id: '3',
      tipo: 'info',
      titulo: 'Nueva obra disponible',
      mensaje: 'Se ha publicado una nueva obra en tu especialidad: "Casa Familiar Los Robles".',
      fecha: '2024-03-14T16:45:00',
      leida: true,
      accion: 'Ver obra'
    },
    {
      id: '4',
      tipo: 'error',
      titulo: 'Integrante sin seguro',
      mensaje: 'Miguel Torres no tiene seguro vigente. Actualizar documentación.',
      fecha: '2024-03-14T14:20:00',
      leida: true,
      accion: 'Actualizar'
    },
    {
      id: '5',
      tipo: 'success',
      titulo: 'Nivel actualizado',
      mensaje: '¡Felicidades! Has alcanzado el nivel Oro. Desbloqueaste nuevas oportunidades.',
      fecha: '2024-03-13T11:00:00',
      leida: true,
      accion: 'Ver beneficios'
    }
  ]);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTipoTextColor = (tipo: string) => {
    switch (tipo) {
      case 'success': return 'text-green-900';
      case 'warning': return 'text-yellow-900';
      case 'error': return 'text-red-900';
      case 'info': return 'text-blue-900';
      default: return 'text-gray-900';
    }
  };

  const marcarComoLeida = (id: string) => {
    setNotificaciones(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, leida: true } : notif
      )
    );
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev => 
      prev.map(notif => ({ ...notif, leida: true }))
    );
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
          <p className="text-sm text-gray-600">
            {notificacionesNoLeidas} sin leer
          </p>
        </div>
        {notificacionesNoLeidas > 0 && (
          <button
            onClick={marcarTodasComoLeidas}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#1A202C' }}>
          <div className="text-lg font-bold" style={{ color: '#FEEB70' }}>{notificaciones.length}</div>
          <div className="text-xs" style={{ color: '#A0AEC0' }}>Total</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#008080' }}>
          <div className="text-lg font-bold" style={{ color: '#FFFFFF' }}>{notificacionesNoLeidas}</div>
          <div className="text-xs" style={{ color: '#FFFFFF' }}>Sin leer</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#FEEB70' }}>
          <div className="text-lg font-bold" style={{ color: '#1A202C' }}>
            {notificaciones.filter(n => n.leida).length}
          </div>
          <div className="text-xs" style={{ color: '#1A202C' }}>Leídas</div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-3">
        {notificaciones.map((notificacion) => (
          <div
            key={notificacion.id}
            className={`rounded-lg border p-4 transition-all duration-200 ${
              notificacion.leida 
                ? 'bg-white border-gray-200' 
                : `${getTipoColor(notificacion.tipo)} border-l-4`
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getTipoIcon(notificacion.tipo)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-semibold text-sm ${
                    notificacion.leida ? 'text-gray-900' : getTipoTextColor(notificacion.tipo)
                  }`}>
                    {notificacion.titulo}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(notificacion.fecha).toLocaleDateString()}
                    </span>
                    {!notificacion.leida && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
                <p className={`text-sm mb-3 ${
                  notificacion.leida ? 'text-gray-600' : getTipoTextColor(notificacion.tipo)
                }`}>
                  {notificacion.mensaje}
                </p>
                {notificacion.accion && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        marcarComoLeida(notificacion.id);
                        console.log(`Acción: ${notificacion.accion}`);
                      }}
                      className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                        notificacion.tipo === 'success' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : notificacion.tipo === 'warning'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : notificacion.tipo === 'error'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {notificacion.accion}
                    </button>
                    {!notificacion.leida && (
                      <button
                        onClick={() => marcarComoLeida(notificacion.id)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay notificaciones */}
      {notificaciones.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
          <p className="text-gray-600">Te notificaremos cuando haya novedades importantes.</p>
        </div>
      )}
    </div>
  );
}