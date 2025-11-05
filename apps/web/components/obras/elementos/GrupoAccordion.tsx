'use client';

import { useState } from 'react';
import GrupoGridPanel from './GrupoGridPanel';

type GrupoAccordionProps = {
  id: string;
  titulo: string;
  tipos: Array<{ nombre: string; fases: { estructura: any[]; obra_gris: any[]; terminaciones: any[] } }>;
  plantaId?: string;
  tareasObra?: Array<{ id: string; nombre: string; codigo?: string }>;
  obraId?: string;
  open?: boolean;
  onToggle?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

export default function GrupoAccordion({ id, titulo, tipos, plantaId, tareasObra, obraId, open: controlledOpen, onToggle, onPrev, onNext }: GrupoAccordionProps) {
  console.log('[GrupoAccordion] Montado con obraId:', obraId, 'titulo:', titulo);
  
  const [internalOpen, setInternalOpen] = useState<boolean>(!!controlledOpen);
  const open = controlledOpen ?? internalOpen;
  const toggle = () => {
    if (onToggle) onToggle(); else setInternalOpen(!open);
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="w-full px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
            aria-label="Siguiente"
          >
            ›
          </button>
          <button
            type="button"
            onClick={toggle}
            className="text-left"
          >
            <span className="text-lg font-semibold" style={{ color: '#003C6E' }}>{titulo}</span>
          </button>
        </div>
        <button type="button" onClick={toggle} className="text-gray-500">{open ? '−' : '+'}</button>
      </div>
      {open && (
        <div className="px-5 pb-5">
          <GrupoGridPanel titulo={titulo} tipos={tipos} plantaId={plantaId} tareasObra={tareasObra} obraId={obraId} onSelectElemento={(n) => console.log('Seleccionar', titulo, n)} onPrev={onPrev} onNext={onNext} />
        </div>
      )}
    </div>
  );
}


