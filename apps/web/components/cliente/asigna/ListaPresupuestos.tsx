'use client';

import { CheckCircle, XCircle, Users, Loader2 } from 'lucide-react';
import { Button, Badge } from '@/components/ui/grows';

interface Presupuesto {
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
}

interface ListaPresupuestosProps {
  presupuestos: Presupuesto[];
  onAprobar: (presupuestoId: string) => void;
  onRechazar: (presupuestoId: string) => void;
  onAsignar: (presupuestoId: string) => void;
  actualizandoId: string | null;
  asignandoId: string | null;
}

export function ListaPresupuestos({
  presupuestos,
  onAprobar,
  onRechazar,
  onAsignar,
  actualizandoId,
  asignandoId,
}: ListaPresupuestosProps) {
  if (presupuestos.length === 0) {
    return null;
  }

  const formatearMonto = (monto: number | null, moneda: string | null) => {
    if (monto === null || monto === undefined || Number(monto) <= 0) {
      return 'Monto no informado';
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda ?? 'ARS',
    }).format(monto);
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Presupuestos recibidos</h3>
        <p className="text-xs text-slate-500">
          {presupuestos.length} presupuesto{presupuestos.length === 1 ? '' : 's'} de cuadrillas
        </p>
      </div>

      <div className="space-y-2">
        {presupuestos.map((presupuesto) => {
          const estado = (presupuesto.estado ?? 'PENDIENTE').toUpperCase();
          const estaActualizando = actualizandoId === presupuesto.id;
          const estaAsignando = asignandoId === presupuesto.id;
          const estaProcesando = estaActualizando || estaAsignando;

          return (
            <div
              key={presupuesto.id}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {presupuesto.tarea_titulo}
                    </p>
                    <Badge
                      variant={
                        estado === 'APROBADO'
                          ? 'success'
                          : estado === 'RECHAZADO'
                          ? 'error'
                          : 'warning'
                      }
                      className="text-xs"
                    >
                      {estado}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium">{presupuesto.cuadrilla_nombre}</span>
                    <span>{formatearMonto(presupuesto.monto, presupuesto.moneda)}</span>
                    {presupuesto.duracion_ofrecida && (
                      <span>{presupuesto.duracion_ofrecida} días ofrecidos</span>
                    )}
                    {presupuesto.duracion_estimada && (
                      <span className="text-slate-400">
                        (estimado: {presupuesto.duracion_estimada} días)
                      </span>
                    )}
                  </div>
                  {presupuesto.notas && (
                    <p className="text-xs text-slate-500">{presupuesto.notas}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<CheckCircle className="h-3.5 w-3.5" />}
                    onClick={() => onAprobar(presupuesto.id)}
                    disabled={estaProcesando || estado === 'APROBADO'}
                    className="text-xs"
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<XCircle className="h-3.5 w-3.5" />}
                    onClick={() => onRechazar(presupuesto.id)}
                    disabled={estaProcesando || estado === 'RECHAZADO'}
                    className="text-xs"
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={
                      estaAsignando ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Users className="h-3.5 w-3.5" />
                      )
                    }
                    onClick={() => onAsignar(presupuesto.id)}
                    disabled={estaProcesando || estado !== 'APROBADO'}
                    className="text-xs"
                  >
                    Asignar
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

