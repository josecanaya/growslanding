/**
 * Datos mock para prototipo UI cliente/usuario (Stitch).
 * Reemplazar por fetch real cuando se reconecte el backend.
 */

export type EstadoObraMock =
  | 'En progreso'
  | 'Para validar'
  | 'Validada'
  | 'Pendiente'
  | 'Planificación';

export type EstadoTareaMock =
  | 'En progreso'
  | 'Para validar'
  | 'Validada'
  | 'Pendiente'
  | 'Bloqueada';

export type PrioridadMock = 'alta' | 'media' | 'baja';

export const MOCK_USUARIO = {
  id: 'usr-mock-1',
  nombre: 'Arq. Laura Méndez',
  email: 'laura@estudionorte.ar',
  iniciales: 'LM',
  rolLabel: 'Arquitecta / Cliente técnico',
};

export const MOCK_ORGANIZACION = {
  id: 'org-mock-1',
  nombre: 'Estudio Norte',
  plan: 'Atelier v.2',
  ubicacion: 'Rosario, Argentina',
};

/** Texto fase / chip hero (vista centro de operaciones Stitch). */
export const MOCK_OBRAS = [
  {
    id: 'obra-san-martin',
    nombre: 'Edificio San Martín',
    tipo: 'Edificación',
    faseCentro: 'Ejecución · Obra gris',
    notaTecnica:
      'La secuencia de losas y el encuentro con la fachada vidriada marcan el ritmo de obra en esta etapa.',
    ubicacion: 'Bv. Oroño 1200, Rosario',
    estado: 'En progreso' as EstadoObraMock,
    avancePct: 62,
    tareasActivas: 9,
    tareasParaValidar: 3,
    presupuestoPendiente: 1,
    cuadrillaNombre: 'Cuadrilla González',
    fechaInicio: '2025-11-01',
    proximoHito: 'Cierre de mampostería 4.º piso',
    fechaHito: '2026-05-02',
  },
  {
    id: 'obra-fisherton',
    nombre: 'Vivienda Fisherton',
    tipo: 'Vivienda unifamiliar',
    faseCentro: 'Terminaciones · Validaciones',
    notaTecnica:
      'Priorizamos la recepción de porcelanatos y la humedad relativa antes de cerrar pintura.',
    ubicacion: 'Fisherton, Rosario',
    estado: 'Para validar' as EstadoObraMock,
    avancePct: 44,
    tareasActivas: 5,
    tareasParaValidar: 4,
    presupuestoPendiente: 0,
    cuadrillaNombre: 'Electro Sur',
    fechaInicio: '2026-01-10',
    proximoHito: 'Recepción de terminaciones livianas',
    fechaHito: '2026-04-28',
  },
  {
    id: 'obra-reforma-centro',
    nombre: 'Reforma oficinas Centro',
    tipo: 'Reforma',
    faseCentro: 'Planificación · Anteproyecto',
    notaTecnica:
      'Coordinar demolición liviana con la administración del edificio y ventana de ruido permitida.',
    ubicacion: 'Mitre 450, Rosario',
    estado: 'Planificación' as EstadoObraMock,
    avancePct: 12,
    tareasActivas: 2,
    tareasParaValidar: 0,
    presupuestoPendiente: 2,
    cuadrillaNombre: '—',
    fechaInicio: '2026-03-20',
    proximoHito: 'Kickoff obra gris',
    fechaHito: '2026-05-15',
  },
];

export const MOCK_COLABORADORES_POR_OBRA: Record<string, string[]> = {
  'obra-san-martin': ['LM', 'CG', 'ES', 'PN', 'MR', 'JV'],
  'obra-fisherton': ['LM', 'GG', 'PD'],
  'obra-reforma-centro': ['LM', 'AR'],
};

export const MOCK_ACTIVIDAD_HUB = [
  {
    id: 'act-1',
    hora: '10:45',
    dia: 'Hoy',
    titulo: 'Borrador de presupuesto aprobado',
    detalle: 'Revisión técnica de carpintería aluminio — Edificio San Martín.',
    tone: 'mint' as const,
  },
  {
    id: 'act-2',
    hora: 'Ayer',
    dia: '',
    titulo: 'Nueva evidencia en validación',
    detalle: 'Cuadrilla González subió fotos de revoque 3.er piso.',
    tone: 'slate' as const,
  },
];

export const MOCK_TAREAS = [
  {
    id: 'tarea-1',
    obraId: 'obra-san-martin',
    titulo: 'Revoque interior 3.er piso',
    descripcion: 'Revoque fino habitaciones frente al río.',
    estado: 'En progreso' as EstadoTareaMock,
    prioridad: 'alta' as PrioridadMock,
    responsable: 'Cuadrilla González',
    avancePct: 70,
    vence: '2026-04-30',
  },
  {
    id: 'tarea-2',
    obraId: 'obra-san-martin',
    titulo: 'Instalación eléctrica PB',
    descripcion: 'Canalización y tablero principal.',
    estado: 'Para validar' as EstadoTareaMock,
    prioridad: 'media' as PrioridadMock,
    responsable: 'Electro Sur',
    avancePct: 100,
    vence: '2026-04-22',
  },
  {
    id: 'tarea-3',
    obraId: 'obra-san-martin',
    titulo: 'Herrería balcón frente',
    descripcion: 'Soldadura y pintura epoxi.',
    estado: 'Pendiente' as EstadoTareaMock,
    prioridad: 'baja' as PrioridadMock,
    responsable: 'Cuadrilla González',
    avancePct: 0,
    vence: '2026-05-18',
  },
  {
    id: 'tarea-4',
    obraId: 'obra-fisherton',
    titulo: 'Colocación porcelanato living',
    descripcion: 'Piso 60×120 continuo.',
    estado: 'Para validar' as EstadoTareaMock,
    prioridad: 'alta' as PrioridadMock,
    responsable: 'González Obra Gruesa',
    avancePct: 100,
    vence: '2026-04-20',
  },
  {
    id: 'tarea-5',
    obraId: 'obra-fisherton',
    titulo: 'Instalación sanitaria baños',
    descripcion: 'Desagües y agua fría/caliente.',
    estado: 'En progreso' as EstadoTareaMock,
    prioridad: 'alta' as PrioridadMock,
    responsable: 'Plomería Delta',
    avancePct: 55,
    vence: '2026-05-05',
  },
  {
    id: 'tarea-6',
    obraId: 'obra-reforma-centro',
    titulo: 'Demolición tabiquería liviana',
    descripcion: 'Sector administrativo piso 2.',
    estado: 'Pendiente' as EstadoTareaMock,
    prioridad: 'media' as PrioridadMock,
    responsable: 'A definir',
    avancePct: 0,
    vence: '2026-04-25',
  },
];

export const MOCK_VALIDACIONES = [
  {
    id: 'val-1',
    obraId: 'obra-san-martin',
    obraNombre: 'Edificio San Martín',
    bloque: 'Instalación eléctrica PB',
    socio: 'Electro Sur',
    enviado: '2026-04-18',
    fotos: 4,
    montoEstimado: 890000,
  },
  {
    id: 'val-2',
    obraId: 'obra-fisherton',
    obraNombre: 'Vivienda Fisherton',
    bloque: 'Colocación porcelanato living',
    socio: 'González Obra Gruesa',
    enviado: '2026-04-19',
    fotos: 6,
    montoEstimado: 1200000,
  },
  {
    id: 'val-3',
    obraId: 'obra-fisherton',
    obraNombre: 'Vivienda Fisherton',
    bloque: 'Cielorraso yeso dormitorios',
    socio: 'Cuadrilla González',
    enviado: '2026-04-17',
    fotos: 3,
    montoEstimado: 340000,
  },
];

export const MOCK_PRESUPUESTOS = [
  {
    id: 'pre-1',
    obraId: 'obra-san-martin',
    titulo: 'Carpintería aluminio aberturas',
    cuadrilla: 'Alumínos del Parque',
    estado: 'Pendiente de respuesta',
    monto: 2450000,
    enviado: '2026-04-12',
  },
  {
    id: 'pre-2',
    obraId: 'obra-reforma-centro',
    titulo: 'Pintura general m²',
    cuadrilla: 'Pinturas Norte',
    estado: 'Recibido',
    monto: 890000,
    enviado: '2026-04-08',
  },
  {
    id: 'pre-3',
    obraId: 'obra-reforma-centro',
    titulo: 'Piso vinílico SPC',
    cuadrilla: 'Floors Studio',
    estado: 'Borrador interno',
    monto: 0,
    enviado: '2026-04-20',
  },
];

export const MOCK_CUADRILLAS = [
  {
    id: 'cua-1',
    nombre: 'Cuadrilla González',
    especialidad: 'Obra gruesa / revoque',
    disponibilidad: 'En obra',
    score: 4.8,
    obrasSimultaneas: 2,
    nota: 'Referencia en San Martín',
  },
  {
    id: 'cua-2',
    nombre: 'Electro Sur',
    especialidad: 'Instalaciones eléctricas',
    disponibilidad: 'Parcial',
    score: 4.6,
    obrasSimultaneas: 3,
    nota: 'Certificación matriculada',
  },
  {
    id: 'cua-3',
    nombre: 'Plomería Delta',
    especialidad: 'Sanitarios / gas',
    disponibilidad: 'Disponible',
    score: 4.4,
    obrasSimultaneas: 1,
    nota: '',
  },
  {
    id: 'cua-4',
    nombre: 'Pinturas Norte',
    especialidad: 'Pintura industrial y obra',
    disponibilidad: 'Disponible',
    score: 4.5,
    obrasSimultaneas: 0,
    nota: '',
  },
];

export const MOCK_NOTIFICACIONES = [
  {
    id: 'not-1',
    titulo: 'Nueva evidencia para validar',
    cuerpo: 'Instalación eléctrica PB — Edificio San Martín',
    fecha: '2026-04-19T09:00:00',
    leida: false,
  },
  {
    id: 'not-2',
    titulo: 'Presupuesto recibido',
    cuerpo: 'Pinturas Norte respondió cotización.',
    fecha: '2026-04-18T16:30:00',
    leida: false,
  },
  {
    id: 'not-3',
    titulo: 'Hito próximo',
    cuerpo: 'Cierre de mampostería 4.º piso en 13 días.',
    fecha: '2026-04-17T08:00:00',
    leida: true,
  },
];

export const MOCK_DASHBOARD_METRICAS = {
  obrasActivas: MOCK_OBRAS.filter((o) => o.estado !== 'Validada').length,
  tareasEnCurso: MOCK_TAREAS.filter((t) => t.estado === 'En progreso').length,
  paraValidar: MOCK_VALIDACIONES.length,
  presupuestosPendientes: MOCK_PRESUPUESTOS.filter((p) =>
    ['Pendiente de respuesta', 'Recibido', 'Borrador interno'].includes(p.estado)
  ).length,
  avancePromedioPct: Math.round(
    MOCK_OBRAS.reduce((a, o) => a + o.avancePct, 0) / MOCK_OBRAS.length
  ),
};

export const MOCK_WALLET = {
  saldoDisponible: 1280000,
  enEscrow: 3450000,
  moneda: 'ARS',
};

export function obraById(id: string) {
  return MOCK_OBRAS.find((o) => o.id === id) ?? MOCK_OBRAS[0];
}

export function tareasByObra(obraId: string) {
  return MOCK_TAREAS.filter((t) => t.obraId === obraId);
}

export function colaboradoresForObra(obraId: string) {
  return MOCK_COLABORADORES_POR_OBRA[obraId] ?? ['LM'];
}
