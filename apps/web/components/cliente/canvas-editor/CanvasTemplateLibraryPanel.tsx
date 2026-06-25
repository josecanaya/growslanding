'use client';

import { useMemo, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { isObraProductKind, type ObraProductKind } from '@/lib/canvas/obraProductKind';
import { filterCanvasXmlLibrary, listCanvasXmlLibrary } from '@/lib/canvas/canvasXmlLibrary';
import { CanvasXmlLibraryList } from './CanvasXmlLibraryList';

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
  const [filter, setFilter] = useState('');
  const library = useMemo(() => listCanvasXmlLibrary(), []);

  const kindFilter: ObraProductKind | undefined =
    obraProductKind && isObraProductKind(obraProductKind) ? obraProductKind : undefined;

  const filtered = useMemo(
    () =>
      filterCanvasXmlLibrary(library, {
        obraProductKind: kindFilter,
        search: filter,
      }),
    [library, kindFilter, filter],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/30">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#002b49]" />
            <h2 className="text-lg font-bold text-[#001629]">Librería XML</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[#f1f5f9]" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="border-b border-[#f1f5f9] px-4 py-2 text-xs text-[#64748b]">
          Cada ítem es un archivo Project XML con tareas. Tocá uno para cargarlo al canvas (mismo flujo que Archivo →
          Importar XML).
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
          <CanvasXmlLibraryList entries={filtered} applyingSlug={applyingSlug} onSelect={onApply} />
        </div>
      </div>
    </div>
  );
}
