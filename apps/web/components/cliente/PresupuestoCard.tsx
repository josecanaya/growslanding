import { StatusBadge } from '@/components/cliente/StatusBadge';

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export function PresupuestoCard({
  titulo,
  cuadrilla,
  estado,
  monto,
  enviado,
}: {
  titulo: string;
  cuadrilla: string;
  estado: string;
  monto: number;
  enviado: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">{titulo}</h3>
          <p className="mt-1 text-sm text-slate-600">{cuadrilla}</p>
          <p className="mt-2 text-xs text-slate-500">Enviado: {enviado}</p>
        </div>
        <StatusBadge label={estado} />
      </div>
      <p className="mt-4 text-xl font-bold text-slate-900">{monto > 0 ? ars.format(monto) : '—'}</p>
    </div>
  );
}
