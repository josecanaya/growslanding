'use client';

import { ArrowRight, CheckCircle2, Circle, Share2, XCircle } from 'lucide-react';

type PublicationStats = {
  total: number;
  published: number;
  unpublished: number;
  incomplete: number;
  blocked: number;
  draft: number;
};

type Props = {
  obraNombre: string;
  stats: PublicationStats;
  canvasHydrated: boolean;
  tieneNodosTarea: boolean;
  onOpenPublishModal: () => void;
  onGoOrganizar: () => void;
};

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'ok' | 'warn' | 'danger' | 'muted';
}) {
  const tones = {
    neutral: 'border-[#e5e7eb] bg-white text-[#0f172a]',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
    muted: 'border-[#e5e7eb] bg-[#f8fafc] text-[#64748b]',
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

export function CanvasPublicarTab({
  obraNombre,
  stats,
  canvasHydrated,
  tieneNodosTarea,
  onOpenPublishModal,
  onGoOrganizar,
}: Props) {
  const listas = Math.max(0, stats.unpublished - stats.incomplete - stats.blocked);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6 md:p-10">
      <header className="mb-8 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Obra</p>
        <h1 className="mt-1 text-2xl font-black text-[#0f172a]">Publicación de tareas</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          Revisá el estado de publicación de las tareas de{' '}
          <strong className="text-[#334155]">{obraNombre}</strong> antes de enviarlas al flujo operativo.
        </p>
      </header>

      <div className="mb-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total tareas" value={stats.total} tone="neutral" />
        <StatCard label="Publicadas" value={stats.published} tone="ok" />
        <StatCard label="Sin publicar" value={stats.unpublished} tone="muted" />
        <StatCard label="Incompletas" value={stats.incomplete} tone="warn" />
        <StatCard label="Bloqueadas" value={stats.blocked} tone="danger" />
      </div>

      <div className="grid max-w-3xl gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-sm font-bold text-[#0f172a]">Acciones principales</h2>
          <p className="mt-1 text-xs text-[#64748b]">
            Abrí el asistente de publicación para revisar y enviar tareas al sistema operativo.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenPublishModal}
              disabled={!canvasHydrated || !tieneNodosTarea}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              Publicar tareas
            </button>
            <button
              type="button"
              onClick={onOpenPublishModal}
              disabled={!canvasHydrated || !tieneNodosTarea || listas === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-50"
              title={listas === 0 ? 'No hay tareas listas sin publicar' : 'Publicar tareas listas'}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Publicar listas ({listas})
            </button>
            <button
              type="button"
              onClick={onGoOrganizar}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
            >
              Volver a organizar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-5">
          <h2 className="text-sm font-bold text-[#0f172a]">Estado rápido</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#475569]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {stats.published} tarea{stats.published === 1 ? '' : 's'} ya publicada{stats.published === 1 ? '' : 's'}
            </li>
            <li className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-[#94a3b8]" />
              {stats.draft} borrador{stats.draft === 1 ? '' : 'es'} sin enviar
            </li>
            <li className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-amber-500" />
              {stats.incomplete} incompleta{stats.incomplete === 1 ? '' : 's'} (checklist o datos faltantes)
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              {stats.blocked} bloqueada{stats.blocked === 1 ? '' : 's'}
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
