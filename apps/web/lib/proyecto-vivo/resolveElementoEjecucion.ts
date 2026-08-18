import type { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { EstadoTareaCore } from '@/lib/domain/estados-core';

type Supabase = ReturnType<typeof createServiceSupabaseClient>;

const ELEMENTO_CANVAS_NOMBRE = 'Canvas operativo';
const ELEMENTO_CANVAS_CATEGORIA = 'sistema';

function readMetadataElementoId(meta: unknown): string | null {
  if (!meta || typeof meta !== 'object') return null;
  const id = (meta as { elemento_id?: unknown }).elemento_id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/**
 * Proyecto vivo: elemento anclado al estado destino (nombre del estado), no «Canvas operativo».
 */
export async function resolveElementoForProyectoVivoTransformacion(
  supabase: Supabase,
  obraId: string,
  toNodeId: string | null,
  warnings: string[],
): Promise<string> {
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => {
        eq: (c: string, v: string) => {
          maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
        };
      };
      insert: (row: Record<string, unknown>) => {
        select: (s: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string; code?: string } | null }> };
      };
    };
  };

  if (!toNodeId) {
    throw new Error('La transformación de ejecución debe tener estado destino (to_node_id).');
  }

  const { data: toNode, error: nodeErr } = await db
    .from('canvas_nodes')
    .select('id, title, metadata')
    .eq('id', toNodeId)
    .maybeSingle();

  if (nodeErr || !toNode) {
    throw new Error(nodeErr?.message ?? 'Estado destino no encontrado');
  }

  const metaEl = readMetadataElementoId(toNode.metadata);
  if (metaEl) {
    warnings.push('Elemento reutilizado desde metadata del estado destino');
    return metaEl;
  }

  const nombre = String(toNode.title ?? 'Estado').trim() || 'Estado';

  const { data: existing } = await (supabase as any)
    .from('elementos')
    .select('id')
    .eq('obra_id', obraId)
    .eq('nombre', nombre)
    .limit(1);

  const existingId = existing?.[0]?.id as string | undefined;
  if (existingId) {
    warnings.push(`Elemento reutilizado: ${nombre}`);
    return existingId;
  }

  const { data: created, error: insErr } = await (supabase as any)
    .from('elementos')
    .insert({
      obra_id: obraId,
      nombre,
      categoria: 'estado_proyecto_vivo',
      unidad: 'ud',
      cantidad: 1,
    })
    .select('id')
    .single();

  if (!insErr && created?.id) {
    warnings.push(`Elemento creado para estado destino: ${nombre}`);
    return created.id as string;
  }

  const pgCode = (insErr as { code?: string } | null)?.code;
  if (pgCode === '23505') {
    const { data: again } = await (supabase as any)
      .from('elementos')
      .select('id')
      .eq('obra_id', obraId)
      .eq('nombre', nombre)
      .limit(1);
    const rid = again?.[0]?.id as string | undefined;
    if (rid) return rid;
  }

  throw new Error(insErr?.message ?? 'No se pudo crear elemento para ejecución');
}

/** Obra plan: mantiene dummy histórico (misma lógica que publicar-tareas). */
export async function resolveElementoCanvasOperativoLegacy(
  supabase: Supabase,
  obraId: string,
  warnings: string[],
): Promise<string> {
  const { data: existingRows, error: readErr } = await (supabase as any)
    .from('elementos')
    .select('id')
    .eq('obra_id', obraId)
    .eq('nombre', ELEMENTO_CANVAS_NOMBRE)
    .limit(1);

  if (readErr) throw new Error(readErr.message || 'No se pudo leer elementos');

  const existingId = existingRows?.[0]?.id as string | undefined;
  if (existingId) {
    warnings.push('Elemento técnico reutilizado: Canvas operativo');
    return existingId;
  }

  const { data: created, error: insErr } = await (supabase as any)
    .from('elementos')
    .insert({
      obra_id: obraId,
      nombre: ELEMENTO_CANVAS_NOMBRE,
      categoria: ELEMENTO_CANVAS_CATEGORIA,
      unidad: 'ud',
      cantidad: 1,
    })
    .select('id')
    .single();

  if (!insErr && created?.id) {
    warnings.push('Elemento técnico creado: Canvas operativo');
    return created.id as string;
  }

  throw new Error(insErr?.message ?? 'No se pudo crear elemento Canvas operativo');
}

export type GraphStatusTransformacionSync = 'en_curso' | 'realizada' | 'bloqueada';

export function graphStatusTransformacionFromTareaEstado(
  estado: EstadoTareaCore,
): GraphStatusTransformacionSync {
  if (estado === 'validada') return 'realizada';
  if (estado === 'rechazada') return 'en_curso';
  return 'en_curso';
}
