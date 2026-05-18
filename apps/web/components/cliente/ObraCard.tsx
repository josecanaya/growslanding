import Link from 'next/link';
import type { Route } from 'next';
import { MapPin, ChevronRight, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/cliente/StatusBadge';

export type ObraCardProps = {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion: string;
  estado: string;
  avancePct: number;
  href?: Route;
  /** Si se pasa, muestra acción Eliminar (llama a DELETE desde la página). */
  onEliminar?: (id: string) => void;
  eliminando?: boolean;
};

export function ObraCard({
  id,
  nombre,
  tipo,
  ubicacion,
  estado,
  avancePct,
  href = `/cliente/tareas/${id}/editor` as Route,
  onEliminar,
  eliminando = false,
}: ObraCardProps) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md">
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        aria-label={`Abrir obra ${nombre}`}
      />
      <div className="relative z-10 flex min-w-0 flex-col pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
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
      </div>
      <div className="relative z-10 mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 pointer-events-auto">
        {onEliminar ? (
          <button
            type="button"
            disabled={eliminando}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEliminar(id);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-800 disabled:pointer-events-none disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </button>
        ) : (
          <span />
        )}
        <span className="ml-auto flex items-center text-sm font-semibold text-sky-700 group-hover:text-sky-900">
          Ver obra
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}
