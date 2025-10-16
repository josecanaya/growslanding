import {
  type PlanCardDescriptor,
  type PlanFeatureDefinition,
  type PlanLimitRule,
  type PlanLimitRuleId,
  type SubscriptionPlanId,
} from './types';

export const PLAN_CARDS: Record<SubscriptionPlanId, PlanCardDescriptor> = {
  FREE: {
    id: 'FREE',
    name: 'Free (Explorador)',
    shortName: 'Free',
    description:
      'Ideal para clientes que quieren explorar GROWS y llevar control b\u00e1sico de sus obras.',
    priceLabel: 'Gratis',
    priceAmount: 0,
    currency: 'ARS',
    cadenceLabel: 'mensual',
    highlight: '2 obras activas y modo demo de automatizaciones',
    benefits: [
      'Hasta 2 obras activas con seguimiento visual',
      'Panel de chat y notificaciones en modo demo',
      'Tareas y dependencias en modo lectura',
      'Vista demo de calendario y automatizaciones N8N',
    ],
    summary:
      'Explor\u00e1 GROWS, document\u00e1 avances y prob\u00e1 el flujo colaborativo.',
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    shortName: 'Starter',
    badge: 'M\u00e1s popular',
    description:
      'Para equipos de obra que necesitan planificaci\u00f3n activa y coordinaci\u00f3n con cuadrillas.',
    priceLabel: '$15.000 / mes',
    priceAmount: 15000,
    currency: 'ARS',
    cadenceLabel: 'mensual',
    highlight:
      '5 obras activas, BIM habilitado y automatizaciones limitadas de N8N',
    benefits: [
      'Hasta 5 obras activas con BIM y dependencias autom\u00e1ticas',
      'Hasta 3 tareas activas por obra con seguimiento',
      'Hasta 3 cuadrillas con asignaciones operativas',
      'Chat operativo, notificaciones internas y calendario manual',
    ],
    summary:
      'Plan ideal para obras en ejecuci\u00f3n con coordinaci\u00f3n entre oficina y campo.',
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    shortName: 'Pro',
    description:
      'Para constructoras que requieren trazabilidad completa, reportes y automatizaciones avanzadas.',
    priceLabel: '$25.000 / mes',
    priceAmount: 25000,
    currency: 'ARS',
    cadenceLabel: 'mensual',
    highlight:
      '10 obras activas, cuadrillas ilimitadas y reportes automatizados PDF/QR',
    benefits: [
      'Hasta 10 obras activas con auditor\u00eda y comparadores',
      'Hasta 10 tareas activas por obra y automatizaciones completas',
      'Cuadrillas ilimitadas con alertas y asignaciones autom\u00e1ticas',
      'Reportes PDF/QR, historial y sincronizaci\u00f3n de calendario externo',
    ],
    summary:
      'Todo el potencial de GROWS para operaciones con m\u00faltiples obras en simult\u00e1neo.',
  },
};

export const PLAN_FEATURES: PlanFeatureDefinition[] = [
  {
    id: 'chat',
    label: 'Chat colaborativo',
    type: 'boolean',
    values: {
      FREE: { enabled: true, description: 'Modo completo' },
      STARTER: { enabled: true, description: 'Modo completo' },
      PRO: { enabled: true, description: 'Modo completo' },
    },
  },
  {
    id: 'obras',
    label: 'Obras activas',
    type: 'cap',
    values: {
      FREE: {
        max: 2,
        unit: 'obras',
        description: 'Modo demo de BIM bloqueado',
      },
      STARTER: {
        max: 5,
        unit: 'obras',
        description: 'BIM habilitado',
      },
      PRO: {
        max: 10,
        unit: 'obras',
        description: 'Incluye auditor\u00eda y comparadores',
      },
    },
  },
  {
    id: 'tareas',
    label: 'Tareas activas',
    type: 'cap',
    values: {
      FREE: {
        max: 0,
        unit: 'tareas',
        description: 'Solo lectura y ejemplos demo',
      },
      STARTER: {
        max: 3,
        unit: 'tareas',
        description: 'Flujo limitado y automatizaciones b\u00e1sicas',
      },
      PRO: {
        max: 10,
        unit: 'tareas',
        description: 'Automatizaciones completas y dependencias avanzadas',
      },
    },
  },
  {
    id: 'cuadrillas',
    label: 'Cuadrillas activas',
    type: 'cap',
    values: {
      FREE: {
        max: 0,
        unit: 'cuadrillas',
        description: 'Vista demo sin asignaciones',
      },
      STARTER: {
        max: 3,
        unit: 'cuadrillas',
        description: 'Asignaciones operativas y seguimiento',
      },
      PRO: {
        max: null,
        unit: 'cuadrillas',
        description: 'Alertas autom\u00e1ticas y comparadores',
      },
    },
  },
  {
    id: 'bim',
    label: 'Visor BIM',
    type: 'boolean',
    values: {
      FREE: { enabled: false, description: 'Bloqueado' },
      STARTER: { enabled: true, description: 'Activado' },
      PRO: { enabled: true, description: 'Activado + auditor\u00eda' },
    },
  },
  {
    id: 'dependencias',
    label: 'Dependencias autom\u00e1ticas',
    type: 'boolean',
    values: {
      FREE: { enabled: false, description: 'No disponible' },
      STARTER: { enabled: true, description: 'Automatizaci\u00f3n limitada' },
      PRO: { enabled: true, description: 'Automatizaci\u00f3n completa' },
    },
  },
  {
    id: 'n8n',
    label: 'Automatizaciones N8N',
    type: 'mode',
    values: {
      FREE: { label: 'Modo demo', description: 'Flujos preconfigurados' },
      STARTER: {
        label: 'Limitadas',
        description: 'Automatizaciones operativas clave',
      },
      PRO: {
        label: 'Completas',
        description: 'Automatizaciones personalizadas ilimitadas',
      },
    },
  },
  {
    id: 'reportes',
    label: 'Reportes PDF/QR',
    type: 'boolean',
    values: {
      FREE: { enabled: false },
      STARTER: { enabled: false },
      PRO: { enabled: true, description: 'Generaci\u00f3n automatizada' },
    },
  },
  {
    id: 'auditoria',
    label: 'Auditor\u00eda hist\u00f3rica',
    type: 'boolean',
    values: {
      FREE: { enabled: false },
      STARTER: { enabled: false },
      PRO: { enabled: true, description: 'Bit\u00e1cora completa' },
    },
  },
  {
    id: 'comparadores',
    label: 'Comparadores de avance',
    type: 'boolean',
    values: {
      FREE: { enabled: false },
      STARTER: { enabled: false },
      PRO: {
        enabled: true,
        description: 'Comparaci\u00f3n multi-obra',
      },
    },
  },
  {
    id: 'notificaciones',
    label: 'Notificaciones',
    type: 'mode',
    values: {
      FREE: {
        label: 'Demo',
        description: 'Panel visual sin emisi\u00f3n real',
      },
      STARTER: {
        label: 'Operativas',
        description: 'Comunicaciones internas y alertas b\u00e1sicas',
      },
      PRO: {
        label: 'Automatizadas',
        description: 'Alertas + reportes PDF/QR',
      },
    },
  },
  {
    id: 'calendario',
    label: 'Calendario',
    type: 'mode',
    values: {
      FREE: { label: 'Demo', description: 'Vista en modo lectura' },
      STARTER: {
        label: 'Manual',
        description: 'Planificaci\u00f3n manual y recordatorios',
      },
      PRO: {
        label: 'Avanzado',
        description: 'Sincronizaci\u00f3n externa y automatizaciones',
      },
    },
  },
];

export const PLAN_LIMIT_RULES: Record<PlanLimitRuleId, PlanLimitRule> = {
  obras: {
    id: 'obras',
    label: 'Obras activas',
    feature: 'obras',
    thresholds: {
      FREE: 2,
      STARTER: 5,
      PRO: 10,
    },
    upgradeTargets: {
      FREE: 'STARTER',
      STARTER: 'PRO',
    },
    unit: 'obras',
    description:
      'Control\u00e1 tus proyectos activos seg\u00fan el plan contratado. Las obras finalizadas o canceladas no cuentan para el l\u00edmite.',
    blockedCopy:
      'Tu plan actual alcanz\u00f3 el m\u00e1ximo de obras activas. Actualiz\u00e1 tu plan para continuar creando obras nuevas.',
  },
  tareas: {
    id: 'tareas',
    label: 'Tareas activas',
    feature: 'tareas',
    thresholds: {
      FREE: 0,
      STARTER: 3,
      PRO: 10,
    },
    upgradeTargets: {
      FREE: 'STARTER',
      STARTER: 'PRO',
    },
    unit: 'tareas',
    description:
      'Cada tarea activa consume cupo. Las tareas finalizadas o archivadas no se contabilizan.',
    blockedCopy:
      'Tu plan actual no permite crear m\u00e1s tareas activas. Mejor\u00e1 tu plan para seguir planificando.',
  },
  cuadrillas: {
    id: 'cuadrillas',
    label: 'Cuadrillas activas',
    feature: 'cuadrillas',
    thresholds: {
      FREE: 0,
      STARTER: 3,
      PRO: null,
    },
    upgradeTargets: {
      FREE: 'STARTER',
      STARTER: 'PRO',
    },
    unit: 'cuadrillas',
    description:
      'Gestion\u00e1 tus cuadrillas activas y sus asignaciones. El plan Free permite solo visualizar ejemplos.',
    blockedCopy:
      'Tu plan actual no habilita la asignaci\u00f3n de cuadrillas. Sub\u00ed de plan para coordinar equipos reales.',
  },
  notificaciones: {
    id: 'notificaciones',
    label: 'Centro de notificaciones',
    feature: 'notificaciones',
    thresholds: {
      FREE: 0,
      STARTER: null,
      PRO: null,
    },
    upgradeTargets: {
      FREE: 'STARTER',
    },
    unit: 'acciones',
    description:
      'Gener\u00e1 y env\u00eda notificaciones operativas con el plan adecuado. En Free se muestra solo un tablero de ejemplo.',
    blockedCopy:
      'Activ\u00e1 un plan pago para emitir notificaciones reales y reportes PDF/QR.',
  },
  calendario: {
    id: 'calendario',
    label: 'Calendario inteligente',
    feature: 'calendario',
    thresholds: {
      FREE: 0,
      STARTER: null,
      PRO: null,
    },
    upgradeTargets: {
      FREE: 'STARTER',
    },
    unit: 'eventos',
    description:
      'Planific\u00e1 tus hitos desde el calendario de obra. En Free solo est\u00e1 disponible la vista demo.',
    blockedCopy:
      'Necesit\u00e1s un plan pago para planificar eventos y sincronizar recordatorios reales.',
  },
};

export const SUBSCRIPTION_UI_COPY = {
  accountHeading: 'Configuraci\u00f3n de cuenta',
  accountSubheading:
    'Gestion\u00e1 tu perfil profesional, preferencias y suscripci\u00f3n.',
  currentPlanLabel: 'Tu plan actual',
  simulatedNotice:
    'Est\u00e1s visualizando un plan simulado (modo desarrollador).',
  viewPlans: 'Ver planes',
  quickUpgrade: 'Upgrade r\u00e1pido',
  availablePlansHeading: 'Planes disponibles',
  availablePlansDescription:
    'Compar\u00e1 beneficios y eleg\u00ed el plan que mejor se adapte a tu obra.',
  planSelectedLabel: 'Plan seleccionado:',
  currentPlanButton: 'Plan actual',
  subscribeButton: 'Suscribirme',
  viewDetailsButton: 'Ver detalles',
  comparisonHeading: 'Comparativa de planes',
  comparisonDescription:
    'Visualiz\u00e1 qu\u00e9 funciones desbloque\u00e1s en cada plan de suscripci\u00f3n.',
  usageLoading: 'Cargando...',
  usageUnlimited: 'Ilimitado',
  usageLabel: (used: number, limitLabel: string) =>
    `${used} / ${limitLabel}`,
  usageFallback: 'Seguimiento visual',
  simulationToastTitle: 'Este ya es tu plan',
  simulationToastMessage:
    'Pod\u00e9s explorar otros planes y funciones desde el modo desarrollador.',
  successToastTitle: 'Suscripci\u00f3n actualizada',
  successToastMessage: (planId: string) =>
    `Tu cuenta ahora est\u00e1 configurada con el plan ${planId}.`,
  errorToastTitle: 'No se pudo actualizar',
  planPreviewReason:
    'Descubr\u00ed c\u00f3mo este plan potencia tu flujo de trabajo.',
  upgradeCta: 'Activar plan superior',
  readOnlyBadge: 'Modo demo',
} as const;
