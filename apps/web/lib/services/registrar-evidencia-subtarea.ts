import type { SupabaseClient } from '@supabase/supabase-js';

export type RegistroEvidenciaResult = {
  eventoId: string;
  mediaId: string;
  tareaId: string;
  subtareaId: string;
  obraId: string | null;
  orgId: string;
  storagePath: string;
  publicUrl: string;
};

type SubtareaCtx = {
  id: string;
  tarea_id: string;
  orden: number | null;
  tareas: {
    id: string;
    title: string | null;
    obra_id: string | null;
    org_id: string;
  } | null;
};

/**
 * Registra evidencia en el historial oficial de la tarea (`eventos` + `media`).
 * Sin este paso la foto queda en Storage + `tareas_subtareas.evidencia_url`
 * pero NO aparece en la galería del socio ni en el historial de eventos.
 */
export async function registrarEvidenciaSubtarea(
  supabase: SupabaseClient<any>,
  params: {
    subtareaId: string;
    storagePath: string;
    publicUrl: string;
    actorName: string;
    actorRole?: string;
    actorMethod?: string;
    notas?: string | null;
  },
): Promise<RegistroEvidenciaResult> {
  const sb = supabase as any;

  const { data: subtarea, error: stErr } = await sb
    .from('tareas_subtareas')
    .select(
      `
      id,
      tarea_id,
      orden,
      tareas:tareas (
        id,
        title,
        obra_id,
        org_id
      )
    `,
    )
    .eq('id', params.subtareaId)
    .maybeSingle();

  if (stErr || !subtarea?.tareas?.org_id) {
    throw new Error(stErr?.message || 'Subtarea no encontrada para registrar evidencia en historial');
  }

  const ctx = subtarea as SubtareaCtx;
  const tarea = ctx.tareas!;
  const orgId = String(tarea.org_id);
  const tareaId = String(ctx.tarea_id);
  const obraId = tarea.obra_id ? String(tarea.obra_id) : null;

  // Idempotencia: si ya existe media con el mismo path para esta subtarea, reutilizar.
  const { data: eventosPrevios } = await sb
    .from('eventos')
    .select('id, snapshot_json')
    .eq('tarea_id', tareaId)
    .eq('tipo', 'evidencia_bloque')
    .order('created_at', { ascending: false })
    .limit(20);

  for (const ev of eventosPrevios ?? []) {
    const snap = (ev.snapshot_json ?? {}) as Record<string, unknown>;
    if (snap.subtarea_id !== params.subtareaId) continue;
    const { data: mediaPrev } = await sb
      .from('media')
      .select('id, path')
      .eq('evento_id', ev.id)
      .eq('path', params.storagePath)
      .maybeSingle();
    if (mediaPrev?.id) {
      return {
        eventoId: String(ev.id),
        mediaId: String(mediaPrev.id),
        tareaId,
        subtareaId: params.subtareaId,
        obraId,
        orgId,
        storagePath: params.storagePath,
        publicUrl: params.publicUrl,
      };
    }
  }

  const snapshot = {
    subtarea_id: params.subtareaId,
    bloque_orden: ctx.orden,
    evidencia_url: params.publicUrl,
    storage_path: params.storagePath,
    origen: 'socio_upload',
  };

  const { data: evento, error: evErr } = await sb
    .from('eventos')
    .insert({
      org_id: orgId,
      tarea_id: tareaId,
      obra_id: obraId,
      tipo: 'evidencia_bloque',
      nuevo_estado: 'para_validar',
      actor_name: params.actorName,
      actor_role: params.actorRole ?? 'Socio',
      actor_method: params.actorMethod ?? 'login',
      descripcion: `Evidencia del bloque ${ctx.orden ?? ''}`.trim(),
      notas: params.notas ?? null,
      has_nc: false,
      snapshot_json: snapshot,
    })
    .select('id')
    .single();

  if (evErr || !evento?.id) {
    throw new Error(evErr?.message || 'No se pudo crear el evento de evidencia');
  }

  const { data: media, error: mediaErr } = await sb
    .from('media')
    .insert({
      evento_id: evento.id,
      path: params.storagePath,
      kind: 'foto',
      idx: 0,
    })
    .select('id')
    .single();

  if (mediaErr || !media?.id) {
    throw new Error(mediaErr?.message || 'No se pudo registrar la media de evidencia');
  }

  return {
    eventoId: String(evento.id),
    mediaId: String(media.id),
    tareaId,
    subtareaId: params.subtareaId,
    obraId,
    orgId,
    storagePath: params.storagePath,
    publicUrl: params.publicUrl,
  };
}
