'use client';

import { Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PresupuestoInfo {
  id: string;
  tarea_id: string;
  tarea_titulo: string;
  cuadrilla_nombre: string;
  monto: number | null;
  moneda: string | null;
  estado: string | null;
  notas: string | null;
  duracion_estimada?: number | null;
  duracion_ofrecida?: number | null;
  created_at: string;
  updated_at?: string | null;
}

interface PresupuestoListaModalProps {
  open: boolean;
  onClose: () => void;
  cuadrillaNombre: string;
  presupuestos: PresupuestoInfo[];
}

const formatFecha = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Fecha inválida';
  }
};

export function PresupuestoListaModal({
  open,
  onClose,
  cuadrillaNombre,
  presupuestos,
}: PresupuestoListaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Lista de Presupuestos - {cuadrillaNombre}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {presupuestos.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No hay presupuestos para mostrar.
            </div>
          ) : (
            presupuestos.map((presupuesto) => {
              const estado = (presupuesto.estado ?? 'PENDIENTE').toUpperCase();

              return (
                <div
                  key={presupuesto.id}
                  className="rounded border border-slate-200 bg-white p-4 space-y-2"
                >
                  {/* Título y estado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900 mb-1">
                        {presupuesto.tarea_titulo}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            estado === 'APROBADO'
                              ? 'bg-green-100 text-green-700'
                              : estado === 'RECHAZADO'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          )}
                        >
                          {estado}
                        </span>
                        <span className="text-xs text-slate-500">
                          {presupuesto.cuadrilla_nombre}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monto y duración */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    {presupuesto.monto && presupuesto.monto > 0 && (
                      <span className="font-medium">
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: presupuesto.moneda ?? 'ARS',
                        }).format(presupuesto.monto)}
                      </span>
                    )}
                    {presupuesto.duracion_ofrecida && (
                      <span>
                        {presupuesto.duracion_ofrecida} día{presupuesto.duracion_ofrecida === 1 ? '' : 's'} ofrecidos
                      </span>
                    )}
                    {presupuesto.duracion_estimada && (
                      <span className="text-slate-400">
                        ({presupuesto.duracion_estimada} días estimados)
                      </span>
                    )}
                  </div>

                  {/* Notas */}
                  {presupuesto.notas && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded p-2">
                      <span className="font-medium">Notas: </span>
                      <span>{presupuesto.notas}</span>
                    </div>
                  )}

                  {/* Fechas */}
                  <div className="space-y-0.5 pt-1 border-t border-slate-100">
                    {presupuesto.created_at && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>Solicitado el: {formatFecha(presupuesto.created_at)}</span>
                      </div>
                    )}
                    {presupuesto.updated_at && estado !== 'PENDIENTE' && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>Enviado por socio: {formatFecha(presupuesto.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

