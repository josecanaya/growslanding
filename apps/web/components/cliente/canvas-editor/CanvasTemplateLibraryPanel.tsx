'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import type { ObraProductKind } from '@/lib/canvas/obraProductKind';

export type CanvasTemplateListItem = {
  slug: string;
  nombre: string;
  descripcion?: string;
  obra_product_kind: string;
  tareas: { titulo: string; orden: number }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  obraProductKind?: string | null;
  onApply: (slug: string) => void;
  applyingSlug?: string | null;
};

export function CanvasTemplateLibraryPanel({
  open,
  onClose,
  obraProductKind,
  onApply,
  applyingSlug,
}: Props) {
  const [templates, setTemplates] = useState<CanvasTemplateListItem[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/canvas-templates');
      const j = await res.json();
      setTemplates(Array.isArray(j.data) ? j.data : []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const filtered = templates.filter((t) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      t.nombre.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      (t.descripcion ?? '').toLowerCase().includes(q)
    );
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/30">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#002b49]" />
            <h2 className="text-lg font-bold text-[#001629]">Librería de templates</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[#f1f5f9]" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="border-b border-[#f1f5f9] px-4 py-2 text-xs text-[#64748b]">
          Elegí un pack de tareas y agregalo al canvas. Después podés editarlo y guardar.
        </p>
        <div className="border-b border-[#f1f5f9] px-4 py-3">
          <input
            type="search"
            placeholder="Buscar (puerta, portón, pintura…)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-[#64748b]">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[#64748b]">No hay templates para mostrar.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((t) => (
                <li
                  key={t.slug}
                  className="rounded-xl border border-[#e2e8f0] p-3 hover:border-[#94a3b8]"
                >
                  <p className="font-semibold text-[#001629]">{t.nombre}</p>
                  {t.descripcion ? (
                    <p className="mt-1 text-xs text-[#64748b]">{t.descripcion}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] font-medium text-[#475569]">
                    {t.tareas.length} tareas
                  </p>
                  <button
                    type="button"
                    disabled={applyingSlug === t.slug}
                    onClick={() => onApply(t.slug)}
                    className="mt-3 w-full rounded-lg bg-[#002b49] py-2 text-sm font-semibold text-white hover:bg-[#02446f] disabled:opacity-50"
                  >
                    {applyingSlug === t.slug ? 'Agregando…' : 'Agregar al canvas'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
