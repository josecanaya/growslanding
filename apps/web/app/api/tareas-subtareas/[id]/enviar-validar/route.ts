import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { SubtareaMvpService } from '@/lib/services/subtarea-mvp.service';
import { TareaFsmService } from '@/lib/services/tarea-fsm.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';
import {
  ESTADO_BLOQUE_FINAL,
  ESTADO_BLOQUE_PARA_VALIDAR,
  normalizeEstadoBloqueParaOperacion,
} from '@/lib/domain/estados-core';
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
      .select(
        'id, tarea_id, estado, socio_id, evidencia_obligatoria, evidencia_cargada, evidencia_url, tareas:tareas(org_id, responsable_socio_id)',
      )
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

    let urlTrim = typeof subtarea.evidencia_url === 'string' ? subtarea.evidencia_url.trim() : '';
    const evidenciaBody = typeof evidenciaUrl === 'string' ? evidenciaUrl.trim() : '';
    if (evidenciaBody && !urlTrim) {
      const { error: primingError } = await supabaseAny
        .from('tareas_subtareas')
        .update({
          evidencia_url: evidenciaBody,
          evidencia_cargada: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (primingError) {
        return NextResponse.json(
          {
            success: false,
            error: 'EVIDENCIA_UPDATE_ERROR',
            message: 'No se pudo guardar la evidencia del bloque',
            detail: primingError.message,
          },
          { status: 500 },
        );
      }
      subtarea.evidencia_url = evidenciaBody;
      subtarea.evidencia_cargada = true;
      urlTrim = evidenciaBody;
    }

    const evidenciaObligatoria = Boolean(subtarea.evidencia_obligatoria);
    const evidenciaCargada = Boolean(subtarea.evidencia_cargada);
    if (evidenciaObligatoria && (!evidenciaCargada || !urlTrim)) {
      return NextResponse.json(
        {
          success: false,
          error: 'EVIDENCIA_REQUERIDA',
          message: 'Debés cargar evidencia en el bloque antes de enviar a validar.',
        },
        { status: 409 },
      );
    }

    if (evidenciaUrl || videoUrl || problemas) {
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      /** No sobreescribir una URL ya persistida con data legacy del cliente (ej. path crudo). */
      const puedeCompletarEvidenciaDesdeBody =
        Boolean(evidenciaUrl?.trim()) && !urlTrim;
      if (evidenciaUrl && puedeCompletarEvidenciaDesdeBody) {
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

    const actorSubtarea = {
      id: user.id,
      rol: 'SOCIO' as const,
      socioId,
    };

    const estadoNorm = normalizeEstadoBloqueParaOperacion(subtarea.estado);
    if (estadoNorm === ESTADO_BLOQUE_PARA_VALIDAR || estadoNorm === ESTADO_BLOQUE_FINAL) {
      const { data: already } = await supabaseAny
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
      return NextResponse.json({ success: true, subtarea: already });
    }

    /** Si el socio nunca pulsó "Comenzar bloque", el bloque sigue en pendiente/rechazado: lo iniciamos antes de enviar a validar. */
    if (estadoNorm === 'pendiente' || estadoNorm === 'rechazado') {
      await SubtareaMvpService.iniciarBloque(id, actorSubtarea);
    }

    await SubtareaMvpService.enviarParaValidar(id, actorSubtarea);

    const { data: pendientes } = await supabaseAny
      .from('tareas_subtareas')
      .select('id')
      .eq('tarea_id', subtarea.tarea_id)
      .not('estado', 'in', `(${ESTADO_BLOQUE_PARA_VALIDAR},${ESTADO_BLOQUE_FINAL})`)
      .limit(1);

    if (!pendientes || pendientes.length === 0) {
      const { data: tareaRow } = await supabaseAny
        .from('tareas')
        .select('id, estado')
        .eq('id', subtarea.tarea_id)
        .maybeSingle();

      const estadoTareaOficial = TareaFsmService.mapLegacyToOficial(tareaRow?.estado);

      /**
       * El socio solo puede pasar la tarea pendiente → en_progreso y luego → para_validar.
       * Si el socio operó solo a nivel bloque, la tarea puede seguir en pendiente: normalizamos antes del último paso.
       */
      if (estadoTareaOficial === 'pendiente') {
        await TareaFsmService.enforceTransition({
          tareaId: subtarea.tarea_id,
          nuevoEstado: 'en_progreso',
          actorId: user.id,
          rol: 'SOCIO',
          motivo: 'Tarea en ejecución al enviar bloques a validar',
          socioOperadorId: socioId,
        });
      }

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
