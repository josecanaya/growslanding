'use client';

import { CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { BaseCard, Badge, Button, EmptyState } from '@/components/ui/grows';

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
    <div className="grid grid-cols-1 gap-4">
      {items.map((item) => {
        const config = tipoConfig[item.tipo];
        const Icon = config.icon;
        const fechaLegible = new Date(item.fecha).toLocaleString('es-AR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <BaseCard
            key={item.id}
            className={clsx(
              'relative overflow-hidden border border-growsBorder/60',
              !item.leida ? 'bg-growsSurface' : 'bg-growsSurface/80'
            )}
          >
            <span
              className={clsx('absolute inset-y-0 left-0 w-1 rounded-r-grows-full', config.accent)}
              aria-hidden="true"
            />

            <div className="flex flex-col gap-3 pl-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      'mt-0.5 flex h-9 w-9 items-center justify-center rounded-full',
                      config.iconBg
                    )}
                  >
                    <Icon className={clsx('h-4 w-4', config.iconColor)} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={clsx('text-sm font-semibold', config.titleColor)}>{item.titulo}</p>
                      {!item.leida && (
                        <Badge variant="info" size="sm" className="bg-growsBlue/10 text-growsBlue">
                          Nueva
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-growsTextMuted">{item.mensaje}</p>
                  </div>
                </div>

                <span className="text-xs text-growsTextMuted">{fechaLegible}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-growsTextMuted">
                {item.destinatario && (
                  <Badge size="sm" className="bg-growsNeutral/40 text-growsTextMuted">
                    {item.destinatario}
                  </Badge>
                )}

                {onMarkAsRead && !item.leida && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="ml-auto border border-growsBorder"
                    onClick={() => onMarkAsRead(item.id)}
                  >
                    Marcar como leída
                  </Button>
                )}
              </div>
            </div>
          </BaseCard>
        );
      })}
    </div>
  );
}


