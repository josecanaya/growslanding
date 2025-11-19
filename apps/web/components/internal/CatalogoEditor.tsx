"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertCircle,
  X,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tareasConstructivas, TareaConstructiva } from "@/lib/tareas-construccion";

// Tipos basados en la estructura del JSON
type TareaCatalogo = {
  task_id?: string;
  id?: string;
  nombre: string;
  fase: string;
  condicion?: string;
};

type Elemento = {
  id: string;
  nombre: string;
  unidad: string;
  opciones?: Record<string, string[]>;
  tareas?: string[] | TareaCatalogo[]; // Soporta ambos formatos (legacy y nuevo)
};

// Tipos para fases
type Fases = {
  estructura: string[];
  obra_gris: string[];
  terminaciones: string[];
};

type Subcategoria = {
  id: string;
  nombre: string;
  elementos: Elemento[];
};

type Categoria = {
  id: string;
  categoria: string;
  subcategorias: Subcategoria[];
};

type Catalogo = {
  catalogo: string;
  version: string;
  categorias: Categoria[];
};

type CatalogoEditorProps = {
  onSave?: () => void;
};

export default function CatalogoEditor({ onSave }: CatalogoEditorProps) {
  const { toast } = useToast();
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(null);
  const [selectedSubcategoriaId, setSelectedSubcategoriaId] = useState<string | null>(null);
  const [selectedElemento, setSelectedElemento] = useState<{
    categoriaId: string;
    subcategoriaId: string;
    elementoIndex: number;
  } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Función para obtener información completa de una tarea desde tareas-construccion.ts
  const obtenerTareaCompleta = useCallback((taskId: string): TareaConstructiva | null => {
    return tareasConstructivas.find(t => t.id === taskId) || null;
  }, []);

  // Función para normalizar tareas (soporta string[] y TareaCatalogo[])
  const normalizarTareas = useCallback((tareas: string[] | TareaCatalogo[] | undefined): TareaCatalogo[] => {
    if (!tareas) return [];
    if (tareas.length === 0) return [];
    
    // Si es array de strings (legacy)
    if (typeof tareas[0] === 'string') {
      return (tareas as string[]).map(t => ({
        nombre: t,
        fase: 'obra_gris' // Default
      }));
    }
    
    // Si ya es array de objetos
    return tareas as TareaCatalogo[];
  }, []);

  // Función para mapear tareas a fases (actualizada para usar objetos)
  const mapearTareasAFases = useCallback((tareas: string[] | TareaCatalogo[] | undefined): {
    estructura: TareaCatalogo[];
    obra_gris: TareaCatalogo[];
    terminaciones: TareaCatalogo[];
  } => {
    const fases = {
      estructura: [] as TareaCatalogo[],
      obra_gris: [] as TareaCatalogo[],
      terminaciones: [] as TareaCatalogo[]
    };

    const tareasNormalizadas = normalizarTareas(tareas);

    tareasNormalizadas.forEach(tarea => {
      const fase = tarea.fase?.toLowerCase() || '';
      
      if (fase === 'estructura') {
        fases.estructura.push(tarea);
      } else if (fase === 'obra_gris' || fase === 'obra gris') {
        fases.obra_gris.push(tarea);
      } else if (fase === 'terminaciones') {
        fases.terminaciones.push(tarea);
      } else {
        // Fallback: mapeo por nombre (legacy)
        const tareaLower = tarea.nombre?.toLowerCase() || '';
        
        // Mapeo de tareas a fases por nombre
        if (
        tareaLower.includes('grifería') ||
        tareaLower.includes('griferia') ||
        tareaLower.includes('colocación artefactos') ||
        tareaLower.includes('colocacion artefactos') ||
        tareaLower.includes('colocar artefactos') ||
        tareaLower.includes('montaje unidad interior') ||
        tareaLower.includes('montaje unidad exterior') ||
        tareaLower.includes('pintura') ||
        tareaLower.includes('terminación') ||
        tareaLower.includes('terminacion') ||
        tareaLower.includes('cerámica') ||
        tareaLower.includes('ceramica') ||
        tareaLower.includes('cerámicos') ||
        tareaLower.includes('ceramicos') ||
        tareaLower.includes('pegado cerámicos') ||
        tareaLower.includes('pegado ceramicos') ||
        tareaLower.includes('pegado adhesivo especial') ||
        tareaLower.includes('pegado adhesivo') ||
        tareaLower.includes('pulido') ||
        tareaLower.includes('pulido final') ||
        tareaLower.includes('colocación madera') ||
        tareaLower.includes('colocacion madera') ||
        tareaLower.includes('colocar madera') ||
        tareaLower.includes('rastreles') ||
        tareaLower.includes('rastrel') ||
        tareaLower.includes('lijado') ||
        tareaLower.includes('2da lijada') ||
        tareaLower.includes('segunda lijada') ||
        tareaLower.includes('barniz') ||
        tareaLower.includes('laca') ||
        tareaLower.includes('preparación superficie') ||
        tareaLower.includes('preparacion superficie') ||
        tareaLower.includes('pastinado') ||
        tareaLower.includes('limpieza') ||
        tareaLower.includes('nivelación cerámicos') ||
        tareaLower.includes('nivelacion ceramicos') ||
        tareaLower.includes('nivelación perfecta') ||
        tareaLower.includes('nivelacion perfecta') ||
        tareaLower.includes('nivelación superficie') ||
        tareaLower.includes('nivelacion superficie') ||
        tareaLower.includes('aislación acústica') ||
        tareaLower.includes('aislacion acustica') ||
        tareaLower.includes('colocación flotante') ||
        tareaLower.includes('colocacion flotante') ||
        tareaLower.includes('barrera humedad') ||
        tareaLower.includes('zócalos') ||
        tareaLower.includes('zocalos') ||
        tareaLower.includes('1ra capa base') ||
        tareaLower.includes('primera capa base') ||
        tareaLower.includes('2da capa base') ||
        tareaLower.includes('segunda capa base') ||
        tareaLower.includes('capa base') ||
        tareaLower.includes('preparación soporte') ||
        tareaLower.includes('preparacion soporte') ||
        tareaLower.includes('imprimación') ||
        tareaLower.includes('imprimacion') ||
        tareaLower.includes('capa micro') ||
        tareaLower.includes('sellador') ||
        tareaLower.includes('protección') ||
        tareaLower.includes('proteccion') ||
        tareaLower.includes('porcelanato') ||
        tareaLower.includes('revestimiento') ||
        tareaLower.includes('yeso') ||
        tareaLower.includes('masillado') ||
        tareaLower.includes('impermeabilización') ||
        tareaLower.includes('impermeabilizacion') ||
        tareaLower.includes('siding') ||
        tareaLower.includes('ladrillo visto') ||
        tareaLower.includes('canaletas') ||
        tareaLower.includes('canaleta') ||
        tareaLower.includes('babetas') ||
        tareaLower.includes('babeta')
      ) {
        fases.terminaciones.push(tarea);
      } else if (
        tareaLower.includes('replanteo') ||
        tareaLower.includes('excavación') ||
        tareaLower.includes('excavacion') ||
        tareaLower.includes('encofrado') ||
        tareaLower.includes('desencofrado') ||
        tareaLower.includes('armado') ||
        tareaLower.includes('armadura') ||
        tareaLower.includes('hormigonado') ||
        tareaLower.includes('hormigon') ||
        tareaLower.includes('columna') ||
        tareaLower.includes('viga') ||
        tareaLower.includes('vigueta') ||
        tareaLower.includes('losa') ||
        tareaLower.includes('bovedilla') ||
        tareaLower.includes('bóvedilla') ||
        tareaLower.includes('malla') ||
        tareaLower.includes('compresión') ||
        tareaLower.includes('compresion') ||
        tareaLower.includes('curado') ||
        tareaLower.includes('montaje') ||
        tareaLower.includes('colocación') ||
        tareaLower.includes('colocacion') ||
        tareaLower.includes('colocar') ||
        tareaLower.includes('colocación chapas') ||
        tareaLower.includes('colocacion chapas') ||
        tareaLower.includes('colocar chapas') ||
        tareaLower.includes('colocación tejas') ||
        tareaLower.includes('colocacion tejas') ||
        tareaLower.includes('colocar tejas') ||
        tareaLower.includes('estructura soporte') ||
        tareaLower.includes('correas') ||
        tareaLower.includes('caballete') ||
        tareaLower.includes('limahoyas') ||
        tareaLower.includes('limatesas') ||
        tareaLower.includes('listones') ||
        tareaLower.includes('aislación') ||
        tareaLower.includes('aislacion') ||
        tareaLower.includes('estructura metálica') ||
        tareaLower.includes('estructura metalica') ||
        tareaLower.includes('cerramiento') ||
        tareaLower.includes('iluminación cenital') ||
        tareaLower.includes('iluminacion cenital') ||
        tareaLower.includes('desagües') ||
        tareaLower.includes('desagues') ||
        tareaLower.includes('levantar muro') ||
        tareaLower.includes('base') ||
        tareaLower.includes('fundación') ||
        tareaLower.includes('fundacion') ||
        tareaLower.includes('montaje estructura') ||
        tareaLower.includes('demolición') ||
        tareaLower.includes('demolicion') ||
        tareaLower.includes('compactación') ||
        tareaLower.includes('compactacion') ||
        tareaLower.includes('retiro de basura') ||
        tareaLower.includes('retiro basura') ||
        tareaLower.includes('desmalezado') ||
        tareaLower.includes('carga en bolsines') ||
        tareaLower.includes('carga bolsines') ||
        tareaLower.includes('carga en volquete') ||
        tareaLower.includes('carga volquete') ||
        tareaLower.includes('colocación tablero') ||
        tareaLower.includes('colocacion tablero') ||
        tareaLower.includes('conexión pilar') ||
        tareaLower.includes('conexion pilar') ||
        tareaLower.includes('tablero provisorio') ||
        tareaLower.includes('pilar de obra') ||
        tareaLower.includes('electricidad provisoria') ||
        tareaLower.includes('luz inicial') ||
        tareaLower.includes('instalación provisoria') ||
        tareaLower.includes('instalacion provisoria') ||
        tareaLower.includes('colocación postes') ||
        tareaLower.includes('colocacion postes') ||
        tareaLower.includes('atado o fijación') ||
        tareaLower.includes('atado') ||
        tareaLower.includes('fijación') ||
        tareaLower.includes('fijacion') ||
        tareaLower.includes('tensado') ||
        tareaLower.includes('impresión cartel') ||
        tareaLower.includes('impresion cartel') ||
        tareaLower.includes('verificación') ||
        tareaLower.includes('verificacion') ||
        tareaLower.includes('mantenimiento') ||
        tareaLower.includes('retiro final') ||
        tareaLower.includes('colocación casilla') ||
        tareaLower.includes('colocacion casilla') ||
        tareaLower.includes('conexiones mínimas') ||
        tareaLower.includes('conexiones minimas') ||
        tareaLower.includes('retiro') ||
        tareaLower.includes('cercado') ||
        tareaLower.includes('cartel') ||
        tareaLower.includes('señalización') ||
        tareaLower.includes('senalizacion')
      ) {
        fases.estructura.push(tarea);
      } else if (
        tareaLower.includes('mampostería') ||
        tareaLower.includes('mamposteria') ||
        tareaLower.includes('tabique') ||
        tareaLower.includes('revoque grueso') ||
        tareaLower.includes('revoque fino') ||
        tareaLower.includes('instalación') ||
        tareaLower.includes('instalacion') ||
        tareaLower.includes('cañería') ||
        tareaLower.includes('caneria') ||
        tareaLower.includes('tablero') ||
        tareaLower.includes('circuito') ||
        tareaLower.includes('contrapiso') ||
        tareaLower.includes('carpeta') ||
        tareaLower.includes('nivelación') ||
        tareaLower.includes('nivelacion') ||
        tareaLower.includes('nivelación suelo') ||
        tareaLower.includes('nivelacion suelo') ||
        tareaLower.includes('nivelación contrapiso') ||
        tareaLower.includes('nivelacion contrapiso') ||
        tareaLower.includes('nivelación carpeta') ||
        tareaLower.includes('nivelacion carpeta')
      ) {
        fases.obra_gris.push(tarea);
      } else {
        // Por defecto, agregar a obra_gris si no se puede clasificar
        fases.obra_gris.push(tarea);
      }
      } // Cierre del else externo (fallback)
    });

    return fases;
  }, [normalizarTareas]);

  // Cargar catálogo
  const loadCatalogo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/catalogo");
      const result = await response.json();
      
      if (result.success) {
        // Limpiar campos "fase" al cargar (los elementos no tienen fases)
        const catalogoLimpio = limpiarFasesDeElementos(result.data);
        setCatalogo(catalogoLimpio);
        if (catalogoLimpio.categorias.length > 0) {
          setSelectedCategoriaId(catalogoLimpio.categorias[0].id);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar el catálogo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar el catálogo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    // TODO: integrar con elementos-vivienda.ts para sincronización bidireccional
    // TODO: sincronizar con Supabase cuando se implemente la tabla de catálogo
  }, [toast]);

  useEffect(() => {
    loadCatalogo();
  }, [loadCatalogo]);

  // Validar catálogo
  const validarCatalogo = (cat: Catalogo): string[] => {
    const errores: string[] = [];
    const idsCategorias = new Set<string>();
    const idsElementos = new Set<string>();

    cat.categorias.forEach((categoria, catIndex) => {
      // Validar categoría
      if (!categoria.id || !categoria.categoria) {
        errores.push(`Categoría ${catIndex + 1}: falta id o nombre`);
      }
      if (idsCategorias.has(categoria.id)) {
        errores.push(`Categoría duplicada: ${categoria.id}`);
      }
      idsCategorias.add(categoria.id);

      const idsSubcategorias = new Set<string>();
      categoria.subcategorias.forEach((subcat, subIndex) => {
        // Validar subcategoría
        if (!subcat.id || !subcat.nombre) {
          errores.push(`${categoria.categoria} > Subcategoría ${subIndex + 1}: falta id o nombre`);
        }
        if (idsSubcategorias.has(subcat.id)) {
          errores.push(`${categoria.categoria} > Subcategoría duplicada: ${subcat.id}`);
        }
        idsSubcategorias.add(subcat.id);

        // Validar elementos
        subcat.elementos.forEach((elemento, elemIndex) => {
          if (!elemento.id || !elemento.nombre || !elemento.unidad) {
            errores.push(
              `${categoria.categoria} > ${subcat.nombre} > Elemento ${elemIndex + 1}: falta id, nombre o unidad`
            );
          }
          if (idsElementos.has(elemento.id)) {
            errores.push(
              `${categoria.categoria} > ${subcat.nombre} > Elemento duplicado: ${elemento.id}`
            );
          }
          idsElementos.add(elemento.id);
        });
      });
    });

    return errores;
  };

  // Limpiar campo "fase" de todos los elementos antes de guardar
  const limpiarFasesDeElementos = (cat: Catalogo): Catalogo => {
    const catalogoLimpio = JSON.parse(JSON.stringify(cat)) as Catalogo; // Deep clone
    catalogoLimpio.categorias.forEach((categoria: Categoria) => {
      categoria.subcategorias.forEach((subcategoria: Subcategoria) => {
        subcategoria.elementos.forEach((elemento: any) => {
          // Eliminar campo "fase" si existe (los elementos no tienen fases, las tareas sí)
          if ('fase' in elemento) {
            delete elemento.fase;
          }
        });
      });
    });
    return catalogoLimpio;
  };

  // Guardar catálogo
  const handleGuardar = async () => {
    if (!catalogo) return;

    setSaving(true);
    setErrors([]);

    // Limpiar campos "fase" de los elementos antes de validar y guardar
    const catalogoLimpio = limpiarFasesDeElementos(catalogo);
    const errores = validarCatalogo(catalogoLimpio);
    if (errores.length > 0) {
      setErrors(errores);
      toast({
        title: "Errores de validación",
        description: `Se encontraron ${errores.length} errores. Revisa el panel de errores.`,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/catalogo", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ catalogo: catalogoLimpio }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Catálogo guardado correctamente. Recargá la página para ver los cambios en los componentes que importan el catálogo.",
        });
        setErrors([]);
        
        // TODO: En el futuro, invalidar caché de Next.js o recargar módulos que importan el catálogo
        // Archivos que importan el catálogo:
        // - apps/web/lib/catalogos/elementos.ts
        // - apps/web/components/cliente/CargaElementosPanel.tsx
        // - apps/web/components/obras/elementos/ElementosContainer.tsx
        // - apps/web/components/wizard/TecnicoElementosWizard.tsx
        // - apps/web/components/cliente/PasoElementosConstructivos.tsx
        // - apps/web/components/wizard/ElementosWizard.tsx
        
        if (onSave) onSave();
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al guardar el catálogo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar el catálogo",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // CRUD Categorías
  const handleCrearCategoria = () => {
    if (!catalogo) return;
    const nuevoId = `categoria_${Date.now()}`;
    const nuevaCategoria: Categoria = {
      id: nuevoId,
      categoria: "Nueva Categoría",
      subcategorias: [],
    };
    setCatalogo({
      ...catalogo,
      categorias: [...catalogo.categorias, nuevaCategoria],
    });
    setSelectedCategoriaId(nuevoId);
  };

  const handleEditarCategoria = (categoriaId: string, campo: "id" | "categoria", valor: string) => {
    if (!catalogo) return;
    setCatalogo({
      ...catalogo,
      categorias: catalogo.categorias.map((cat) =>
        cat.id === categoriaId ? { ...cat, [campo]: valor } : cat
      ),
    });
  };

  const handleEliminarCategoria = (categoriaId: string) => {
    if (!catalogo) return;
    if (!confirm("¿Estás seguro? Esto eliminará todas las subcategorías y elementos.")) return;
    setCatalogo({
      ...catalogo,
      categorias: catalogo.categorias.filter((cat) => cat.id !== categoriaId),
    });
    if (selectedCategoriaId === categoriaId) {
      setSelectedCategoriaId(null);
      setSelectedSubcategoriaId(null);
    }
  };

  // CRUD Subcategorías
  const categoriaSeleccionada = catalogo?.categorias.find((c) => c.id === selectedCategoriaId);

  const handleCrearSubcategoria = () => {
    if (!catalogo || !selectedCategoriaId) return;
    const nuevoId = `subcategoria_${Date.now()}`;
    const nuevaSubcategoria: Subcategoria = {
      id: nuevoId,
      nombre: "Nueva Subcategoría",
      elementos: [],
    };
    setCatalogo({
      ...catalogo,
      categorias: catalogo.categorias.map((cat) =>
        cat.id === selectedCategoriaId
          ? { ...cat, subcategorias: [...cat.subcategorias, nuevaSubcategoria] }
          : cat
      ),
    });
    setSelectedSubcategoriaId(nuevoId);
  };

  const handleEditarSubcategoria = (
    subcategoriaId: string,
    campo: "id" | "nombre",
    valor: string
  ) => {
    if (!catalogo || !selectedCategoriaId) return;
    setCatalogo({
      ...catalogo,
      categorias: catalogo.categorias.map((cat) =>
        cat.id === selectedCategoriaId
          ? {
              ...cat,
              subcategorias: cat.subcategorias.map((sub) =>
                sub.id === subcategoriaId ? { ...sub, [campo]: valor } : sub
              ),
            }
          : cat
      ),
    });
  };

  const handleEliminarSubcategoria = (subcategoriaId: string) => {
    if (!catalogo || !selectedCategoriaId) return;
    if (!confirm("¿Estás seguro? Esto eliminará todos los elementos de esta subcategoría."))
      return;
    setCatalogo({
      ...catalogo,
      categorias: catalogo.categorias.map((cat) =>
        cat.id === selectedCategoriaId
          ? {
              ...cat,
              subcategorias: cat.subcategorias.filter((sub) => sub.id !== subcategoriaId),
            }
          : cat
      ),
    });
    if (selectedSubcategoriaId === subcategoriaId) {
      setSelectedSubcategoriaId(null);
    }
  };

  // CRUD Elementos
  const subcategoriaSeleccionada = categoriaSeleccionada?.subcategorias.find(
    (s) => s.id === selectedSubcategoriaId
  );

  const handleCrearElemento = () => {
    if (!catalogo || !selectedCategoriaId || !selectedSubcategoriaId) return;
    const nuevoId = `elemento_${Date.now()}`;
    const nuevoElemento: Elemento = {
      id: nuevoId,
      nombre: "Nuevo Elemento",
      unidad: "m²",
      opciones: {},
      tareas: [],
    };
    setCatalogo({
      ...catalogo,
      categorias: catalogo.categorias.map((cat) =>
        cat.id === selectedCategoriaId
          ? {
              ...cat,
              subcategorias: cat.subcategorias.map((sub) =>
                sub.id === selectedSubcategoriaId
                  ? { ...sub, elementos: [...sub.elementos, nuevoElemento] }
                  : sub
              ),
            }
          : cat
      ),
    });
    const elementoIndex = subcategoriaSeleccionada?.elementos.length || 0;
    setSelectedElemento({
      categoriaId: selectedCategoriaId,
      subcategoriaId: selectedSubcategoriaId,
      elementoIndex,
    });
  };

  const handleEditarElemento = (
    elementoIndex: number,
    campo: keyof Elemento,
    valor: any
  ) => {
    if (!catalogo || !selectedCategoriaId || !selectedSubcategoriaId) return;
    setCatalogo({
      ...catalogo,
      categorias: catalogo.categorias.map((cat) =>
        cat.id === selectedCategoriaId
          ? {
              ...cat,
              subcategorias: cat.subcategorias.map((sub) =>
                sub.id === selectedSubcategoriaId
                  ? {
                      ...sub,
                      elementos: sub.elementos.map((elem, idx) =>
                        idx === elementoIndex ? { ...elem, [campo]: valor } : elem
                      ),
                    }
                  : sub
              ),
            }
          : cat
      ),
    });
  };

  const handleEliminarElemento = (elementoIndex: number) => {
    if (!catalogo || !selectedCategoriaId || !selectedSubcategoriaId) return;
    if (!confirm("¿Estás seguro de eliminar este elemento?")) return;
    setCatalogo({
      ...catalogo,
      categorias: catalogo.categorias.map((cat) =>
        cat.id === selectedCategoriaId
          ? {
              ...cat,
              subcategorias: cat.subcategorias.map((sub) =>
                sub.id === selectedSubcategoriaId
                  ? {
                      ...sub,
                      elementos: sub.elementos.filter((_, idx) => idx !== elementoIndex),
                    }
                  : sub
              ),
            }
          : cat
      ),
    });
    setSelectedElemento(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (!catalogo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">No se pudo cargar el catálogo</p>
          <Button onClick={loadCatalogo} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const elementoEditando = selectedElemento
    ? categoriaSeleccionada?.subcategorias
        .find((s) => s.id === selectedElemento.subcategoriaId)
        ?.elementos[selectedElemento.elementoIndex]
    : null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header con botón guardar */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editor de Catálogo</h1>
            <p className="text-sm text-gray-500">
              {catalogo.catalogo} - v{catalogo.version}
            </p>
          </div>
          <Button onClick={handleGuardar} disabled={saving} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar Catálogo"}
          </Button>
        </div>
      </div>

      {/* Panel de errores */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-red-800">Errores de validación ({errors.length})</h3>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Contenido principal - 3 columnas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna 1: Categorías */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900">Categorías</h2>
              <Button
                onClick={handleCrearCategoria}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Nueva
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {catalogo.categorias.length} categoría{catalogo.categorias.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="p-2 space-y-1">
            {catalogo.categorias.map((categoria) => (
              <div
                key={categoria.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedCategoriaId === categoria.id
                    ? "bg-blue-50 border-blue-500"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
                onClick={() => {
                  setSelectedCategoriaId(categoria.id);
                  setSelectedSubcategoriaId(null);
                  setSelectedElemento(null);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Input
                        value={categoria.categoria}
                        onChange={(e) =>
                          handleEditarCategoria(categoria.id, "categoria", e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 text-sm font-medium"
                      />
                    </div>
                    <Input
                      value={categoria.id}
                      onChange={(e) =>
                        handleEditarCategoria(categoria.id, "id", e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 text-xs text-gray-500 mt-1"
                      placeholder="id"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {categoria.subcategorias.length} subcategoría
                      {categoria.subcategorias.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarCategoria(categoria.id);
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna 2: Subcategorías */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900">Subcategorías</h2>
              <Button
                onClick={handleCrearSubcategoria}
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={!selectedCategoriaId}
              >
                <Plus className="h-3 w-3" />
                Nueva
              </Button>
            </div>
            {categoriaSeleccionada ? (
              <p className="text-xs text-gray-500">
                {categoriaSeleccionada.subcategorias.length} subcategoría
                {categoriaSeleccionada.subcategorias.length !== 1 ? "s" : ""} en{" "}
                {categoriaSeleccionada.categoria}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Selecciona una categoría</p>
            )}
          </div>
          {categoriaSeleccionada ? (
            <div className="p-2 space-y-1">
              {categoriaSeleccionada.subcategorias.map((subcategoria) => (
                <div
                  key={subcategoria.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedSubcategoriaId === subcategoria.id
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => {
                    setSelectedSubcategoriaId(subcategoria.id);
                    setSelectedElemento(null);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        value={subcategoria.nombre}
                        onChange={(e) =>
                          handleEditarSubcategoria(subcategoria.id, "nombre", e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 text-sm font-medium mb-1"
                      />
                      <Input
                        value={subcategoria.id}
                        onChange={(e) =>
                          handleEditarSubcategoria(subcategoria.id, "id", e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 text-xs text-gray-500"
                        placeholder="id"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {subcategoria.elementos.length} elemento
                        {subcategoria.elementos.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarSubcategoria(subcategoria.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">
              Selecciona una categoría para ver sus subcategorías
            </div>
          )}
        </div>

        {/* Columna 3: Elementos */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900">Elementos</h2>
              <Button
                onClick={handleCrearElemento}
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={!selectedSubcategoriaId}
              >
                <Plus className="h-3 w-3" />
                Nuevo
              </Button>
            </div>
            {subcategoriaSeleccionada ? (
              <p className="text-xs text-gray-500">
                {subcategoriaSeleccionada.elementos.length} elemento
                {subcategoriaSeleccionada.elementos.length !== 1 ? "s" : ""} en{" "}
                {subcategoriaSeleccionada.nombre}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Selecciona una subcategoría</p>
            )}
          </div>
          {subcategoriaSeleccionada ? (
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-xs font-semibold text-gray-600">ID</th>
                      <th className="text-left p-2 text-xs font-semibold text-gray-600">Nombre</th>
                      <th className="text-left p-2 text-xs font-semibold text-gray-600">Unidad</th>
                      <th className="text-left p-2 text-xs font-semibold text-gray-600">Fases (de tareas)</th>
                      <th className="text-left p-2 text-xs font-semibold text-gray-600">Tareas</th>
                      <th className="text-left p-2 text-xs font-semibold text-gray-600">Opciones</th>
                      <th className="text-left p-2 text-xs font-semibold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subcategoriaSeleccionada.elementos.map((elemento, index) => (
                      <tr
                        key={elemento.id}
                        className={cn(
                          "border-b hover:bg-gray-50 cursor-pointer",
                          selectedElemento?.elementoIndex === index && "bg-blue-50"
                        )}
                        onClick={() =>
                          setSelectedElemento({
                            categoriaId: selectedCategoriaId!,
                            subcategoriaId: selectedSubcategoriaId!,
                            elementoIndex: index,
                          })
                        }
                      >
                        <td className="p-2 text-xs font-mono text-gray-600">{elemento.id}</td>
                        <td className="p-2 text-sm">{elemento.nombre}</td>
                        <td className="p-2 text-xs text-gray-500">{elemento.unidad}</td>
                        <td className="p-2 text-xs text-gray-500">
                          {(() => {
                            const fases = mapearTareasAFases(elemento.tareas || []);
                            const fasesConTareas = [];
                            if (fases.estructura.length > 0) fasesConTareas.push("Estructura");
                            if (fases.obra_gris.length > 0) fasesConTareas.push("Obra Gris");
                            if (fases.terminaciones.length > 0) fasesConTareas.push("Terminaciones");
                            return fasesConTareas.length > 0 ? fasesConTareas.join(", ") : "-";
                          })()}
                        </td>
                        <td className="p-2 text-xs text-gray-500">
                          {(() => {
                            const tareasNormalizadas = normalizarTareas(elemento.tareas);
                            if (tareasNormalizadas.length === 0) return "0 tareas";
                            
                            const codigos = tareasNormalizadas
                              .map(t => t.task_id || t.id || '?')
                              .filter(Boolean)
                              .slice(0, 3);
                            
                            const total = tareasNormalizadas.length;
                            const mostrar = codigos.length;
                            
                            return (
                              <div className="space-y-1">
                                <div className="font-mono text-blue-600">
                                  {codigos.join(", ")}
                                  {mostrar < total && ` +${total - mostrar} más`}
                                </div>
                                <div className="text-gray-400">
                                  {total} tarea{total !== 1 ? "s" : ""}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-2 text-xs text-gray-500">
                          {Object.keys(elemento.opciones || {}).length} opción
                          {Object.keys(elemento.opciones || {}).length !== 1 ? "es" : ""}
                        </td>
                        <td className="p-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedElemento({
                                categoriaId: selectedCategoriaId!,
                                subcategoriaId: selectedSubcategoriaId!,
                                elementoIndex: index,
                              });
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarElemento(index);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">
              Selecciona una subcategoría para ver sus elementos
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición de elemento */}
      {elementoEditando && selectedElemento && (
        <Dialog
          open={!!selectedElemento}
          onOpenChange={(open) => {
            if (!open) setSelectedElemento(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200">
            <DialogHeader className="bg-white">
              <DialogTitle className="text-gray-900">Editar Elemento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 bg-white">
              {/* ID */}
              <div>
                <label className="text-sm font-medium text-gray-700">ID</label>
                <Input
                  value={elementoEditando.id}
                  onChange={(e) =>
                    handleEditarElemento(selectedElemento.elementoIndex, "id", e.target.value)
                  }
                  className="mt-1 bg-white"
                />
              </div>

              {/* Nombre */}
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre *</label>
                <Input
                  value={elementoEditando.nombre}
                  onChange={(e) =>
                    handleEditarElemento(selectedElemento.elementoIndex, "nombre", e.target.value)
                  }
                  className="mt-1 bg-white"
                  placeholder="Nombre del elemento"
                />
              </div>

              {/* Unidad */}
              <div>
                <label className="text-sm font-medium text-gray-700">Unidad *</label>
                <Input
                  value={elementoEditando.unidad}
                  onChange={(e) =>
                    handleEditarElemento(selectedElemento.elementoIndex, "unidad", e.target.value)
                  }
                  className="mt-1 bg-white"
                  placeholder="m², m³, m, unidad, etc."
                />
              </div>

              {/* Tareas agrupadas por fase */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tareas (con código y nombre real)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Las tareas muestran su código (task_id), nombre real desde tareas-construccion.ts, fase y condición si existe.
                </p>
                
                {(() => {
                  if (!elementoEditando) return null;
                  const tareas = elementoEditando.tareas || [];
                  const fases = mapearTareasAFases(tareas);
                  
                  const renderTarea = (tarea: TareaCatalogo, fase: string, idx: number) => {
                    const taskId = tarea.task_id || tarea.id || '';
                    const tareaCompleta = taskId ? obtenerTareaCompleta(taskId) : null;
                    const nombreReal = tareaCompleta?.nombre || tarea.nombre || 'Sin nombre';
                    const codigoReal = tareaCompleta?.id || taskId || 'Sin código';
                    
                    // Encontrar el índice real en el array de tareas
                    const tareasNormalizadas = normalizarTareas(elementoEditando.tareas);
                    const tareaIndex = tareasNormalizadas.findIndex(t => 
                      (t.task_id || t.id) === taskId && t.nombre === tarea.nombre
                    );
                    
                    return (
                      <div key={`${fase}-${idx}`} className="border rounded p-2 bg-white">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {codigoReal}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{nombreReal}</span>
                            </div>
                            {tarea.condicion && (
                              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1">
                                Condición: {tarea.condicion}
                              </div>
                            )}
                            {!tareaCompleta && (
                              <div className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded mt-1">
                                ⚠️ Tarea no encontrada en tareas-construccion.ts
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => {
                              const nuevasTareas = tareasNormalizadas.filter((_, i) => i !== tareaIndex);
                              handleEditarElemento(selectedElemento.elementoIndex, "tareas", nuevasTareas);
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  };
                  
                  return (
                    <div className="space-y-4">
                      {/* Fase: Estructura */}
                      <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-blue-900">🏗️ Estructura</span>
                          <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            {fases.estructura.length} {fases.estructura.length === 1 ? 'tarea' : 'tareas'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {fases.estructura.map((tarea, idx) => renderTarea(tarea, 'estructura', idx))}
                        </div>
                      </div>

                      {/* Fase: Obra Gris */}
                      <div className="border rounded-lg p-3 bg-gray-50 border-gray-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-900">🧱 Obra Gris</span>
                          <span className="text-xs text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full">
                            {fases.obra_gris.length} {fases.obra_gris.length === 1 ? 'tarea' : 'tareas'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {fases.obra_gris.map((tarea, idx) => renderTarea(tarea, 'obra_gris', idx))}
                        </div>
                      </div>

                      {/* Fase: Terminaciones */}
                      <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-green-900">✨ Terminaciones</span>
                          <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            {fases.terminaciones.length} {fases.terminaciones.length === 1 ? 'tarea' : 'tareas'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {fases.terminaciones.map((tarea, idx) => renderTarea(tarea, 'terminaciones', idx))}
                        </div>
                      </div>
                      
                      {(!elementoEditando?.tareas || (elementoEditando.tareas && elementoEditando.tareas.length === 0)) && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                          ⚠️ Advertencia: Este elemento no tiene tareas definidas
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Opciones */}
              <div>
                <label className="text-sm font-medium text-gray-700">Opciones</label>
                {/* TODO: agregar campo precio_unitario o costo_referencia a los elementos */}
                <div className="mt-1 space-y-3">
                  {Object.entries(elementoEditando.opciones || {}).map(([key, values]) => (
                    <div key={key} className="border rounded-lg p-3 bg-white border-gray-300 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={key}
                          onChange={(e) => {
                            const nuevasOpciones = { ...(elementoEditando.opciones || {}) };
                            delete nuevasOpciones[key];
                            nuevasOpciones[e.target.value] = values;
                            handleEditarElemento(
                              selectedElemento.elementoIndex,
                              "opciones",
                              nuevasOpciones
                            );
                          }}
                          className="font-medium text-sm bg-white"
                          placeholder="Nombre de la opción"
                        />
                        <Button
                          onClick={() => {
                            const nuevasOpciones = { ...(elementoEditando.opciones || {}) };
                            delete nuevasOpciones[key];
                            handleEditarElemento(
                              selectedElemento.elementoIndex,
                              "opciones",
                              nuevasOpciones
                            );
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {values.map((valor, valorIndex) => (
                          <div key={valorIndex} className="flex items-center gap-2">
                            <Input
                              value={valor}
                              onChange={(e) => {
                                const nuevasOpciones = { ...(elementoEditando.opciones || {}) };
                                nuevasOpciones[key] = [...values];
                                nuevasOpciones[key][valorIndex] = e.target.value;
                                handleEditarElemento(
                                  selectedElemento.elementoIndex,
                                  "opciones",
                                  nuevasOpciones
                                );
                              }}
                              className="text-sm bg-white"
                            />
                            <Button
                              onClick={() => {
                                const nuevasOpciones = { ...(elementoEditando.opciones || {}) };
                                nuevasOpciones[key] = values.filter((_, idx) => idx !== valorIndex);
                                handleEditarElemento(
                                  selectedElemento.elementoIndex,
                                  "opciones",
                                  nuevasOpciones
                                );
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => {
                            const nuevasOpciones = { ...(elementoEditando.opciones || {}) };
                            nuevasOpciones[key] = [...values, "Nuevo valor"];
                            handleEditarElemento(
                              selectedElemento.elementoIndex,
                              "opciones",
                              nuevasOpciones
                            );
                          }}
                          size="sm"
                          variant="outline"
                          className="w-full gap-1 text-xs"
                        >
                          <Plus className="h-3 w-3" />
                          Agregar Valor
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={() => {
                      const nuevasOpciones = {
                        ...(elementoEditando.opciones || {}),
                        nueva_opcion: ["Valor 1"],
                      };
                      handleEditarElemento(
                        selectedElemento.elementoIndex,
                        "opciones",
                        nuevasOpciones
                      );
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar Opción
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedElemento(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

