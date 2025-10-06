'use client';

import { useState } from 'react';
import { elementos } from '../../lib/catalogos/elementos';
import { SubgrupoAccordion, Seleccion } from './SubgrupoAccordion';
import { MiniResumenFloat } from './MiniResumenFloat';

interface ElementosWizardProps {
  onSeleccionesChange: (selecciones: Seleccion[]) => void;
}

// Mapeo de iconos por subgrupo
const iconosSubgrupos: { [key: string]: string } = {
  "Fundaciones y Estructuras": "🏗️",
  "Muros": "🧱",
  "Pisos": "🏠",
  "Cubiertas": "🏘️",
  "Escaleras": "🪜",
  "Carpinterías": "🚪"
};

export function ElementosWizard({ onSeleccionesChange }: ElementosWizardProps) {
  const [elementosSeleccionados, setElementosSeleccionados] = useState<Seleccion[]>([]);

  const handleElementoSeleccionado = (seleccion: Seleccion) => {
    const nuevasSelecciones = [...elementosSeleccionados, seleccion];
    setElementosSeleccionados(nuevasSelecciones);
    onSeleccionesChange(nuevasSelecciones);
  };

  const handleQuitarSeleccion = (opcionId: string) => {
    const nuevasSelecciones = elementosSeleccionados.filter(s => s.opcionId !== opcionId);
    setElementosSeleccionados(nuevasSelecciones);
    onSeleccionesChange(nuevasSelecciones);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Elementos Constructivos</h3>
          <p className="text-gray-600">
            Selecciona los elementos que formarán parte de tu obra organizados por subgrupos
          </p>
        </div>

        {/* Lista de subgrupos con accordion */}
        <div className="space-y-4">
          {elementos.map((categoria) => (
            <SubgrupoAccordion
              key={categoria.categoria}
              subgrupo={categoria.categoria}
              icono={iconosSubgrupos[categoria.categoria] || "🏗️"}
              elementos={categoria.tipos}
              elementosSeleccionados={elementosSeleccionados}
              onElementoSeleccionado={handleElementoSeleccionado}
            />
          ))}
        </div>

        {/* Mini resumen flotante */}
        <MiniResumenFloat
          elementosSeleccionados={elementosSeleccionados}
          onQuitarSeleccion={handleQuitarSeleccion}
        />
      </div>
    </div>
  );
}
