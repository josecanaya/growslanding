"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import CategoriaGridPanelConNavegacion from "./CategoriaGridPanelConNavegacion";
import { catalogoCompletoJson } from "@/lib/catalogos/elementos";
import { useElementosStore } from "./useElementosStore";
import { Accordion, AccordionItem } from "@/components/ui/accordion";

// Importar la función de mapeo desde GrupoGridPanel
const mapeoCodigosANombres: Record<string, string> = {
  'R00': 'Replanteo general', 'R01': 'Replanteo de columnas', 'R02': 'Replanteo de vigas',
  'R03': 'Replanteo de losas', 'R04': 'Replanteo de cubierta',
  'D01': 'Excavación', 'D03': 'Demolición',
  'H01': 'Hormigón de columnas', 'H11': 'Hormigón de bases', 'H15': 'Hormigón de encadenado',
  'H16': 'Hormigón de losa', 'H17': 'Hormigón de vigas',
  'M01': 'Mampostería', 'M02': 'Mampostería adicional', 'M25': 'Mampostería doble muro', 'M27': 'Mampostería de muros',
  'RV01': 'Revoque grueso exterior', 'RV02': 'Revoque fino exterior', 'RV03': 'Revoque grueso interior',
  'RV04': 'Revoque fino interior', 'RV05': 'Pintura exterior', 'RV06': 'Pintura interior',
  'EL01': 'Instalación eléctrica cubierta', 'EL02': 'Instalación eléctrica general', 'EL03': 'Puntos eléctricos',
  'C01': 'Estructura de cubierta chapa', 'C02': 'Cubierta de chapa', 'C03': 'Estructura de cubierta teja',
  'C04': 'Cubierta de teja', 'C05': 'Estructura escalera metálica', 'C06': 'Montaje escalera metálica',
  'C07': 'Carpintería puerta madera', 'C08': 'Instalación puerta madera', 'C09': 'Carpintería ventana madera',
  'C10': 'Instalación ventana madera', 'C11': 'Carpintería puerta aluminio', 'C12': 'Instalación puerta aluminio',
  'C13': 'Carpintería ventana aluminio', 'C14': 'Instalación ventana aluminio',
  'TE01': 'Contrapiso', 'TE02': 'Nivelación de piso', 'TE03': 'Cerámica', 'TE04': 'Porcelanato',
  'TE05': 'Impermeabilización techo', 'TE06': 'Terminación techo', 'TE07': 'Terminación cubierta chapa',
  'TE08': 'Terminación cubierta teja', 'TE09': 'Revoque escalera', 'TE10': 'Terminación escalera hormigón',
  'TE11': 'Terminación escalera metálica', 'TE12': 'Terminación puerta madera', 'TE13': 'Terminación ventana madera',
  'TE14': 'Terminación puerta aluminio', 'TE15': 'Terminación ventana aluminio', 'TE30': 'Terminación de muros'
};

const obtenerNombreTarea = (codigo: string): string => {
  return mapeoCodigosANombres[codigo] || codigo;
};

type ElementosContainerProps = {
  obraId: string;
  plantas?: { id: string; nombre: string }[];
};

type ElementoSupabase = {
  id: string;
  obra_id: string;
  nombre: string;
  categoria: string;
  subcategoria?: string | null;
  unidad: string;
  cantidad: number;
  costo_unitario?: number | null;
  duracion_estimada?: number | null;
  orden?: number | null;
  planta_id?: string | null;
  descripcion?: string | null;
  created_at: string;
};

export default function ElementosContainer({ obraId, plantas }: ElementosContainerProps) {
  console.log('[ElementosContainer] Montado con obraId:', obraId);
  
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<string | undefined>(
    plantas?.[0]?.id
  );
  const [elementosSupabase, setElementosSupabase] = useState<ElementoSupabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar elementos (memoizada)
  const cargarElementos = useCallback(async () => {
    if (!obraId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/obras/${obraId}/elementos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[ElementosContainer] Respuesta no JSON:', text.substring(0, 200));
        throw new Error(`Error del servidor: La respuesta no es JSON. Status: ${response.status}`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Error al cargar elementos');
      }

      setElementosSupabase(result.data || []);
    } catch (err) {
      console.error('[ElementosContainer] Error cargando elementos:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Error de conexión. Por favor, verifica tu conexión a internet.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al cargar elementos');
      }
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  // Cargar elementos desde Supabase al montar y cuando cambia obraId
  useEffect(() => {
    cargarElementos();
  }, [cargarElementos]);

  // Escuchar evento personalizado para recargar elementos cuando se agrega uno nuevo
  useEffect(() => {
    window.addEventListener('elemento-agregado', cargarElementos);
    return () => {
      window.removeEventListener('elemento-agregado', cargarElementos);
    };
  }, [cargarElementos]);

  // Agrupar elementos cargados por categoría y subcategoría
  const elementosPorSubcategoria = useMemo(() => {
    const grupos: Record<string, Record<string, ElementoSupabase[]>> = {};
    
    elementosSupabase.forEach(elemento => {
      const categoria = elemento.categoria || 'Sin categoría';
      const subcategoria = elemento.subcategoria || 'General';
      
      if (!grupos[categoria]) {
        grupos[categoria] = {};
      }
      if (!grupos[categoria][subcategoria]) {
        grupos[categoria][subcategoria] = [];
      }
      grupos[categoria][subcategoria].push(elemento);
    });

    return grupos;
  }, [elementosSupabase]);

  // Crear Set de nombres de elementos cargados para badges
  const elementosCargadosSet = useMemo(() => {
    return new Set(elementosSupabase.map(el => el.nombre));
  }, [elementosSupabase]);

  const getTareasObra = useElementosStore((s) => s.getTareasObra);
  
  // Obtener tareas de la obra y mapear a formato esperado
  const tareasObra = useMemo(() => {
    const tareas = getTareasObra();
    return tareas.map(t => ({
      id: t.id,
      nombre: t.codigo ? obtenerNombreTarea(t.codigo) : t.nombre,
      codigo: t.codigo || t.id,
    }));
  }, [getTareasObra]);

  const tareasDe = (tipos: any[]) => {
    const set = new Set<string>();
    tipos.forEach((t) => {
      if (t.fases?.estructura?.length) set.add("Estructura");
      if (t.fases?.obra_gris?.length) set.add("Obra gris");
      if (t.fases?.terminaciones?.length) set.add("Terminaciones");
    });
    return Array.from(set);
  };

  // Filtrar elementos por planta si hay filtro
  const elementosFiltrados = useMemo(() => {
    if (!plantaSeleccionada) {
      return elementosSupabase;
    }
    return elementosSupabase.filter(el => 
      !el.planta_id || el.planta_id === plantaSeleccionada
    );
  }, [elementosSupabase, plantaSeleccionada]);

  return (
    <div className="p-6" style={{ backgroundColor: "#f6f7f9" }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#003C6E" }}>
            Carga de Elementos
          </h2>
          <p className="text-sm text-gray-600">
            {loading 
              ? 'Cargando elementos...' 
              : elementosSupabase.length > 0
                ? `${elementosSupabase.length} elemento(s) cargado(s) desde Supabase`
                : 'Organizá configuraciones y tareas por etapa constructiva'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">Planta</label>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            value={plantaSeleccionada || ''}
            onChange={(e) => setPlantaSeleccionada(e.target.value || undefined)}
          >
            <option value="">General</option>
            {(plantas ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">Error: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando elementos...</p>
        </div>
      ) : (
        <CategoriaGridPanelConNavegacion
          categorias={catalogoCompletoJson.categorias.map(cat => ({
            id: cat.id,
            nombre: cat.categoria,
            subcategorias: cat.subcategorias.map(sub => ({
              id: sub.id,
              nombre: sub.nombre,
              elementos: (sub.elementos || []).map(el => ({
                ...el,
                tareas: Array.isArray(el.tareas) 
                  ? el.tareas.map((t: any) => typeof t === 'string' ? t : t.task_id || t.nombre || '')
                  : []
              }))
            })),
            elementosCargados: elementosPorSubcategoria[cat.categoria] || {}
          }))}
          plantaId={plantaSeleccionada}
          tareasObra={tareasObra}
          obraId={obraId}
          elementosCargadosSet={elementosCargadosSet}
        />
      )}
    </div>
  );
}


