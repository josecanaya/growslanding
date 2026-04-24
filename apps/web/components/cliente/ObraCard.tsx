import Link from 'next/link';
import type { Route } from 'next';
import { MapPin, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/cliente/StatusBadge';
import { MOCK_OBRAS } from '@/lib/mocks/clienteMockData';

type ObraRow = (typeof MOCK_OBRAS)[number];

export function ObraCard({
  id,
  nombre,
  tipo,
  ubicacion,
  estado,
  avancePct,
  href = `/cliente/obras/${id}` as Route,
}: Pick<ObraRow, 'id' | 'nombre' | 'tipo' | 'ubicacion' | 'estado' | 'avancePct'> & { href?: Route }) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{tipo}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{nombre}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-600" />
            <span className="line-clamp-1">{ubicacion}</span>
          </div>
        </div>
        <StatusBadge label={estado} />
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
          <span>Avance</span>
          <span>{avancePct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all group-hover:from-sky-700"
            style={{ width: `${avancePct}%` }}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end text-sm font-semibold text-sky-700">
        Ver obra
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
