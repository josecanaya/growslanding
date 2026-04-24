/**
 * Mocks de 3 obras para video demo – Home del Cliente.
 * Sin backend: datos fijos, estables, pensados para demo.
 *
 * Activar: ?demo=1 en la URL o NEXT_PUBLIC_DEMO_VIDEO=true
 */

import { isDemoVideoEnabled } from './demoVideoData';

export { isDemoVideoEnabled };

/** ID de la obra “completa” (la que se usa en el demo con elementos/tareas/validaciones). */
export const DEMO_OBRA_COMPLETA_ID = 'demo-obra-1-casa-familiar';

export interface ObraDemoHome {
  id: string;
  nombre: string;
  estado: string;
  propietario?: string | null;
  tipo_obra?: string | null;
  fecha_inicio_estimada?: string | null;
  fecha_final_estimada?: string | null;
  address?: string | null;
}

const OBRAS_DEMO_RAW = [
  {
    id: DEMO_OBRA_COMPLETA_ID,
    nombre: 'Casa Familiar – Juan Pérez',
    tipo_obra: 'Vivienda unifamiliar',
    estado: 'En ejecución',
    address: 'Rosario',
    fecha_inicio_estimada: '2026-03-01',
    fecha_final_estimada: '2026-06-30',
    propietario: 'Juan Pérez',
  },
  {
    id: 'demo-obra-2-reforma-bano',
    nombre: 'Reforma Baño – María González',
    tipo_obra: 'Reforma',
    estado: 'Pendiente',
    address: 'Rosario',
    fecha_inicio_estimada: '2026-04-15',
    fecha_final_estimada: null,
    propietario: 'María González',
  },
  {
    id: 'demo-obra-3-ampliacion-cocina',
    nombre: 'Ampliación Cocina – Carlos López',
    tipo_obra: 'Ampliación',
    estado: 'Creada',
    address: 'Rosario',
    fecha_inicio_estimada: null,
    fecha_final_estimada: null,
    propietario: 'Carlos López',
  },
];

/**
 * 3 obras para el Home del Cliente (video demo).
 * OBRA 1 = Completa (En ejecución). OBRA 2 = Simple (Pendiente). OBRA 3 = Creada (sin actividad).
 */
export function getObrasDemoVideoHome(): ObraDemoHome[] {
  return OBRAS_DEMO_RAW.map((o) => ({
    id: o.id,
    nombre: o.nombre,
    estado: o.estado,
    propietario: o.propietario ?? null,
    tipo_obra: o.tipo_obra ?? null,
    fecha_inicio_estimada: o.fecha_inicio_estimada ?? null,
    fecha_final_estimada: o.fecha_final_estimada ?? null,
    address: o.address ?? null,
  }));
}

/** Formato raw para ObrasListContainer (id, name, address, estado, created_at, tipoObra, etc.). */
export function getObrasDemoVideoRaw(): Array<{
  id: string;
  name: string;
  address: string | null;
  estado: string;
  created_at: string;
  tipoObra: 'nueva' | 'reforma' | 'ampliacion';
  fecha_inicio?: string;
  fecha_final_estimada?: string | null;
}> {
  const now = new Date().toISOString();
  return OBRAS_DEMO_RAW.map((o) => ({
    id: o.id,
    name: o.nombre,
    address: o.address ?? null,
    estado: o.estado,
    created_at: now,
    tipoObra: (o.tipo_obra === 'Reforma' ? 'reforma' : o.tipo_obra === 'Ampliación' ? 'ampliacion' : 'nueva') as 'nueva' | 'reforma' | 'ampliacion',
    fecha_inicio: o.fecha_inicio_estimada ?? undefined,
    fecha_final_estimada: o.fecha_final_estimada ?? null,
  }));
}
