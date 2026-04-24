import { Star, HardHat } from 'lucide-react';
import { StatusBadge } from '@/components/cliente/StatusBadge';

export function CuadrillaCard({
  id: _id,
  nombre,
  especialidad,
  disponibilidad,
  score,
  obrasSimultaneas,
  nota,
}: {
  id?: string;
  nombre: string;
  especialidad: string;
  disponibilidad: string;
  score: number;
  obrasSimultaneas: number;
  nota?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-sky-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{nombre}</h3>
            <p className="text-sm text-slate-600">{especialidad}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-amber-700">
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
          {score.toFixed(1)}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge label={disponibilidad} />
        <span className="text-xs text-slate-500">{obrasSimultaneas} obra(s) activas</span>
      </div>
      {nota ? <p className="mt-3 text-xs text-slate-500">{nota}</p> : null}
    </div>
  );
}
