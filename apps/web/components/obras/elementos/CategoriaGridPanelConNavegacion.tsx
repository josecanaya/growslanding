'use client';

import { useState } from 'react';
import CategoriaGridPanel from './CategoriaGridPanel';

type SubcategoriaData = {
  id: string;
  nombre: string;
  elementos: Array<{
    id: string;
    nombre: string;
    unidad: string;
    opciones?: Record<string, string[]>;
    tareas?: string[];
  }>;
};

type CategoriaData = {
  id: string;
  nombre: string;
  subcategorias: SubcategoriaData[];
  elementosCargados: Record<string, any[]>;
};

type CategoriaGridPanelConNavegacionProps = {
  categorias: CategoriaData[];
  plantaId?: string;
  tareasObra?: Array<{ id: string; nombre: string; codigo?: string }>;
  obraId?: string;
  elementosCargadosSet?: Set<string>;
};

export default function CategoriaGridPanelConNavegacion({
  categorias,
  plantaId,
  tareasObra,
  obraId,
  elementosCargadosSet = new Set()
}: CategoriaGridPanelConNavegacionProps) {
  const [categoriaIndex, setCategoriaIndex] = useState(0);
  const categoriaActual = categorias[categoriaIndex];

  const handlePrev = () => {
    setCategoriaIndex((prev) => (prev === 0 ? categorias.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCategoriaIndex((prev) => (prev === categorias.length - 1 ? 0 : prev + 1));
  };

  if (!categoriaActual) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay categorías disponibles</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Header azul con navegación */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1f5a8a' }}>
        <button
          type="button"
          onClick={handlePrev}
          className="rounded-md border border-white/30 text-white/90 hover:bg-white/10 px-2 py-1"
          aria-label="Anterior"
        >
          ‹
        </button>
        <h2 className="text-white text-2xl font-bold tracking-wide text-center flex-1">
          {categoriaActual.nombre.toUpperCase()}
        </h2>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-md border border-white/30 text-white/90 hover:bg-white/10 px-2 py-1"
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>

      {/* Panel de categoría */}
      <CategoriaGridPanel
        categoriaId={categoriaActual.id}
        categoriaNombre={categoriaActual.nombre}
        subcategorias={categoriaActual.subcategorias}
        plantaId={plantaId}
        tareasObra={tareasObra}
        obraId={obraId}
        elementosCargados={elementosCargadosSet}
      />
    </div>
  );
}

