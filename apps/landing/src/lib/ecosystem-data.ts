export interface Node {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'people' | 'modules' | 'data' | 'integrations';
  size: 'xs' | 's' | 'm' | 'l' | 'xl';
  color: string;
  borderColor?: string;
  icon?: string;
  subnodes?: string[];
  href?: string;
  // Propiedades para D3
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Link {
  source: string;
  target: string;
  type: 'solid' | 'dashed' | 'dotted';
  strength: number;
  bidirectional?: boolean;
}

export interface EcosystemData {
  nodes: Node[];
  links: Link[];
}

export const ecosystemData: EcosystemData = {
  nodes: [
    // 🔵 Núcleo central
    {
      id: 'grows-platform',
      name: 'GROWS Platform',
      description: 'Núcleo central del sistema que orquesta todos los flujos y datos',
      category: 'core',
      size: 'xl',
      color: '#2563eb', // azul primario
      borderColor: '#1d4ed8',
      icon: 'Network',
      subnodes: ['Orquestador de flujos', 'Data Hub'],
      href: '/ecosistema/platform'
    },

    // 🟦 Personas y roles
    {
      id: 'arquitecto',
      name: 'Arquitecto / Cliente técnico',
      description: 'Diseña y supervisa proyectos desde el panel de obras',
      category: 'people',
      size: 'l',
      color: '#0891b2', // turquesa
      icon: 'UserCheck',
      subnodes: ['Panel de obras', 'KPIs financieros'],
      href: '/ecosistema/arquitecto'
    },
    {
      id: 'coordinador',
      name: 'Coordinador de obra',
      description: 'Gestiona tareas y coordina el equipo de trabajo',
      category: 'people',
      size: 'l',
      color: '#0891b2',
      icon: 'Users',
      subnodes: ['Asignación de tareas', 'Gestión de incidencias'],
      href: '/ecosistema/coordinador'
    },
    {
      id: 'socio-constructor',
      name: 'Socio constructor',
      description: 'Ejecuta obras con cuadrillas especializadas',
      category: 'people',
      size: 'l',
      color: '#0891b2',
      icon: 'HardHat',
      subnodes: ['Cuadrillas', 'Reporte de avances'],
      href: '/ecosistema/socio-constructor'
    },
    {
      id: 'supervisor',
      name: 'Supervisor',
      description: 'Audita procesos y mantiene la calidad',
      category: 'people',
      size: 'l',
      color: '#0891b2',
      icon: 'Eye',
      subnodes: ['Auditoría', 'Alertas'],
      href: '/ecosistema/supervisor'
    },
    {
      id: 'cliente-final',
      name: 'Cliente final',
      description: 'Sigue el progreso y proporciona feedback',
      category: 'people',
      size: 'l',
      color: '#0891b2',
      icon: 'User',
      subnodes: ['Seguimiento', 'Feedback'],
      href: '/ecosistema/cliente-final'
    },

    // 🟡 Módulos funcionales
    {
      id: 'obras',
      name: 'Obras',
      description: 'Gestión de proyectos y roadmaps',
      category: 'modules',
      size: 'm',
      color: '#eab308', // amarillo acento
      borderColor: '#ca8a04',
      icon: 'Building',
      subnodes: ['Roadmap / Frentes activos'],
      href: '/ecosistema/obras'
    },
    {
      id: 'tareas',
      name: 'Tareas',
      description: 'Sistema de checklist digital y camino crítico',
      category: 'modules',
      size: 'm',
      color: '#eab308',
      borderColor: '#ca8a04',
      icon: 'CheckSquare',
      subnodes: ['Checklist digital / Camino crítico'],
      href: '/ecosistema/tareas'
    },
    {
      id: 'presupuestos',
      name: 'Presupuestos',
      description: 'Gestión financiera y cotizaciones',
      category: 'modules',
      size: 'm',
      color: '#eab308',
      borderColor: '#ca8a04',
      icon: 'DollarSign',
      subnodes: ['Cotizaciones / Billetera'],
      href: '/ecosistema/presupuestos'
    },
    {
      id: 'materiales',
      name: 'Materiales',
      description: 'Catálogo y logística de materiales',
      category: 'modules',
      size: 'm',
      color: '#eab308',
      icon: 'Package',
      subnodes: ['Catálogo / Logística'],
      href: '/ecosistema/materiales'
    },
    {
      id: 'cronograma',
      name: 'Cronograma',
      description: 'Gantt dinámico y alertas de holgura',
      category: 'modules',
      size: 'm',
      color: '#eab308',
      borderColor: '#ca8a04',
      icon: 'Calendar',
      subnodes: ['Gantt dinámico / Alertas de holgura'],
      href: '/ecosistema/cronograma'
    },
    {
      id: 'auditoria',
      name: 'Auditoría',
      description: 'Validaciones y historial de cambios',
      category: 'modules',
      size: 'm',
      color: '#eab308',
      borderColor: '#ca8a04',
      icon: 'Shield',
      subnodes: ['Validaciones / Historial'],
      href: '/ecosistema/auditoria'
    },

    // 🟣 Datos e insights
    {
      id: 'reportes',
      name: 'Reportes ejecutivos',
      description: 'KPIs de fase y reportes exportables',
      category: 'data',
      size: 'm',
      color: '#8b5cf6', // violeta
      icon: 'BarChart3',
      subnodes: ['KPIs fase / Exportables'],
      href: '/ecosistema/reportes'
    },
    {
      id: 'reputacion',
      name: 'Reputación',
      description: 'Métricas de desempeño y niveles de confianza',
      category: 'data',
      size: 'm',
      color: '#8b5cf6',
      icon: 'Award',
      subnodes: ['Métricas de desempeño / Niveles de confianza'],
      href: '/ecosistema/reputacion'
    },
    {
      id: 'documentacion',
      name: 'Documentación',
      description: 'Contratos, planos y documentos técnicos',
      category: 'data',
      size: 'm',
      color: '#8b5cf6',
      icon: 'FileText',
      subnodes: ['Contratos / Planos'],
      href: '/ecosistema/documentacion'
    },
    {
      id: 'flujos-aprobacion',
      name: 'Flujos de aprobación',
      description: 'Estados y SLA de procesos',
      category: 'data',
      size: 'm',
      color: '#8b5cf6',
      icon: 'Workflow',
      subnodes: ['Estados / SLA'],
      href: '/ecosistema/flujos-aprobacion'
    },
    {
      id: 'notificaciones',
      name: 'Notificaciones',
      description: 'Push notifications y recordatorios',
      category: 'data',
      size: 'm',
      color: '#8b5cf6',
      icon: 'Bell',
      subnodes: ['Push / Recordatorios'],
      href: '/ecosistema/notificaciones'
    },

    // ⚫ Integraciones y soporte
    {
      id: 'supabase',
      name: 'Supabase / DB',
      description: 'Base de datos y autenticación multi-tenant',
      category: 'integrations',
      size: 's',
      color: '#6b7280', // gris
      icon: 'Database',
      href: '/ecosistema/supabase'
    },
    {
      id: 'n8n',
      name: 'n8n Automations',
      description: 'Webhooks y automatizaciones',
      category: 'integrations',
      size: 's',
      color: '#6b7280',
      icon: 'Zap',
      href: '/ecosistema/n8n'
    },
    {
      id: 'pagos-protegidos',
      name: 'Pagos protegidos',
      description: 'Escrow y conciliación de pagos',
      category: 'integrations',
      size: 's',
      color: '#6b7280',
      icon: 'Lock',
      href: '/ecosistema/pagos-protegidos'
    },
    {
      id: 'analitica',
      name: 'Analítica',
      description: 'Data lake e insights futuros',
      category: 'integrations',
      size: 's',
      color: '#6b7280',
      icon: 'TrendingUp',
      href: '/ecosistema/analitica'
    }
  ],

  links: [
    // Conexiones principales del núcleo
    { source: 'grows-platform', target: 'obras', type: 'solid', strength: 0.8 },
    { source: 'grows-platform', target: 'tareas', type: 'solid', strength: 0.8 },
    { source: 'grows-platform', target: 'presupuestos', type: 'solid', strength: 0.8 },
    { source: 'grows-platform', target: 'supabase', type: 'solid', strength: 0.9 },
    { source: 'grows-platform', target: 'analitica', type: 'solid', strength: 0.7 },

    // Conexiones personas ↔ módulos
    { source: 'arquitecto', target: 'obras', type: 'solid', strength: 0.8, bidirectional: true },
    { source: 'coordinador', target: 'tareas', type: 'solid', strength: 0.8, bidirectional: true },
    { source: 'coordinador', target: 'cronograma', type: 'solid', strength: 0.7, bidirectional: true },
    { source: 'socio-constructor', target: 'obras', type: 'solid', strength: 0.8, bidirectional: true },
    { source: 'socio-constructor', target: 'materiales', type: 'solid', strength: 0.7, bidirectional: true },
    { source: 'supervisor', target: 'auditoria', type: 'solid', strength: 0.8, bidirectional: true },
    { source: 'cliente-final', target: 'reportes', type: 'dashed', strength: 0.6, bidirectional: true },
    { source: 'cliente-final', target: 'reputacion', type: 'dashed', strength: 0.6 },

    // Conexiones módulos ↔ datos
    { source: 'obras', target: 'reportes', type: 'dashed', strength: 0.6 },
    { source: 'tareas', target: 'cronograma', type: 'solid', strength: 0.7, bidirectional: true },
    { source: 'presupuestos', target: 'pagos-protegidos', type: 'solid', strength: 0.8, bidirectional: true },
    { source: 'auditoria', target: 'reportes', type: 'solid', strength: 0.7 },
    { source: 'auditoria', target: 'reputacion', type: 'dashed', strength: 0.6 },

    // Conexiones integraciones
    { source: 'supabase', target: 'reportes', type: 'dashed', strength: 0.5 },
    { source: 'n8n', target: 'notificaciones', type: 'solid', strength: 0.7 },
    { source: 'analitica', target: 'reputacion', type: 'dashed', strength: 0.5 }
  ]
};
