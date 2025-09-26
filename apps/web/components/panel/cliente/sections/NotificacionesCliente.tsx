'use client';

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

interface NotificacionesClienteProps {
  user: User;
}

export function NotificacionesCliente({ user }: NotificacionesClienteProps) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-oscuro mb-8">Notificaciones</h1>
      <div className="bg-claro rounded-xl p-8 text-center">
        <p className="text-oscuro/70">Sección de notificaciones en desarrollo...</p>
      </div>
    </div>
  );
}
