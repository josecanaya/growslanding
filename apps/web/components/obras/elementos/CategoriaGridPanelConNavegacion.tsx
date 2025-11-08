import { useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import SubcategoriaAccordion, { type ElementoCatalogo as SubcategoriaElemento } from './SubcategoriaAccordion';

interface ElementoCatalogoData {
  id: string;
  nombre: string;
  descripcion?: string | null;
  codigo?: string | null;
  unidad?: string;
  opciones?: Record<string, string[] | undefined>;
  tareas?: string[];
}

interface SubcategoriaCatalogo {
  id: string;
  nombre: string;
  elementos: ElementoCatalogoData[];
}

interface CategoriaCatalogo {
  id: string;
  nombre: string;
  subcategorias: SubcategoriaCatalogo[];
  elementosCargados: Record<string, any[]>;
}

interface TareaObra {
  id: string;
  nombre: string;
  codigo: string;
}

interface CategoriaGridPanelConNavegacionProps {
  categorias: CategoriaCatalogo[];
  plantaId?: string;
  tareasObra: TareaObra[];
  obraId: string;
  elementosCargadosSet: Set<string>;
}

export default function CategoriaGridPanelConNavegacion({
  categorias,
  plantaId,
  tareasObra,
  obraId,
  elementosCargadosSet: _elementosCargadosSet,
}: CategoriaGridPanelConNavegacionProps) {
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(
    categorias[0]?.id ?? null
  );

  const categoriaSeleccionada = useMemo(() => {
    if (!categoriaActiva) return null;
    return categorias.find((categoria) => categoria.id === categoriaActiva) ?? null;
  }, [categoriaActiva, categorias]);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Layers className="h-4 w-4 text-[#0052CC]" /> Categorías constructivas
          </div>
          <div className="space-y-2">
            {categorias.map((categoria) => {
              const activa = categoria.id === categoriaActiva;
              const total = categoria.subcategorias.reduce(
                (acc, sub) => acc + (sub.elementos?.length ?? 0),
                0,
              );
              const cargados = Object.values(categoria.elementosCargados || {}).reduce(
                (acc, elementos) => acc + (elementos?.length ?? 0),
                0,
              );

              return (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => setCategoriaActiva(categoria.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                    activa
                      ? 'border-[#0052CC] bg-[#0052CC]/10 text-[#0052CC] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-[#0052CC]/40 hover:bg-[#0052CC]/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{categoria.nombre}</span>
                    <span className="text-xs text-slate-500">{total}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {cargados} cargados • {total} disponibles
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {categoriaSeleccionada ? (
          <div className="space-y-4 p-6">
            {categoriaSeleccionada.subcategorias.length > 0 ? (
              categoriaSeleccionada.subcategorias.map((subcategoria) => {
                const elementosNormalizados: SubcategoriaElemento[] = subcategoria.elementos.map(
                  (elemento) => {
                    const opcionesNormalizadas = elemento.opciones
                      ? Object.fromEntries(
                          Object.entries(elemento.opciones).map(([clave, valor]) => [
                            clave,
                            valor ?? [],
                          ]),
                        )
                      : undefined;

                    return {
                      id: elemento.id,
                      nombre: elemento.nombre,
                      unidad: elemento.unidad ?? 'unidad',
                      opciones: opcionesNormalizadas,
                      tareas: elemento.tareas,
                    };
                  },
                );

                return (
                  <SubcategoriaAccordion
                    key={subcategoria.id}
                    subcategoriaId={subcategoria.id}
                    subcategoriaNombre={subcategoria.nombre}
                    elementos={elementosNormalizados}
                    categoriaNombre={categoriaSeleccionada.nombre}
                    plantaId={plantaId}
                    tareasObra={tareasObra}
                    obraId={obraId}
                    elementosCargados={new Set(
                      (categoriaSeleccionada.elementosCargados?.[subcategoria.nombre] ?? []).map(
                        (elem: { nombre: string }) => elem.nombre,
                      ),
                    )}
                  />
                );
              })
            ) : (
              <div className="py-16 text-center text-sm text-slate-500">
                Todavía no hay elementos definidos para esta categoría.
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-12 text-sm text-slate-500">
            Seleccioná una categoría para ver sus configuraciones.
          </div>
        )}
      </section>
    </div>
  );
}
