'use client';

import type { CanvasXmlLibraryEntry } from '@/lib/canvas/canvasXmlLibrary';

type Props = {
  entries: CanvasXmlLibraryEntry[];
  applyingSlug?: string | null;
  onSelect: (slug: string) => void;
  emptyMessage?: string;
};

export function CanvasXmlLibraryList({
  entries,
  applyingSlug,
  onSelect,
  emptyMessage = 'No hay planes XML que coincidan con los filtros.',
}: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-[#64748b]">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {entries.map((t) => {
        const busy = applyingSlug === t.slug;
        return (
          <li key={t.slug}>
            <button
              type="button"
              disabled={busy || applyingSlug != null}
              onClick={() => onSelect(t.slug)}
              className="w-full rounded-xl border border-[#e2e8f0] p-3 text-left transition hover:border-[#002b49] hover:bg-[#f8fafc] disabled:opacity-60"
            >
              <p className="font-semibold text-[#001629]">{t.nombre}</p>
              {t.descripcion ? (
                <p className="mt-1 text-xs text-[#64748b]">{t.descripcion}</p>
              ) : null}
              <p className="mt-2 text-[11px] font-medium text-[#475569]">
                {busy ? 'Cargando XML al canvas…' : `${t.taskCount} tareas · archivo XML`}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
