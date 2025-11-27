'use client';

import { CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { BaseCard, Badge, Button, EmptyState } from '@/components/ui/grows';
import { useEffect, useRef } from 'react';

export type NotificacionItem = {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'success' | 'info' | 'warning' | 'error';
  fecha: string;
  leida?: boolean;
  destinatario?: string;
};

interface ListaNotificacionesProps {
  items: NotificacionItem[];
  onMarkAsRead?: (id: string) => void;
}

const tipoConfig: Record<
  NotificacionItem['tipo'],
  {
    icon: typeof CheckCircle;
    accent: string;
    badge: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
  }
> = {
  success: {
    icon: CheckCircle,
    accent: 'bg-growsGreen/30',
    badge: 'bg-growsGreen/15 text-growsGreen',
    iconBg: 'bg-growsGreen/10',
    iconColor: 'text-growsGreen',
    titleColor: 'text-growsGreen',
  },
  info: {
    icon: Info,
    accent: 'bg-growsBlue/20',
    badge: 'bg-growsBlue/10 text-growsBlue',
    iconBg: 'bg-growsBlue/10',
    iconColor: 'text-growsBlue',
    titleColor: 'text-growsBlue',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-growsYellow/30',
    badge: 'bg-growsYellow/15 text-growsYellow',
    iconBg: 'bg-growsYellow/10',
    iconColor: 'text-growsYellow',
    titleColor: 'text-growsYellow',
  },
  error: {
    icon: AlertCircle,
    accent: 'bg-growsError/15',
    badge: 'bg-growsError/15 text-growsError',
    iconBg: 'bg-growsError/10',
    iconColor: 'text-growsError',
    titleColor: 'text-growsError',
  },
};

export function ListaNotificaciones({ items, onMarkAsRead }: ListaNotificacionesProps) {
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Animación slide-in para nuevas notificaciones
  useEffect(() => {
    items.forEach((item) => {
      const element = itemRefs.current.get(item.id);
      if (element && !item.leida) {
        // Agregar animación solo si es nueva
        element.style.animation = 'slideIn 0.3s ease-out';
      }
    });
  }, [items]);

  if (!items.length) {
    return (
      <EmptyState
        title="Sin notificaciones"
        description="Cuando recibas novedades, las vas a ver listadas acá."
        icon={<Info className="h-12 w-12 text-growsBlue" />}
      />
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      <div className="space-y-3">
        {items.map((item, index) => {
          // Validar que el tipo sea válido, usar 'info' como fallback
          const tipoValido: NotificacionItem['tipo'] = 
            (item.tipo && tipoConfig[item.tipo]) ? item.tipo : 'info';
          const config = tipoConfig[tipoValido];
          const Icon = config.icon;
          const fechaLegible = new Date(item.fecha).toLocaleString('es-AR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });

          // Determinar si es recibida (izquierda) o enviada (derecha)
          // Por defecto, todas son recibidas (izquierda) ya que son notificaciones para el usuario
          const esRecibida = true;

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
              }}
              className={clsx(
                'flex w-full',
                esRecibida ? 'justify-start' : 'justify-end'
              )}
            >
              <div
                className={clsx(
                  'relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm',
                  esRecibida
                    ? 'bg-white rounded-tl-sm border border-gray-200'
                    : 'bg-growsBlue text-white rounded-tr-sm',
                  !item.leida && 'ring-2 ring-growsBlue/20'
                )}
              >
                {/* Badge rojo para no leídas */}
                {!item.leida && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    !
                  </span>
                )}

                {/* Header con título y fecha */}
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={clsx('h-4 w-4', esRecibida ? config.iconColor : 'text-white')} />
                    <p className={clsx(
                      'text-base font-semibold',
                      esRecibida ? config.titleColor : 'text-white'
                    )}>
                      {item.titulo}
                    </p>
                  </div>
                  <span className={clsx(
                    'text-xs',
                    esRecibida ? 'text-growsTextMuted' : 'text-white/80'
                  )}>
                    {fechaLegible}
                  </span>
                </div>

                {/* Mensaje tipo iMessage (16-17px) */}
                <p className={clsx(
                  'text-[16px] leading-relaxed',
                  esRecibida ? 'text-growsText' : 'text-white'
                )}>
                  {item.mensaje}
                </p>

                {/* Footer con acciones */}
                {onMarkAsRead && !item.leida && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => onMarkAsRead(item.id)}
                      className={clsx(
                        'text-xs font-medium underline',
                        esRecibida ? 'text-growsBlue' : 'text-white/90'
                      )}
                    >
                      Marcar como leída
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}


