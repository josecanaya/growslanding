'use client';

import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge, Button, EmptyState } from '@/components/ui/grows';
import { CheckCircle, XCircle, Users, Loader2 } from 'lucide-react';

const STAGE_DEFINITIONS = [
  { key: 'estructura', label: 'Estructura' },
  { key: 'obra gris', label: 'Obra gris' },
  { key: 'terminaciones', label: 'Terminaciones' },
];

const STATUS_OPTIONS = ['PEDIDO', 'PENDIENTE', 'APROBADO', 'RECHAZADO'];

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return DATE_FORMATTER.format(date);
}

// Función para formatear fechas con hora
function formatFechaCompleta(fecha: string | null | undefined): string {
  if (!fecha) return '';
  try {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const año = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  } catch {
    return '';
  }
}

interface PresupuestoAuditoria {
  id: string;
  tarea_id: string;
  created_at: string;
  updated_at?: string | null;
  estado: string | null;
  monto: number | null;
  moneda: string | null;
  notas: string | null;
  socio_id: string | null;
}

interface TareaAuditoria {
  id: string;
  titulo: string;
  etapa: string | null;
}

interface PanelAuditoriaProps {
  presupuestos: PresupuestoAuditoria[];
  tareas: Map<string, TareaAuditoria>;
  cuadrillas: Map<string, string>;
  stageFilter: string;
  statusFilter: string;
  onStageFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onAprobar: (presupuestoId: string) => void;
  onRechazar: (presupuestoId: string) => void;
  onAsignar: (presupuestoId: string) => void;
  actualizandoId: string | null;
  asignandoId: string | null;
}

export function PanelAuditoria({
  presupuestos,
  tareas,
  cuadrillas,
  stageFilter,
  statusFilter,
  onStageFilterChange,
  onStatusFilterChange,
  onAprobar,
  onRechazar,
  onAsignar,
  actualizandoId,
  asignandoId,
}: PanelAuditoriaProps) {
  const filteredPresupuestos = presupuestos.filter((presupuesto) => {
    const tarea = tareas.get(presupuesto.tarea_id);
    if (!tarea) return false;

    if (stageFilter !== 'todas') {
      const etapa = tarea.etapa ? tarea.etapa.toLowerCase() : '';
      if (!etapa.includes(stageFilter)) return false;
    }

    if (statusFilter !== 'todos') {
      const estado = (presupuesto.estado ?? '').toUpperCase();
      if (estado !== statusFilter.toUpperCase()) return false;
    }

    return true;
  });

  const formatearMonto = (monto: number | null, moneda: string | null) => {
    if (monto === null || monto === undefined || Number(monto) <= 0) {
      return null;
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda ?? 'ARS',
    }).format(monto);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={stageFilter} onValueChange={onStageFilterChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar por etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las etapas</SelectItem>
              {STAGE_DEFINITIONS.map((stage) => (
                <SelectItem key={stage.key} value={stage.key}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPresupuestos.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {/* Header de tabla - estilo email */}
          <div className="hidden grid-cols-[120px_160px_1fr_100px_100px_180px] border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <span>Fecha</span>
            <span>Cuadrilla</span>
            <span>Tarea</span>
            <span>Etapa</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {/* Filas de tabla - estilo email compacto */}
          <div className="divide-y divide-slate-100">
            {filteredPresupuestos.map((presupuesto) => {
              const tarea = tareas.get(presupuesto.tarea_id);
              if (!tarea) return null;
              const fecha = formatDate(presupuesto.created_at);
              const vinculoId = presupuesto.socio_id ?? '';
              const cuadrillaNombre = cuadrillas.get(vinculoId) ?? 'Sin cuadrilla';
              const etapa = tarea.etapa ?? 'Sin etapa';
              const estado = (presupuesto.estado ?? 'PENDIENTE').toUpperCase();
              const montoFormateado = formatearMonto(presupuesto.monto, presupuesto.moneda);
              const estaActualizando = actualizandoId === presupuesto.id;
              const estaAsignando = asignandoId === presupuesto.id;
              const estaProcesando = estaActualizando || estaAsignando;

              return (
                <div
                  key={presupuesto.id}
                  className="grid grid-cols-1 gap-2 px-4 py-3 text-sm transition-colors hover:bg-slate-50 lg:grid-cols-[120px_160px_1fr_100px_100px_180px] lg:gap-4"
                >
                  <div className="text-xs text-slate-600 lg:text-sm">{fecha}</div>
                  <div className="truncate text-sm font-medium text-slate-900">
                    {cuadrillaNombre}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{tarea.titulo}</p>
                    {montoFormateado && (
                      <p className="text-xs text-slate-500">{montoFormateado}</p>
                    )}
                    {/* Fechas */}
                    <div className="mt-1 space-y-0.5">
                      {presupuesto.created_at && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>Solicitado el: {formatFechaCompleta(presupuesto.created_at)}</span>
                        </div>
                      )}
                      {presupuesto.updated_at && estado !== 'PENDIENTE' && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>Enviado por socio: {formatFechaCompleta(presupuesto.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 lg:text-sm">{etapa}</div>
                  <div>
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
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<CheckCircle className="h-3 w-3" />}
                      onClick={() => onAprobar(presupuesto.id)}
                      disabled={estaProcesando || estado === 'APROBADO'}
                      className="h-7 px-2 text-xs"
                    >
                      Aprobar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<XCircle className="h-3 w-3" />}
                      onClick={() => onRechazar(presupuesto.id)}
                      disabled={estaProcesando || estado === 'RECHAZADO'}
                      className="h-7 px-2 text-xs"
                    >
                      Rechazar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={
                        estaAsignando ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Users className="h-3 w-3" />
                        )
                      }
                      onClick={() => onAsignar(presupuesto.id)}
                      disabled={estaProcesando || estado !== 'APROBADO'}
                      className="h-7 px-2 text-xs"
                    >
                      Asignar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No hay presupuestos registrados"
          description="Cuando solicites presupuestos a las cuadrillas los vas a ver acá."
        />
      )}
    </div>
  );
}

