"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Plus,
  Sparkles,
  Layers,
  Pencil,
  Trash2,
  Wrench,
  Blocks,
  Construction,
  Plug,
  Home,
  Grid3x3,
  Star,
  Leaf,
  Building2,
  ChevronRight,
  HelpCircle,
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
import ModalEditarElemento from "@/components/cliente/modals/ModalEditarElemento";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Planta = {
  id: string;
  nombre: string;
};

type ElementoCatalogo = {
  id: string;
  nombre: string;
  unidad?: string;
  opciones?: Record<string, string[] | undefined>;
  tareas?: (string | { task_id?: string; nombre: string; fase: string })[];
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

// Demo video: obra demo sin base de datos — muchos elementos de todas las categorías para el video
const DEMO_OBRA_ID = "demo-obra-1-casa-familiar";
const MOCK_ELEMENTOS_OBRA: ElementoSupabase[] = [
  // Trabajos Preliminares (11)
  { id: "mock-1", nombre: "Limpieza inicial del terreno", categoria: "Trabajos Preliminares", subcategoria: "Limpieza y Preparación del Terreno", cantidad: 120, unidad: "m²", descripcion: "Tipo Limpieza: media | Desmalezado: sí", created_at: new Date().toISOString() },
  { id: "mock-2", nombre: "Nivelación manual del terreno", categoria: "Trabajos Preliminares", subcategoria: "Limpieza y Preparación del Terreno", cantidad: 80, unidad: "m²", descripcion: "Intensidad: media", created_at: new Date().toISOString() },
  { id: "mock-3", nombre: "Nivelación mecánica del terreno", categoria: "Trabajos Preliminares", subcategoria: "Limpieza y Preparación del Terreno", cantidad: 200, unidad: "m²", descripcion: "Maquinaria: mini cargadora", created_at: new Date().toISOString() },
  { id: "mock-4", nombre: "Pequeñas demoliciones", categoria: "Trabajos Preliminares", subcategoria: "Demoliciones y Retiro", cantidad: 15, unidad: "m³", descripcion: "Tipo: tabique", created_at: new Date().toISOString() },
  { id: "mock-5", nombre: "Retiro de escombros", categoria: "Trabajos Preliminares", subcategoria: "Demoliciones y Retiro", cantidad: 20, unidad: "m³", descripcion: "Destino: municipal | Carga: mecánica", created_at: new Date().toISOString() },
  { id: "mock-6", nombre: "Baño químico de obra (alquiler)", categoria: "Trabajos Preliminares", subcategoria: "Instalaciones Provisionales", cantidad: 1, unidad: "unidad", descripcion: "Tipo: estándar | Mantenimiento: semanal", created_at: new Date().toISOString() },
  { id: "mock-7", nombre: "Obrador provisorio (casilla)", categoria: "Trabajos Preliminares", subcategoria: "Instalaciones Provisionales", cantidad: 1, unidad: "unidad", descripcion: "Tipo: casilla chapa", created_at: new Date().toISOString() },
  { id: "mock-8", nombre: "Electricidad provisoria de obra", categoria: "Trabajos Preliminares", subcategoria: "Instalaciones Provisionales", cantidad: 1, unidad: "unidad", descripcion: "Tipo: pilar de obra", created_at: new Date().toISOString() },
  { id: "mock-9", nombre: "Cercado perimetral", categoria: "Trabajos Preliminares", subcategoria: "Cercado y Seguridad", cantidad: 45, unidad: "metro", descripcion: "Material: malla romboidal", created_at: new Date().toISOString() },
  { id: "mock-10", nombre: "Cartel de obra reglamentario", categoria: "Trabajos Preliminares", subcategoria: "Cercado y Seguridad", cantidad: 1, unidad: "unidad", descripcion: "Material: chapa", created_at: new Date().toISOString() },
  { id: "mock-11", nombre: "Señalización preventiva", categoria: "Trabajos Preliminares", subcategoria: "Cercado y Seguridad", cantidad: 1, unidad: "unidad", descripcion: "Tipo: cintas y conos", created_at: new Date().toISOString() },
  // Fundación y Estructura (12)
  { id: "mock-12", nombre: "Excavación de fundación manual", categoria: "Fundación y Estructura", subcategoria: "Excavación", cantidad: 85, unidad: "m³", descripcion: "Replanteo y compactación", created_at: new Date().toISOString() },
  { id: "mock-13", nombre: "Excavación de fundación mecánica", categoria: "Fundación y Estructura", subcategoria: "Excavación", cantidad: 120, unidad: "m³", descripcion: "Maquinaria: retro", created_at: new Date().toISOString() },
  { id: "mock-14", nombre: "Platea de fundación", categoria: "Fundación y Estructura", subcategoria: "Fundaciones", cantidad: 95, unidad: "m²", descripcion: "H10 | Armadura y hormigonado", created_at: new Date().toISOString() },
  { id: "mock-15", nombre: "Zapatas aisladas", categoria: "Fundación y Estructura", subcategoria: "Fundaciones", cantidad: 8, unidad: "unidad", descripcion: "Encofrado, armado, hormigonado", created_at: new Date().toISOString() },
  { id: "mock-16", nombre: "Vigas de fundación", categoria: "Fundación y Estructura", subcategoria: "Fundaciones", cantidad: 24, unidad: "ml", descripcion: "H21 | Encofrado y hormigonado", created_at: new Date().toISOString() },
  { id: "mock-17", nombre: "Bases de hormigón armado", categoria: "Fundación y Estructura", subcategoria: "Hormigón Armado", cantidad: 8, unidad: "unidad", descripcion: "Encofrado, armadura, H21", created_at: new Date().toISOString() },
  { id: "mock-18", nombre: "Columnas de hormigón armado", categoria: "Fundación y Estructura", subcategoria: "Hormigón Armado", cantidad: 12, unidad: "unidad", descripcion: "20x40 | Estribos y curado", created_at: new Date().toISOString() },
  { id: "mock-19", nombre: "Vigas de hormigón armado", categoria: "Fundación y Estructura", subcategoria: "Hormigón Armado", cantidad: 18, unidad: "ml", descripcion: "Vigas principales y secundarias", created_at: new Date().toISOString() },
  { id: "mock-20", nombre: "Vigas metálicas", categoria: "Fundación y Estructura", subcategoria: "Hormigón Armado", cantidad: 6, unidad: "ml", descripcion: "Montaje y nivelación", created_at: new Date().toISOString() },
  { id: "mock-21", nombre: "Losa maciza de hormigón armado", categoria: "Fundación y Estructura", subcategoria: "Hormigón Armado", cantidad: 85, unidad: "m²", descripcion: "Encofrado, armado, H21", created_at: new Date().toISOString() },
  { id: "mock-22", nombre: "Losa alivianada", categoria: "Fundación y Estructura", subcategoria: "Hormigón Armado", cantidad: 90, unidad: "m²", descripcion: "Viguetas y bovedillas", created_at: new Date().toISOString() },
  { id: "mock-23", nombre: "Losa pretensada", categoria: "Fundación y Estructura", subcategoria: "Hormigón Armado", cantidad: 75, unidad: "m²", descripcion: "Montaje viguetas, capa compresión", created_at: new Date().toISOString() },
  // Muros y Cerramientos (12)
  { id: "mock-24", nombre: "Muro de ladrillo común", categoria: "Muros y Cerramientos", subcategoria: "Muros Exteriores", cantidad: 120, unidad: "m²", descripcion: "15 cm | Revoque + pintura", created_at: new Date().toISOString() },
  { id: "mock-25", nombre: "Muro de ladrillo cerámico hueco", categoria: "Muros y Cerramientos", subcategoria: "Muros Exteriores", cantidad: 95, unidad: "m²", descripcion: "18 cm | Revoque exterior e interior", created_at: new Date().toISOString() },
  { id: "mock-26", nombre: "Muro de bloque de hormigón", categoria: "Muros y Cerramientos", subcategoria: "Muros Exteriores", cantidad: 80, unidad: "m²", descripcion: "Portante 15 cm | Revoque", created_at: new Date().toISOString() },
  { id: "mock-27", nombre: "Muro de Retak / bloque celular", categoria: "Muros y Cerramientos", subcategoria: "Muros Exteriores", cantidad: 65, unidad: "m²", descripcion: "15 cm | Revoque especial", created_at: new Date().toISOString() },
  { id: "mock-28", nombre: "Panel sándwich metálico con aislación", categoria: "Muros y Cerramientos", subcategoria: "Muros Exteriores", cantidad: 40, unidad: "m²", descripcion: "80mm | EPS | Chapa prepintada", created_at: new Date().toISOString() },
  { id: "mock-29", nombre: "Muro cortina de vidrio (con DVH)", categoria: "Muros y Cerramientos", subcategoria: "Muros Exteriores", cantidad: 18, unidad: "m²", descripcion: "DVH 6+12+6 | Aluminio", created_at: new Date().toISOString() },
  { id: "mock-30", nombre: "Tabique de ladrillo cerámico 8 cm", categoria: "Muros y Cerramientos", subcategoria: "Muros Interiores", cantidad: 55, unidad: "m²", descripcion: "Revoque + pintura", created_at: new Date().toISOString() },
  { id: "mock-31", nombre: "Tabique de ladrillo cerámico 12 cm", categoria: "Muros y Cerramientos", subcategoria: "Muros Interiores", cantidad: 42, unidad: "m²", descripcion: "Yeso + pintura", created_at: new Date().toISOString() },
  { id: "mock-32", nombre: "Tabique de durlock placa simple", categoria: "Muros y Cerramientos", subcategoria: "Muros Interiores", cantidad: 75, unidad: "m²", descripcion: "Estructura metalica, placa 12.5", created_at: new Date().toISOString() },
  { id: "mock-33", nombre: "Tabique de durlock placa doble", categoria: "Muros y Cerramientos", subcategoria: "Muros Interiores", cantidad: 28, unidad: "m²", descripcion: "Doble placa, aislación", created_at: new Date().toISOString() },
  { id: "mock-34", nombre: "Tabique de durlock con aislación acústica", categoria: "Muros y Cerramientos", subcategoria: "Muros Interiores", cantidad: 22, unidad: "m²", descripcion: "Lana de vidrio 50mm", created_at: new Date().toISOString() },
  { id: "mock-35", nombre: "Revoque grueso y fino exterior", categoria: "Muros y Cerramientos", subcategoria: "Muros Exteriores", cantidad: 180, unidad: "m²", descripcion: "Cemento-arena + revoque fino", created_at: new Date().toISOString() },
  // Instalaciones (varias)
  { id: "mock-36", nombre: "Instalación cloacal baños", categoria: "Instalaciones", subcategoria: "Instalación Cloacal", cantidad: 2, unidad: "unidad", descripcion: "Bajada y desagües", created_at: new Date().toISOString() },
  { id: "mock-37", nombre: "Instalación cloacal cocina", categoria: "Instalaciones", subcategoria: "Instalación Cloacal", cantidad: 1, unidad: "unidad", descripcion: "Desagüe cocina", created_at: new Date().toISOString() },
  { id: "mock-38", nombre: "Instalación cloacal general de la casa (recorrido interno)", categoria: "Instalaciones", subcategoria: "Instalación Cloacal", cantidad: 1, unidad: "unidad", descripcion: "Recorrido interno PVC", created_at: new Date().toISOString() },
  { id: "mock-39", nombre: "Conexión a línea municipal cloacal", categoria: "Instalaciones", subcategoria: "Instalación Cloacal", cantidad: 1, unidad: "unidad", descripcion: "Conexión a red municipal", created_at: new Date().toISOString() },
  { id: "mock-40", nombre: "Instalación de agua baños", categoria: "Instalaciones", subcategoria: "Instalación de Agua Fría/Caliente", cantidad: 2, unidad: "unidad", descripcion: "Fría y caliente, caños", created_at: new Date().toISOString() },
  { id: "mock-41", nombre: "Instalación de agua cocina", categoria: "Instalaciones", subcategoria: "Instalación de Agua Fría/Caliente", cantidad: 1, unidad: "unidad", descripcion: "Mesada y lavavajillas", created_at: new Date().toISOString() },
  { id: "mock-42", nombre: "Instalación eléctrica vivienda completa", categoria: "Instalaciones", subcategoria: "Instalación Eléctrica", cantidad: 1, unidad: "unidad", descripcion: "Tablero, circuitos, tomas", created_at: new Date().toISOString() },
  { id: "mock-43", nombre: "Instalación de gas (interno)", categoria: "Instalaciones", subcategoria: "Instalación de Gas", cantidad: 1, unidad: "unidad", descripcion: "Cañería interna, regulador", created_at: new Date().toISOString() },
  { id: "mock-44", nombre: "Calefacción por radiadores", categoria: "Instalaciones", subcategoria: "Calefacción", cantidad: 6, unidad: "unidad", descripcion: "Radiadores aluminio", created_at: new Date().toISOString() },
  { id: "mock-45", nombre: "Aire acondicionado split", categoria: "Instalaciones", subcategoria: "Climatización", cantidad: 3, unidad: "unidad", descripcion: "3500 frigorías", created_at: new Date().toISOString() },
  // Cubiertas
  { id: "mock-46", nombre: "Cubierta de chapa con aislación", categoria: "Cubiertas", subcategoria: "Cubiertas Livianas", cantidad: 95, unidad: "m²", descripcion: "Chapa prepintada, lana vidrio", created_at: new Date().toISOString() },
  { id: "mock-47", nombre: "Cumbrera y limahoya", categoria: "Cubiertas", subcategoria: "Cubiertas Livianas", cantidad: 18, unidad: "ml", descripcion: "Cumbrera zinc, limahoya", created_at: new Date().toISOString() },
  { id: "mock-48", nombre: "Tirantes y correas", categoria: "Cubiertas", subcategoria: "Estructura de Cubierta", cantidad: 1, unidad: "unidad", descripcion: "Estructura madera", created_at: new Date().toISOString() },
  { id: "mock-49", nombre: "Cielo raso yeso", categoria: "Cubiertas", subcategoria: "Cielo Raso", cantidad: 85, unidad: "m²", descripcion: "Yeso proyectado", created_at: new Date().toISOString() },
  { id: "mock-50", nombre: "Cielo raso durlock", categoria: "Cubiertas", subcategoria: "Cielo Raso", cantidad: 45, unidad: "m²", descripcion: "Placa 12.5, pintura", created_at: new Date().toISOString() },
  // Suelos / Pisos
  { id: "mock-51", nombre: "Contrapiso de hormigón", categoria: "Suelos / Pisos", subcategoria: "Contrapisos", cantidad: 95, unidad: "m²", descripcion: "H17, 8 cm", created_at: new Date().toISOString() },
  { id: "mock-52", nombre: "Piso cerámico esmaltado", categoria: "Suelos / Pisos", subcategoria: "Pisos Cerámicos", cantidad: 65, unidad: "m²", descripcion: "45x45, colocación y junta", created_at: new Date().toISOString() },
  { id: "mock-53", nombre: "Piso porcelanato", categoria: "Suelos / Pisos", subcategoria: "Pisos Cerámicos", cantidad: 42, unidad: "m²", descripcion: "60x60, interior", created_at: new Date().toISOString() },
  { id: "mock-54", nombre: "Alfombra de goma (gimnasio/playroom)", categoria: "Suelos / Pisos", subcategoria: "Pisos Especiales", cantidad: 25, unidad: "m²", descripcion: "4 mm", created_at: new Date().toISOString() },
  { id: "mock-55", nombre: "Piso de madera flotante", categoria: "Suelos / Pisos", subcategoria: "Pisos de Madera", cantidad: 38, unidad: "m²", descripcion: "Lamas 3 tiras", created_at: new Date().toISOString() },
  { id: "mock-56", nombre: "Zócalo cerámico", categoria: "Suelos / Pisos", subcategoria: "Zócalos y Juntas", cantidad: 85, unidad: "ml", descripcion: "8 cm altura", created_at: new Date().toISOString() },
  // Amenities
  { id: "mock-57", nombre: "Parrilla de obra", categoria: "Amenities", subcategoria: "Parrilla y Quincho", cantidad: 1, unidad: "unidad", descripcion: "Horno y parrilla", created_at: new Date().toISOString() },
  { id: "mock-58", nombre: "Piscina de obra", categoria: "Amenities", subcategoria: "Piscina", cantidad: 1, unidad: "unidad", descripcion: "8x4 m, revestimiento", created_at: new Date().toISOString() },
  { id: "mock-59", nombre: "Deck de madera", categoria: "Amenities", subcategoria: "Decks", cantidad: 28, unidad: "m²", descripcion: "Madera tratada", created_at: new Date().toISOString() },
  { id: "mock-60", nombre: "Solárium / galería", categoria: "Amenities", subcategoria: "Solárium", cantidad: 22, unidad: "m²", descripcion: "Cierre vidrio", created_at: new Date().toISOString() },
  { id: "mock-61", nombre: "Portón eléctrico", categoria: "Amenities", subcategoria: "Accesos", cantidad: 1, unidad: "unidad", descripcion: "Automático, 4 m", created_at: new Date().toISOString() },
  { id: "mock-62", nombre: "Riego automático", categoria: "Amenities", subcategoria: "Riego", cantidad: 1, unidad: "unidad", descripcion: "Sector parquizado", created_at: new Date().toISOString() },
  // Parquizado
  { id: "mock-63", nombre: "Preparación del suelo (parquizado)", categoria: "Parquizado", subcategoria: "Preparación del Terreno", cantidad: 120, unidad: "m²", descripcion: "Nivelación y enmienda", created_at: new Date().toISOString() },
  { id: "mock-64", nombre: "Césped en panes", categoria: "Parquizado", subcategoria: "Césped", cantidad: 85, unidad: "m²", descripcion: "Colocación y riego", created_at: new Date().toISOString() },
  { id: "mock-65", nombre: "Plantación de árboles", categoria: "Parquizado", subcategoria: "Plantación", cantidad: 5, unidad: "unidad", descripcion: "Árboles medianos", created_at: new Date().toISOString() },
  { id: "mock-66", nombre: "Plantación de arbustos", categoria: "Parquizado", subcategoria: "Plantación", cantidad: 18, unidad: "unidad", descripcion: "Arbustos y canteros", created_at: new Date().toISOString() },
  { id: "mock-67", nombre: "Sendero de ladrillos", categoria: "Parquizado", subcategoria: "Senderos y Canteros", cantidad: 25, unidad: "ml", descripcion: "Ladrillo sobre arena", created_at: new Date().toISOString() },
  { id: "mock-68", nombre: "Iluminación exterior (parquizado)", categoria: "Parquizado", subcategoria: "Iluminación", cantidad: 8, unidad: "unidad", descripcion: "Columnas y focos LED", created_at: new Date().toISOString() },
];

const mapearTareasAFases = (
  tareas: (string | { task_id?: string; nombre: string; fase: string })[] = []
) => {
  const fases: Record<string, string[]> = {
    estructura: [],
    "obra gris": [],
    terminaciones: [],
  };

  tareas.forEach((tarea) => {
    let nombreTarea: string;
    let faseTarea: "estructura" | "obra gris" | "terminaciones";

    // Si la tarea es un objeto, extraer nombre y fase
    if (typeof tarea === "object" && tarea !== null && "nombre" in tarea) {
      nombreTarea = tarea.nombre || "";

      // Si el objeto tiene fase válida, usarla directamente
      if (tarea.fase && typeof tarea.fase === "string") {
        const faseLower = tarea.fase.toLowerCase().trim();
        if (faseLower === "estructura") {
          faseTarea = "estructura";
        } else if (faseLower === "obra_gris" || faseLower === "obra gris") {
          faseTarea = "obra gris";
        } else if (faseLower === "terminaciones") {
          faseTarea = "terminaciones";
        } else {
          // Si la fase no es reconocida, mapear por nombre
          const lower = nombreTarea.toLowerCase();
          if (
            lower.includes("replanteo") ||
            lower.includes("excav") ||
            lower.includes("encofrado") ||
            lower.includes("armado") ||
            lower.includes("estructura") ||
            lower.includes("hormig")
          ) {
            faseTarea = "estructura";
          } else if (
            lower.includes("revoque") ||
            lower.includes("instal") ||
            lower.includes("mamposter") ||
            lower.includes("contrapiso") ||
            lower.includes("carp")
          ) {
            faseTarea = "obra gris";
          } else {
            faseTarea = "terminaciones";
          }
        }
      } else {
        // Si no tiene fase, mapear por nombre
        const lower = nombreTarea.toLowerCase();
        if (
          lower.includes("replanteo") ||
          lower.includes("excav") ||
          lower.includes("encofrado") ||
          lower.includes("armado") ||
          lower.includes("estructura") ||
          lower.includes("hormig")
        ) {
          faseTarea = "estructura";
        } else if (
          lower.includes("revoque") ||
          lower.includes("instal") ||
          lower.includes("mamposter") ||
          lower.includes("contrapiso") ||
          lower.includes("carp")
        ) {
          faseTarea = "obra gris";
        } else {
          faseTarea = "terminaciones";
        }
      }
    } else {
      // Si la tarea es un string (compatibilidad legacy)
      nombreTarea = typeof tarea === "string" ? tarea : String(tarea);
      const lower = nombreTarea.toLowerCase();
      if (
        lower.includes("replanteo") ||
        lower.includes("excav") ||
        lower.includes("encofrado") ||
        lower.includes("armado") ||
        lower.includes("estructura") ||
        lower.includes("hormig")
      ) {
        faseTarea = "estructura";
      } else if (
        lower.includes("revoque") ||
        lower.includes("instal") ||
        lower.includes("mamposter") ||
        lower.includes("contrapiso") ||
        lower.includes("carp")
      ) {
        faseTarea = "obra gris";
      } else {
        faseTarea = "terminaciones";
      }
    }

    // Agregar la tarea a la fase correspondiente
    fases[faseTarea].push(nombreTarea);
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

function CargaElementosPanelContent({
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
  const [modalEditarElementoOpen, setModalEditarElementoOpen] = useState(false);
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
    const statsCategorias = categorias.map((categoria) => {
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

    return statsCategorias;
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
    // Demo video: no llamar API, usar elementos mock (misma estructura que la UI)
    if (obraId === DEMO_OBRA_ID) {
      setElementosObra(MOCK_ELEMENTOS_OBRA);
      setLoadingElementos(false);
      return;
    }
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

    // Demo video: agregar elemento solo en estado local, sin POST a la base de datos
    if (obraId === DEMO_OBRA_ID) {
      const mockElement: ElementoSupabase = {
        id: `mock-${Date.now()}`,
        nombre: selectedElemento.elemento.nombre,
        categoria: selectedElemento.categoriaNombre,
        subcategoria: selectedElemento.subcategoriaNombre,
        cantidad,
        unidad: unidad || selectedElemento.elemento.unidad || "unidad",
        descripcion: buildDescripcion(configValues, observaciones) || null,
        created_at: new Date().toISOString(),
      };
      setElementosObra((prev) => [...prev, mockElement]);
      toast({
        title: "Elemento agregado",
        description: `${selectedElemento.elemento.nombre} se sumó a la obra`,
      });
      setSelectedElemento(null);
      setCantidad(0);
      setObservaciones("");
      setSelectedElementoCargado(null);
      setActiveTab("cargados");
      setIsSaving(false);
      return;
    }

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

  const selectTriggerClass =
    "h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm focus:border-[#0066FF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20";
  const selectContentClass =
    "rounded-xl border border-slate-200 bg-white shadow-lg";
  const selectItemClass =
    "rounded-lg px-3 py-2 text-sm text-slate-700 data-[highlighted]:bg-[#EAF3FF] data-[highlighted]:text-[#0066FF] focus:bg-[#EAF3FF] focus:text-[#0066FF]";

  // Función para obtener el color del badge según el porcentaje
  const getBadgeColor = (cargados: number, disponibles: number) => {
    if (disponibles === 0) return "bg-[#E5E7EB] text-slate-600";
    const porcentaje = (cargados / disponibles) * 100;
    if (porcentaje === 0) return "bg-[#E5E7EB] text-slate-600";
    if (porcentaje >= 1 && porcentaje < 50) return "bg-[#FFF3BF] text-amber-700";
    if (porcentaje >= 50 && porcentaje < 100) return "bg-[#D9E8FF] text-blue-700";
    if (porcentaje === 100) return "bg-[#D4F8D4] text-green-700";
    return "bg-[#E5E7EB] text-slate-600";
  };

  // Función para obtener el icono según la categoría
  const getCategoriaIcon = (nombre: string) => {
    if (!nombre) return Building2;
    const nombreLower = nombre.toLowerCase();
    if (nombreLower.includes("trabajos preliminares") || nombreLower.includes("preliminares")) return Wrench;
    if (nombreLower.includes("fundación") || nombreLower.includes("estructura")) return Blocks;
    if (nombreLower.includes("muro") || nombreLower.includes("cerramiento")) return Construction;
    if (nombreLower.includes("instalación") || nombreLower.includes("instalaciones")) return Plug;
    if (nombreLower.includes("cubierta") || nombreLower.includes("cubiertas")) return Home;
    if (nombreLower.includes("suelo") || nombreLower.includes("piso") || nombreLower.includes("suelos") || nombreLower.includes("pisos")) return Grid3x3;
    if (nombreLower.includes("amenity") || nombreLower.includes("amenities")) return Star;
    if (nombreLower.includes("parquizado") || nombreLower.includes("parque") || nombreLower.includes("parquizados")) return Leaf;
    return Building2;
  };

  // Breadcrumb - muestra categoría y subcategoría cuando hay selección
  const breadcrumb = useMemo(() => {
    if (selectedElemento) {
      return `${selectedElemento.categoriaNombre} / ${selectedElemento.subcategoriaNombre}`;
    }
    // Si hay una subcategoría abierta, mostrar categoría / subcategoría
    const subcategoriaAbierta = subcategoriasConConteo.find(
      (sub) => openSubcategorias[sub.subcategoria.id]
    );
    if (subcategoriaAbierta && categoriaSeleccionada) {
      return `${categoriaSeleccionada.categoria} / ${subcategoriaAbierta.subcategoria.nombre}`;
    }
    // Solo categoría si está seleccionada
    if (categoriaSeleccionada) {
      return categoriaSeleccionada.categoria;
    }
    return null;
  }, [selectedElemento, categoriaSeleccionada, subcategoriasConConteo, openSubcategorias]);

  return (
    <div className="grid grid-cols-12 gap-0 p-5 bg-[#F5F7FA]">
      {/* Panel izquierdo */}
      <aside className="col-span-12 h-max rounded-l-xl border-r border-[#E5E7EB] bg-[#FFFEF5] shadow-sm lg:col-span-3">
        {/* Header fijo */}
        <div className="sticky top-0 z-10 bg-[#F0F2F5] border-b border-[#E1E4E8] px-5 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Building2 className="h-4 w-4 text-slate-500" />
            Categorías constructivas
          </div>
        </div>
        <div className="p-4 space-y-2">
          {categoriaStats.map((cat) => {
            const isActive = cat.id === selectedCategoriaId;
            const badgeColor = getBadgeColor(cat.cargados, cat.disponibles || 1);
            const Icon = getCategoriaIcon(cat.nombre) || Building2;
            return (
              <button
                key={cat.id}
                type="button"
                className={cn(
                  "w-full rounded-xl px-4 py-4 text-left transition-all flex items-center justify-between group",
                  isActive
                    ? "bg-[#E8F1FF] text-[#0066FF] shadow-sm font-semibold border-l-[6px] border-[#0066FF] rounded-l-none"
                    : "bg-[#FFF9E6] text-slate-700 hover:border-[#F5E6C4] hover:shadow-sm border border-transparent"
                )}
                onClick={() => {
                  if (cat.id !== "trabajos-preliminares") {
                    setSelectedCategoriaId(cat.id);
                    setSelectedElemento(null);
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isActive ? "text-[#0066FF]" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  <span className={cn(
                    "text-sm line-clamp-2",
                    isActive ? "font-semibold" : "font-medium"
                  )}>
                    {cat.nombre}
                  </span>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ml-2 flex-shrink-0",
                  badgeColor
                )}>
                  {cat.cargados}/{cat.disponibles || 0}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Panel central */}
      <section className="col-span-12 space-y-4 lg:col-span-6 bg-white border-r border-[#E5E7EB] shadow-sm">
        <div className="rounded-r-xl bg-white p-5">
          {/* Header con botón de tutorial */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Cargar elementos</h2>
          </div>
          {/* Breadcrumb */}
          {breadcrumb && (
            <div className="mb-4 flex items-center gap-1.5 text-sm text-slate-600">
              {breadcrumb.split(' / ').map((part, index, array) => (
                <span key={index} className="flex items-center gap-1.5">
                  <span className={cn(
                    "font-medium",
                    index === array.length - 1 ? "text-slate-900" : "text-slate-600"
                  )}>
                    {part}
                  </span>
                  {index < array.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </span>
              ))}
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "cargar" | "cargados")} className="w-full">
              <TabsList className="mb-4 flex gap-2 border-b border-slate-200 bg-transparent p-0">
              <TabsTrigger
                value="cargar"
                  className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 data-[state=active]:border-[#0066FF] data-[state=active]:text-[#0066FF]"
              >
                Cargar elementos
              </TabsTrigger>
              <TabsTrigger
                value="cargados"
                  className="rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 data-[state=active]:border-[#0066FF] data-[state=active]:text-[#0066FF]"
              >
                Elementos cargados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cargar" className="mt-0">
              <div className="flex items-center justify-between mb-5">
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
                  className="flex items-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0052E6] shadow-md transition-all"
                  onClick={() => setModalNuevoElementoOpen(true)}
                >
                  <Plus className="h-5 w-5" /> Cargar nuevo elemento
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {subcategoriasConConteo.map(({ subcategoria, cargados }) => {
                  const isOpen = openSubcategorias[subcategoria.id];
                  const total = subcategoria.elementos.length;
                  const porcentaje = total > 0 ? (cargados / total) * 100 : 0;
                  const badgeColor = porcentaje === 0 
                    ? "bg-[#E5E7EB] text-slate-600"
                    : porcentaje >= 1 && porcentaje < 50
                    ? "bg-[#FFF3BF] text-amber-700"
                    : porcentaje >= 50 && porcentaje < 100
                    ? "bg-[#D9E8FF] text-blue-700"
                    : "bg-[#D4F8D4] text-green-700";
                  const isSelected = selectedElemento?.subcategoriaId === subcategoria.id;
                  
                  return (
                    <div
                      key={subcategoria.id}
                      className={cn(
                        "rounded-lg border bg-white shadow-md transition-all duration-200",
                        isSelected
                          ? "border-[#0066FF] border-2 shadow-lg"
                          : "border-[#E0E0E0] hover:shadow-lg hover:-translate-y-0.5"
                      )}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50/50"
                        onClick={() => toggleSubcategoria(subcategoria.id)}
                      >
                        <div className="flex flex-col">
                          <span className="text-slate-900 text-lg font-semibold">
                            {subcategoria.nombre}
                          </span>
                          <span className="text-xs text-slate-500 font-normal mt-1">
                            {total} elemento{total === 1 ? "" : "s"} disponibles
                          </span>
                        </div>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ml-3",
                          badgeColor
                        )}>
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
                                    "rounded-lg border bg-white p-4 text-left transition-all duration-200",
                                    isActive 
                                      ? "border-[#0066FF] border-2 bg-[#E8F1FF] shadow-md" 
                                      : "border-slate-200 hover:shadow-md hover:border-slate-300"
                                  )}
                                  onClick={() => handleSelectElemento(subcategoria, elemento)}
                                >
                                  <div
                                    className={cn(
                                      "text-sm font-medium",
                                      isActive ? "text-[#0066FF] font-semibold" : "text-slate-800"
                                    )}
                                    title={elemento.nombre}
                                  >
                                    {elemento.nombre}
                                  </div>
                                  {elemento.opciones ? (
                                    <p className={cn(
                                      "mt-2 line-clamp-2 text-xs",
                                      isActive ? "text-slate-600" : "text-slate-500"
                                    )}>
                                      {Object.keys(elemento.opciones)
                                        .map((key) => key.replace(/_/g, " "))
                                        .slice(0, 2)
                                        .join(" · ")}
                                    </p>
                                  ) : null}
                                  {yaCargado ? (
                                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-[#0066FF]">
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
                          isActive && "border-[#0066FF]"
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
      <aside className="col-span-12 h-max rounded-r-xl border-l border-[#E5E7EB] bg-[#FBFBFB] p-6 shadow-sm lg:col-span-3">
        {activeTab === "cargar" ? (
          <>
            {selectedElemento ? (
              <>
                <header className="mb-5">
                  <h3 className="text-2xl font-semibold text-[#0066FF] mb-1">
                    {selectedElemento.elemento.nombre}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Configuración del elemento
                  </p>
                </header>
                <div className="space-y-5 divide-y divide-slate-200">
                {Object.entries(selectedElemento.elemento.opciones ?? {}).map(
                  ([key, opciones], index) => (
                    <div key={key} className={cn("space-y-2", index === 0 ? "pt-0" : "pt-5")}>
                      <label className="text-xs font-medium text-slate-600">
                        {key.split("_").map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1)).join(" ")}
                      </label>
                      <Select
                        value={configValues[key] ?? ""}
                        onValueChange={(value) =>
                          setConfigValues((prev) => ({ ...prev, [key]: value }))
                        }
                      >
                        <SelectTrigger className={cn(selectTriggerClass, "focus:border-[#0066FF] focus:ring-[#0066FF]/20")}>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className={selectContentClass}>
                          {(opciones ?? []).map((opcion) => (
                            <SelectItem key={opcion} value={opcion} className={cn(selectItemClass, "data-[highlighted]:bg-[#EAF3FF] data-[highlighted]:text-[#0066FF]")}>
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
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentClass}>
                        {[
                          "m²",
                          "m³",
                          "unidad",
                          "ml",
                          "kg",
                        ].map((option) => (
                          <SelectItem key={option} value={option} className={selectItemClass}>
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
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className={selectContentClass}>
                      <SelectItem value={GENERAL_PLANTA_ID} className={selectItemClass}>
                        General / Sin asignar
                      </SelectItem>
                      {plantas.map((planta) => (
                        <SelectItem key={planta.id} value={planta.id} className={selectItemClass}>
                          {planta.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Observaciones</label>
                  <textarea
                    className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-[#0066FF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/25"
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
                            {tareas.map((tarea, index) => (
                              <li key={`${fase}-${tarea}-${index}`}>{tarea}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              </>
            ) : (
              <div className="flex h-[480px] flex-col items-center justify-center gap-4 text-center px-4">
                <Layers className="h-20 w-20 text-[#CACACA]" />
                <h4 className="text-lg font-semibold text-slate-700">
                  Configuración del elemento
                </h4>
                <p className="text-sm font-medium text-slate-500 max-w-xs">
                  Elegí un elemento del panel central para ver sus detalles técnicos.
                </p>
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
                    onClick={() => setModalEditarElementoOpen(true)}
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

      <ModalEditarElemento
        open={modalEditarElementoOpen}
        onClose={() => setModalEditarElementoOpen(false)}
        elemento={selectedElementoCargado}
        obraId={obraId}
        onSuccess={() => {
          fetchElementosObra();
        }}
      />
    </div>
  );
}

// Componente principal exportado (con provider)
export default function CargaElementosPanel(props: CargaElementosPanelProps) {
  return <CargaElementosPanelContent {...props} />;
}


