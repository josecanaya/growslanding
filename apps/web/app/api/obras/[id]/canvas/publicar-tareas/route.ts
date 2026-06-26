import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { PermisoService } from '@/lib/services/permiso.service';
import { TareasRepository, TareaMetadataService } from '@/lib/tareas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Evita cortes en publicaciones largas (tareas + precedencias) en hosting con límite por defecto. */
export const maxDuration = 120;

const ELEMENTO_CANVAS_NOMBRE = 'Canvas operativo';
const ELEMENTO_CANVAS_CATEGORIA = 'sistema';
const TIPO_DEPENDENCIA_FS = 'FINISH_TO_START';

type CanvasNodeRow = {
  id: string;
  obra_id: string;
  org_id: string | null;
  type: string;
  title: string | null;
  description: string | null;
  planned_duration_days: number | null;
  is_critical: boolean | null;
};

type CanvasEdgeRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  type: string;
  is_critical: boolean | null;
  lag_days: number | null;
};

async function assertObraInOrgs(
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
  const orgId = obra.org_id as string;
  if (!allowedOrgIds.includes(orgId)) {
    return { ok: false, status: 403, message: 'No autorizado para esta obra' };
  }
  return { ok: true, org_id: orgId };
}

async function puedePublicarTareasEnOrganizacion(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  user: { id: string; email?: string | null },
  orgId: string,
): Promise<boolean> {
  const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
  if (rol === 'CLIENTE') {
    return true;
  }

  if (user.email) {
    try {
      const { data, error } = await (supabase as any)
        .from('leader_invites')
        .select('id')
        .eq('org_id', orgId)
        .eq('email', user.email)
        .eq('status', 'accepted')
        .maybeSingle();
      if (error) {
        const msg = String(error.message ?? '').toLowerCase();
        const code = (error as { code?: string }).code;
        if (!msg.includes('does not exist') && code !== '42P01') {
          console.warn('[publicar-tareas] leader_invites:', error.message);
        }
      }
      if (data) {
        return true;
      }
    } catch (e) {
      console.warn('[publicar-tareas] leader_invites:', e);
    }
  }
  return false;
}

function isTransientPublishError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('socket') ||
    msg.includes('timeout') ||
    msg.includes('etimedout') ||
    msg.includes('eai_again')
  );
}

async function ensureElementoCanvasOperativo(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  obraId: string,
  warnings: string[],
): Promise<string> {
  const supabaseAny = supabase as any;
  // Solo obra_id + nombre: muchas BDs tienen único (obra_id, nombre). Filtrar también por
  // categoria impedía ver filas creadas con otra categoría y el INSERT volvía a chocar con la unique.
  const { data: existingRows, error: readErr } = await supabaseAny
    .from('elementos')
    .select('id')
    .eq('obra_id', obraId)
    .eq('nombre', ELEMENTO_CANVAS_NOMBRE)
    .limit(1);

  if (readErr) {
    throw new Error(readErr.message || 'No se pudo leer elementos');
  }

  const existingId = existingRows?.[0]?.id as string | undefined;
  if (existingId) {
    warnings.push('Elemento técnico reutilizado: Canvas operativo');
    return existingId;
  }

  const { data: created, error: insErr } = await supabaseAny
    .from('elementos')
    .insert({
      obra_id: obraId,
      nombre: ELEMENTO_CANVAS_NOMBRE,
      categoria: ELEMENTO_CANVAS_CATEGORIA,
      unidad: 'ud',
      cantidad: 1,
    })
    .select('id')
    .single();

  if (!insErr && created?.id) {
    warnings.push('Elemento técnico creado: Canvas operativo');
    return created.id as string;
  }

  const pgCode = (insErr as { code?: string } | null)?.code;
  if (pgCode === '23505') {
    const { data: again } = await supabaseAny
      .from('elementos')
      .select('id')
      .eq('obra_id', obraId)
      .eq('nombre', ELEMENTO_CANVAS_NOMBRE)
      .limit(1);
    const rid = again?.[0]?.id as string | undefined;
    if (rid) {
      warnings.push('Elemento técnico reutilizado: Canvas operativo (ya existía en la obra)');
      return rid;
    }
  }

  throw new Error(insErr?.message || 'No se pudo crear elemento Canvas operativo');
}

async function fetchTareasByCanvasNodeIds(
  obraId: string,
  canvasNodeIds: string[],
  select: string,
): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  try {
    const data = await TareasRepository.findByCanvasNodeIds(obraId, canvasNodeIds, select);
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : 'Error al leer tareas' },
    };
  }
}

function buildPreviewFromRows(
  taskNodes: CanvasNodeRow[],
  edges: CanvasEdgeRow[],
  publishedIds: Set<string>,
) {
  const taskIdSet = new Set(taskNodes.map((n) => n.id));
  let precedenceEdgesDetected = 0;
  for (const e of edges) {
    if (e.type !== 'precedencia') {
      continue;
    }
    const s = taskIdSet.has(e.source_node_id);
    const t = taskIdSet.has(e.target_node_id);
    if (s && t) {
      precedenceEdgesDetected++;
    }
  }

  const alreadyPublished = taskNodes.filter((n) => publishedIds.has(n.id)).length;
  return {
    taskNodesDetected: taskNodes.length,
    alreadyPublished,
    newEstimated: Math.max(0, taskNodes.length - alreadyPublished),
    precedenceEdgesDetected,
  };
}

/**
 * GET — vista previa (sin escritura): conteos para confirmar publicación.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: obraId } = await params;
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
    const gate = await assertObraInOrgs(supabase, obraId, allowedOrgIds);
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.message }, { status: gate.status });
    }

    const can = await puedePublicarTareasEnOrganizacion(supabase, user, gate.org_id);
    if (!can) {
      return NextResponse.json(
        { ok: false, error: 'No tenés permiso para publicar tareas en esta organización.' },
        { status: 403 },
      );
    }

    const supabaseAny = supabase as any;
    const { data: nodeRows, error: nErr } = await supabaseAny
      .from('canvas_nodes')
      .select('id, type')
      .eq('obra_id', obraId);

    if (nErr) {
      return NextResponse.json({ ok: false, error: nErr.message }, { status: 500 });
    }

    const allNodes = (nodeRows ?? []) as Array<{ id: string; type: string }>;
    const taskNodesMeta = allNodes.filter((n) => n.type === 'tarea');
    const taskIds = taskNodesMeta.map((n) => n.id);

    const publishedIds = new Set<string>();
    if (taskIds.length > 0) {
      const { data: tareasRows, error: tErr } = await fetchTareasByCanvasNodeIds(
        obraId,
        taskIds,
        'canvas_node_id',
      );
      if (tErr) {
        return NextResponse.json({ ok: false, error: tErr.message }, { status: 500 });
      }
      for (const row of tareasRows ?? []) {
        const cid = (row as { canvas_node_id: string | null }).canvas_node_id;
        if (cid) {
          publishedIds.add(cid);
        }
      }
    }

    const { data: edgeRows, error: eErr } = await supabaseAny
      .from('canvas_edges')
      .select('source_node_id, target_node_id, type')
      .eq('obra_id', obraId);

    if (eErr) {
      return NextResponse.json({ ok: false, error: eErr.message }, { status: 500 });
    }

    const taskIdSet = new Set(taskIds);
    const edges = (edgeRows ?? []) as CanvasEdgeRow[];
    let precedenceEdgesDetected = 0;
    for (const e of edges) {
      if (e.type !== 'precedencia') {
        continue;
      }
      if (taskIdSet.has(e.source_node_id) && taskIdSet.has(e.target_node_id)) {
        precedenceEdgesDetected++;
      }
    }

    const alreadyPublished = taskIds.filter((id) => publishedIds.has(id)).length;
    return NextResponse.json({
      ok: true,
      preview: {
        taskNodesDetected: taskIds.length,
        alreadyPublished,
        newEstimated: Math.max(0, taskIds.length - alreadyPublished),
        precedenceEdgesDetected,
      },
    });
  } catch (e) {
    console.error('[GET publicar-tareas]', e);
    const transient = isTransientPublishError(e);
    return NextResponse.json(
      {
        ok: false,
        error: transient
          ? 'No pudimos conectar con la base de datos. Probá de nuevo en unos segundos.'
          : e instanceof Error
            ? e.message
            : 'Error interno',
        retryable: transient,
      },
      { status: transient ? 503 : 500 },
    );
  }
}

/**
 * POST — publicar nodos canvas type=tarea como filas en public.tareas y precedencias.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const warnings: string[] = [];
  let createdTasks = 0;
  let updatedTasks = 0;
  let skippedNodes = 0;
  let createdPrecedences = 0;
  let skippedEdges = 0;

  try {
    const { id: obraId } = await params;
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
    const gate = await assertObraInOrgs(supabase, obraId, allowedOrgIds);
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.message }, { status: gate.status });
    }

    const obraOrgId = gate.org_id;

    const can = await puedePublicarTareasEnOrganizacion(supabase, user, obraOrgId);
    if (!can) {
      return NextResponse.json(
        { ok: false, error: 'No tenés permiso para publicar tareas en esta organización.' },
        { status: 403 },
      );
    }

    const supabaseAny = supabase as any;

    const { data: nodeRows, error: nErr } = await supabaseAny
      .from('canvas_nodes')
      .select(
        'id, obra_id, org_id, type, title, description, planned_duration_days, is_critical',
      )
      .eq('obra_id', obraId);

    if (nErr) {
      return NextResponse.json({ ok: false, error: nErr.message }, { status: 500 });
    }

    const allNodes = (nodeRows ?? []) as CanvasNodeRow[];
    const nodesById = new Map(allNodes.map((n) => [n.id, n]));
    const taskNodes = allNodes.filter((n) => n.type === 'tarea');
    // #region agent log
    fetch('http://127.0.0.1:7442/ingest/29db9a63-8d84-4477-8ab7-861ee9aeea7c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'41b243'},body:JSON.stringify({sessionId:'41b243',runId:'pre-fix',hypothesisId:'H1,H2,H3,H4',location:'app/api/obras/[id]/canvas/publicar-tareas/route.ts:406',message:'canvas publish task nodes loaded',data:{obraId,allNodesCount:allNodes.length,taskNodesCount:taskNodes.length,plannedSamples:taskNodes.slice(0,5).map((n)=>({nodeId:n.id,planned_duration_days:n.planned_duration_days,plannedType:typeof n.planned_duration_days,titleLen:(n.title??'').length}))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (taskNodes.length === 0) {
      return NextResponse.json({
        ok: true,
        createdTasks: 0,
        updatedTasks: 0,
        skippedNodes: 0,
        createdPrecedences: 0,
        skippedEdges: 0,
        warnings: ['No hay nodos tipo tarea en el canvas de esta obra.'],
      });
    }

    const elementoId = await ensureElementoCanvasOperativo(supabase, obraId, warnings);

    const nowIso = new Date().toISOString();
    const canvasNodeIds = taskNodes.map((n) => n.id);

    const { data: existingTareas, error: exErr } = await fetchTareasByCanvasNodeIds(
      obraId,
      canvasNodeIds,
      'id, canvas_node_id, estado, bloques_planificados, elemento_id',
    );

    if (exErr) {
      return NextResponse.json({ ok: false, error: exErr.message }, { status: 500 });
    }

    const existingByCanvasNode = new Map<string, { id: string; elemento_id: string | null }>();
    for (const row of existingTareas ?? []) {
      const r = row as {
        id: string;
        canvas_node_id: string | null;
        elemento_id: string | null;
      };
      if (r.canvas_node_id) {
        existingByCanvasNode.set(r.canvas_node_id, { id: r.id, elemento_id: r.elemento_id });
      }
    }

    const canvasNodeIdToTareaId = new Map<string, string>();

    for (const node of taskNodes) {
      const orgId = node.org_id || obraOrgId;
      const rawTitle = (node.title ?? '').trim();
      const title = rawTitle || '(Sin título)';
      if (!rawTitle) {
        warnings.push(`Nodo tarea ${node.id}: sin título; se usó "(Sin título)".`);
      }

      const planned = node.planned_duration_days;
      if (planned == null || Number(planned) < 1) {
        warnings.push(`Nodo tarea "${title}": sin duración planificada; se usó 1 día.`);
      }
      const diasPresupuesto = Math.max(1, Math.floor(Number(planned) || 1));
      // #region agent log
      fetch('http://127.0.0.1:7442/ingest/29db9a63-8d84-4477-8ab7-861ee9aeea7c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'41b243'},body:JSON.stringify({sessionId:'41b243',runId:'pre-fix',hypothesisId:'H1,H2,H3,H4',location:'app/api/obras/[id]/canvas/publicar-tareas/route.ts:464',message:'canvas node duration normalized before upsert',data:{nodeId:node.id,rawPlanned:planned,rawPlannedType:typeof planned,diasPresupuesto,willUpdateExisting:existingByCanvasNode.has(node.id)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      const descripcion = node.description ?? null;
      const isCritical = Boolean(node.is_critical);

      const existing = existingByCanvasNode.get(node.id);

      try {
        const upsert = await TareaMetadataService.upsertDesdeCanvas({
          existingId: existing?.id ?? null,
          existingElementoId: existing?.elemento_id ?? null,
          actorId: user.id,
          payload: {
            obra_id: obraId,
            org_id: orgId,
            elemento_id: elementoId,
            canvas_node_id: node.id,
            title,
            descripcion,
            dias_presupuesto: diasPresupuesto,
            is_critical: isCritical,
            source: 'canvas',
            published_from_canvas_at: nowIso,
          },
        });

        if (upsert.created) {
          createdTasks++;
        } else {
          updatedTasks++;
        }
        canvasNodeIdToTareaId.set(node.id, upsert.id);
      } catch (upsertErr) {
        // #region agent log
        fetch('http://127.0.0.1:7442/ingest/29db9a63-8d84-4477-8ab7-861ee9aeea7c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'41b243'},body:JSON.stringify({sessionId:'41b243',runId:'pre-fix',hypothesisId:'H2,H4,H5',location:'app/api/obras/[id]/canvas/publicar-tareas/route.ts:497',message:'canvas task upsert failed',data:{nodeId:node.id,diasPresupuesto,errorMessage:upsertErr instanceof Error ? upsertErr.message : String(upsertErr)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        warnings.push(
          `No se pudo publicar tarea para nodo ${node.id}: ${upsertErr instanceof Error ? upsertErr.message : 'error'}`,
        );
        skippedNodes++;
      }
    }

    const { data: edgeRows, error: eErr } = await supabaseAny
      .from('canvas_edges')
      .select('id, source_node_id, target_node_id, type, is_critical, lag_days')
      .eq('obra_id', obraId);

    if (eErr) {
      warnings.push(`No se pudieron leer aristas del canvas: ${eErr.message}`);
    } else {
      const edges = (edgeRows ?? []) as CanvasEdgeRow[];

      for (const edge of edges) {
        if (edge.type !== 'precedencia') {
          continue;
        }

        const srcNode = nodesById.get(edge.source_node_id);
        const tgtNode = nodesById.get(edge.target_node_id);

        if (!srcNode || !tgtNode || srcNode.type !== 'tarea' || tgtNode.type !== 'tarea') {
          skippedEdges++;
          continue;
        }

        const predTareaId = canvasNodeIdToTareaId.get(edge.source_node_id);
        const succTareaId = canvasNodeIdToTareaId.get(edge.target_node_id);

        if (!predTareaId || !succTareaId) {
          warnings.push(
            `Precedencia omitida: falta tarea publicada para extremos ${edge.source_node_id} → ${edge.target_node_id}.`,
          );
          skippedEdges++;
          continue;
        }

        if (predTareaId === succTareaId) {
          skippedEdges++;
          continue;
        }

        const { data: dup, error: dupErr } = await supabaseAny
          .from('tarea_precedencias')
          .select('id')
          .eq('tarea_id', succTareaId)
          .eq('depende_de', predTareaId)
          .maybeSingle();

        if (dupErr) {
          warnings.push(`Error comprobando precedencia: ${dupErr.message}`);
          skippedEdges++;
          continue;
        }

        if (dup?.id) {
          warnings.push(`Precedencia duplicada omitida: ${predTareaId} → ${succTareaId}`);
          skippedEdges++;
          continue;
        }

        const lag = edge.lag_days != null ? Number(edge.lag_days) : 0;
        const { error: pInsErr } = await supabaseAny.from('tarea_precedencias').insert({
          tarea_id: succTareaId,
          depende_de: predTareaId,
          lag_dias: Number.isFinite(lag) ? lag : 0,
          tipo_dependencia: TIPO_DEPENDENCIA_FS,
        });

        if (pInsErr) {
          warnings.push(`No se pudo crear precedencia ${predTareaId} → ${succTareaId}: ${pInsErr.message}`);
          skippedEdges++;
          continue;
        }

        createdPrecedences++;
      }
    }

    return NextResponse.json({
      ok: true,
      createdTasks,
      updatedTasks,
      skippedNodes,
      createdPrecedences,
      skippedEdges,
      warnings,
    });
  } catch (e) {
    console.error('[POST publicar-tareas]', e);
    const transient = isTransientPublishError(e);
    const errorMsg = transient
      ? 'Fallo temporal de conexión con la base de datos. Volvé a pulsar «Guardar en la nube» en unos segundos.'
      : e instanceof Error
        ? e.message
        : 'Error interno';
    return NextResponse.json(
      {
        ok: false,
        error: errorMsg,
        retryable: transient,
        createdTasks,
        updatedTasks,
        skippedNodes,
        createdPrecedences,
        skippedEdges,
        warnings,
      },
      { status: transient ? 503 : 500 },
    );
  }
}
