import Link from 'next/link';
import type { Route } from 'next';
import { User, Calendar } from 'lucide-react';
import { StatusBadge } from '@/components/cliente/StatusBadge';
import type { EstadoTareaMock, PrioridadMock } from '@/lib/mocks/clienteMockData';

const prioridadLabel: Record<PrioridadMock, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const prioridadClass: Record<PrioridadMock, string> = {
  alta: 'text-rose-700 bg-rose-50',
  media: 'text-amber-800 bg-amber-50',
  baja: 'text-slate-600 bg-slate-100',
};

export function TareaCard({
  id: _id,
  obraId,
  titulo,
  estado,
  responsable,
  avancePct,
  vence,
  prioridad,
}: {
  id: string;
  obraId: string;
  titulo: string;
  estado: EstadoTareaMock;
  responsable: string;
  avancePct: number;
  vence: string;
  prioridad: PrioridadMock;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{titulo}</h3>
          <StatusBadge label={estado} />
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${prioridadClass[prioridad]}`}
          >
            {prioridadLabel[prioridad]}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {responsable}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Vence {vence}
          </span>
        </div>
        <div className="mt-3 max-w-md">
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Avance</span>
            <span>{avancePct}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-sky-600" style={{ width: `${avancePct}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-3 shrink-0 sm:mt-0">
        <Link
          href={`/cliente/tareas/${obraId}` as Route}
          className="inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
        >
          Ver en obra
        </Link>
      </div>
    </div>
  );
}
