export interface EcosystemNode {
  id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  color: string;
  size: 'xs' | 's' | 'm' | 'l' | 'xl';
  x?: number;
  y?: number;
  category: 'roles' | 'modules' | 'data' | 'integrations' | 'results' | 'center';
  href?: string;
  role?: 'architect' | 'partner' | 'supervisor';
}

export interface EcosystemConnection {
  from: string;
  to: string;
  type: 'center' | 'inner' | 'middle' | 'outer';
}

export interface EcosystemConfig {
  title: string;
  subtitle?: string;
  nodes: EcosystemNode[];
  connections: EcosystemConnection[];
}

export const ecosystems = {
  enterprise: {
    title: "Más que una plataforma, es un ecosistema.",
    nodes: [
      // Level 1: Roles
      {
        id: 'arquitecto',
        name: 'Arquitecto',
        description: 'Decisiones de diseño y validaciones técnicas',
        image: '/images/Icono_tecnico.png',
        color: '#1E293B',
        size: 'l',
        category: 'roles',
        href: '/es/roles/arquitecto-tecnico',
        role: 'architect'
      },
      {
        id: 'socio',
        name: 'Socio Constructor',
        description: 'Gestión operativa y recursos',
        image: '/images/Icono_socio.png',
        color: '#1E293B',
        size: 'l',
        category: 'roles',
        href: '/es/roles/socio-constructor',
        role: 'partner'
      },
      // Center: GROWS
      {
        id: 'grows',
        name: 'GROWS',
        description: 'Orquestador central de flujos y datos',
        image: '/images/growsapp.png',
        color: '#FFF8E7',
        size: 'xl',
        category: 'center'
      },
      // Integrations
      {
        id: 'supabase',
        name: 'DB',
        color: '#F0F9F4',
        size: 's',
        category: 'integrations'
      },
      {
        id: 'n8n',
        name: 'n8n',
        color: '#F0F9F4',
        size: 's',
        category: 'integrations'
      },
      {
        id: 'pagos',
        name: '',
        icon: 'payments',
        color: '#F0F9F4',
        size: 's',
        category: 'integrations'
      },
      {
        id: 'analitica',
        name: '',
        icon: 'analytics',
        color: '#F0F9F4',
        size: 's',
        category: 'integrations'
      },
      // Level 3: Modules
      {
        id: 'plan',
        name: 'Plan de Trabajo',
        description: 'Organización de tareas',
        icon: 'document',
        color: '#F8FAFC',
        size: 'm',
        category: 'modules'
      },
      {
        id: 'cost',
        name: 'Cost Manager',
        description: 'Presupuestos y costos',
        icon: 'money',
        color: '#F8FAFC',
        size: 'm',
        category: 'modules'
      },
      {
        id: 'quality',
        name: 'Quality Gate',
        description: 'Control de calidad',
        icon: 'check',
        color: '#F8FAFC',
        size: 'm',
        category: 'modules'
      },
      // Level 4: Results
      {
        id: 'insights',
        name: 'Insights Hub',
        description: 'Reportes y análisis',
        icon: 'chart',
        color: '#F8F5FF',
        size: 's',
        category: 'results'
      },
      {
        id: 'reputation',
        name: 'Reputation Ledger',
        description: 'Sistema de reputación',
        icon: 'star',
        color: '#F8F5FF',
        size: 's',
        category: 'results'
      },
      {
        id: 'alerts',
        name: 'Alert System',
        description: 'Notificaciones',
        icon: 'alert',
        color: '#F8F5FF',
        size: 's',
        category: 'results'
      }
    ] as EcosystemNode[],
    connections: [
      { from: 'grows', to: 'arquitecto', type: 'center' },
      { from: 'grows', to: 'socio', type: 'center' },
      { from: 'grows', to: 'supabase', type: 'outer' },
      { from: 'grows', to: 'n8n', type: 'outer' },
      { from: 'grows', to: 'pagos', type: 'outer' },
      { from: 'grows', to: 'analitica', type: 'outer' }
    ] as EcosystemConnection[]
  },
  
  simplified: {
    title: "Ecosistema GROWS",
    subtitle: "Una red conectada de personas, módulos y sistemas trabajando en armonía",
    nodes: [
      // Center
      {
        id: 'grows-center',
        name: 'GROWS',
        color: '#CFAF55',
        size: 'xs',
        category: 'center',
        x: 400,
        y: 300
      },
      // People (turquoise)
      {
        id: 'arquitecto',
        name: 'Arquitecto',
        color: '#3DB7B0',
        size: 'l',
        category: 'roles',
        x: 400,
        y: 180
      },
      {
        id: 'coordinador',
        name: 'Coordinador',
        color: '#3DB7B0',
        size: 'l',
        category: 'roles',
        x: 520,
        y: 220
      },
      {
        id: 'socio-constructor',
        name: 'Constructor',
        color: '#3DB7B0',
        size: 'l',
        category: 'roles',
        x: 520,
        y: 380
      },
      {
        id: 'supervisor',
        name: 'Supervisor',
        color: '#3DB7B0',
        size: 'l',
        category: 'roles',
        x: 400,
        y: 420
      },
      {
        id: 'cliente-final',
        name: 'Cliente',
        color: '#3DB7B0',
        size: 'l',
        category: 'roles',
        x: 280,
        y: 380
      },
      // Modules (yellow)
      {
        id: 'obras',
        name: 'Obras',
        color: '#F4C542',
        size: 'm',
        category: 'modules',
        x: 400,
        y: 120
      },
      {
        id: 'tareas',
        name: 'Tareas',
        color: '#F4C542',
        size: 'm',
        category: 'modules',
        x: 580,
        y: 180
      },
      {
        id: 'presupuestos',
        name: 'Presupuestos',
        color: '#F4C542',
        size: 'm',
        category: 'modules',
        x: 580,
        y: 420
      },
      {
        id: 'materiales',
        name: 'Materiales',
        color: '#F4C542',
        size: 'm',
        category: 'modules',
        x: 400,
        y: 480
      },
      {
        id: 'cronograma',
        name: 'Cronograma',
        color: '#F4C542',
        size: 'm',
        category: 'modules',
        x: 220,
        y: 420
      },
      {
        id: 'auditoria',
        name: 'Auditoría',
        color: '#F4C542',
        size: 'm',
        category: 'modules',
        x: 220,
        y: 180
      },
      // Data (violet)
      {
        id: 'reportes',
        name: 'Reportes',
        color: '#A48BD0',
        size: 's',
        category: 'data',
        x: 400,
        y: 80
      },
      {
        id: 'documentacion',
        name: 'Documentación',
        color: '#A48BD0',
        size: 's',
        category: 'data',
        x: 640,
        y: 140
      },
      {
        id: 'reputacion-data',
        name: 'Reputación',
        color: '#A48BD0',
        size: 's',
        category: 'data',
        x: 640,
        y: 460
      },
      {
        id: 'notificaciones',
        name: 'Notificaciones',
        color: '#A48BD0',
        size: 's',
        category: 'data',
        x: 400,
        y: 520
      },
      // Integrations (gray)
      {
        id: 'supabase-int',
        name: 'Supabase',
        color: '#9DA3A6',
        size: 's',
        category: 'integrations',
        x: 160,
        y: 460
      },
      {
        id: 'n8n-int',
        name: 'n8n',
        color: '#9DA3A6',
        size: 's',
        category: 'integrations',
        x: 160,
        y: 140
      },
      {
        id: 'pagos-protegidos',
        name: 'Pagos',
        color: '#9DA3A6',
        size: 's',
        category: 'integrations',
        x: 320,
        y: 520
      },
      {
        id: 'analitica-int',
        name: 'Analítica',
        color: '#9DA3A6',
        size: 's',
        category: 'integrations',
        x: 480,
        y: 520
      }
    ] as EcosystemNode[],
    connections: [
      { from: 'grows-center', to: 'arquitecto', type: 'center' },
      { from: 'grows-center', to: 'coordinador', type: 'center' },
      { from: 'grows-center', to: 'socio-constructor', type: 'center' },
      { from: 'grows-center', to: 'supervisor', type: 'center' },
      { from: 'grows-center', to: 'cliente-final', type: 'center' }
    ] as EcosystemConnection[]
  }
} as const;

