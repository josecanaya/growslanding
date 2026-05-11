import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { uploadPhoto } from '@/lib/storage';
import type { Database } from '@/lib/types/supabase.gen';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';
import { resolveSocioParaOperacionDeTarea } from '@/lib/socios/resolveSocioForAuthUser';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataUrl } = body;
    const subtareaId = typeof body?.subtareaId === 'string' ? body.subtareaId : null;

    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'dataUrl es requerido' },
        { status: 400 }
      );
    }

    // Validar que sea un dataUrl válido
    if (!dataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'El dataUrl debe ser una imagen válida' },
        { status: 400 }
      );
    }

    // Subir usando la función del servidor
    const { path } = await uploadPhoto(dataUrl);

    if (subtareaId) {
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
          { success: false, error: 'No autenticado para asociar evidencia' },
          { status: 401 },
        );
      }

      const supabase = createServiceSupabaseClient();
      const supabaseAny = supabase as any;
      const { data: subtarea } = await supabaseAny
        .from('tareas_subtareas')
        .select('id, socio_id, tareas:tareas(org_id, responsable_socio_id)')
        .eq('id', subtareaId)
        .maybeSingle();

      if (!subtarea?.tareas?.org_id) {
        return NextResponse.json(
          { success: false, error: 'Subtarea no encontrada para asociar evidencia' },
          { status: 404 },
        );
      }

      const orgId = subtarea.tareas.org_id as string;
      const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
      const socio = await resolveSocioParaOperacionDeTarea(
        supabase,
        { id: user.id, email: user.email ?? null },
        {
          responsableSocioId: subtarea.socio_id ?? subtarea.tareas?.responsable_socio_id ?? null,
          orgId,
        },
      );

      if (rol !== 'SOCIO' && !socio) {
        return NextResponse.json(
          { success: false, error: 'Solo el socio autorizado puede asociar evidencia' },
          { status: 403 },
        );
      }

      const { error: updateError } = await supabaseAny
        .from('tareas_subtareas')
        .update({
          evidencia_url: path,
          evidencia_cargada: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subtareaId);

      if (updateError) {
        return NextResponse.json(
          {
            success: false,
            error: 'EVIDENCIA_UPDATE_ERROR',
            message: 'La foto subió, pero no se pudo asociar al bloque',
            detail: updateError.message,
            path,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      path,
    });

  } catch (error) {
    console.error('[UPLOAD_PHOTO_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir la imagen',
      },
      { status: 500 }
    );
  }
}

