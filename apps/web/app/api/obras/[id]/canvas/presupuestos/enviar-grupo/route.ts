import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { toDbUuidFromCanvasId, toClientBudgetGroupId } from '@/lib/canvas/canvasSupabaseMapper';
import { solicitarPresupuestoTareaEnPaquete } from '@/lib/services/solicitar-presupuesto-paquete.service';
import { socioEsContactoDeOrg } from '@/lib/socios/agenda-access';
import { MAX_OFERTORES_POR_PLIEGO } from '@/lib/cliente/pliegoPresupuesto';
import {
  countOfertoresEnGrupo,
  grupoTienePresupuestoAprobado,
  resolveTaskNodeIdsForBudgetGroup,
  resolveTareaIdsForTaskNodes,
} from '@/lib/canvas/budgetGroupTasks';
import { evaluarBloqueoPublicacionPliego } from '@/lib/canvas/budgetGroupPublish';
import { isMissingOptionalBudgetGroupSocioColumnsError } from '@/lib/canvas/budgetGroupColumnCompat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CHANGE_WINDOW_OPEN = new Set(['abierta_cliente', 'confirmada_socio']);

async function gateObra(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  obraId: string,
  allowedOrgIds: string[],
): Promise<{ ok: true; org_id: string } | { ok: false; status: number; message: string }> {
  if (allowedOrgIds.length === 0) {
    return { ok: false, status: 403, message: 'Sin organización accesible' };
  }
  const { data: obra, error } = await (supabase as any)
    .from('obras')
    .select('id, org_id')
    .eq('id', obraId)
    .maybeSingle();
  if (error || !obra) {
    return { ok: false, status: 404, message: 'Obra no encontrada' };
  }
  const org_id = obra.org_id as string;
  if (!allowedOrgIds.includes(org_id)) {
    return { ok: false, status: 403, message: 'No autorizado para esta obra' };
  }
  return { ok: true, org_id };
}

type Body = {
  budgetGroupId?: string;
  socioId?: string;
  socioIds?: string[];
  message?: string;
  /** Invitar socios de la agenda (crea filas PENDIENTE). Default true si hay socioIds. */
  publishToAgenda?: boolean;
  /** Publicar en bolsa: visible para todos los socios; postulan desde Oportunidades. */
  publishToBolsa?: boolean;
};

async function selectCanvasNodesByIds(
  supabaseAny: any,
  obraId: string,
  ids: string[],
): Promise<{ data: Array<{ id: string; type: string; title?: string | null }> | null; error: { message: string } | null }> {
  const IN_FILTER_CHUNK = 100;
  if (ids.length === 0) {
    return { data: [], error: null };
  }
  const merged: Array<{ id: string; type: string; title?: string | null }> = [];
  for (let i = 0; i < ids.length; i += IN_FILTER_CHUNK) {
    const chunk = ids.slice(i, i + IN_FILTER_CHUNK);
    const { data, error } = await supabaseAny
      .from('canvas_nodes')
      .select('id, type, title')
      .eq('obra_id', obraId)
      .in('id', chunk);
    if (error) {
      return { data: null, error };
    }
    merged.push(...(data ?? []));
  }
  return { data: merged, error: null };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const warnings: string[] = [];
  try {
    const { id: obraId } = await params;
    const body = (await req.json().catch(() => ({}))) as Body;
    const budgetGroupIdRaw = typeof body.budgetGroupId === 'string' ? body.budgetGroupId.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const socioIdsRaw = Array.isArray(body.socioIds)
      ? body.socioIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];
    if (typeof body.socioId === 'string' && body.socioId.trim()) {
      socioIdsRaw.push(body.socioId.trim());
    }
    const socioIds = [...new Set(socioIdsRaw.map((id) => id.trim()))];
    const publishToBolsa = body.publishToBolsa === true;
    const publishToAgenda =
      body.publishToAgenda === false ? false : publishToBolsa ? socioIds.length > 0 : true;

    if (!budgetGroupIdRaw) {
      return NextResponse.json({ ok: false, error: 'Falta budgetGroupId.' }, { status: 400 });
    }

    if (!publishToBolsa && (!publishToAgenda || socioIds.length === 0)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Elegí al menos un destino: socios de tu agenda o publicar en bolsa (todos los socios).',
        },
        { status: 400 },
      );
    }

    if (publishToAgenda && socioIds.length === 0 && !publishToBolsa) {
      return NextResponse.json(
        { ok: false, error: 'Elegí al menos un socio de la agenda o activá la bolsa.' },
        { status: 400 },
      );
    }

    if (publishToAgenda && socioIds.length > MAX_OFERTORES_POR_PLIEGO) {
      return NextResponse.json(
        {
          ok: false,
          error: `Un pliego admite hasta ${MAX_OFERTORES_POR_PLIEGO} ofertores. Elegí menos socios.`,
        },
        { status: 400 },
      );
    }

    let dbGroupId: string;
    try {
      dbGroupId = toDbUuidFromCanvasId(budgetGroupIdRaw);
    } catch {
      return NextResponse.json({ ok: false, error: 'Grupo inválido' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    let supabase;
    try {
      supabase = createServiceSupabaseClient();
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : 'Configuración incompleta' },
        { status: 503 },
      );
    }

    const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
    const gate = await gateObra(supabase, obraId, allowedOrgIds);
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.message }, { status: gate.status });
    }

    const orgId = gate.org_id;
    const supabaseAny = supabase as any;

    for (const sid of socioIds) {
      if (!publishToAgenda) continue;
      const esContacto = await socioEsContactoDeOrg(supabase, sid, orgId);
      if (!esContacto) {
        return NextResponse.json(
          { ok: false, error: `El socio ${sid} no está en tu agenda para esta organización.` },
          { status: 403 },
        );
      }
    }

    const { data: groupRow, error: gErr } = await supabaseAny
      .from('canvas_budget_groups')
      .select(
        'id, obra_id, status, change_window_status, approved_at, bolsa_publicada, pliego_publicado_at, publicado_a_agenda',
      )
      .eq('id', dbGroupId)
      .eq('obra_id', obraId)
      .maybeSingle();

    if (gErr || !groupRow) {
      return NextResponse.json({ ok: false, error: 'Grupo no encontrado' }, { status: 404 });
    }

    const groupStatus = String((groupRow as { status?: string }).status ?? '').toLowerCase();
    const changeWindow = String(
      (groupRow as { change_window_status?: string }).change_window_status ?? 'cerrada',
    ).toLowerCase();

    const { taskNodeIds, error: resolveErr } = await resolveTaskNodeIdsForBudgetGroup(
      supabaseAny,
      obraId,
      dbGroupId,
    );
    if (resolveErr) {
      return NextResponse.json({ ok: false, error: resolveErr }, { status: 500 });
    }

    const { tareaIds, canvasToTarea, error: tareaResolveErr } = await resolveTareaIdsForTaskNodes(
      supabaseAny,
      obraId,
      taskNodeIds,
    );
    if (tareaResolveErr) {
      return NextResponse.json({ ok: false, error: tareaResolveErr }, { status: 500 });
    }

    const tieneAprobado = await grupoTienePresupuestoAprobado(supabaseAny, tareaIds);
    const bloqueo = evaluarBloqueoPublicacionPliego({
      groupStatus,
      changeWindowStatus: changeWindow,
      pliegoPublicadoAt: (groupRow as { pliego_publicado_at?: string | null }).pliego_publicado_at,
      tienePresupuestoAprobadoEnGrupo: tieneAprobado,
    });
    if (bloqueo.blocked) {
      return NextResponse.json(
        {
          ok: false,
          error: bloqueo.message,
          errorCode: bloqueo.reason?.toUpperCase(),
        },
        { status: 409 },
      );
    }

    if (taskNodeIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'El grupo no tiene tareas incluidas.', warnings },
        { status: 400 },
      );
    }

    const { data: nodeRows, error: nErr } = await selectCanvasNodesByIds(supabaseAny, obraId, taskNodeIds);

    if (nErr) {
      return NextResponse.json({ ok: false, error: nErr.message }, { status: 500 });
    }

    const tareaNodeIds = (nodeRows ?? [])
      .filter((n: { type: string }) => n.type === 'tarea')
      .map((n: { id: string }) => n.id);

    if (tareaNodeIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No hay nodos tipo tarea en este grupo.', warnings },
        { status: 400 },
      );
    }

    const nodeTitleById = new Map<string, string>();
    for (const nid of tareaNodeIds) {
      const row = (nodeRows ?? []).find((n: { id: string }) => n.id === nid) as
        | { id: string; title?: string | null }
        | undefined;
      nodeTitleById.set(nid, row?.title != null ? String(row.title) : '');
    }

    const pendingPublish: Array<{ canvasNodeId: string; title: string | null; motivo: string }> = [];
    for (const nid of tareaNodeIds) {
      if (!canvasToTarea.has(nid)) {
        pendingPublish.push({
          canvasNodeId: nid,
          title: nodeTitleById.get(nid) || null,
          motivo: 'Falta publicación: la tarea operativa no está creada o vinculada al nodo del canvas.',
        });
      }
    }

    const readyNodeIds = tareaNodeIds.filter((nid) => canvasToTarea.has(nid));

    if (publishToAgenda && socioIds.length > 0) {
      const ofertoresActuales = await countOfertoresEnGrupo(supabaseAny, tareaIds);
      const sociosNuevos = socioIds.length;
      if (ofertoresActuales + sociosNuevos > MAX_OFERTORES_POR_PLIEGO) {
        return NextResponse.json(
          {
            ok: false,
            error: `Este pliego admite hasta ${MAX_OFERTORES_POR_PLIEGO} ofertores en total. Ya hay ${ofertoresActuales} y querés sumar ${sociosNuevos}.`,
          },
          { status: 400 },
        );
      }
    }

    const notasPayload = JSON.stringify({
      canvas_budget_group_id: toClientBudgetGroupId(dbGroupId),
      mensaje: message || undefined,
    });

    let solicitudesCreadas = 0;
    let solicitudesYaExistentes = 0;
    let solicitudesFallidas = 0;

    if (publishToAgenda) {
      for (const socioId of socioIds) {
        for (const nodeId of readyNodeIds) {
          const tareaMeta = canvasToTarea.get(nodeId);
          if (!tareaMeta) continue;
          const tareaId = tareaMeta.id;

          const result = await solicitarPresupuestoTareaEnPaquete(supabaseAny, {
            tareaId,
            socioId,
            diasPresupuesto: tareaMeta.dias_presupuesto,
            notasPayload: notasPayload,
          });

          if (!result.ok) {
            solicitudesFallidas += 1;
            warnings.push(
              `No se pudo solicitar presupuesto a socio ${socioId} para «${tareaMeta.title ?? tareaId}»: ${result.error}`,
            );
            continue;
          }

          if (result.result.accion === 'ya_solicitado') {
            solicitudesYaExistentes += 1;
          } else {
            solicitudesCreadas += 1;
          }
        }

        const countNuevas = readyNodeIds.length;
        const mensajeNotificacion =
          countNuevas === 1
            ? `Tenés 1 tarea para presupuestar en la obra (paquete ${toClientBudgetGroupId(dbGroupId)})`
            : `Tenés ${countNuevas} tareas para presupuestar en la obra (paquete ${toClientBudgetGroupId(dbGroupId)})`;

        const { error: notifSocioError } = await supabaseAny.from('notificaciones').insert({
          org_id: orgId,
          obra_id: obraId,
          tarea_id: readyNodeIds.length
            ? canvasToTarea.get(readyNodeIds[0])?.id ?? null
            : null,
          remitente_id: user.id,
          destinatario_id: socioId,
          socio_id: socioId,
          tipo: 'presupuesto',
          titulo: 'Nueva solicitud de presupuesto',
          mensaje: message ? `${mensajeNotificacion}. ${message}` : mensajeNotificacion,
          leida: false,
          created_at: new Date().toISOString(),
        });
        if (notifSocioError) {
          warnings.push(`Notificación al socio ${socioId} no enviada: ${notifSocioError.message}`);
        }
      }
    }

    const agendaOk = solicitudesCreadas + solicitudesYaExistentes > 0;
    const bolsaOk = publishToBolsa && readyNodeIds.length > 0;

    if (!agendaOk && !bolsaOk) {
      return NextResponse.json(
        {
          ok: false,
          error:
            warnings[0] ??
            (pendingPublish.length === tareaNodeIds.length
              ? 'Ninguna tarea del grupo está publicada todavía. Publicá las tareas operativas y volvé a intentar.'
              : 'No se pudo crear ninguna solicitud de presupuesto del paquete.'),
          warnings,
          solicitudesFallidas,
          presupuestosFallidos: solicitudesFallidas,
          pendingPublish,
          tasksReadyCount: readyNodeIds.length,
        },
        { status: solicitudesFallidas > 0 || pendingPublish.length > 0 ? 409 : 400 },
      );
    }

    const nowIso = new Date().toISOString();
    const finalGroupStatus =
      pendingPublish.length > 0 ? 'enviado_parcial' : 'enviado';

    const prevPublicadoAt = (groupRow as { pliego_publicado_at?: string | null }).pliego_publicado_at;
    const prevBolsa = Boolean((groupRow as { bolsa_publicada?: boolean }).bolsa_publicada);
    const prevAgenda = Boolean((groupRow as { publicado_a_agenda?: boolean }).publicado_a_agenda);

    const groupPatch: Record<string, unknown> = {
      status: finalGroupStatus,
      approved_at: null,
      change_window_status: 'cerrada',
      change_window_opened_at: null,
      change_window_notes: null,
      bolsa_publicada: prevBolsa || publishToBolsa,
      publicado_a_agenda: prevAgenda || (publishToAgenda && agendaOk),
      pliego_publicado_at: prevPublicadoAt || nowIso,
    };

    let stErr = (
      await supabaseAny
        .from('canvas_budget_groups')
        .update(groupPatch)
        .eq('id', dbGroupId)
        .eq('obra_id', obraId)
    ).error;

    if (stErr && isMissingOptionalBudgetGroupSocioColumnsError(stErr)) {
      const fallback = { ...groupPatch };
      delete fallback.bolsa_publicada;
      delete fallback.publicado_a_agenda;
      delete fallback.pliego_publicado_at;
      stErr = (
        await supabaseAny
          .from('canvas_budget_groups')
          .update(fallback)
          .eq('id', dbGroupId)
          .eq('obra_id', obraId)
      ).error;
      if (publishToBolsa) {
        warnings.push(
          'Aplicá la migración canvas_budget_groups_publicacion_bolsa para habilitar la bolsa en base de datos.',
        );
      }
    }

    if (stErr && finalGroupStatus === 'enviado_parcial') {
      warnings.push(`No se pudo guardar estado «enviado_parcial» (${stErr.message}). Se usa «enviado».`);
      stErr = (
        await supabaseAny
          .from('canvas_budget_groups')
          .update({ ...groupPatch, status: 'enviado' })
          .eq('id', dbGroupId)
          .eq('obra_id', obraId)
      ).error;
    }

    if (stErr) {
      warnings.push(`Solicitudes enviadas pero no se pudo actualizar estado del grupo: ${stErr.message}`);
    }

    return NextResponse.json({
      ok: true,
      budgetGroupId: toClientBudgetGroupId(dbGroupId),
      socioIds: publishToAgenda ? socioIds : [],
      publishToBolsa,
      publishToAgenda,
      bolsaPublicada: prevBolsa || publishToBolsa,
      tasksIncluded: tareaNodeIds.length,
      tasksPublishedCount: readyNodeIds.length,
      solicitudesCreadas,
      solicitudesYaExistentes,
      solicitudesFallidas,
      presupuestosAprobados: solicitudesCreadas,
      presupuestosYaAprobados: solicitudesYaExistentes,
      presupuestosFallidos: solicitudesFallidas,
      pendingPublish,
      groupStatus: finalGroupStatus,
      partial: pendingPublish.length > 0 || solicitudesFallidas > 0,
      warnings,
    });
  } catch (e) {
    console.error('[POST enviar-grupo]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno', warnings },
      { status: 500 },
    );
  }
}
