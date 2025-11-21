'use client';

interface PanelEstadoProps {
  presupuestosPendientes: number;
  presupuestosEnviados: number;
  presupuestosAprobados: number;
}

export function PanelEstado({
  presupuestosPendientes,
  presupuestosEnviados,
  presupuestosAprobados,
}: PanelEstadoProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Presupuestos pendientes
          </p>
          <p className="text-2xl font-semibold text-slate-900">{presupuestosPendientes}</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Presupuestos enviados
          </p>
          <p className="text-2xl font-semibold text-slate-900">{presupuestosEnviados}</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Presupuestos aprobados
          </p>
          <p className="text-2xl font-semibold text-slate-900">{presupuestosAprobados}</p>
        </div>
      </div>
    </div>
  );
}

