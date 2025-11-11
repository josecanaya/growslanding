
import { z } from 'zod';

import { visitStatusSchema } from '@/lib/fsm';
import {
  prepareEventoInsert,
  validateMediaRules,
} from '@/lib/evento-rules';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { uploadActaPdf, uploadPhoto, uploadSignature } from '@/lib/storage';

export const runtime = 'nodejs';

const mediaSchema = z.object({
  kind: z.enum(['foto', 'firma']),
  dataUrl: z.string().min(10, 'Media requerida'),
});

const checklistSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const requestSchema = z.object({
  nuevo_estado: visitStatusSchema,
  notas: z.string().max(2000).optional(),
  checklist: z.array(checklistSchema).default([]),
  has_nc: z.boolean().default(false),
  actor: z.object({
    name: z.string().min(2),
    role: z.enum(['Cliente', 'Socio']),
    method: z.enum(['QR', 'login', 'PIN']),
  }),
  media: z.array(mediaSchema).max(5).default([]),
  motivo: z.string().optional(),
  nc_responsable: z.string().optional(),
  nc_deadline: z.string().optional(),
  gps_lat: z.number().optional(),
  gps_lon: z.number().optional(),
});

type TareaRecord = {
  id: string;
  obra_id: string | null;
  tipo: string | null;
  descripcion: string | null;
  estado: string | null;
  referente_id: string | null;
  socio_ids: string[] | null;
  obra: {
    nombre: string | null;
    cliente: string | null;
    localizacion: string | null;
  } | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = requestSchema.parse(body);
    const supabase = createServiceSupabaseClient();

    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .select(
        `id, obra_id, tipo, descripcion, estado, referente_id, socio_ids,
         obra:obras(nombre, cliente, localizacion)`
      )
      .eq('id', id)
      .maybeSingle<TareaRecord>();

    if (tareaError) {
      throw tareaError;
    }

    if (!tarea) {
      return new Response(JSON.stringify({ message: 'Tarea no encontrada' }), {
        status: 404,
      });
    }

    const { data: precedencias } = await supabase
      .from('tarea_precedencias')
      .select('depende_de')
      .eq('tarea_id', tarea.id);

    if (precedencias && precedencias.length > 0) {
      const dependeIds = precedencias.map((p) => p.depende_de);
      const { data: bloqueo } = await supabase
        .from('tareas')
        .select('id, estado')
        .in('id', dependeIds)
        .neq('estado', 'validado');

      if (bloqueo && bloqueo.length > 0) {
        return new Response(
          JSON.stringify({
            message: 'No se puede avanzar: tareas precedentes sin validar',
            bloqueos: bloqueo,
          }),
          { status: 409 }
        );
      }
    }

    validateMediaRules({
      has_nc: payload.has_nc,
      checklist: payload.checklist,
      media: payload.media,
    });

    const uploadedMedia = await Promise.all(
      payload.media.map(async (item, idx) => {
        if (item.kind === 'foto') {
          const { path } = await uploadPhoto(item.dataUrl);
          return { kind: item.kind, path, dataUrl: item.dataUrl, idx };
        }
        const { path } = await uploadSignature(item.dataUrl);
        return { kind: item.kind, path, dataUrl: item.dataUrl, idx };
      })
    );

    const prepared = await prepareEventoInsert(
      {
        tareaId: tarea.id,
        nuevo_estado: payload.nuevo_estado,
        checklist: payload.checklist,
        media: uploadedMedia,
        notas: payload.notas,
        has_nc: payload.has_nc,
        actor: payload.actor,
        nc_responsable: payload.nc_responsable ?? null,
        nc_deadline: payload.nc_deadline ?? null,
        rollbackMotivo: payload.motivo ?? null,
      },
      {
        tarea: tarea as any,
        obra: (tarea.obra as any)!,
      }
    );

    const pdfPath = prepared.pdf_path;
    if (prepared.pdf_bytes && pdfPath) {
      await uploadActaPdf(prepared.pdf_bytes, pdfPath);
    }

    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .insert({
        ...prepared.evento,
        checklist: prepared.evento.checklist,
        notas: prepared.evento.notas,
        gps_lat: payload.gps_lat ?? null,
        gps_lon: payload.gps_lon ?? null,
        has_nc: payload.has_nc,
        snapshot_json: prepared.snapshot_json,
        pdf_path: pdfPath,
      } as any)
      .select('id, created_at')
      .single();

    if (eventoError) {
      throw eventoError;
    }

    if (uploadedMedia.length > 0) {
      const mediaRows = uploadedMedia.map((item) => ({
        evento_id: evento.id,
        path: item.path,
        kind: item.kind,
        idx: item.idx,
      }));
      const { error: mediaError } = await supabase
        .from('media')
        .insert(mediaRows);
      if (mediaError) {
        throw mediaError;
      }
    }

    const { error: updateError } = await supabase
      .from('tareas')
      .update({ estado: payload.nuevo_estado })
      .eq('id', tarea.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        eventoId: evento.id,
        pdf_path: pdfPath,
      })
    );
  } catch (error) {
    console.error('[TRANSITION_ERROR]', error);
    const message =
      error instanceof Error ? error.message : 'Error al transicionar tarea';
    const status = message.includes('foto') ? 400 : 500;
    return new Response(JSON.stringify({ message }), { status });
  }
}
