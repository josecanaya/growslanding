import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { uploadPhoto } from '@/lib/storage';
import type { Database } from '@/lib/types/supabase.gen';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';
import { resolveSocioParaOperacionDeTarea } from '@/lib/socios/resolveSocioForAuthUser';

export const runtime = 'nodejs';

const BUCKET_EVIDENCIAS = 'evidencias';

export async function POST(request: NextRequest) {
  const debugBase: Record<string, unknown> = {
    bucket: BUCKET_EVIDENCIAS,
    subtareaId: null as string | null,
    tareaId: null as string | null,
    socioId: null as string | null,
    path: null as string | null,
    publicUrl: null as string | null,
    storageError: null as string | null,
    subtareaUpdateError: null as string | null,
  };

  try {
    const body = await request.json();
    const { dataUrl } = body;
    const subtareaId = typeof body?.subtareaId === 'string' ? body.subtareaId : null;
    debugBase.subtareaId = subtareaId;

    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json(
        { success: false, ok: false, error: 'dataUrl es requerido' },
        { status: 400 },
      );
    }

    if (!dataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, ok: false, error: 'El dataUrl debe ser una imagen válida' },
        { status: 400 },
      );
    }

    let path: string;
    try {
      const uploadResult = await uploadPhoto(dataUrl);
      path = uploadResult.path;
    } catch (storageErr) {
      const message =
        storageErr instanceof Error ? storageErr.message : 'Error al subir al storage';
      debugBase.storageError = message;
      return NextResponse.json(
        {
          error: 'UPLOAD_EVIDENCIA_SUBTAREA_ERROR',
          message: 'No se pudo subir la imagen al almacenamiento',
          debug: { ...debugBase, storageError: message },
        },
        { status: 500 },
      );
    }

    const supabase = createServiceSupabaseClient();
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_EVIDENCIAS).getPublicUrl(path);
    debugBase.path = path;
    debugBase.publicUrl = publicUrl;

    if (!subtareaId) {
      return NextResponse.json({
        ok: true,
        success: true,
        path,
        publicUrl,
        evidencia_url: publicUrl,
      });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'UPLOAD_EVIDENCIA_SUBTAREA_ERROR',
          message: 'No autenticado para asociar evidencia',
          debug: { ...debugBase },
        },
        { status: 401 },
      );
    }

    const supabaseAny = supabase as any;
    const { data: subtareaRow } = await supabaseAny
      .from('tareas_subtareas')
      .select(
        'id, socio_id, tarea_id, tareas:tareas(org_id, responsable_socio_id)',
      )
      .eq('id', subtareaId)
      .maybeSingle();

    if (!subtareaRow?.tareas?.org_id) {
      return NextResponse.json(
        {
          error: 'UPLOAD_EVIDENCIA_SUBTAREA_ERROR',
          message: 'Subtarea no encontrada para asociar evidencia',
          debug: { ...debugBase, subtareaUpdateError: 'SUBTAREA_NOT_FOUND' },
        },
        { status: 404 },
      );
    }

    debugBase.tareaId = subtareaRow.tarea_id ?? null;
    debugBase.socioId = subtareaRow.socio_id ?? null;

    const orgId = subtareaRow.tareas.org_id as string;
    const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
    const socio = await resolveSocioParaOperacionDeTarea(
      supabase,
      { id: user.id, email: user.email ?? null },
      {
        responsableSocioId: subtareaRow.socio_id ?? subtareaRow.tareas?.responsable_socio_id ?? null,
        orgId,
      },
    );

    if (rol !== 'SOCIO' && !socio) {
      return NextResponse.json(
        {
          error: 'UPLOAD_EVIDENCIA_SUBTAREA_ERROR',
          message: 'Solo el socio autorizado puede asociar evidencia',
          debug: { ...debugBase },
        },
        { status: 403 },
      );
    }

    const { error: updateError } = await supabaseAny
      .from('tareas_subtareas')
      .update({
        evidencia_url: publicUrl,
        evidencia_cargada: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtareaId);

    if (updateError) {
      const msg = updateError.message;
      debugBase.subtareaUpdateError = msg;
      return NextResponse.json(
        {
          error: 'UPLOAD_EVIDENCIA_SUBTAREA_ERROR',
          message: 'La foto subió, pero no se pudo asociar al bloque',
          debug: { ...debugBase },
        },
        { status: 500 },
      );
    }

    const { data: subtarea } = await supabaseAny
      .from('tareas_subtareas')
      .select('*')
      .eq('id', subtareaId)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      success: true,
      path,
      publicUrl,
      evidencia_url: publicUrl,
      subtarea,
    });
  } catch (error) {
    console.error('[UPLOAD_PHOTO_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Error al subir la imagen';
    return NextResponse.json(
      {
        error: 'UPLOAD_EVIDENCIA_SUBTAREA_ERROR',
        message,
        debug: {
          ...debugBase,
          storageError: debugBase.storageError ?? message,
        },
      },
      { status: 500 },
    );
  }
}
