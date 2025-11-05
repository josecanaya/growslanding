export type FlowNode = 
  | "Cliente técnico" 
  | "Obra" 
  | "Plantillas" 
  | "Tareas" 
  | "Socio constructor" 
  | "Evidencias" 
  | "Validación" 
  | "Pagos" 
  | "KPIs/Reportes" 
  | "GROWS Core";

export interface FlowStep {
  id: number;
  source: FlowNode;
  target: FlowNode;
  title: string;
  desc: string;
  icon: string;
}

export const growsFlow: FlowStep[] = [
  { 
    id: 1, 
    source: "Cliente técnico", 
    target: "Obra", 
    title: "Creación de Obra", 
    desc: "Se registra una obra nueva (datos básicos, dirección, cliente).", 
    icon: "UserCog" 
  },
  { 
    id: 2, 
    source: "Obra", 
    target: "Plantillas", 
    title: "Aplicación de Plantillas", 
    desc: "Se aplican plantillas técnicas (1800+ tareas preconfiguradas).", 
    icon: "Layers" 
  },
  { 
    id: 3, 
    source: "Plantillas", 
    target: "Tareas", 
    title: "Generación de Tareas + CPM", 
    desc: "Se generan tareas con dependencias y calendario CPM.", 
    icon: "ListChecks" 
  },
  { 
    id: 4, 
    source: "Tareas", 
    target: "Socio constructor", 
    title: "Asignación", 
    desc: "Se asignan cuadrillas/ socios y se notifican prioridades.", 
    icon: "UsersRound" 
  },
  { 
    id: 5, 
    source: "Socio constructor", 
    target: "Evidencias", 
    title: "Registro en Obra", 
    desc: "Evidencias: fotos, geolocalización, checklist desde móvil.", 
    icon: "Camera" 
  },
  { 
    id: 6, 
    source: "Evidencias", 
    target: "Validación", 
    title: "Control Técnico", 
    desc: "El cliente técnico valida la entrega y cambia el estado.", 
    icon: "ClipboardCheck" 
  },
  { 
    id: 7, 
    source: "Validación", 
    target: "Pagos", 
    title: "Liberación de Pago", 
    desc: "Aprobada la validación, se libera el pago al socio.", 
    icon: "CreditCard" 
  },
  { 
    id: 8, 
    source: "Tareas", 
    target: "KPIs/Reportes", 
    title: "Analítica", 
    desc: "Avance, costos y rendimiento alimentan KPIs y reportes.", 
    icon: "BarChart3" 
  },
  { 
    id: 9, 
    source: "KPIs/Reportes", 
    target: "GROWS Core", 
    title: "Orquestación", 
    desc: "El motor ajusta CPM y dependencias (IA ligera).", 
    icon: "Cpu" 
  },
  { 
    id: 10, 
    source: "GROWS Core", 
    target: "Tareas", 
    title: "Reprogramación", 
    desc: "Se reordenan prioridades y se notifica a todos.", 
    icon: "RefreshCw" 
  },
];

