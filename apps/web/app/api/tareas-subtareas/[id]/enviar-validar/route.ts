import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { SubtareaMvpService } from '@/lib/services/subtarea-mvp.service';
import { TareaFsmService } from '@/lib/services/tarea-fsm.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';
import { ESTADO_BLOQUE_FINAL, ESTADO_BLOQUE_PARA_VALIDAR } from '@/lib/domain/estados-core';
import { resolveSocioParaOperacionDeTarea } from '@/lib/socios/resolveSocioForAuthUser';

function statusFromMessage(msg: string): number {
  if (msg === 'FORBIDDEN_ACTION' || msg.includes('permiso')) return 403;
  if (msg.includes('evidencia')) return 409;
  if (msg.includes('en progreso')) return 409;
  return 500;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const evidenciaUrl = typeof body?.evidenciaUrl === 'string' ? body.evidenciaUrl : null;
    const videoUrl = typeof body?.videoUrl === 'string' ? body.videoUrl : null;
    const problemas = typeof body?.problemas === 'string' ? body.problemas : null;

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: subtarea } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, tarea_id, estado, socio_id, tareas:tareas(org_id, responsable_socio_id)')
      .eq('id', id)
      .maybeSingle();

    if (!subtarea) {
      return NextResponse.json({ success: false, error: 'Subtarea no encontrada' }, { status: 404 });
    }

    const orgId = subtarea.tareas?.org_id as string | undefined;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 400 });
    }

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
        { success: false, error: 'Solo socios pueden enviar bloques a validar' },
        { status: 403 },
      );
    }

    const socioId = socio?.id ?? await PermisoService.obtenerSocioIdPorUsuario(user.id, orgId);
    if (!socioId) {
      return NextResponse.json({ success: false, error: 'No se encontró tu perfil de socio' }, { status: 403 });
    }

    if (evidenciaUrl || videoUrl || problemas) {
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (evidenciaUrl) {
        patch.evidencia_url = evidenciaUrl;
        patch.evidencia_cargada = true;
      }
      if (videoUrl) {
        patch.video_url = videoUrl;
      }
      if (problemas) {
        patch.problemas = problemas;
      }

      const { error: evidenciaError } = await supabaseAny
        .from('tareas_subtareas')
        .update(patch)
        .eq('id', id);

      if (evidenciaError) {
        return NextResponse.json(
          {
            success: false,
            error: 'EVIDENCIA_UPDATE_ERROR',
            message: 'No se pudo guardar la evidencia del bloque',
            detail: evidenciaError.message,
          },
          { status: 500 },
        );
      }
    }

    await SubtareaMvpService.enviarParaValidar(id, {
      id: user.id,
      rol: 'SOCIO',
      socioId,
    });

    const { data: pendientes } = await supabaseAny
      .from('tareas_subtareas')
      .select('id')
      .eq('tarea_id', subtarea.tarea_id)
      .not('estado', 'in', `(${ESTADO_BLOQUE_PARA_VALIDAR},${ESTADO_BLOQUE_FINAL})`)
      .limit(1);

    if (!pendientes || pendientes.length === 0) {
      await TareaFsmService.enforceTransition({
        tareaId: subtarea.tarea_id,
        nuevoEstado: 'para_validar',
        actorId: user.id,
        rol: 'SOCIO',
        motivo: 'Bloques enviados a validar',
        socioOperadorId: socioId,
      });
    }

    const { data: updated } = await supabaseAny
      .from('tareas_subtareas')
      .select(
        `
        *,
        tareas:tareas (
          id,
          title,
          obra_id,
          estado,
          obras:obras (
            id,
            name,
            address
          )
        )
      `,
      )
      .eq('id', id)
      .maybeSingle();

    return NextResponse.json({ success: true, subtarea: updated });
  } catch (error) {
    console.error('[ENVIAR_VALIDAR_SUBTAREA]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: msg }, { status: statusFromMessage(msg) });
  }
}
