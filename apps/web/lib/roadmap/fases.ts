// Mapeo de objetivos a fases del MVP
export interface Fase {
  id: number;
  nombre: string;
  descripcion: string;
  color: string;
  objetivos: string[]; // IDs de objetivos que pertenecen a esta fase
}

export const FASES: Fase[] = [
  {
    id: 1,
    nombre: "BASE TÉCNICA",
    descripcion: "Consolidar backend, login real y modo desarrollador",
    color: "#9B5DE5", // violeta
    objetivos: [
      "grows-obj-1", // Autenticación y Organización
      "grows-obj-4", // Catálogos y Base de Datos
      "grows-obj-2", // Backend Core y Lógica de Negocio
      "grows-obj-3", // API Routes Funcionales
    ]
  },
  {
    id: 2,
    nombre: "INTERFAZ Y USABILIDAD",
    descripcion: "Conectar las UIs reales y completar la experiencia de usuario",
    color: "#00BBF9", // celeste
    objetivos: [
      "grows-obj-6", // Frontend - Interfaces Funcionales
      "grows-obj-7", // Panel de Socio (versión móvil)
      "grows-obj-8", // Gestión de Cuadrillas
      "grows-obj-9", // Wizard de Obras
      "grows-obj-11", // UI/UX y Componentes Globales
    ]
  },
  {
    id: 3,
    nombre: "OPERATIVIDAD Y COLABORACIÓN",
    descripcion: "Comunicación en tiempo real, notificaciones y pagos",
    color: "#00F5D4", // verde agua
    objetivos: [
      "grows-obj-12", // Comunicación & Coordinación Operativa
      "grows-obj-5", // Pagos & Suscripciones
      "grows-obj-10", // Configuración de Cuenta
    ]
  },
  {
    id: 4,
    nombre: "CONTROL Y OPTIMIZACIÓN",
    descripcion: "Testing, documentación y rendimiento",
    color: "#3B82F6", // azul sólido
    objetivos: [
      "grows-obj-14", // Testing & Documentación API
      "grows-obj-13", // Documentación Interna
      "grows-obj-17", // Métricas & Rendimiento
    ]
  },
  {
    id: 5,
    nombre: "DEPLOY Y ESCALABILIDAD",
    descripcion: "Lanzamiento público y pruebas beta",
    color: "#F15BB5", // rosa
    objetivos: [
      "grows-obj-15", // Deploy & Beta Pública
      "grows-obj-16", // (Opcional) BIM: Importación & 3D
    ]
  }
];

// Función para obtener la fase de un objetivo
export function getFaseByObjetivoId(objetivoId: string): Fase | undefined {
  return FASES.find(fase => fase.objetivos.includes(objetivoId));
}

// Función para obtener todos los objetivos de una fase
export function getObjetivosByFase(faseId: number): string[] {
  const fase = FASES.find(f => f.id === faseId);
  return fase ? fase.objetivos : [];
}

// Función para calcular el progreso de una fase
export function calcularProgresoFase(faseId: number, objetivos: any[]): number {
  const objetivosFase = objetivos.filter(obj => 
    getFaseByObjetivoId(obj.id)?.id === faseId
  );
  
  if (objetivosFase.length === 0) return 0;
  
  const progresoTotal = objetivosFase.reduce((sum, obj) => sum + (obj.progreso || 0), 0);
  return Math.round(progresoTotal / objetivosFase.length);
}

// Función para obtener el estado de una fase
export function getEstadoFase(faseId: number, objetivos: any[]): string {
  const progreso = calcularProgresoFase(faseId, objetivos);
  
  if (progreso === 0) return "PENDIENTE";
  if (progreso === 100) return "COMPLETO";
  return "EN_CURSO";
}
