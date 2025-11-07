"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Plus,
  Sparkles,
  Layers,
  Pencil,
  Trash2,
} from "lucide-react";
import { catalogoCompletoJson } from "@/lib/catalogos/elementos";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import ModalNuevoElemento from "@/components/cliente/modals/ModalNuevoElemento";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Planta = {
  id: string;
  nombre: string;
};

type ElementoCatalogo = {
  id: string;
  nombre: string;
  unidad?: string;
  opciones?: Record<string, string[]>;
  tareas?: string[];
};

type SubcategoriaCatalogo = {
  id: string;
  nombre: string;
  elementos: ElementoCatalogo[];
};

type CategoriaCatalogo = {
  id: string;
  categoria: string;
  subcategorias: SubcategoriaCatalogo[];
};

type ElementoSupabase = {
  id: string;
  nombre: string;
  categoria: string | null;
  subcategoria: string | null;
  cantidad: number | null;
  unidad: string | null;
  descripcion: string | null;
  created_at: string;
};

type CargaElementosPanelProps = {
  obraId: string;
  plantas?: Planta[];
};

type ConfiguracionKey = string;

const mapearTareasAFases = (tareas: string[] = []) => {
  const fases: Record<string, string[]> = {
    estructura: [],
    "obra gris": [],
    terminaciones: [],
  };

  tareas.forEach((tarea) => {
    const lower = tarea.toLowerCase();
    if (
      lower.includes("replanteo") ||
      lower.includes("excav") ||
      lower.includes("encofrado") ||
      lower.includes("armado") ||
      lower.includes("estructura") ||
      lower.includes("hormig")
    ) {
      fases.estructura.push(tarea);
    } else if (
      lower.includes("revoque") ||
      lower.includes("instal") ||
      lower.includes("mamposter") ||
      lower.includes("contrapiso") ||
      lower.includes("carp")
    ) {
      fases["obra gris"].push(tarea);
    } else {
      fases.terminaciones.push(tarea);
    }
  });

  return fases;
};

const buildDescripcion = (config: Record<string, string>, observaciones: string) => {
  const partes: string[] = [];
  Object.entries(config).forEach(([clave, valor]) => {
    if (!valor) return;
    const label = clave
      .split("_")
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ");
    partes.push(`${label}: ${valor}`);
  });

  if (observaciones.trim().length > 0) {
    partes.push(`Observaciones: ${observaciones.trim()}`);
  }

  return partes.join(" | ");
};

export default function CargaElementosPanel({
  obraId,
  plantas = [],
}: CargaElementosPanelProps) {
  const { toast } = useToast();

  const categorias: CategoriaCatalogo[] = useMemo(
    () => catalogoCompletoJson.categorias,
    []
  );

  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(
    categorias[0]?.id ?? ""
  );
  const [selectedElemento, setSelectedElemento] = useState<{
    categoriaId: string;
    categoriaNombre: string;
    subcategoriaId: string;
    subcategoriaNombre: string;
    elemento: ElementoCatalogo;
  } | null>(null);
  const GENERAL_PLANTA_ID = "general";
  const [selectedPlanta, setSelectedPlanta] = useState<string>(GENERAL_PLANTA_ID);
  const [cantidad, setCantidad] = useState<number>(0);
  const [unidad, setUnidad] = useState<string>("unidad");
  const [observaciones, setObservaciones] = useState<string>("");
  const [configValues, setConfigValues] = useState<Record<ConfiguracionKey, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [modalNuevoElementoOpen, setModalNuevoElementoOpen] = useState(false);
  const [elementosObra, setElementosObra] = useState<ElementoSupabase[]>([]);
  const [loadingElementos, setLoadingElementos] = useState(false);
  const [openSubcategorias, setOpenSubcategorias] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"cargar" | "cargados">("cargar");
  const [selectedElementoCargado, setSelectedElementoCargado] = useState<ElementoSupabase | null>(null);

  const categoriaSeleccionada = useMemo(
    () => categorias.find((categoria) => categoria.id === selectedCategoriaId),
    [categorias, selectedCategoriaId]
  );
  useEffect(() => {
    if (!categoriaSeleccionada) return;

    setOpenSubcategorias((prev) => {
      const next = { ...prev };
      categoriaSeleccionada.subcategorias.forEach((sub, index) => {
        if (!(sub.id in next)) {
          next[sub.id] = index === 0;
        }
      });
      return next;
    });
  }, [categoriaSeleccionada]);

  useEffect(() => {
    if (activeTab === "cargados") {
      setSelectedElemento(null);
    } else {
      setSelectedElementoCargado(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedElementoCargado) {
      const stillExists = elementosObra.some((el) => el.id === selectedElementoCargado.id);
      if (!stillExists) {
        setSelectedElementoCargado(null);
      }
    }
  }, [elementosObra, selectedElementoCargado]);

  const toggleSubcategoria = (id: string) => {
    setOpenSubcategorias((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };


  const elementosCargadosPorCategoria = useMemo(() => {
    if (!categoriaSeleccionada) return [] as ElementoSupabase[];
    return elementosObra.filter(
      (el) => el.categoria === categoriaSeleccionada.categoria,
    );
  }, [categoriaSeleccionada, elementosObra]);

  const subcategoriasConConteo = useMemo(() => {
    if (!categoriaSeleccionada) return [] as Array<{
      subcategoria: SubcategoriaCatalogo;
      cargados: number;
    }>;

    return categoriaSeleccionada.subcategorias.map((subcategoria) => {
      const cargados = elementosObra.filter(
        (el) =>
          el.categoria === categoriaSeleccionada.categoria &&
          el.subcategoria === subcategoria.nombre,
      ).length;

      return {
        subcategoria,
        cargados,
      };
    });
  }, [categoriaSeleccionada, elementosObra]);

  const categoriaStats = useMemo(() => {
    return categorias.map((categoria) => {
      const disponibles = categoria.subcategorias.reduce(
        (acc, sub) => acc + (sub.elementos?.length ?? 0),
        0
      );
      const cargados = elementosObra.filter(
        (el) => el.categoria === categoria.categoria
      ).length;

      return {
        id: categoria.id,
        nombre: categoria.categoria,
        disponibles,
        cargados,
      };
    });
  }, [categorias, elementosObra]);

  const tareasPorFase = useMemo(() => {
    if (!selectedElemento) {
      return {
        estructura: [],
        "obra gris": [],
        terminaciones: [],
      } as Record<string, string[]>;
    }

    return mapearTareasAFases(selectedElemento.elemento.tareas ?? []);
  }, [selectedElemento]);

  const fetchElementosObra = useCallback(async () => {
    if (!obraId) return;
    try {
      setLoadingElementos(true);
      const response = await fetch(`/api/obras/${obraId}/elementos`);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los elementos de la obra");
      }
      const json = await response.json();
      setElementosObra(json.data || []);
    } catch (error) {
      console.error("[CargaElementosPanel] Error cargando elementos", error);
      toast({
        title: "Error al cargar elementos",
        description:
          error instanceof Error ? error.message : "Reintentá en unos segundos",
        variant: "destructive",
      });
    } finally {
      setLoadingElementos(false);
    }
  }, [obraId, toast]);

  useEffect(() => {
    fetchElementosObra();
  }, [fetchElementosObra]);

  useEffect(() => {
    const handler = () => fetchElementosObra();
    window.addEventListener("elemento-agregado", handler);
    return () => window.removeEventListener("elemento-agregado", handler);
  }, [fetchElementosObra]);

  useEffect(() => {
    if (!selectedElemento) return;

    const unidadDefault = selectedElemento.elemento.unidad ?? "unidad";
    setUnidad(unidadDefault);
    setCantidad(0);
    setObservaciones("");

    const configuraciones = selectedElemento.elemento.opciones ?? {};
    const initialConfig: Record<string, string> = {};
    Object.keys(configuraciones).forEach((key) => {
      initialConfig[key] = "";
    });
    setConfigValues(initialConfig);
  }, [selectedElemento]);

  const handleSelectElemento = (
    subcategoria: SubcategoriaCatalogo,
    elemento: ElementoCatalogo
  ) => {
    if (!categoriaSeleccionada) return;

    setSelectedElemento({
      categoriaId: categoriaSeleccionada.id,
      categoriaNombre: categoriaSeleccionada.categoria,
      subcategoriaId: subcategoria.id,
      subcategoriaNombre: subcategoria.nombre,
      elemento,
    });
    setSelectedPlanta(GENERAL_PLANTA_ID);
  };

  const handleConfirmar = async () => {
    if (!selectedElemento) return;
    setIsSaving(true);

    try {
      const payload = {
        nombre: selectedElemento.elemento.nombre,
        categoria: selectedElemento.categoriaNombre,
        subcategoria: selectedElemento.subcategoriaNombre,
        unidad,
        cantidad,
        descripcion: buildDescripcion(configValues, observaciones),
        planta_id:
          selectedPlanta && selectedPlanta !== GENERAL_PLANTA_ID
            ? selectedPlanta
            : null,
      };

      const response = await fetch(`/api/obras/${obraId}/elementos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo guardar el elemento");
      }

      toast({
        title: "Elemento agregado",
        description: `${selectedElemento.elemento.nombre} se sumó a la obra`,
      });

      setSelectedElemento(null);
      setCantidad(0);
      setObservaciones("");
      fetchElementosObra();
      window.dispatchEvent(new CustomEvent("elemento-agregado"));
      setSelectedElementoCargado(null);
      setActiveTab("cargados");
    } catch (error) {
      console.error("[CargaElementosPanel] Error confirmando elemento", error);
      toast({
        title: "Error al agregar elemento",
        description:
          error instanceof Error ? error.message : "Intentá nuevamente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-5 p-5 bg-[#F9FAFB]">
      {/* Panel izquierdo */}
      <aside className="col-span-12 h-max rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(0,0,0,0.05)] lg:col-span-3">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FolderKanban className="h-4 w-4 text-[#0052CC]" /> Categorías constructivas
        </div>
        <div className="space-y-2">
          {categoriaStats.map((cat) => {
            const isActive = cat.id === selectedCategoriaId;
            return (
              <button
                key={cat.id}
                type="button"
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-all flex items-center justify-between",
                  isActive
                    ? "border-[#0052CC] bg-[#0052CC]/10 text-[#0052CC] shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#0052CC]/40 hover:bg-[#0052CC]/5"
                )}
                onClick={() => {
                  setSelectedCategoriaId(cat.id);
                  setSelectedElemento(null);
                }}
              >
                <span className="text-sm font-medium text-slate-700 line-clamp-2 pr-2">
                  {cat.nombre}
                </span>
                <span className="flex flex-col items-end text-xs text-slate-500">
                  <span>{cat.cargados}/{cat.disponibles}</span>
                  <span className="text-[11px] text-slate-400">cargados</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Panel central */}
      <section className="col-span-12 space-y-4 lg:col-span-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "cargar" | "cargados")} className="w-full">
            <TabsList className="mb-4 flex gap-2 border-b border-slate-200 bg-transparent p-0">
              <TabsTrigger
                value="cargar"
                className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 data-[state=active]:border-[#0052CC] data-[state=active]:text-[#0052CC] data-[state=active]:font-semibold"
              >
                Cargar elementos
              </TabsTrigger>
              <TabsTrigger
                value="cargados"
                className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 data-[state=active]:border-[#0052CC] data-[state=active]:text-[#0052CC] data-[state=active]:font-semibold"
              >
                Elementos cargados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cargar" className="mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {categoriaSeleccionada?.categoria ?? "Seleccioná una categoría"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {loadingElementos
                      ? "Cargando elementos..."
                      : `${subcategoriasConConteo.length} subcategoría${subcategoriasConConteo.length === 1 ? "" : "s"}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 rounded-xl border border-[#0052CC]/30 bg-[#0052CC]/10 px-4 py-2 text-sm font-medium text-[#0052CC] hover:bg-[#0052CC]/15"
                  onClick={() => setModalNuevoElementoOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Agregar elemento
                </Button>
              </div>

              <div className="mt-5 space-y-5">
                {subcategoriasConConteo.map(({ subcategoria, cargados }) => {
                  const isOpen = openSubcategorias[subcategoria.id];
                  const total = subcategoria.elementos.length;
                  return (
                    <div
                      key={subcategoria.id}
                      className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        onClick={() => toggleSubcategoria(subcategoria.id)}
                      >
                        <div className="flex flex-col">
                          <span className="text-slate-800 text-base font-semibold">
                            {subcategoria.nombre}
                          </span>
                          <span className="text-xs text-slate-500 font-normal">
                            {total} elemento{total === 1 ? "" : "s"} disponibles
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {cargados}/{total} cargados
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5">
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {subcategoria.elementos.map((elemento) => {
                              const isActive =
                                selectedElemento?.elemento.id === elemento.id &&
                                selectedElemento?.subcategoriaId === subcategoria.id;

                              const yaCargado = elementosObra.some(
                                (el) =>
                                  el.nombre === elemento.nombre &&
                                  el.categoria === categoriaSeleccionada?.categoria
                              );

                              return (
                                <button
                                  key={elemento.id}
                                  type="button"
                                  className={cn(
                                    "rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:shadow-md",
                                    isActive && "border-[#0052CC] bg-[#0052CC]/10 text-[#0052CC] shadow-md"
                                  )}
                                  onClick={() => handleSelectElemento(subcategoria, elemento)}
                                >
                                  <div
                                    className="text-sm font-medium text-slate-800"
                                    title={elemento.nombre}
                                  >
                                    {elemento.nombre}
                                  </div>
                                  {elemento.opciones ? (
                                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                                      {Object.keys(elemento.opciones)
                                        .map((key) => key.replace(/_/g, " "))
                                        .slice(0, 2)
                                        .join(" · ")}
                                    </p>
                                  ) : null}
                                  {yaCargado ? (
                                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[#0052CC]">
                                      <Sparkles className="h-3 w-3" /> Cargado
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="cargados" className="mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Elementos cargados</h3>
                  <p className="text-sm text-slate-500">
                    {elementosObra.length} elemento{elementosObra.length === 1 ? "" : "s"} en esta obra
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {elementosCargadosPorCategoria.length === 0 ? (
                  <p className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Todavía no hay elementos cargados. Sumá algunos desde la pestaña &quot;Cargar elementos&quot;.
                  </p>
                ) : (
                  elementosCargadosPorCategoria.map((elemento) => {
                    const isActive = selectedElementoCargado?.id === elemento.id;
                    return (
                      <button
                        key={elemento.id}
                        type="button"
                        className={cn(
                          "rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:shadow-md",
                          isActive && "border-[#0052CC]"
                        )}
                        onClick={() => setSelectedElementoCargado(elemento)}
                      >
                        <div className="space-y-2 p-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800 line-clamp-2">
                              {elemento.nombre}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {(elemento.subcategoria || "Sin subcategoría").concat(
                                elemento.categoria ? ` · ${elemento.categoria}` : ""
                              )}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {elemento.cantidad ?? 0} {elemento.unidad ?? "unidad"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
                              ✅ Cargado
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Panel derecho */}
      <aside className="col-span-12 h-max rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(0,0,0,0.05)] lg:col-span-3">
        {activeTab === "cargar" ? (
          <>
            <header className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Configuración</h3>
              <p className="text-sm text-slate-500">
                {selectedElemento
                  ? `Elemento seleccionado: ${selectedElemento.elemento.nombre}`
                  : "Seleccioná un elemento del listado"}
              </p>
            </header>

            {selectedElemento ? (
              <div className="space-y-4">
                {Object.entries(selectedElemento.elemento.opciones ?? {}).map(
                  ([key, opciones]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">
                        {key.split("_").map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1)).join(" ")}
                      </label>
                      <Select
                        value={configValues[key] ?? ""}
                        onValueChange={(value) =>
                          setConfigValues((prev) => ({ ...prev, [key]: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {opciones.map((opcion) => (
                            <SelectItem key={opcion} value={opcion}>
                              {opcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Unidad</label>
                    <Select value={unidad} onValueChange={setUnidad}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "m²",
                          "m³",
                          "unidad",
                          "ml",
                          "kg",
                        ].map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Cantidad</label>
                    <Input
                      type="number"
                      value={Number.isNaN(cantidad) ? "" : cantidad}
                      onChange={(event) => setCantidad(Number(event.target.value))}
                      min={0}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Planta</label>
                  <Select
                    value={selectedPlanta}
                    onValueChange={(value) => setSelectedPlanta(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GENERAL_PLANTA_ID}>General / Sin asignar</SelectItem>
                      {plantas.map((planta) => (
                        <SelectItem key={planta.id} value={planta.id}>
                          {planta.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Observaciones</label>
                  <textarea
                    className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25"
                    placeholder="Notas adicionales, especificaciones, etc."
                    value={observaciones}
                    onChange={(event) => setObservaciones(event.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full rounded-xl bg-[#22C55E] py-2 text-white hover:bg-[#16A34A]"
                  onClick={handleConfirmar}
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando..." : "Confirmar selección"}
                </Button>

                <section className="mt-5 border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-semibold text-slate-700">
                    Tareas asociadas
                  </h4>
                  <div className="mt-2 space-y-3 text-xs text-slate-600">
                    {Object.entries(tareasPorFase).map(([fase, tareas]) => (
                      <div key={fase}>
                        <h5 className="mb-1 font-semibold text-slate-700">
                          {fase.charAt(0).toUpperCase() + fase.slice(1)}
                        </h5>
                        {tareas.length === 0 ? (
                          <p className="text-[11px] text-slate-400">
                            Sin tareas asociadas
                          </p>
                        ) : (
                          <ul className="list-outside list-disc pl-4">
                            {tareas.map((tarea) => (
                              <li key={tarea}>{tarea}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex h-[480px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-500">
                <Layers className="h-8 w-8 text-slate-300" />
                <p>Seleccioná un elemento del listado central para configurarlo.</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <header className="mb-2">
              <h3 className="text-lg font-semibold text-slate-900">Detalle</h3>
              <p className="text-sm text-slate-500">
                {selectedElementoCargado
                  ? selectedElementoCargado.nombre
                  : "Seleccioná un elemento cargado para ver detalles"}
              </p>
            </header>

            {selectedElementoCargado ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold text-slate-800">Información general</h4>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    <li>Categoría: {selectedElementoCargado.categoria ?? "Sin categoría"}</li>
                    <li>Subcategoría: {selectedElementoCargado.subcategoria ?? "Sin subcategoría"}</li>
                    <li>
                      Cantidad: {selectedElementoCargado.cantidad ?? 0} {selectedElementoCargado.unidad ?? "unidad"}
                    </li>
                    <li>Descripción: {selectedElementoCargado.descripcion ?? "Sin notas"}</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl border border-slate-300"
                    onClick={() => console.log("Editar elemento", selectedElementoCargado.id)}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar elemento
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => console.log("Eliminar elemento", selectedElementoCargado.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-500">
                <Layers className="h-8 w-8 text-slate-300" />
                <p>Seleccioná un elemento cargado desde la lista para ver sus detalles.</p>
              </div>
            )}
          </div>
        )}
      </aside>

      <ModalNuevoElemento
        open={modalNuevoElementoOpen}
        onClose={() => setModalNuevoElementoOpen(false)}
        categorias={categorias}
        obraId={obraId}
        onSuccess={() => {
          fetchElementosObra();
          toast({
            title: "Elemento añadido",
            description: "El nuevo elemento quedó disponible en tu catálogo",
          });
        }}
      />
    </div>
  );
}


