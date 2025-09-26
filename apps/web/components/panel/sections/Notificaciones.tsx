'use client';

import { Bell, DollarSign, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface MiCuadrillaProps {
  user: User;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'payment' | 'success' | 'warning' | 'info';
  date: string;
  read: boolean;
}

export function Notificaciones({ user }: MiCuadrillaProps) {
  const notifications: Notification[] = [
    {
      id: 1,
      title: 'Pago disponible',
      message: 'Tu pago por la obra "Casa Familiar - San Isidro" está listo para retirar.',
      type: 'payment',
      date: '2024-01-15',
      read: false
    },
    {
      id: 2,
      title: 'Obra aceptada',
      message: 'Tu propuesta para "Edificio Residencial - Palermo" ha sido aceptada.',
      type: 'success',
      date: '2024-01-14',
      read: false
    },
    {
      id: 3,
      title: 'Recordatorio de entrega',
      message: 'La tarea "Replanteo de cimientos" debe completarse antes del 20 de enero.',
      type: 'warning',
      date: '2024-01-13',
      read: true
    },
    {
      id: 4,
      title: 'Nueva oportunidad',
      message: 'Se ha publicado una nueva obra en tu zona: "Oficinas Corporativas - Puerto Madero".',
      type: 'info',
      date: '2024-01-12',
      read: true
    },
    {
      id: 5,
      title: 'Actualización de perfil',
      message: 'Tu nivel ha sido actualizado a Oro. ¡Felicitaciones!',
      type: 'success',
      date: '2024-01-10',
      read: true
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment': return 'border-l-green-500 bg-green-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">Notificaciones</h2>
        {unreadCount > 0 && (
          <span className="bg-accent text-dark px-3 py-1 rounded-full text-sm font-medium">
            {unreadCount} sin leer
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`
              bg-white rounded-lg p-4 border-l-4 hover:shadow-md transition-shadow duration-200
              ${getNotificationColor(notification.type)}
              ${!notification.read ? 'ring-2 ring-accent/20' : ''}
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${!notification.read ? 'text-dark' : 'text-dark/70'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-sm text-dark/50">{notification.date}</span>
                </div>
                <p className={`mt-1 ${!notification.read ? 'text-dark/80' : 'text-dark/60'}`}>
                  {notification.message}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2"></div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-dark/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark/70 mb-2">No hay notificaciones</h3>
          <p className="text-dark/50">Te notificaremos cuando tengas nuevas actualizaciones.</p>
        </div>
      )}
    </div>
  );
}
