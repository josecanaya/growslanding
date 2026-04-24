/**
 * Mock data para el frontend del socio (demo / Stitch).
 * - Desarrollo: usa mocks salvo `NEXT_PUBLIC_SOCIO_USE_MOCK=false` en .env
 * - Producción: solo mocks si `NEXT_PUBLIC_SOCIO_USE_MOCK=true`
 */
export const USE_MOCK_DATA =
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_SOCIO_USE_MOCK !== 'false'
    : process.env.NEXT_PUBLIC_SOCIO_USE_MOCK === 'true';

/**
 * Ruta `/socio/ahora`: vista fija estilo Stitch (jornada activa, checklist, slider).
 * Desactivar: `NEXT_PUBLIC_SOCIO_AHORA_MOCK=false`
 */
export const USE_AHORA_STITCH_MOCK =
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_SOCIO_AHORA_MOCK !== 'false'
    : process.env.NEXT_PUBLIC_SOCIO_AHORA_MOCK === 'true';

/**
 * Presupuestos: siempre datos mock (listado + detalle) para ver UI sin API.
 * Desactivar: `NEXT_PUBLIC_SOCIO_PRESUPUESTOS_MOCK=false`
 */
export const FORCE_PRESUPUESTOS_MOCK =
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_SOCIO_PRESUPUESTOS_MOCK !== 'false'
    : process.env.NEXT_PUBLIC_SOCIO_PRESUPUESTOS_MOCK === 'true';

export type AhoraStitchItemState = 'done' | 'active' | 'pending';

export interface AhoraStitchChecklistItem {
  id: string;
  title: string;
  state: AhoraStitchItemState;
}

/** Ref. `stitch_socio/_02_ahora/ahora_responsive_jornada_activa` (modo en obra) */
export const MOCK_AHORA_STITCH = {
  marca: 'Grows',
  titulo: 'Poda de Setos',
  /** Reloj que arranca al montar (segundos desde inicio de jornada simulada) */
  segundosInicio: 2 * 3600 + 45 * 60 + 12,
  progresoHecho: 4,
  progresoTotal: 6,
  checklist: [
    { id: 'c1', title: 'Corte de césped', state: 'done' as const },
    { id: 'c2', title: 'Poda de Setos', state: 'active' as const },
    { id: 'c3', title: 'Limpieza de bordes', state: 'pending' as const },
    { id: 'c4', title: 'Retiro de residuos', state: 'pending' as const },
  ] satisfies AhoraStitchChecklistItem[],
};

/** Nombre para el saludo en modo demo (empresa) */
export const MOCK_USER_DISPLAY_NAME = 'ALPHA CONSTRUCCIONES';

// ============================================
// TIPOS DE DATOS MOCK
// ============================================

export interface MockSolicitud {
  id: string;
  obra_id: string;
  tipo_trabajo: string;
  zona: string;
  inicio_estimado_dias: number;
  duracion_estimada_dias: number;
  urgencia: 'ALTA' | 'MEDIA' | 'BAJA';
  cantidad_tareas: number;
  estado: 'RECIBIENDO_PRESUPUESTOS' | 'PRESUPUESTO_ENVIADO';
  socio_ya_presupuesto: boolean;
  obra_name: string;
  direccion_completa: string;
  fecha_inicio_estimada: string | null;
  etapa: string | null;
}

export interface MockPresupuesto {
  id: string;
  obra_id: string;
  obra_name: string;
  direccion_completa: string | null;
  fecha_inicio: string | null;
  estado: 'ENVIADO' | 'APROBADO' | 'RECHAZADO' | 'PENDIENTE';
  fecha_envio: string;
  inicio_estimado: string | null;
  cantidad_tareas: number;
  pendientes: number;
  enviados: number;
  aprobados: number;
}

export interface MockObra {
  id: string;
  obra_id: string;
  obra_name: string;
  direccion_completa: string | null;
  fecha_inicio: string | null;
  tareas_totales: number;
  tareas_en_progreso: number;
  estado: 'ACTIVA' | 'PAUSADA' | 'FINALIZADA';
  presupuestos_aprobados: number;
}

export interface MockTrabajoActual {
  obra: string;
  bloque_actual: number;
  bloques_totales: number;
  estado: 'EN_PROGRESO' | null;
  obra_name: string | null;
  tarea_title: string | null;
  subtarea_orden: number | null;
}

// ============================================
// DATOS MOCK
// ============================================

export const MOCK_SOLICITUDES: MockSolicitud[] = [
  {
    id: 'solicitud-001',
    obra_id: 'obra-001',
    tipo_trabajo: 'Revoque exterior · Obra gris',
    zona: 'Rosario · Zona Sur',
    inicio_estimado_dias: 10,
    duracion_estimada_dias: 30,
    urgencia: 'ALTA',
    cantidad_tareas: 12,
    estado: 'RECIBIENDO_PRESUPUESTOS',
    socio_ya_presupuesto: false,
    obra_name: 'Edificio Residencial Rosario',
    direccion_completa: 'Av. San Martín 325, Rosario',
    fecha_inicio_estimada: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    etapa: 'Obra gris',
  },
  {
    id: 'solicitud-002',
    obra_id: 'obra-002',
    tipo_trabajo: 'Instalación eléctrica completa',
    zona: 'Córdoba · Centro',
    inicio_estimado_dias: 15,
    duracion_estimada_dias: 20,
    urgencia: 'ALTA',
    cantidad_tareas: 18,
    estado: 'RECIBIENDO_PRESUPUESTOS',
    socio_ya_presupuesto: false,
    obra_name: 'Edificio Córdoba 1200',
    direccion_completa: 'Córdoba 1200, Córdoba',
    fecha_inicio_estimada: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    etapa: 'Instalaciones',
  },
  {
    id: 'solicitud-003',
    obra_id: 'obra-003',
    tipo_trabajo: 'Pintura interior y exterior',
    zona: 'Buenos Aires · Palermo',
    inicio_estimado_dias: 25,
    duracion_estimada_dias: 15,
    urgencia: 'MEDIA',
    cantidad_tareas: 8,
    estado: 'RECIBIENDO_PRESUPUESTOS',
    socio_ya_presupuesto: false,
    obra_name: 'Casa Palermo',
    direccion_completa: 'Av. Santa Fe 2500, Palermo',
    fecha_inicio_estimada: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    etapa: 'Terminaciones',
  },
  {
    id: 'solicitud-004',
    obra_id: 'obra-004',
    tipo_trabajo: 'Construcción de mampostería',
    zona: 'La Plata · Centro',
    inicio_estimado_dias: 30,
    duracion_estimada_dias: 45,
    urgencia: 'MEDIA',
    cantidad_tareas: 22,
    estado: 'RECIBIENDO_PRESUPUESTOS',
    socio_ya_presupuesto: false,
    obra_name: 'Obra La Plata Centro',
    direccion_completa: 'Calle 50 1200, La Plata',
    fecha_inicio_estimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    etapa: 'Estructura',
  },
  {
    id: 'solicitud-005',
    obra_id: 'obra-005',
    tipo_trabajo: 'Instalación sanitaria',
    zona: 'Mendoza · Godoy Cruz',
    inicio_estimado_dias: 20,
    duracion_estimada_dias: 12,
    urgencia: 'BAJA',
    cantidad_tareas: 6,
    estado: 'RECIBIENDO_PRESUPUESTOS',
    socio_ya_presupuesto: false,
    obra_name: 'Casa Godoy Cruz',
    direccion_completa: 'Av. San Martín 800, Godoy Cruz',
    fecha_inicio_estimada: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    etapa: 'Instalaciones',
  },
  {
    id: 'solicitud-006',
    obra_id: 'obra-006',
    tipo_trabajo: 'Carpintería y herrería',
    zona: 'Rosario · Zona Norte',
    inicio_estimado_dias: 40,
    duracion_estimada_dias: 18,
    urgencia: 'BAJA',
    cantidad_tareas: 10,
    estado: 'RECIBIENDO_PRESUPUESTOS',
    socio_ya_presupuesto: false,
    obra_name: 'Obra Zona Norte',
    direccion_completa: 'Av. Pellegrini 1500, Rosario',
    fecha_inicio_estimada: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    etapa: 'Terminaciones',
  },
];

export const MOCK_PRESUPUESTOS: MockPresupuesto[] = [
  {
    id: 'pres-001',
    obra_id: 'obra-001',
    obra_name: 'Obra San Martín 325',
    direccion_completa: 'Av. San Martín 325, Rosario',
    fecha_inicio: null,
    estado: 'ENVIADO',
    fecha_envio: '2024-12-10',
    inicio_estimado: '2025-01-15',
    cantidad_tareas: 14,
    pendientes: 0,
    enviados: 1,
    aprobados: 0,
  },
  {
    id: 'pres-002',
    obra_id: 'obra-002',
    obra_name: 'Edificio Córdoba 1200',
    direccion_completa: 'Córdoba 1200, Córdoba',
    fecha_inicio: '2025-01-20',
    estado: 'APROBADO',
    fecha_envio: '2024-11-25',
    inicio_estimado: '2025-01-20',
    cantidad_tareas: 18,
    pendientes: 0,
    enviados: 0,
    aprobados: 1,
  },
  {
    id: 'pres-003',
    obra_id: 'obra-003',
    obra_name: 'Casa Palermo',
    direccion_completa: 'Av. Santa Fe 2500, Palermo',
    fecha_inicio: null,
    estado: 'PENDIENTE',
    fecha_envio: '',
    inicio_estimado: null,
    cantidad_tareas: 8,
    pendientes: 1,
    enviados: 0,
    aprobados: 0,
  },
];

export const MOCK_OBRAS: MockObra[] = [
  {
    id: 'obra-002',
    obra_id: 'obra-002',
    obra_name: 'Edificio Córdoba 1200',
    direccion_completa: 'Córdoba 1200, Córdoba',
    fecha_inicio: '2025-01-20',
    tareas_totales: 18,
    tareas_en_progreso: 3,
    estado: 'ACTIVA',
    presupuestos_aprobados: 1,
  },
];

export const MOCK_TRABAJO_ACTIVO: MockTrabajoActual = {
  obra: 'Obra San Martín 325',
  bloque_actual: 4,
  bloques_totales: 12,
  estado: 'EN_PROGRESO',
  obra_name: 'Obra San Martín 325',
  tarea_title: 'Revoque exterior · Obra gris',
  subtarea_orden: 4,
};

export const MOCK_TRABAJO_SIN_ACTIVO: MockTrabajoActual = {
  obra: '',
  bloque_actual: 0,
  bloques_totales: 0,
  estado: null,
  obra_name: null,
  tarea_title: null,
  subtarea_orden: null,
};

/** Trabajos para hoy (sección principal del home socio) — demo video */
export interface MockTrabajoHoy {
  id: string;
  obra_name: string;
  tarea_title: string;
  bloque_actual: number;
  bloques_totales: number;
  estado: string;
  tiempo_estimado?: string;
}

export const MOCK_TRABAJOS_HOY: MockTrabajoHoy[] = [
  {
    id: 'trabajo-1',
    obra_name: 'Obra San Martín 325',
    tarea_title: 'Revoque exterior',
    bloque_actual: 3,
    bloques_totales: 12,
    estado: 'en_progreso',
    tiempo_estimado: '4 horas',
  },
];

/** Mock de subtarea activa para "Tu jornada de hoy" (AhoraSection) — como si estuvieras realizando una tarea */
export const MOCK_SUBTAREA_JORNADA_HOY = {
  id: 'mock-subtarea-1',
  tarea_id: 'mock-tarea-1',
  orden: 3,
  cantidad: 35,
  unidad: 'm²',
  estado: 'en_progreso',
  tareas: {
    id: 'mock-tarea-1',
    title: 'Revoque exterior',
    obra_id: 'obra-001',
    estado: 'en_progreso',
    obras: {
      id: 'obra-001',
      name: 'Obra San Martín 325',
      address: 'Av. San Martín 325, Rosario',
    },
  },
};

/** Mock de checklist para demo (Revoque exterior) */
export const MOCK_CHECKLIST_ITEMS = [
  { id: 'mock-c1', label: 'Verificar materiales y mezcla', done: true },
  { id: 'mock-c2', label: 'Preparar superficie y guías', done: true },
  { id: 'mock-c3', label: 'Aplicar revoque bloque 3', done: true },
  { id: 'mock-c4', label: 'Control de plomo y regla', done: false },
  { id: 'mock-c5', label: 'Control de calidad final', done: false },
];

/** Mock de mensajes de chat para demo */
export const MOCK_MENSAJES_CHAT = [
  {
    id: 'msg-1',
    contenido: 'Hola, ¿cómo va el bloque 3 de revoque?',
    remitente_tipo: 'cliente' as const,
    remitente_id: 'cliente-1',
    destinatario_tipo: 'socio' as const,
    destinatario_id: 'socio-1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    leido: true,
  },
  {
    id: 'msg-2',
    contenido: 'Bien, ya terminé la mitad. Para esta tarde termino el bloque.',
    remitente_tipo: 'socio' as const,
    remitente_id: 'socio-1',
    destinatario_tipo: 'cliente' as const,
    destinatario_id: 'cliente-1',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    leido: true,
  },
  {
    id: 'msg-3',
    contenido: 'Perfecto, avisame cuando esté para pasar a revisar.',
    remitente_tipo: 'cliente' as const,
    remitente_id: 'cliente-1',
    destinatario_tipo: 'socio' as const,
    destinatario_id: 'socio-1',
    created_at: new Date(Date.now() - 600000).toISOString(),
    leido: false,
  },
];

// ============================================
// MOCKS PARA BILLETERA (saldo y movimientos en millones ARS)
// ============================================

/** Saldo mock: varios millones de pesos argentinos para demo */
export const MOCK_BILLETERA_SALDO = {
  saldo_actual: 2_850_000,
  saldo_pendiente: 580_000,
  moneda: 'ARS',
};

/** Movimientos mock: créditos por tareas y un retiro anterior */
export const MOCK_BILLETERA_MOVIMIENTOS = [
  {
    id: 'mov-1',
    owner_tipo: 'SOCIO' as const,
    owner_id: 'socio-1',
    tipo: 'CREDITO' as const,
    monto: 420_000,
    concepto: 'Pago bloque 3 - Revoque exterior · Obra San Martín 325',
    tarea_id: 't-1',
    presupuesto_id: null,
    estado: 'completado',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mov-2',
    owner_tipo: 'SOCIO' as const,
    owner_id: 'socio-1',
    tipo: 'DEBITO' as const,
    monto: 1_200_000,
    concepto: 'Retiro a cuenta bancaria',
    tarea_id: null,
    presupuesto_id: null,
    estado: 'completado',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mov-3',
    owner_tipo: 'SOCIO' as const,
    owner_id: 'socio-1',
    tipo: 'CREDITO' as const,
    monto: 385_000,
    concepto: 'Pago losa PB · Obra San Martín 325',
    tarea_id: 't-2',
    presupuesto_id: null,
    estado: 'completado',
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mov-4',
    owner_tipo: 'SOCIO' as const,
    owner_id: 'socio-1',
    tipo: 'CREDITO' as const,
    monto: 680_000,
    concepto: 'Pago terminaciones · Casa Palermo',
    tarea_id: 't-3',
    presupuesto_id: null,
    estado: 'completado',
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mov-5',
    owner_tipo: 'SOCIO' as const,
    owner_id: 'socio-1',
    tipo: 'CREDITO' as const,
    monto: 580_000,
    concepto: 'Pago pendiente de validación · Revoque bloque 4',
    tarea_id: 't-4',
    presupuesto_id: null,
    estado: 'pendiente',
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
];

// ============================================
// MOCKS PARA PÁGINA PRESUPUESTOS (editar/enviar)
// ============================================

/** Lista de obras para Presupuestos (ListaObras) — demo sin base de datos */
export interface MockObraPresupuestosList {
  obra_id: string;
  obra_name: string;
  direccion_completa?: string | null;
  fecha_inicio?: string | null;
  pendientes: number;
  enviados: number;
  aprobados: number;
  /** Ref. `presupuestos_responsive_mis_lista` (badge + borde lateral) */
  stitch_estado?: 'aprobado' | 'visto' | 'enviado' | 'rechazado' | 'pendiente';
}

export const MOCK_OBRAS_PARA_PRESUPUESTOS: MockObraPresupuestosList[] = [
  {
    obra_id: 'obra-001',
    obra_name: 'Obra San Martín 325',
    direccion_completa: 'Av. San Martín 325, Rosario',
    fecha_inicio: null,
    pendientes: 1,
    enviados: 0,
    aprobados: 0,
    stitch_estado: 'pendiente',
  },
  {
    obra_id: 'obra-002',
    obra_name: 'Residencia Los Olivos — Fase 1',
    direccion_completa: 'Ruta 8 km 4, Funes',
    fecha_inicio: '2025-02-10',
    pendientes: 0,
    enviados: 0,
    aprobados: 1,
    stitch_estado: 'aprobado',
  },
  {
    obra_id: 'obra-003',
    obra_name: 'Casa Palermo',
    direccion_completa: 'Av. Santa Fe 2500, Palermo',
    fecha_inicio: null,
    pendientes: 1,
    enviados: 0,
    aprobados: 0,
    stitch_estado: 'pendiente',
  },
  {
    obra_id: 'obra-004',
    obra_name: 'Refacción Oficinas Centro',
    direccion_completa: 'San Luis 1200, Rosario',
    fecha_inicio: null,
    pendientes: 0,
    enviados: 1,
    aprobados: 0,
    stitch_estado: 'visto',
  },
  {
    obra_id: 'obra-006',
    obra_name: 'Instalación Eléctrica Nave B',
    direccion_completa: 'Parque Industrial, Lote 12',
    fecha_inicio: null,
    pendientes: 0,
    enviados: 1,
    aprobados: 0,
    stitch_estado: 'enviado',
  },
  {
    obra_id: 'obra-005',
    obra_name: 'Mantenimiento Fachada Norte',
    direccion_completa: 'Av. Pellegrini 2000, Rosario',
    fecha_inicio: null,
    pendientes: 0,
    enviados: 0,
    aprobados: 0,
    stitch_estado: 'rechazado',
  },
];

/** Obra para detalle de presupuesto (obra-001) */
export const MOCK_OBRA_PRESUPUESTO_DETALLE = {
  id: 'obra-001',
  name: 'Obra San Martín 325',
  direccion_completa: 'Av. San Martín 325, Rosario',
  cantidad_plantas: 4,
  fecha_inicio: null,
  cliente: 'Cliente demo',
};

/** Ítems de presupuesto para editar/enviar — demo sin base de datos */
export interface MockPresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  monto: number | null;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    duracion_sugerida: number | null;
  } | null;
  elemento: {
    nombre: string | null;
    planta: string | null;
    altura: string | null;
    cantidad: number | null;
    unidad: string | null;
  } | null;
}

/** 25 tareas Estructura (Obra San Martín 325) con montos y días coherentes para video */
const MOCK_ESTRUCTURA_ITEMS: MockPresupuestoItem[] = [
  { id: 'pres-e1', tarea_id: 'e1', estado: 'PENDIENTE', dias_reales: 3, monto: 45000, tarea: { id: 'e1', title: 'Replanteo y límites de obra', etapa: 'ESTRUCTURA', duracion_sugerida: 3 }, elemento: { nombre: 'Replanteo', planta: null, altura: null, cantidad: 1, unidad: 'global' } },
  { id: 'pres-e2', tarea_id: 'e2', estado: 'PENDIENTE', dias_reales: 6, monto: 180000, tarea: { id: 'e2', title: 'Excavación manual (fundaciones)', etapa: 'ESTRUCTURA', duracion_sugerida: 6 }, elemento: { nombre: 'Excavación', planta: null, altura: null, cantidad: 85, unidad: 'm³' } },
  { id: 'pres-e3', tarea_id: 'e3', estado: 'PENDIENTE', dias_reales: 4, monto: 95000, tarea: { id: 'e3', title: 'Excavación mecánica (retro)', etapa: 'ESTRUCTURA', duracion_sugerida: 4 }, elemento: { nombre: 'Excavación', planta: null, altura: null, cantidad: 120, unidad: 'm³' } },
  { id: 'pres-e4', tarea_id: 'e4', estado: 'PENDIENTE', dias_reales: 2, monto: 85000, tarea: { id: 'e4', title: 'Hormigón de limpieza', etapa: 'ESTRUCTURA', duracion_sugerida: 2 }, elemento: { nombre: 'Hormigón', planta: null, altura: null, cantidad: 12, unidad: 'm³' } },
  { id: 'pres-e5', tarea_id: 'e5', estado: 'PENDIENTE', dias_reales: 10, monto: 420000, tarea: { id: 'e5', title: 'Platea de fundación (armado y H21)', etapa: 'ESTRUCTURA', duracion_sugerida: 10 }, elemento: { nombre: 'Platea', planta: null, altura: null, cantidad: 95, unidad: 'm²' } },
  { id: 'pres-e6', tarea_id: 'e6', estado: 'PENDIENTE', dias_reales: 6, monto: 185000, tarea: { id: 'e6', title: 'Zapatas aisladas (8 un)', etapa: 'ESTRUCTURA', duracion_sugerida: 6 }, elemento: { nombre: 'Zapatas', planta: null, altura: null, cantidad: 8, unidad: 'unidad' } },
  { id: 'pres-e7', tarea_id: 'e7', estado: 'PENDIENTE', dias_reales: 5, monto: 148000, tarea: { id: 'e7', title: 'Vigas de fundación', etapa: 'ESTRUCTURA', duracion_sugerida: 5 }, elemento: { nombre: 'Vigas', planta: null, altura: null, cantidad: 24, unidad: 'ml' } },
  { id: 'pres-e8', tarea_id: 'e8', estado: 'PENDIENTE', dias_reales: 4, monto: 98000, tarea: { id: 'e8', title: 'Encadenado inferior', etapa: 'ESTRUCTURA', duracion_sugerida: 4 }, elemento: { nombre: 'Encadenado', planta: null, altura: null, cantidad: 32, unidad: 'ml' } },
  { id: 'pres-e9', tarea_id: 'e9', estado: 'PENDIENTE', dias_reales: 8, monto: 225000, tarea: { id: 'e9', title: 'Columnas planta baja (12 un)', etapa: 'ESTRUCTURA', duracion_sugerida: 8 }, elemento: { nombre: 'Columnas', planta: 'PB', altura: null, cantidad: 12, unidad: 'unidad' } },
  { id: 'pres-e10', tarea_id: 'e10', estado: 'PENDIENTE', dias_reales: 5, monto: 138000, tarea: { id: 'e10', title: 'Vigas planta baja', etapa: 'ESTRUCTURA', duracion_sugerida: 5 }, elemento: { nombre: 'Vigas', planta: 'PB', altura: null, cantidad: 18, unidad: 'ml' } },
  { id: 'pres-e11', tarea_id: 'e11', estado: 'PENDIENTE', dias_reales: 7, monto: 385000, tarea: { id: 'e11', title: 'Losa PB (encofrado, armado, H21)', etapa: 'ESTRUCTURA', duracion_sugerida: 7 }, elemento: { nombre: 'Losa', planta: 'PB', altura: null, cantidad: 85, unidad: 'm²' } },
  { id: 'pres-e12', tarea_id: 'e12', estado: 'PENDIENTE', dias_reales: 10, monto: 285000, tarea: { id: 'e12', title: 'Mampostería planta baja', etapa: 'ESTRUCTURA', duracion_sugerida: 10 }, elemento: { nombre: 'Mampostería', planta: 'PB', altura: null, cantidad: 120, unidad: 'm²' } },
  { id: 'pres-e13', tarea_id: 'e13', estado: 'PENDIENTE', dias_reales: 6, monto: 198000, tarea: { id: 'e13', title: 'Columnas primer piso (12 un)', etapa: 'ESTRUCTURA', duracion_sugerida: 6 }, elemento: { nombre: 'Columnas', planta: 'P1', altura: null, cantidad: 12, unidad: 'unidad' } },
  { id: 'pres-e14', tarea_id: 'e14', estado: 'PENDIENTE', dias_reales: 4, monto: 128000, tarea: { id: 'e14', title: 'Vigas primer piso', etapa: 'ESTRUCTURA', duracion_sugerida: 4 }, elemento: { nombre: 'Vigas', planta: 'P1', altura: null, cantidad: 18, unidad: 'ml' } },
  { id: 'pres-e15', tarea_id: 'e15', estado: 'PENDIENTE', dias_reales: 9, monto: 272000, tarea: { id: 'e15', title: 'Mampostería primer piso', etapa: 'ESTRUCTURA', duracion_sugerida: 9 }, elemento: { nombre: 'Mampostería', planta: 'P1', altura: null, cantidad: 115, unidad: 'm²' } },
  { id: 'pres-e16', tarea_id: 'e16', estado: 'PENDIENTE', dias_reales: 6, monto: 355000, tarea: { id: 'e16', title: 'Losa P1 / techo', etapa: 'ESTRUCTURA', duracion_sugerida: 6 }, elemento: { nombre: 'Losa', planta: 'P1', altura: null, cantidad: 85, unidad: 'm²' } },
  { id: 'pres-e17', tarea_id: 'e17', estado: 'PENDIENTE', dias_reales: 4, monto: 98000, tarea: { id: 'e17', title: 'Escalera de hormigón armado', etapa: 'ESTRUCTURA', duracion_sugerida: 4 }, elemento: { nombre: 'Escalera', planta: null, altura: null, cantidad: 1, unidad: 'unidad' } },
  { id: 'pres-e18', tarea_id: 'e18', estado: 'PENDIENTE', dias_reales: 5, monto: 92000, tarea: { id: 'e18', title: 'Encofrado losa cubierta', etapa: 'ESTRUCTURA', duracion_sugerida: 5 }, elemento: { nombre: 'Encofrado', planta: 'cubierta', altura: null, cantidad: 75, unidad: 'm²' } },
  { id: 'pres-e19', tarea_id: 'e19', estado: 'PENDIENTE', dias_reales: 3, monto: 78000, tarea: { id: 'e19', title: 'Armadura losa cubierta', etapa: 'ESTRUCTURA', duracion_sugerida: 3 }, elemento: { nombre: 'Armadura', planta: 'cubierta', altura: null, cantidad: 75, unidad: 'm²' } },
  { id: 'pres-e20', tarea_id: 'e20', estado: 'PENDIENTE', dias_reales: 2, monto: 268000, tarea: { id: 'e20', title: 'Hormigón losa cubierta (22 m³)', etapa: 'ESTRUCTURA', duracion_sugerida: 2 }, elemento: { nombre: 'Hormigón', planta: 'cubierta', altura: null, cantidad: 22, unidad: 'm³' } },
  { id: 'pres-e21', tarea_id: 'e21', estado: 'PENDIENTE', dias_reales: 3, monto: 78000, tarea: { id: 'e21', title: 'Contrapisos PB', etapa: 'ESTRUCTURA', duracion_sugerida: 3 }, elemento: { nombre: 'Contrapiso', planta: 'PB', altura: null, cantidad: 85, unidad: 'm²' } },
  { id: 'pres-e22', tarea_id: 'e22', estado: 'PENDIENTE', dias_reales: 3, monto: 76000, tarea: { id: 'e22', title: 'Contrapisos P1', etapa: 'ESTRUCTURA', duracion_sugerida: 3 }, elemento: { nombre: 'Contrapiso', planta: 'P1', altura: null, cantidad: 85, unidad: 'm²' } },
  { id: 'pres-e23', tarea_id: 'e23', estado: 'PENDIENTE', dias_reales: 2, monto: 42000, tarea: { id: 'e23', title: 'Refuerzo columnas (revisión)', etapa: 'ESTRUCTURA', duracion_sugerida: 2 }, elemento: { nombre: 'Refuerzo', planta: null, altura: null, cantidad: 12, unidad: 'unidad' } },
  { id: 'pres-e24', tarea_id: 'e24', estado: 'PENDIENTE', dias_reales: 4, monto: 115000, tarea: { id: 'e24', title: 'Vigas de borde y cerco perimetral', etapa: 'ESTRUCTURA', duracion_sugerida: 4 }, elemento: { nombre: 'Vigas', planta: null, altura: null, cantidad: 28, unidad: 'ml' } },
  { id: 'pres-e25', tarea_id: 'e25', estado: 'PENDIENTE', dias_reales: 2, monto: 55000, tarea: { id: 'e25', title: 'Curado y desencofrado general', etapa: 'ESTRUCTURA', duracion_sugerida: 2 }, elemento: { nombre: 'Curado', planta: null, altura: null, cantidad: 1, unidad: 'global' } },
];

/** 3 tareas Obra Gris (para etapa Obra Gris) */
const MOCK_OBRA_GRIS_ITEMS: MockPresupuestoItem[] = [
  { id: 'pres-t1', tarea_id: 't1', estado: 'PENDIENTE', dias_reales: 5, monto: 85000, tarea: { id: 't1', title: 'Revoque exterior bloque 1-4', etapa: 'OBRA_GRIS', duracion_sugerida: 5 }, elemento: { nombre: 'Revoque', planta: '1', altura: null, cantidad: 420, unidad: 'm²' } },
  { id: 'pres-t2', tarea_id: 't2', estado: 'PENDIENTE', dias_reales: 6, monto: 102000, tarea: { id: 't2', title: 'Revoque exterior bloque 5-8', etapa: 'OBRA_GRIS', duracion_sugerida: 6 }, elemento: { nombre: 'Revoque', planta: '2', altura: null, cantidad: 380, unidad: 'm²' } },
  { id: 'pres-t3', tarea_id: 't3', estado: 'PENDIENTE', dias_reales: 4, monto: 68000, tarea: { id: 't3', title: 'Revoque exterior bloque 9-12', etapa: 'OBRA_GRIS', duracion_sugerida: 4 }, elemento: { nombre: 'Revoque', planta: '3', altura: null, cantidad: 290, unidad: 'm²' } },
];

export const MOCK_PRESUPUESTO_ITEMS: MockPresupuestoItem[] = [
  ...MOCK_ESTRUCTURA_ITEMS,
  ...MOCK_OBRA_GRIS_ITEMS,
];

// ============================================
// FUNCIONES DE ORDENAMIENTO Y FILTRADO
// ============================================

/**
 * Ordena solicitudes por prioridad:
 * 1. Urgencia (ALTA primero)
 * 2. Inicio más próximo
 * 3. Cantidad de tareas (más grande = más arriba)
 */
export function ordenarSolicitudesPorPrioridad(solicitudes: MockSolicitud[]): MockSolicitud[] {
  const urgenciaOrden = { ALTA: 0, MEDIA: 1, BAJA: 2 };

  return [...solicitudes].sort((a, b) => {
    // 1. Por urgencia
    if (urgenciaOrden[a.urgencia] !== urgenciaOrden[b.urgencia]) {
      return urgenciaOrden[a.urgencia] - urgenciaOrden[b.urgencia];
    }
    // 2. Por inicio más próximo
    if (a.inicio_estimado_dias !== b.inicio_estimado_dias) {
      return a.inicio_estimado_dias - b.inicio_estimado_dias;
    }
    // 3. Por cantidad de tareas (más grande primero)
    return b.cantidad_tareas - a.cantidad_tareas;
  });
}

/**
 * Limita solicitudes a máximo 5 y agrega indicador si hay más
 */
export function limitarSolicitudes(solicitudes: MockSolicitud[], max: number = 5): {
  solicitudes: MockSolicitud[];
  hayMas: boolean;
} {
  const ordenadas = ordenarSolicitudesPorPrioridad(solicitudes);
  const limitadas = ordenadas.slice(0, max);
  return {
    solicitudes: limitadas,
    hayMas: ordenadas.length > max,
  };
}

/**
 * Obtiene el color/badge según urgencia
 */
export function getUrgenciaStyle(urgencia: 'ALTA' | 'MEDIA' | 'BAJA'): {
  borderColor: string;
  badgeVariant: 'error' | 'warning' | 'default';
  badgeText: string;
} {
  switch (urgencia) {
    case 'ALTA':
      return {
        borderColor: 'border-orange-500',
        badgeVariant: 'error',
        badgeText: 'Inicio próximo',
      };
    case 'MEDIA':
      return {
        borderColor: 'border-yellow-500',
        badgeVariant: 'warning',
        badgeText: 'Obra grande',
      };
    case 'BAJA':
      return {
        borderColor: 'border-gray-300',
        badgeVariant: 'default',
        badgeText: '',
      };
  }
}


