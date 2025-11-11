'use client';

import clsx from 'clsx';
import { FileText, User, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { BaseCard, Badge, EmptyState } from '@/components/ui/grows';

export type InformeItem = {
  id: string;
  titulo: string;
  tipo: 'progreso' | 'problema' | 'completado' | 'solicitud';
  fecha: string;
  obra: string;
  estado: 'pendiente' | 'enviado' | 'leido';
};

interface ListaInformesProps {
  items: InformeItem[];
}

const estadoConfig: Record<
  InformeItem['estado'],
  {
    icon: typeof Clock;
    badge: string;
    text: string;
  }
> = {
  pendiente: {
    icon: AlertTriangle,
    badge: 'bg-growsYellow/15 text-growsYellow border border-growsYellow/40',
    text: 'Pendiente',
  },
  enviado: {
    icon: Clock,
    badge: 'bg-growsBlue/10 text-growsBlue border border-growsBlue/30',
    text: 'Enviado',
  },
  leido: {
    icon: CheckCircle2,
    badge: 'bg-growsGreen/15 text-growsGreen border border-growsGreen/40',
    text: 'Leído',
  },
};

export function ListaInformes({ items }: ListaInformesProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin informes emitidos"
        description="Cuando generes informes, vas a ver su historial en esta pestaña."
        icon={<FileText className="h-12 w-12 text-growsBlue" />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((informe) => {
        const estado = estadoConfig[informe.estado];
        const EstadoIcon = estado.icon;
        const fechaLegible = new Date(informe.fecha).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        return (
          <BaseCard key={informe.id}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-grows-md bg-growsBlue/10 p-2 text-growsBlue">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-growsBlue">{informe.titulo}</h3>
                    <p className="text-xs uppercase tracking-wide text-growsTextMuted">
                      {informe.tipo.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', estado.badge)}>
                  <EstadoIcon className="h-3.5 w-3.5" />
                  {estado.text}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-growsTextMuted">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {informe.obra}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {fechaLegible}
                </span>
              </div>

              <div>
                <Badge size="sm" variant="info" className="bg-growsNeutral/40 text-growsTextMuted">
                  {`ID #${informe.id}`}
                </Badge>
              </div>
            </div>
          </BaseCard>
        );
      })}
    </div>
  );
}


