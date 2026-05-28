import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { toDbUuidFromCanvasId, toClientBudgetGroupId } from '@/lib/canvas/canvasSupabaseMapper';
import { aprobarPresupuestoTareaEnPaquete } from '@/lib/services/aprobar-presupuesto-paquete.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CHANGE_WINDOW_OPEN = new Set(['abierta_cliente', 'confirmada_socio']);
const IN_FILTER_CHUNK = 100;

async function selectCanvasNodesByIds(
  supabaseAny: any,
  obraId: string,
  ids: string[],
): Promise<{ data: Array<{ id: string; type: string; title?: string | null }> | null; error: { message: string } | null }> {
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

async function selectTareasByCanvasNodeIds(
  supabaseAny: any,
  obraId: string,
  canvasNodeIds: string[],
): Promise<{
  data: Array<{
    id: string;
    canvas_node_id: string | null;
    dias_presupuesto?: number | null;
    title?: string | null;
  }> | null;
  error: { message: string } | null;
}> {
  if (canvasNodeIds.length === 0) {
    return { data: [], error: null };
  }
  const merged: Array<{
    id: string;
    canvas_node_id: string | null;
    dias_presupuesto?: number | null;
    title?: string | null;
  }> = [];
  for (let i = 0; i < canvasNodeIds.length; i += IN_FILTER_CHUNK) {
    const chunk = canvasNodeIds.slice(i, i + IN_FILTER_CHUNK);
    const { data, error } = await supabaseAny
      .from('tareas')
      .select('id, canvas_node_id, dias_presupuesto, title')
      .eq('obra_id', obraId)
      .in('canvas_node_id', chunk);
    if (error) {
      return { data: null, error };
    }
    merged.push(...(data ?? []));
  }
  return { data: merged, error: null };
}

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
  message?: string;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const warnings: string[] = [];
  try {
    const { id: obraId } = await params;
    const body = (await req.json().catch(() => ({}))) as Body;
    const budgetGroupIdRaw = typeof body.budgetGroupId === 'string' ? body.budgetGroupId.trim() : '';
    const socioId = typeof body.socioId === 'string' ? body.socioId.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!budgetGroupIdRaw || !socioId) {
      return NextResponse.json(
        { ok: false, error: 'Faltan budgetGroupId o socioId.' },
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

    const { data: inAgenda, error: agErr } = await supabaseAny
      .from('cliente_socio_agenda')
      .select('id')
      .eq('org_id', orgId)
      .eq('socio_id', socioId)
      .maybeSingle();

    if (agErr) {
      return NextResponse.json({ ok: false, error: agErr.message }, { status: 500 });
    }
    if (!inAgenda) {
      return NextResponse.json(
        { ok: false, error: 'El socio no está en tu agenda para esta organización.' },
        { status: 403 },
      );
    }

    const { data: groupRow, error: gErr } = await supabaseAny
      .from('canvas_budget_groups')
      .select('id, obra_id, status, change_window_status, approved_at')
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

    if (
      (groupStatus === 'aprobado' || groupStatus === 'aprobado_parcial') &&
      !CHANGE_WINDOW_OPEN.has(changeWindow)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Este paquete ya está aprobado. Para modificarlo, abrí una ventana de cambio (doble verificación) desde la pestaña Presupuestos.',
          errorCode: 'PAQUETE_YA_APROBADO',
        },
        { status: 409 },
      );
    }

    const { data: bgtRows, error: bgtErr } = await supabaseAny
      .from('canvas_budget_group_tasks')
      .select('task_node_id')
      .eq('obra_id', obraId)
      .eq('budget_group_id', dbGroupId);

    if (bgtErr) {
      return NextResponse.json({ ok: false, error: bgtErr.message }, { status: 500 });
    }

    // Misma fuente que el cliente (nodes[].budgetGroupId): nodos tarea con budget_group_id.
    // La tabla canvas_budget_group_tasks a veces queda desfasada tras guardados/publicaciones masivas.
    const { data: nodesInGroupRows, error: nbgErr } = await supabaseAny
      .from('canvas_nodes')
      .select('id')
      .eq('obra_id', obraId)
      .eq('type', 'tarea')
      .eq('budget_group_id', dbGroupId);

    if (nbgErr) {
      console.warn('[enviar-grupo] lectura canvas_nodes por budget_group_id:', nbgErr.message);
      warnings.push(
        'No se pudo alinear tareas por grupo en nodos del canvas; se usan solo los enlaces canvas_budget_group_tasks.',
      );
    }

    const taskNodeIdSet = new Set<string>();
    for (const r of bgtRows ?? []) {
      const tid = (r as { task_node_id?: string }).task_node_id;
      if (tid) {
        taskNodeIdSet.add(tid);
      }
    }
    for (const r of nodesInGroupRows ?? []) {
      const id = (r as { id?: string }).id;
      if (id) {
        taskNodeIdSet.add(id);
      }
    }

    const taskNodeIds = [...taskNodeIdSet];
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

    const { data: tareasRows, error: tErr } = await selectTareasByCanvasNodeIds(
      supabaseAny,
      obraId,
      tareaNodeIds,
    );

    if (tErr) {
      return NextResponse.json({ ok: false, error: tErr.message }, { status: 500 });
    }

    const canvasToTarea = new Map<
      string,
      { id: string; dias_presupuesto: number; title: string | null }
    >();
    for (const t of tareasRows ?? []) {
      const cid = (t as { canvas_node_id: string | null }).canvas_node_id;
      if (cid) {
        canvasToTarea.set(cid, {
          id: (t as { id: string }).id,
          dias_presupuesto: Math.max(
            1,
            Math.floor(Number((t as { dias_presupuesto?: number | null }).dias_presupuesto) || 1),
          ),
          title: (t as { title?: string | null }).title ?? null,
        });
      }
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

    const notasPayload = JSON.stringify({
      canvas_budget_group_id: toClientBudgetGroupId(dbGroupId),
      mensaje: message || undefined,
    });

    let presupuestosAprobados = 0;
    let presupuestosYaAprobados = 0;
    let presupuestosFallidos = 0;

    for (const nodeId of readyNodeIds) {
      const tareaMeta = canvasToTarea.get(nodeId);
      if (!tareaMeta) continue;
      const tareaId = tareaMeta.id;

      const result = await aprobarPresupuestoTareaEnPaquete(supabaseAny, {
        tareaId,
        socioId,
        diasPresupuesto: tareaMeta.dias_presupuesto,
        notasPayload: notasPayload,
      });

      if (!result.ok) {
        presupuestosFallidos += 1;
        warnings.push(
          `No se pudo aprobar presupuesto para «${tareaMeta.title ?? tareaId}»: ${result.error}`,
        );
        continue;
      }

      if (result.result.accion === 'ya_aprobado') {
        presupuestosYaAprobados += 1;
      } else {
        presupuestosAprobados += 1;
      }

      const { error: eventoError } = await supabaseAny.from('eventos').insert({
        tarea_id: tareaId,
        org_id: orgId,
        obra_id: obraId,
        actor_name: user.email ?? 'Cliente',
        actor_role: 'Cliente',
        actor_method: 'login',
        notas: `Paquete aprobado y tarea asignada al socio (grupo ${toClientBudgetGroupId(dbGroupId)})`,
        checklist: null,
        has_nc: false,
        nuevo_estado: 'pendiente' as const,
        snapshot_json: null,
        created_at: new Date().toISOString(),
      });
      if (eventoError) {
        warnings.push(`Evento no registrado para tarea ${tareaId}: ${eventoError.message}`);
      }
    }

    const totalOk = presupuestosAprobados + presupuestosYaAprobados;

    if (totalOk === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            warnings[0] ??
            (pendingPublish.length === tareaNodeIds.length
              ? 'Ninguna tarea del grupo está publicada todavía. Publicá las tareas operativas y volvé a intentar.'
              : 'No se pudo aprobar ningún presupuesto del paquete.'),
          warnings,
          presupuestosFallidos,
          pendingPublish,
          tasksReadyCount: readyNodeIds.length,
        },
        { status: presupuestosFallidos > 0 || pendingPublish.length > 0 ? 409 : 400 },
      );
    }

    const nowIso = new Date().toISOString();
    const finalGroupStatus =
      pendingPublish.length > 0 ? 'aprobado_parcial' : 'aprobado';

    const groupPatch: Record<string, unknown> = {
      status: finalGroupStatus,
      approved_at: nowIso,
      change_window_status: 'cerrada',
      change_window_opened_at: null,
      change_window_notes: null,
    };

    let stErr = (
      await supabaseAny
        .from('canvas_budget_groups')
        .update(groupPatch)
        .eq('id', dbGroupId)
        .eq('obra_id', obraId)
    ).error;

    if (stErr && finalGroupStatus === 'aprobado_parcial') {
      warnings.push(`No se pudo guardar estado «aprobado_parcial» (${stErr.message}). Se usa «aprobado».`);
      stErr = (
        await supabaseAny
          .from('canvas_budget_groups')
          .update({ ...groupPatch, status: 'aprobado' })
          .eq('id', dbGroupId)
          .eq('obra_id', obraId)
      ).error;
    }

    if (stErr) {
      warnings.push(`Presupuestos aprobados pero no se pudo actualizar estado del grupo: ${stErr.message}`);
    }

    const { error: notifError } = await supabaseAny.from('notificaciones').insert({
      org_id: orgId,
      obra_id: obraId,
      tarea_id: null,
      remitente_id: user.id,
      destinatario_id: socioId,
      socio_id: socioId,
      tipo: 'presupuesto_aprobado',
      titulo: 'Paquete de tareas aprobado',
      mensaje: `Se aprobó un paquete con ${totalOk} tarea${totalOk === 1 ? '' : 's'}. Ya podés comenzar bloques en la app.`,
      leida: false,
      created_at: nowIso,
    });
    if (notifError) {
      warnings.push(`Notificación al socio no enviada: ${notifError.message}`);
    }

    return NextResponse.json({
      ok: true,
      budgetGroupId: toClientBudgetGroupId(dbGroupId),
      socioId,
      tasksIncluded: tareaNodeIds.length,
      tasksPublishedCount: readyNodeIds.length,
      presupuestosAprobados,
      presupuestosYaAprobados,
      presupuestosFallidos,
      pendingPublish,
      groupStatus: finalGroupStatus,
      partial: pendingPublish.length > 0 || presupuestosFallidos > 0,
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
