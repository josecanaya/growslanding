import { NextRequest, NextResponse } from 'next/server';

import { resolveSocioSession } from '@/lib/socio/resolve-socio-session';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { uploadVideoBuffer } from '@/lib/storage';
import { SubtareasRepository } from '@/lib/tareas/infrastructure/subtareas.repository';
import { PermisoService } from '@/lib/services/permiso.service';
import { resolveSocioParaOperacionDeTarea } from '@/lib/socios/resolveSocioForAuthUser';

export const runtime = 'nodejs';

/** POST /api/upload/video — multipart: file + subtareaId (opcional) + tareaId */
export async function POST(request: NextRequest) {
  try {
    const session = await resolveSocioSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file');
    const subtareaId = typeof form.get('subtareaId') === 'string' ? String(form.get('subtareaId')) : '';
    const tareaId = typeof form.get('tareaId') === 'string' ? String(form.get('tareaId')) : 'general';

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'file es requerido' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || 'video/mp4';
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const objectPath = `${tareaId}/${Date.now()}-${safeName}`;

    const { path, publicUrl } = await uploadVideoBuffer(buffer, mime, objectPath);

    if (subtareaId) {
      const supabase = createServiceSupabaseClient();
      const row = await SubtareasRepository.findById(
        subtareaId,
        'id, socio_id, tarea_id, tareas:tareas(org_id, responsable_socio_id)',
      );
      const orgId = (row?.tareas as { org_id?: string } | undefined)?.org_id;
      if (orgId) {
        const rol = await PermisoService.obtenerRolEnOrganizacion(session.user.id, orgId);
        const socio = await resolveSocioParaOperacionDeTarea(
          supabase,
          session.user,
          {
            responsableSocioId:
              (row?.socio_id as string | null) ??
              (row?.tareas as { responsable_socio_id?: string | null })?.responsable_socio_id ??
              null,
            orgId,
          },
        );
        if (rol === 'SOCIO' || socio) {
          await SubtareasRepository.update(subtareaId, { video_url: publicUrl });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      path,
      publicUrl,
      video_url: publicUrl,
    });
  } catch (e) {
    console.error('[POST /api/upload/video]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error al subir video' },
      { status: 500 },
    );
  }
}
