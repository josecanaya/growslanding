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
      'Lee el canvas Organizar de una obra: etapas, tareas y precedencias CPM. No incluye nodos estado del grafo IDEA.',
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
        mensaje: {
          type: 'string',
          description: 'Ej: Definir programa → Unidades por piso',
        },
      },
      required: ['obra_id', 'mensaje'],
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
  return org || null;
}

export async function callGrowsMcpTool(
  supabase: SupabaseClient,
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: { type: 'text'; text: string }[] }> {
  try {
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
      let oq = supabase
        .from('obras')
        .select('id, name, objetivo_texto, graph_mode, canvas_ui, org_id')
        .eq('id', obraId);
      const org = orgFilter();
      if (org) oq = oq.eq('org_id', org);
      const { data: obra, error: oe } = await oq.maybeSingle();
      if (oe) throw oe;
      if (!obra) return textResult({ error: 'Obra no encontrada' });

      const { data: nodes, error: ne } = await supabase
        .from('canvas_nodes')
        .select('id, type, title, parent_id, graph_status, transform_kind, status, metadata, created_at')
        .eq('obra_id', obraId)
        .neq('type', 'estado')
        .order('created_at', { ascending: true });
      if (ne) throw ne;

      const { data: edges, error: ee } = await supabase
        .from('canvas_edges')
        .select('id, source_node_id, target_node_id, type, is_critical')
        .eq('obra_id', obraId);
      if (ee) throw ee;

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
          orquestador: (n.metadata as { orquestador?: unknown } | null)?.orquestador ?? null,
        })),
        precedencias: edges ?? [],
        hilo,
      });
    }

    if (name === 'proponer_paso') {
      const obraId = String(args.obra_id || '');
      const mensaje = String(args.mensaje || '').trim();
      if (!mensaje) return textResult({ error: 'mensaje vacío' });

      let oq = supabase.from('obras').select('id, org_id, graph_mode').eq('id', obraId);
      const org = orgFilter();
      if (org) oq = oq.eq('org_id', org);
      const { data: obra, error: oe } = await oq.maybeSingle();
      if (oe) throw oe;
      if (!obra) return textResult({ error: 'Obra no encontrada' });

      const { data: nodes, error: ne } = await supabase
        .from('canvas_nodes')
        .select('id, type, title, parent_id, created_at')
        .eq('obra_id', obraId);
      if (ne) throw ne;

      let etapa = (nodes ?? []).find(
        (n) =>
          n.type === 'etapa' &&
          !n.parent_id &&
          (n.title === ETAPA_DEFINICION || /^00\.\s/i.test(String(n.title))),
      );
      const now = new Date().toISOString();
      const createdEtapa = !etapa;
      if (!etapa) {
        const etapaId = randomUUID();
        etapa = {
          id: etapaId,
          type: 'etapa',
          title: ETAPA_DEFINICION,
          parent_id: null,
          created_at: now,
        };
        const { error: eEtapa } = await supabase.from('canvas_nodes').insert({
          id: etapaId,
          obra_id: obraId,
          org_id: obra.org_id,
          parent_id: null,
          type: 'etapa',
          title: ETAPA_DEFINICION,
          position_x: 40,
          position_y: 40,
          status: 'en_curso',
          metadata: { level: 1 },
          created_at: now,
          updated_at: now,
        });
        if (eEtapa) throw eEtapa;
      }

      const paso = parsePaso(mensaje);
      const siblings = (nodes ?? []).filter((n) => n.parent_id === etapa!.id && n.type === 'tarea');
      const dup = siblings.find(
        (n) => String(n.title).trim().toLowerCase() === paso.verb.toLowerCase(),
      );
      if (dup) {
        return textResult({
          ok: true,
          ya_existia: true,
          etapa_id: etapa.id,
          tarea_id: dup.id,
          paso,
          nota: `Ya estaba la tarea «${paso.verb}».`,
        });
      }

      const sorted = [...siblings].sort((a, b) =>
        String(a.created_at).localeCompare(String(b.created_at)),
      );
      const prev = sorted[sorted.length - 1] ?? null;
      const tareaId = randomUUID();
      const x = 80 + sorted.length * 280;

      const { error: eTarea } = await supabase.from('canvas_nodes').insert({
        id: tareaId,
        obra_id: obraId,
        org_id: obra.org_id,
        parent_id: etapa.id,
        type: 'tarea',
        title: paso.verb,
        description: paso.detalle,
        position_x: x,
        position_y: 120,
        status: 'pendiente',
        planned_duration_days: 1,
        graph_status: 'propuesta',
        transform_kind: paso.transformKind,
        executor_kind: 'agente',
        metadata: {
          level: 2,
          orquestador: {
            origen: 'chatgpt_mcp',
            estado: 'pendiente',
            formulaId: 'chat',
            chatUser: mensaje.slice(0, 4000),
          },
        },
        created_at: now,
        updated_at: now,
      });
      if (eTarea) throw eTarea;

      let edgeId: string | null = null;
      if (prev) {
        edgeId = randomUUID();
        const { error: eEdge } = await supabase.from('canvas_edges').insert({
          id: edgeId,
          obra_id: obraId,
          org_id: obra.org_id,
          source_node_id: prev.id,
          target_node_id: tareaId,
          type: 'precedencia',
          is_critical: true,
          lag_days: 0,
          created_at: now,
          updated_at: now,
        });
        if (eEdge) throw eEdge;
      }

      return textResult({
        ok: true,
        etapa_id: etapa.id,
        etapa_creada: createdEtapa,
        tarea_id: tareaId,
        precedencia_id: edgeId,
        paso,
        editor: `/cliente/tareas/${obraId}/editor`,
        nota: 'Tarea propuesta en Organizar. Revisá y publicá en el canvas. No realizada / no wallet.',
      });
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

      const base =
        obra.canvas_ui && typeof obra.canvas_ui === 'object' && !Array.isArray(obra.canvas_ui)
          ? { ...(obra.canvas_ui as Record<string, unknown>) }
          : {};
      const prev = Array.isArray(base.hilo) ? (base.hilo as unknown[]) : [];
      const now = new Date().toISOString();
      const hilo = [
        ...prev,
        { id: `u-${now}`, role: 'user', text: user, at: now },
        { id: `h-${now}`, role: 'horizonte', text: oficio, at: now },
      ].slice(-80);

      const { error: ue } = await supabase
        .from('obras')
        .update({ canvas_ui: { ...base, hilo } })
        .eq('id', obraId);
      if (ue) throw ue;
      return textResult({ ok: true, hilo_len: hilo.length });
    }

    return textResult({ error: `Herramienta desconocida: ${name}` });
  } catch (e) {
    return textResult({ error: e instanceof Error ? e.message : String(e) });
  }
}
