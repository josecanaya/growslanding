/**
 * Mock data para el frontend del socio
 * Activar/desactivar con USE_MOCK_DATA
 */

export const USE_MOCK_DATA = true; // Cambiar a false para usar datos reales

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


