// Map of roadmap phases and their objectives
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
    nombre: "BASE TECNICA",
    descripcion: "Consolidar backend, login real y modo desarrollador",
    color: "#EFF3FF", // violeta suave
    objetivos: [
      "grows-obj-1", // Autenticacion y Organizacion
      "grows-obj-2", // Backend Core y Logica de Negocio
      "grows-obj-3", // API Routes Funcionales
      "grows-obj-4", // Catalogos y Base de Datos
    ]
  },
  {
    id: 2,
    nombre: "INTERFAZ Y USABILIDAD",
    descripcion: "Conectar las UIs reales y completar la experiencia de usuario",
    color: "#F5F7FB", // celeste suave
    objetivos: [
      "grows-obj-6", // Frontend - Interfaces Funcionales
      "grows-obj-7", // Panel de Socio (version movil)
      "grows-obj-8", // Gestion de Cuadrillas
      "grows-obj-9", // Wizard de Obras
      "grows-obj-11", // UI/UX y Componentes Globales
    ]
  },
  {
    id: 3,
    nombre: "OPERATIVIDAD Y COLABORACION",
    descripcion: "Comunicacion en tiempo real, notificaciones y pagos",
    color: "#F2FBF7", // verde agua suave
    objetivos: [
      "grows-obj-5", // Pagos & Suscripciones
      "grows-obj-10", // Configuracion de Cuenta
      "grows-obj-12", // Comunicacion & Coordinacion Operativa
    ]
  },
  {
    id: 4,
    nombre: "CONTROL Y OPTIMIZACION",
    descripcion: "Testing, documentacion y rendimiento",
    color: "#F7F5FB", // azul solido suave
    objetivos: [
      "grows-obj-13", // Documentacion Interna
      "grows-obj-14", // Testing & Documentacion API
      "grows-obj-17", // Metricas & Rendimiento
    ]
  },
  {
    id: 5,
    nombre: "DEPLOY Y ESCALABILIDAD",
    descripcion: "Lanzamiento publico y pruebas beta",
    color: "#FFF7FB", // rosa suave
    objetivos: [
      "grows-obj-15", // Deploy & Beta Publica
      "grows-obj-16", // (Opcional) BIM: Importacion & 3D
    ]
  }
];

export function getFaseByObjetivoId(objetivoId: string): Fase | undefined {
  return FASES.find(fase => fase.objetivos.includes(objetivoId));
}

export function getObjetivosByFase(faseId: number): string[] {
  const fase = FASES.find(f => f.id === faseId);
  return fase ? fase.objetivos : [];
}

// Funcion para calcular el progreso de una fase
export function calcularProgresoFase(faseId: number, objetivos: any[]): number {
  const fase = FASES.find(f => f.id === faseId);
  if (!fase) return 0;
  
  const objetivosFase = objetivos.filter(obj => 
    fase.objetivos.includes(obj.id)
  );
  
  if (objetivosFase.length === 0) return 0;
  
  const progresoTotal = objetivosFase.reduce((sum, obj) => {
    const progreso = typeof obj.progreso === 'number'
      ? obj.progreso
      : typeof obj.progress === 'number'
        ? obj.progress
        : typeof obj.percentage === 'number'
          ? obj.percentage
          : obj.status === 'COMPLETO'
            ? 100
            : obj.status === 'EN_CURSO'
              ? 50
              : 0;
    return sum + progreso;
  }, 0);
  
  return Math.round(progresoTotal / objetivosFase.length);
}

// Funcion para obtener el estado de una fase
export function getEstadoFase(faseId: number, objetivos: any[]): string {
  const fase = FASES.find(f => f.id === faseId);
  if (!fase) return "PENDIENTE";
  
  const objetivosFase = objetivos.filter(obj => 
    fase.objetivos.includes(obj.id)
  );
  
  if (objetivosFase.length === 0) return "PENDIENTE";
  
  const estados = objetivosFase.map(obj => (obj.status ?? "").toString().toUpperCase());
  if (estados.every(status => status.includes('COMPLE'))) return "COMPLETO";
  if (estados.some(status => status.includes('CUR') || status.includes('REV'))) return "EN_CURSO";
  
  const progreso = calcularProgresoFase(faseId, objetivos);
  if (progreso >= 100) return "COMPLETO";
  if (progreso > 0) return "EN_CURSO";
  
  return "PENDIENTE";
}
