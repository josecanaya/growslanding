'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import GrupoGridPanel from './GrupoGridPanel';

type ElementoCatalogo = {
  id: string;
  nombre: string;
  unidad: string;
  opciones?: Record<string, string[]>;
  tareas?: string[];
};

type SubcategoriaAccordionProps = {
  subcategoriaId: string;
  subcategoriaNombre: string;
  elementos: ElementoCatalogo[];
  categoriaNombre: string;
  plantaId?: string;
  tareasObra?: Array<{ id: string; nombre: string; codigo?: string }>;
  obraId?: string;
  elementosCargados?: Set<string>; // IDs de elementos ya cargados en Supabase
};

export default function SubcategoriaAccordion({
  subcategoriaId,
  subcategoriaNombre,
  elementos,
  categoriaNombre,
  plantaId,
  tareasObra,
  obraId,
  elementosCargados = new Set()
}: SubcategoriaAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Convertir elementos del catálogo al formato esperado por GrupoGridPanel
  // Mapear tareas a fases
  const mapearTareasAFases = (tareas: string[] = []) => {
    const fases = {
      estructura: [] as string[],
      obra_gris: [] as string[],
      terminaciones: [] as string[]
    };

    tareas.forEach(tarea => {
      const tareaLower = tarea.toLowerCase();
      if (
        tareaLower.includes('replanteo') ||
        tareaLower.includes('excavación') ||
        tareaLower.includes('excavacion') ||
        tareaLower.includes('hormigon') ||
        tareaLower.includes('estructura')
      ) {
        fases.estructura.push(tarea);
      } else if (
        tareaLower.includes('mampostería') ||
        tareaLower.includes('revoque') ||
        tareaLower.includes('instalación') ||
        tareaLower.includes('instalacion')
      ) {
        fases.obra_gris.push(tarea);
      } else {
        fases.terminaciones.push(tarea);
      }
    });

    return fases;
  };

  const tiposParaPanel = elementos.map(el => ({
    nombre: el.nombre,
    fases: mapearTareasAFases(el.tareas),
    // Guardar referencia al elemento completo para acceso a opciones
    elementoCompleto: el
  }));

  const cantidadElementos = elementos.length;
  const cantidadCargados = elementos.filter(el => elementosCargados.has(el.nombre)).length;

  return (
    <div className="ml-6 border-l-2 border-gray-300 pl-4 my-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-md group"
        style={{ backgroundColor: isOpen ? '#E6EEF7' : 'transparent' }}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
          )}
          <span className="font-medium text-gray-800 text-sm">{subcategoriaNombre}</span>
          <span className="text-xs text-gray-500">
            ({cantidadCargados}/{cantidadElementos} cargados)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {cantidadCargados > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
              {cantidadCargados}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-3">
          <GrupoGridPanel
            titulo={categoriaNombre}
            tipos={tiposParaPanel}
            plantaId={plantaId}
            tareasObra={tareasObra}
            obraId={obraId}
            subcategoria={subcategoriaNombre}
            onSelectElemento={(nombre) => {
              console.log('Elemento seleccionado:', nombre);
            }}
          />
        </div>
      )}
    </div>
  );
}

