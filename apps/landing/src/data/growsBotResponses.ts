export type GrowsBotAction = {
  label: string;
  section: string;
};

export type GrowsBotIntent = {
  keywords: string[];
  reply: string;
  actions?: GrowsBotAction[];
};

export const growsBotIntents: GrowsBotIntent[] = [
  {
    keywords: ["hola", "buenas", "qué tal", "que tal", "saludo"],
    reply:
      "¡Hola! Soy GROWS·Bot 👋 Tu asistente de obra digital. ¿Qué querés conocer?",
  },
  {
    keywords: ["bienvenido", "inicio", "empezar"],
    reply:
      "GROWS te recibe con una torre de control digital que conecta planificación, equipos y reputación.",
  },
  {
    keywords: [
      "cómo funciona grows",
      "como funciona grows",
      "cómo funciona",
      "como funciona",
      "funciona grows",
    ],
    reply:
      "GROWS orquesta planificación, ejecución y reputación desde una única Control Tower conectada.",
    actions: [{ label: "Ver Soluciones", section: "soluciones" }],
  },
  {
    keywords: ["qué es grows", "que es grows", "qué hace grows"],
    reply:
      "GROWS es un ecosistema digital que conecta planificación técnica, ejecución en obra y reputación profesional.",
  },
  {
    keywords: ["grows", "plataforma grows", "bot grows"],
    reply:
      "GROWS centraliza obras, equipos y pagos con trazabilidad completa para todos los actores de la construcción.",
    actions: [{ label: "Ver Soluciones", section: "soluciones" }],
  },
  {
    keywords: ["obras", "proyectos", "obras en grows"],
    reply:
      "Cada obra en GROWS nace planificada, se ejecuta con seguimiento digital y se audita en tiempo real.",
    actions: [{ label: "Ir a Obras", section: "obras" }],
  },
  {
    keywords: ["ecosistema", "control tower", "torre de control", "módulos"],
    reply:
      "El ecosistema GROWS integra módulos de planificación, control de calidad, pagos y reputación bajo la Control Tower.",
  },
  {
    keywords: ["problemas", "errores", "dolores", "dificultades"],
    reply: "Mirá los problemas más comunes que GROWS resuelve 👇",
    actions: [{ label: "Ver Problemas", section: "problemas" }],
  },
  {
    keywords: ["soluciones", "ventajas", "beneficios", "herramientas"],
    reply: "Así es como GROWS automatiza tareas y centraliza la gestión de obra.",
    actions: [{ label: "Ver Soluciones", section: "soluciones" }],
  },
  {
    keywords: ["reputación", "ranking", "niveles", "puntaje"],
    reply:
      "La reputación GROWS escala de Hierro → Bronce → Plata → Platino → Oro a medida que validás tareas con calidad.",
    actions: [{ label: "Ver Reputación", section: "reputacion" }],
  },
  {
    keywords: ["precios", "planes", "suscripción", "suscripcion", "costo"],
    reply:
      "GROWS ofrece planes gratuitos para socios constructores y paquetes premium para estudios y desarrolladoras.",
    actions: [{ label: "Ver Planes", section: "precios" }],
  },
  {
    keywords: ["contacto", "ayuda", "hablar", "soporte"],
    reply:
      "Podés escribirnos o agendar una demo desde la sección de contacto 📩",
    actions: [{ label: "Ir a Contacto", section: "contacto" }],
  },
  {
    keywords: ["roles", "perfiles", "quiénes usan", "quienes usan"],
    reply:
      "En GROWS conviven Cliente Técnico, Socios Constructores, coordinadores de obra y especialistas.",
  },
  {
    keywords: ["cliente técnico", "cliente tecnico", "arquitecto", "planificador"],
    reply:
      "El Cliente Técnico planea, valida entregables y aprueba pagos desde la Control Tower.",
  },
  {
    keywords: ["socio", "socio constructor", "cuadrilla", "equipo de obra"],
    reply:
      "Los Socios Constructores ejecutan tareas, cargan evidencias y ganan reputación con cada entrega aprobada.",
  },
  {
    keywords: ["automatización", "automatizacion", "robot", "automatizar"],
    reply:
      "GROWS automatiza notificaciones, conciliaciones de pagos y reportes para reducir tiempos muertos.",
  },
  {
    keywords: ["ia", "inteligencia", "bot", "inteligencia artificial"],
    reply:
      "Este chat simula al futuro GROWS·IA. Pronto vas a conversar con una IA constructiva que entiende tu obra.",
  },
  {
    keywords: ["pagos", "cobros", "liberación de pagos", "pagos automáticos"],
    reply:
      "Los pagos se liberan automáticamente cuando el Cliente Técnico valida tareas, garantizando transparencia.",
  },
  {
    keywords: ["wallet", "billetera", "saldo", "caja"],
    reply:
      "La wallet de GROWS registra adelantos, retenciones y pagos liberados por obra y por rol.",
  },
  {
    keywords: ["cronograma", "planificación", "planificacion", "calendario"],
    reply:
      "El cronograma CPM de GROWS recalcula dependencias y tiempos reales para que cada cuadrilla sepa qué sigue.",
  },
  {
    keywords: ["reportes", "indicadores", "dashboard", "métricas"],
    reply:
      "Tenés dashboards con avance físico, costos, productividad y reputación listos para compartir.",
  },
  {
    keywords: ["calidad", "quality gate", "validaciones", "control"],
    reply:
      "El Quality Gate digital asegura fotos, checklists y aprobaciones técnicas antes de cerrar cada etapa.",
  },
  {
    keywords: ["documentación", "documentacion", "planos", "archivos"],
    reply:
      "Planos, presupuestos y manuales quedan versionados y seguros en el repositorio técnico de GROWS.",
  },
  {
    keywords: ["equipos", "colaboradores", "personas", "obreros"],
    reply:
      "Invitá a todo tu equipo: cada rol tiene permisos específicos y ve solo lo que necesita.",
  },
  {
    keywords: ["comunicación", "chat interno", "mensaje", "conversación"],
    reply:
      "GROWS centraliza la comunicación por tarea, evitando chats dispersos y pérdidas de información.",
  },
  {
    keywords: ["notificaciones", "alertas", "recordatorios", "avisos"],
    reply:
      "Recibís alertas cuando falta evidencia, hay atrasos o cuando un pago está listo para liberarse.",
  },
  {
    keywords: ["seguridad", "datos", "privacidad", "encriptado"],
    reply:
      "Toda la información de GROWS está cifrada, auditada y con accesos jerarquizados.",
  },
  {
    keywords: ["demo", "tour", "presentación", "presentacion"],
    reply:
      "Coordinamos demos guiadas para estudios y constructoras. Contanos qué buscás y te mostramos el flujo completo.",
  },
  {
    keywords: ["onboarding", "implementación", "implementacion", "puesta en marcha"],
    reply:
      "El onboarding incluye setup de proyectos, capacitación de roles y acompañamiento en las primeras obras.",
  },
  {
    keywords: ["clientes", "propietario", "dueño", "dueño de obra"],
    reply:
      "Los clientes finales siguen el avance con reportes claros y consolidan confianza con el equipo técnico.",
  },
  {
    keywords: ["feedback", "retroalimentación", "comentarios", "calificaciones"],
    reply:
      "Cada entrega recibe feedback estructurado que alimenta la reputación y mejora procesos futuros.",
  },
  {
    keywords: ["inversión", "inversion", "roi", "retorno", "ahorro"],
    reply:
      "GROWS reduce retrabajos, baja costos invisibles y acelera el retorno de inversión del proyecto.",
  },
  {
    keywords: ["integraciones", "bim", "cad", "apis"],
    reply:
      "GROWS integra datos BIM/CAD y APIs externas para mantener coherencia entre documentación y ejecución.",
  },
  {
    keywords: ["gracias", "chau", "adiós", "adios", "hasta luego"],
    reply:
      "¡Gracias por visitar GROWS! Que tus obras crezcan con nosotros 🌱. Si necesitás algo más, seguí chateando.",
  },
];

export const growsBotFallback =
  "Todavía no tengo información sobre eso, pero puedo mostrarte cómo funciona GROWS 👷.";

export const growsBotInitialGreeting =
  "👋 ¡Bienvenido a GROWS! ¿Querés que te muestre cómo funciona el sistema?";
