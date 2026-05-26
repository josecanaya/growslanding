import { createServiceSupabaseClient } from '../supabase-server';

export interface Evidencia {
  id: string;
  path: string;
  kind: string;
  created_at: string;
  tarea_id: string;
  tarea_nombre: string | null;
  obra_id: string | null;
  subido_por: string | null;
  subido_por_email: string | null;
}

/**
 * Obtiene todas las evidencias (fotos) de un socio en una obra específica
 * @param obraId ID de la obra
 * @param socioId ID del socio (user_id de auth.users)
 * @returns Array de evidencias agrupadas por tarea
 */
export async function fetchEvidenciasPorSocioYObra(
  obraId: string,
  socioId: string
): Promise<Evidencia[]> {
  const supabase = createServiceSupabaseClient();

  // Query optimizada usando select anidado
  const { data, error } = await supabase
    .from('media')
    .select(`
      id,
      path,
      kind,
      created_at,
      evento:eventos(
        tarea_id,
        tarea:tareas(
          id,
          title,
          obra_id
        )
      )
    `)
    .eq('evento.tarea.obra_id', obraId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[FETCH_EVIDENCIAS] Error:', error);
    throw new Error(`Error al obtener evidencias: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Filtrar y mapear los resultados
  const evidencias: Evidencia[] = [];

  for (const mediaItem of data) {
    const evento = mediaItem.evento as any;
    if (!evento || !evento.tarea) continue;

    const tarea = evento.tarea as any;
    
    // Verificar que la obra coincida
    if (tarea.obra_id !== obraId) continue;

    // Obtener email del usuario que subió la evidencia
    // Nota: subido_por no existe en la tabla media, usamos el actor del evento
    // Necesitamos obtenerlo desde eventos
    let subidoPorEmail: string | null = null;
    
    // Intentar obtener el email desde el evento
    if (evento.actor_name) {
      // El actor_name puede contener el email o nombre
      subidoPorEmail = evento.actor_name;
    }

    evidencias.push({
      id: mediaItem.id,
      path: mediaItem.path,
      kind: mediaItem.kind,
      created_at: mediaItem.created_at || new Date().toISOString(),
      tarea_id: evento.tarea_id,
      tarea_nombre: tarea.title || null,
      obra_id: tarea.obra_id,
      subido_por: socioId, // Asumimos que es el socio actual
      subido_por_email: subidoPorEmail,
    });
  }

  return evidencias;
}

/**
 * Versión cliente para usar desde componentes React
 * @param obraId ID de la obra
 * @param socioEmail Email del socio
 */
export async function fetchEvidenciasPorSocioYObraCliente(
  obraId: string,
  socioEmail: string,
  supabaseClient: any
): Promise<Evidencia[]> {
  try {
    console.log('[FETCH_EVIDENCIAS] Buscando evidencias para obra:', obraId, 'socio:', socioEmail);

    // Primero obtener todas las tareas de la obra
    const { data: tareasData, error: tareasError } = await supabaseClient
      .from('tareas')
      .select('id')
      .eq('obra_id', obraId);

    if (tareasError) {
      console.error('[FETCH_EVIDENCIAS] Error al obtener tareas:', tareasError);
      throw new Error(`Error al obtener tareas: ${tareasError.message}`);
    }

    if (!tareasData || tareasData.length === 0) {
      console.log('[FETCH_EVIDENCIAS] No se encontraron tareas para la obra:', obraId);
      return [];
    }

    const tareaIds = tareasData.map((t: any) => t.id);
    console.log('[FETCH_EVIDENCIAS] Tareas encontradas:', tareaIds.length);

    // Obtener eventos de esas tareas
    const { data: eventosData, error: eventosError } = await supabaseClient
      .from('eventos')
      .select('id, tarea_id, actor_name, created_at')
      .in('tarea_id', tareaIds)
      .order('created_at', { ascending: false });

    if (eventosError) {
      console.error('[FETCH_EVIDENCIAS] Error al obtener eventos:', eventosError);
      throw new Error(`Error al obtener eventos: ${eventosError.message}`);
    }

    if (!eventosData || eventosData.length === 0) {
      console.log('[FETCH_EVIDENCIAS] No se encontraron eventos para las tareas');
      return [];
    }

    console.log('[FETCH_EVIDENCIAS] Eventos encontrados:', eventosData.length);

    // Obtener IDs de eventos
    const eventoIds = eventosData.map((e: any) => e.id);

    // Obtener media de esos eventos
    const { data: mediaData, error: mediaError } = await supabaseClient
      .from('media')
      .select('id, path, kind, created_at, evento_id')
      .in('evento_id', eventoIds)
      .order('created_at', { ascending: false });

    if (mediaError) {
      console.error('[FETCH_EVIDENCIAS] Error al obtener media:', mediaError);
      throw new Error(`Error al obtener media: ${mediaError.message}`);
    }

    if (!mediaData || mediaData.length === 0) {
      console.log('[FETCH_EVIDENCIAS] No se encontró media para los eventos');
      return [];
    }

    console.log('[FETCH_EVIDENCIAS] Media encontrada:', mediaData.length);

    // Crear mapa de eventos por ID
    const eventosMap = new Map();
    eventosData.forEach((e: any) => {
      eventosMap.set(e.id, e);
    });

    // Crear mapa de tareas por ID
    const tareasMap = new Map();
    tareasData.forEach((t: any) => {
      tareasMap.set(t.id, t);
    });

    // Obtener información de las tareas (título)
    const tareaIdsUnicos = Array.from(new Set(eventosData.map((e: any) => e.tarea_id)));
    const { data: tareasInfo, error: tareasInfoError } = await supabaseClient
      .from('tareas')
      .select('id, title')
      .in('id', tareaIdsUnicos);

    if (tareasInfoError) {
      console.error('[FETCH_EVIDENCIAS] Error al obtener info de tareas:', tareasInfoError);
    }

    const tareasInfoMap = new Map();
    if (tareasInfo) {
      tareasInfo.forEach((t: any) => {
        tareasInfoMap.set(t.id, t);
      });
    }

    // Mapear resultados combinando media con eventos y tareas
    const evidencias: Evidencia[] = mediaData
      .map((mediaItem: any) => {
        const evento = eventosMap.get(mediaItem.evento_id);
        if (!evento) return null;

        const tareaInfo = tareasInfoMap.get(evento.tarea_id);
        
        return {
          id: mediaItem.id,
          path: mediaItem.path,
          kind: mediaItem.kind,
          created_at: mediaItem.created_at,
          tarea_id: evento.tarea_id,
          tarea_nombre: tareaInfo?.title || null,
          obra_id: obraId,
          subido_por: null, // No tenemos el ID del socio directamente
          subido_por_email: evento.actor_name || socioEmail,
        };
      })
      .filter((e: any): e is Evidencia => e !== null);

    console.log('[FETCH_EVIDENCIAS] Evidencias mapeadas (eventos+media):', evidencias.length);

    // Complementar con evidencias persistidas en bloques (tareas_subtareas.evidencia_url)
    const { data: subtareasEv, error: subtErr } = await supabaseClient
      .from('tareas_subtareas')
      .select(
        `
        id,
        evidencia_url,
        updated_at,
        tarea_id,
        tareas:tareas!inner (
          id,
          title,
          obra_id
        )
      `,
      )
      .eq('tareas.obra_id', obraId)
      .eq('evidencia_cargada', true)
      .not('evidencia_url', 'is', null)
      .order('updated_at', { ascending: false });

    if (subtErr) {
      console.warn('[FETCH_EVIDENCIAS] subtareas fallback:', subtErr.message);
    } else if (subtareasEv?.length) {
      const idsExistentes = new Set(evidencias.map((e) => `${e.tarea_id}:${e.path}`));
      for (const row of subtareasEv as Array<{
        id: string;
        evidencia_url: string;
        updated_at: string;
        tarea_id: string;
        tareas: { id: string; title: string | null; obra_id: string | null } | null;
      }>) {
        const url = String(row.evidencia_url || '').trim();
        if (!url) continue;
        const dedupeKey = `${row.tarea_id}:${url}`;
        if (idsExistentes.has(dedupeKey)) continue;
        idsExistentes.add(dedupeKey);
        evidencias.push({
          id: `subtarea-${row.id}`,
          path: url,
          kind: 'foto',
          created_at: row.updated_at || new Date().toISOString(),
          tarea_id: row.tarea_id,
          tarea_nombre: row.tareas?.title ?? null,
          obra_id: obraId,
          subido_por: null,
          subido_por_email: socioEmail,
        });
      }
      console.log('[FETCH_EVIDENCIAS] Total con subtareas:', evidencias.length);
    }

    return evidencias;
  } catch (error) {
    console.error('[FETCH_EVIDENCIAS] Error general:', error);
    throw error;
  }
}

