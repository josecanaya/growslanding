// GROWS Ecosystem - Estructura Jerárquica Completa
// Especificación interna de arquitectura para el equipo de diseño de producto

export interface GrowsNode {
  id: string;
  name: string;
  type: 'role' | 'core' | 'module' | 'output' | 'integration';
  size: number;
  color: string;
  position: { x: number; y: number };
  description: string;
  connectsTo: string[];
  children?: string[];
  level: number;
}

export interface GrowsConnection {
  source: string;
  target: string;
  type: 'solid' | 'dashed';
  direction: 'bidirectional' | 'unidirectional';
  weight: number;
}

export const growsEcosystemData = {
  nodes: [
    // Nivel 1: Roles Estratégicos (arriba)
    {
      id: 'arquitecto_cliente_tecnico',
      name: 'Arquitecto / Cliente Técnico',
      type: 'role' as const,
      size: 160,
      color: '#3DB7B0',
      position: { x: 200, y: 100 },
      description: 'Decisiones de diseño y validaciones técnicas',
      connectsTo: ['grows_control_tower'],
      level: 1
    },
    {
      id: 'socio_constructor',
      name: 'Socio Constructor',
      type: 'role' as const,
      size: 160,
      color: '#3DB7B0',
      position: { x: 700, y: 100 },
      description: 'Gestión operativa y recursos',
      connectsTo: ['grows_control_tower', 'proyecto'],
      level: 1
    },

    // Nivel 2: GROWS Control Tower (centro)
    {
      id: 'grows_control_tower',
      name: 'GROWS Control Tower',
      type: 'core' as const,
      size: 130,
      color: '#CFAF55',
      position: { x: 450, y: 350 },
      description: 'Orquestador central de flujos y datos',
      connectsTo: ['proyecto'],
      children: ['supabase_db', 'n8n_automations', 'pagos_protegidos', 'analitica'],
      level: 2
    },

    // Nivel 3: Procesos/Módulos Operativos (centro-abajo)
    {
      id: 'proyecto',
      name: 'Proyecto',
      type: 'module' as const,
      size: 100,
      color: '#F4C542',
      position: { x: 450, y: 550 },
      description: 'Entidad madre - Gestión central del proyecto',
      connectsTo: ['plan_trabajo', 'scheduling_engine', 'cost_manager', 'resource_hub', 'quality_gate'],
      level: 3
    },
    {
      id: 'plan_trabajo',
      name: 'Plan de Trabajo',
      type: 'module' as const,
      size: 80,
      color: '#F4C542',
      position: { x: 250, y: 550 },
      description: 'Organización de tareas y actividades',
      connectsTo: [],
      level: 3
    },
    {
      id: 'scheduling_engine',
      name: 'Scheduling Engine',
      type: 'module' as const,
      size: 80,
      color: '#F4C542',
      position: { x: 350, y: 550 },
      description: 'Gestión de cronogramas y tiempos',
      connectsTo: [],
      level: 3
    },
    {
      id: 'cost_manager',
      name: 'Cost Manager',
      type: 'module' as const,
      size: 80,
      color: '#F4C542',
      position: { x: 550, y: 550 },
      description: 'Gestión de presupuestos y costos',
      connectsTo: ['insights_hub', 'reputation_ledger', 'alert_system'],
      level: 3
    },
    {
      id: 'resource_hub',
      name: 'Resource Hub',
      type: 'module' as const,
      size: 80,
      color: '#F4C542',
      position: { x: 650, y: 550 },
      description: 'Gestión de cuadrillas y materiales',
      connectsTo: [],
      level: 3
    },
    {
      id: 'quality_gate',
      name: 'Quality Gate',
      type: 'module' as const,
      size: 80,
      color: '#F4C542',
      position: { x: 450, y: 650 },
      description: 'Control de calidad y checklist',
      connectsTo: ['insights_hub', 'reputation_ledger', 'alert_system'],
      level: 3
    },

    // Nivel 4: Resultados/Datos (abajo)
    {
      id: 'insights_hub',
      name: 'Insights Hub',
      type: 'output' as const,
      size: 70,
      color: '#A48BD0',
      position: { x: 300, y: 800 },
      description: 'Reportes y análisis de datos',
      connectsTo: [],
      level: 4
    },
    {
      id: 'reputation_ledger',
      name: 'Reputation Ledger',
      type: 'output' as const,
      size: 70,
      color: '#A48BD0',
      position: { x: 450, y: 800 },
      description: 'Sistema de reputación y calificaciones',
      connectsTo: [],
      level: 4
    },
    {
      id: 'alert_system',
      name: 'Alert System',
      type: 'output' as const,
      size: 70,
      color: '#A48BD0',
      position: { x: 600, y: 800 },
      description: 'Sistema de notificaciones y alertas',
      connectsTo: [],
      level: 4
    },

    // Nivel 5: Integraciones Técnicas (Orbitales - Electrones)
    {
      id: 'supabase_db',
      name: 'Supabase / DB',
      type: 'integration' as const,
      size: 100,
      color: '#1E40AF',
      position: { x: 450, y: 200 }, // 12:00 (arriba) - más cerca como electrón
      description: 'Base de datos y almacenamiento',
      connectsTo: ['grows_control_tower'],
      level: 5,
      orbital: { radius: 150, angle: 0 } // 0° = 12:00
    },
    {
      id: 'n8n_automations',
      name: 'n8n Automations',
      type: 'integration' as const,
      size: 100,
      color: '#1E40AF',
      position: { x: 600, y: 350 }, // 3:00 (derecha) - más cerca como electrón
      description: 'Automatización de procesos',
      connectsTo: ['grows_control_tower'],
      level: 5,
      orbital: { radius: 150, angle: 90 } // 90° = 3:00
    },
    {
      id: 'pagos_protegidos',
      name: 'Pagos Protegidos',
      type: 'integration' as const,
      size: 100,
      color: '#1E40AF',
      position: { x: 450, y: 500 }, // 6:00 (abajo) - más cerca como electrón
      description: 'Sistema de pagos seguro',
      connectsTo: ['grows_control_tower'],
      level: 5,
      orbital: { radius: 150, angle: 180 } // 180° = 6:00
    },
    {
      id: 'analitica',
      name: 'Analítica',
      type: 'integration' as const,
      size: 100,
      color: '#1E40AF',
      position: { x: 300, y: 350 }, // 9:00 (izquierda) - más cerca como electrón
      description: 'Análisis de datos y métricas',
      connectsTo: ['grows_control_tower'],
      level: 5,
      orbital: { radius: 150, angle: 270 } // 270° = 9:00
    }
  ] as GrowsNode[],

  connections: [
    // Conexiones principales (líneas continuas)
    { source: 'arquitecto_cliente_tecnico', target: 'grows_control_tower', type: 'solid', direction: 'unidirectional', weight: 3 },
    { source: 'socio_constructor', target: 'grows_control_tower', type: 'solid', direction: 'unidirectional', weight: 3 },
    { source: 'grows_control_tower', target: 'proyecto', type: 'solid', direction: 'unidirectional', weight: 4 },
    
    // Conexiones secundarias (líneas continuas)
    { source: 'socio_constructor', target: 'proyecto', type: 'solid', direction: 'unidirectional', weight: 2 },
    
    // Conexiones de módulos (líneas continuas)
    { source: 'proyecto', target: 'plan_trabajo', type: 'solid', direction: 'unidirectional', weight: 2 },
    { source: 'proyecto', target: 'scheduling_engine', type: 'solid', direction: 'unidirectional', weight: 2 },
    { source: 'proyecto', target: 'cost_manager', type: 'solid', direction: 'unidirectional', weight: 2 },
    { source: 'proyecto', target: 'resource_hub', type: 'solid', direction: 'unidirectional', weight: 2 },
    { source: 'proyecto', target: 'quality_gate', type: 'solid', direction: 'unidirectional', weight: 2 },
    
    // Conexiones a resultados (líneas continuas)
    { source: 'cost_manager', target: 'insights_hub', type: 'solid', direction: 'unidirectional', weight: 2 },
    { source: 'cost_manager', target: 'reputation_ledger', type: 'solid', direction: 'unidirectional', weight: 2 },
    { source: 'cost_manager', target: 'alert_system', type: 'solid', direction: 'unidirectional', weight: 2 },
    { source: 'quality_gate', target: 'insights_hub', type: 'solid', direction: 'unidirectional', weight: 2 },
    { source: 'quality_gate', target: 'reputation_ledger', type: 'solid', direction: 'unidirectional', weight: 2 },
    { source: 'quality_gate', target: 'alert_system', type: 'solid', direction: 'unidirectional', weight: 2 },
    
    // Conexiones orbitales (líneas punteadas)
    { source: 'grows_control_tower', target: 'supabase_db', type: 'dashed', direction: 'bidirectional', weight: 1 },
    { source: 'grows_control_tower', target: 'n8n_automations', type: 'dashed', direction: 'bidirectional', weight: 1 },
    { source: 'grows_control_tower', target: 'pagos_protegidos', type: 'dashed', direction: 'bidirectional', weight: 1 },
    { source: 'grows_control_tower', target: 'analitica', type: 'dashed', direction: 'bidirectional', weight: 1 }
  ] as GrowsConnection[]
};

// Configuración visual
export const growsVisualConfig = {
  canvas: {
    width: 1000,
    height: 1000,
    background: '#FFFFFF'
  },
  levels: {
    1: { name: 'Roles Estratégicos', color: '#3DB7B0', y: 100 },
    2: { name: 'Control Tower', color: '#CFAF55', y: 350 },
    3: { name: 'Procesos/Módulos', color: '#F4C542', y: 550 },
    4: { name: 'Resultados/Datos', color: '#A48BD0', y: 800 },
    5: { name: 'Integraciones Orbitales', color: '#3B82F6', y: 350 }
  },
  animations: {
    pulse: {
      duration: 2000,
      ease: 'ease-in-out'
    },
    hover: {
      scale: 1.1,
      duration: 300
    }
  },
  connections: {
    main: { width: 3, color: '#CFAF55', opacity: 0.8 },
    secondary: { width: 2, color: '#CFAF55', opacity: 0.8 },
    dashed: { width: 2, color: '#3B82F6', opacity: 0.8 }
  },
  orbital: {
    radius: 150,
    animation: {
      duration: 20,
      timing: 'linear',
      iteration: 'infinite'
    }
  }
};

// Storytelling UX
export const growsStorytelling = {
  title: 'Desde las decisiones del arquitecto hasta las métricas del cliente final',
  description: 'GROWS conecta personas, datos y procesos en un mismo flujo digital, transparente y colaborativo.',
  flow: [
    'Los roles estratégicos (Arquitecto, Socio Constructor, Supervisor) toman decisiones y aportan validaciones',
    'GROWS Control Tower orquesta todos los flujos y datos de manera centralizada',
    'Los módulos operativos (Proyecto, Plan de Trabajo, Cost Manager, etc.) ejecutan las operaciones',
    'Los resultados (Insights Hub, Reputation Ledger, Alert System) generan valor medible',
    'Las integraciones técnicas proporcionan el soporte y la automatización necesaria'
  ]
};
