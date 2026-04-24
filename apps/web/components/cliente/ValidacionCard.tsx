import { Building2, Camera, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/grows';

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export function ValidacionCard({
  obraNombre,
  bloque,
  socio,
  enviado,
  fotos,
  montoEstimado,
  onAprobar,
  onRechazar,
}: {
  obraNombre: string;
  bloque: string;
  socio: string;
  enviado: string;
  fotos: number;
  montoEstimado: number;
  onAprobar?: () => void;
  onRechazar?: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Building2 className="h-3.5 w-3.5" />
            {obraNombre}
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-900">{bloque}</h3>
          <p className="mt-1 text-sm text-slate-600">Cuadrilla: {socio}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-slate-900">{ars.format(montoEstimado)}</p>
          <p className="text-xs text-slate-500">estimado</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Enviado {enviado}
        </span>
        <span className="inline-flex items-center gap-1">
          <Camera className="h-3.5 w-3.5" />
          {fotos} fotos simuladas
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" type="button" onClick={onAprobar}>
          Aprobar (mock)
        </Button>
        <Button variant="secondary" size="sm" type="button" onClick={onRechazar}>
          Rechazar (mock)
        </Button>
      </div>
    </div>
  );
}
