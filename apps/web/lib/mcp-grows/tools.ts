import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const ETAPA_DEFINICION = '00. Definición del proyecto';

export const GROWS_MCP_TOOLS = [
  {
    name: 'listar_obras_vivas',
    description:
      'Lista obras de Grows (Organizar / proyecto vivo) con id, nombre y objetivo. Usá el id para leer o proponer pasos.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'leer_horizonte',
    description:
      'Lee estados A/B, transformaciones, relaciones explícitas y revisión del canvas de una obra.',
    inputSchema: {
      type: 'object',
      properties: {
        obra_id: { type: 'string', description: 'UUID de la obra' },
      },
      required: ['obra_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'proponer_paso',
    description:
      'Propone una tarea en el Organizar bajo «00. Definición del proyecto» con precedencia. Mensaje «verbo → detalle». Solo propuesta: el humano acepta/publica en el front. No wallet / no realizada.',
    inputSchema: {
      type: 'object',
      properties: {
        obra_id: { type: 'string' },
        base_revision: { type: 'integer', minimum: 0 },
        idempotency_key: { type: 'string', minLength: 1, maxLength: 100 },
        from_node_id: { type: 'string', description: 'Estado A existente en esta obra' },
        to_node_id: { type: 'string', description: 'Estado B existente en esta obra' },
        parent_id: { type: 'string', description: 'Contenedor existente; opcional' },
        transform_kind: { type: 'string', enum: ['conocimiento', 'coordinacion', 'ejecucion'] },
        executor_kind: { type: 'string', enum: ['humano', 'empresa', 'agente', 'sin_asignar'] },
        duration_days: { type: 'number', minimum: 0 },
        cantidad: { type: 'number', exclusiveMinimum: 0 },
        unidad: { type: 'string', maxLength: 80 },
        fuentes: { type: 'array', items: { type: 'string' }, maxItems: 30 },
        supuestos: { type: 'array', items: { type: 'string' }, maxItems: 30 },
        mensaje: {
          type: 'string',
          description: 'Ej: Definir programa → Unidades por piso',
        },
      },
      required: ['obra_id', 'mensaje', 'base_revision', 'idempotency_key', 'from_node_id', 'to_node_id', 'transform_kind'],
      additionalProperties: false,
    },
  },
  {
    name: 'anotar_hilo',
    description: 'Agrega un turno user/oficio al hilo de conversación de la obra (canvas_ui).',
    inputSchema: {
      type: 'object',
      properties: {
        obra_id: { type: 'string' },
        user: { type: 'string', description: 'Lo que dijo el humano' },
        oficio: { type: 'string', description: 'Respuesta o nota del agente' },
      },
      required: ['obra_id', 'user', 'oficio'],
      additionalProperties: false,
    },
  },
] as const;

function kindFrom(texto: string): string {
  const t = texto.toLowerCase();
  if (/\b(ejecut|construir|obra física|levantar muro|hormigon|mampost)\b/.test(t)) return 'ejecucion';
  if (/\b(equipo|socio|convoc|colabor|arquitect|invers)\b/.test(t)) return 'coordinacion';
  return 'conocimiento';
}

export function parsePaso(mensaje: string) {
  const raw = mensaje.replace(/\s+/g, ' ').trim();
  const parts = raw.split(/\s*(?:→|->|=>)\s*/).filter(Boolean);
  return {
    verb: (parts[0] ?? raw).slice(0, 80),
    detalle: (parts[1] ?? parts[0] ?? raw).slice(0, 200),
    transformKind: kindFrom(raw),
  };
}

function textResult(obj: unknown) {
  return {
    content: [{ type: 'text' as const, text: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) }],
  };
}

function orgFilter() {
  const org = process.env.GROWS_MCP_ORG_ID?.trim();
  if (!org) throw new Error('MCP_SCOPE_REQUIRED: GROWS_MCP_ORG_ID no configurado');
  return org;
}

export async function callGrowsMcpTool(
  supabase: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }> {
  try {
    orgFilter(); // Fail closed before any privileged query, including unknown tools.
    if (name === 'listar_obras_vivas') {
      let q = supabase
        .from('obras')
        .select('id, name, graph_mode, objetivo_texto, created_at')
        .in('graph_mode', ['proyecto_vivo', 'obra_plan'])
        .order('created_at', { ascending: false })
        .limit(40);
      const org = orgFilter();
      if (org) q = q.eq('org_id', org);
      const { data, error } = await q;
      if (error) throw error;
      return textResult({
        obras: (data ?? []).map((o) => ({
          ...o,
          editor: `/cliente/tareas/${o.id}/editor`,
        })),
      });
    }

    if (name === 'leer_horizonte') {
      const obraId = String(args.obra_id || '');
      const read = await supabase.rpc('read_canvas_snapshot', { p_obra_id: obraId, p_org_id: orgFilter() });
      if (read.error) throw read.error;
      if (!read.data) throw new Error('Obra no encontrada');
      const { obra, nodes, edges } = read.data as { obra: any; nodes: any[]; edges: any[] };

      const canvasUi = obra.canvas_ui as { hilo?: unknown[] } | null;
      const hilo = Array.isArray(canvasUi?.hilo) ? canvasUi.hilo.slice(-20) : [];

      return textResult({
        obra: {
          id: obra.id,
          name: obra.name,
          objetivo: obra.objetivo_texto,
          graph_mode: obra.graph_mode,
          editor: `/cliente/tareas/${obra.id}/editor`,
        },
        nodos: (nodes ?? []).map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          parent_id: n.parent_id,
          graph_status: n.graph_status,
          status: n.status,
          transform_kind: n.transform_kind,
          from_node_id: n.from_node_id,
          to_node_id: n.to_node_id,
          executor_kind: n.executor_kind,
          metadata: n.metadata,
          orquestador: (n.metadata as { orquestador?: unknown } | null)?.orquestador ?? null,
        })),
        revision: (obra.canvas_ui as { revision?: number } | null)?.revision ?? 0,
        relaciones: edges ?? [],
        precedencias: (edges ?? []).filter((edge) => edge.type === 'precedencia' || edge.type === 'precede'),
        hilo,
      });
    }

    if (name === 'proponer_paso') {
      const obraId = String(args.obra_id || '');
      const mensaje = String(args.mensaje || '').trim();
      if (!mensaje) return textResult({ error: 'mensaje vacío' });

      const baseRevision = args.base_revision;
      const idempotencyKey = typeof args.idempotency_key === 'string' ? args.idempotency_key.trim() : '';
      const fromId = typeof args.from_node_id === 'string' ? args.from_node_id : '';
      const toId = typeof args.to_node_id === 'string' ? args.to_node_id : '';
      const kind = args.transform_kind;
      const executor = args.executor_kind ?? 'sin_asignar';
      if (!Number.isSafeInteger(baseRevision) || Number(baseRevision) < 0 || !idempotencyKey || idempotencyKey.length > 100) {
        throw new Error('INVALID_PROPOSAL: base_revision e idempotency_key son obligatorios');
      }
      if (!fromId || !toId || fromId === toId) throw new Error('INVALID_PROPOSAL: estados A/B distintos obligatorios');
      if (!['conocimiento', 'coordinacion', 'ejecucion'].includes(String(kind))) throw new Error('INVALID_PROPOSAL: transform_kind explícito obligatorio');
      if (!['humano', 'empresa', 'agente', 'sin_asignar'].includes(String(executor))) throw new Error('INVALID_PROPOSAL: executor_kind inválido');
      if (args.duration_days != null && (typeof args.duration_days !== 'number' || !Number.isFinite(args.duration_days) || args.duration_days < 0)) throw new Error('INVALID_PROPOSAL: duración inválida');
      if (args.cantidad != null && (typeof args.cantidad !== 'number' || !Number.isFinite(args.cantidad) || args.cantidad <= 0)) throw new Error('INVALID_PROPOSAL: cantidad inválida');
      if (args.unidad != null && (typeof args.unidad !== 'string' || args.unidad.length > 80)) throw new Error('INVALID_PROPOSAL: unidad inválida');
      for (const key of ['fuentes', 'supuestos']) {
        const value = args[key];
        if (value != null && (!Array.isArray(value) || value.length > 30 || value.some((item) => typeof item !== 'string' || item.length > 4000))) throw new Error(`INVALID_PROPOSAL: ${key} inválido`);
      }
      const org = orgFilter();
      const { data: obra, error: oe } = await supabase.from('obras').select('id, org_id').eq('id', obraId).eq('org_id', org).maybeSingle();
      if (oe) throw oe;
      if (!obra) throw new Error('Obra no encontrada');
      const paso = parsePaso(mensaje);
      // References, revision and deduplication are rechecked under the same obra lock as web saves.
      const tareaId = randomUUID();
      const proposalRequest = {
        p_obra_id: obraId,
        p_org_id: org,
        p_expected_revision: baseRevision,
        p_idempotency_key: idempotencyKey,
        p_node: {
          id: tareaId, parent_id: args.parent_id ?? null, type: 'tarea',
          title: paso.verb, description: paso.detalle, position_x: 80, position_y: 120,
          status: 'pendiente', graph_status: 'propuesta', transform_kind: kind,
          from_node_id: fromId, to_node_id: toId, executor_kind: executor,
          planned_duration_days: args.duration_days ?? null,
          sort_order: 0, is_summary: false, is_critical: false,
          metadata: {
            level: args.parent_id ? 2 : 1,
            propuesta: { autor_tipo: 'agente', autor: 'mcp', base_revision: baseRevision, idempotency_key: idempotencyKey, fuentes: args.fuentes ?? [], supuestos: args.supuestos ?? [], cantidad: args.cantidad ?? null, unidad: args.unidad ?? null },
            orquestador: { origen: 'chatgpt_mcp', estado: 'pendiente', formulaId: 'chat', chatUser: mensaje.slice(0, 4000) },
          },
        },
      };
      const { data, error } = await appendProposal(supabase, proposalRequest);
      if (error) throw new Error(error.message);
      return textResult({ ok: true, ...data, editor: `/cliente/tareas/${obraId}/editor`, nota: 'Transformación propuesta entre A/B. Requiere aceptación humana; sin precedencias temporales inventadas.' });
    }

    if (name === 'anotar_hilo') {
      const obraId = String(args.obra_id || '');
      const user = String(args.user || '').trim();
      const oficio = String(args.oficio || '').trim();
      let oq = supabase.from('obras').select('id, canvas_ui, org_id').eq('id', obraId);
      const org = orgFilter();
      if (org) oq = oq.eq('org_id', org);
      const { data: obra, error: oe } = await oq.maybeSingle();
      if (oe) throw oe;
      if (!obra) return textResult({ error: 'Obra no encontrada' });

      const read = await supabase.rpc('read_canvas_snapshot', { p_obra_id: obraId, p_org_id: org });
      if (read.error) throw read.error;
      const snapshot = read.data;
      const base = snapshot.obra.canvas_ui ?? {};
      const prev = Array.isArray(base.hilo) ? base.hilo : [];
      const now = new Date().toISOString();
      const hilo = [...prev,
        { id: randomUUID(), role: 'user', text: user.slice(0, 8000), at: now },
        { id: randomUUID(), role: 'horizonte', text: oficio.slice(0, 8000), at: now },
      ].slice(-80);
      const { error: ue } = await supabase.rpc('save_canvas_snapshot', {
        p_obra_id: obraId, p_org_id: org, p_expected_revision: snapshot.revision,
        p_snapshot: snapshotForSave(snapshot, { ...base, hilo }),
      });
      if (ue) throw ue;
      return textResult({ ok: true, hilo_len: hilo.length });
    }

    return textResult({ error: `Herramienta desconocida: ${name}` });
  } catch (e) {
    return { ...textResult({ error: e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e) }), isError: true };
  }
}

/** Reuse the atomic canvas command; preserve raw metadata instead of lossy UI roundtrips. */
function snapshotForSave(snapshot: any, canvasUi = snapshot.obra.canvas_ui) {
  return {
    obrasPatch: { name: snapshot.obra.name, canvas_project_kind: snapshot.obra.canvas_project_kind, canvas_ui: canvasUi },
    nodes: snapshot.nodes, edges: snapshot.edges, budgetGroups: snapshot.budgetGroups,
    checklistItems: snapshot.checklistItems, budgetGroupTasks: snapshot.budgetGroupTasks,
  };
}

async function appendProposal(supabase: SupabaseClient, request: any) {
  const read = await supabase.rpc('read_canvas_snapshot', { p_obra_id: request.p_obra_id, p_org_id: request.p_org_id });
  if (read.error) return { data: null, error: read.error };
  const snapshot = read.data;
  const existing = snapshot.nodes.find((node: any) => node.metadata?.propuesta?.idempotency_key === request.p_idempotency_key);
  if (existing) return { data: { tarea_id: existing.id, revision: snapshot.revision, ya_existia: true }, error: null };
  const node = request.p_node;
  for (const id of [node.from_node_id, node.to_node_id]) {
    if (!snapshot.nodes.some((candidate: any) => candidate.id === id && candidate.type === 'estado')) throw new Error('INVALID_PROPOSAL: A/B deben ser estados existentes de esta obra');
  }
  if (node.parent_id && !snapshot.nodes.some((candidate: any) => candidate.id === node.parent_id)) throw new Error('INVALID_PROPOSAL: contenedor ajeno a la obra');
  const rows = snapshotForSave(snapshot);
  rows.nodes = [...rows.nodes, { ...node, obra_id: request.p_obra_id, org_id: request.p_org_id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
  const saved = await supabase.rpc('save_canvas_snapshot', { p_obra_id: request.p_obra_id, p_org_id: request.p_org_id, p_expected_revision: request.p_expected_revision, p_snapshot: rows });
  return { data: { tarea_id: node.id, revision: saved.data?.revision }, error: saved.error };
}
