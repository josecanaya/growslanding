import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ESTADOS_OPORTUNIDAD = new Set(['PENDIENTE', 'ENVIADO', 'APROBADO']);

type TareaMini = {
  id: string;
  title: string | null;
  etapa: string | null;
  obra_id: string;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  dias_presupuesto: number | null;
};

function daysUntil(iso: string | null): number {
  if (!iso) return 999;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 999;
  const diff = t - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function duracionEntreTareas(t: TareaMini): number | null {
  if (t.fecha_inicio_estimada && t.fecha_fin_estimada) {
    const a = new Date(t.fecha_inicio_estimada).getTime();
    const b = new Date(t.fecha_fin_estimada).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b) && b >= a) {
      return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
    }
  }
  if (t.dias_presupuesto != null && t.dias_presupuesto > 0) {
    return t.dias_presupuesto;
  }
  return null;
}

/**
 * GET /api/socio/solicitudes
 * Obras / tareas donde el socio tiene presupuestos abiertos o recientes (PENDIENTE / ENVIADO / APROBADO).
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const socioRow = await resolveSocioRecordForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });
    const socioId = socioRow?.id ?? null;

    if (!socioId) {
      return NextResponse.json(
        { message: 'No encontramos tu perfil de socio vinculado a esta cuenta.' },
        { status: 404 },
      );
    }

    const supabaseAny = supabase as any;
    const { data: presupRows, error: presupErr } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, estado, tarea_id')
      .eq('socio_id', socioId);

    if (presupErr) {
      console.error('[SOCIO_SOLICITUDES]', presupErr);
      return NextResponse.json({ message: presupErr.message || 'Error al cargar solicitudes' }, { status: 500 });
    }

    const rows = (presupRows ?? []).filter((r: { estado: string | null }) => {
      const s = (r.estado || 'PENDIENTE').toUpperCase();
      return ESTADOS_OPORTUNIDAD.has(s);
    });
    const tareaIds = [...new Set(rows.map((r: { tarea_id: string | null }) => r.tarea_id).filter(Boolean))] as string[];

    if (tareaIds.length === 0) {
      return NextResponse.json({ solicitudes: [] });
    }

    const { data: tareasRows, error: tareasErr } = await supabase
      .from('tareas')
      .select('id, title, etapa, obra_id, fecha_inicio_estimada, fecha_fin_estimada, dias_presupuesto')
      .in('id', tareaIds);

    if (tareasErr) {
      console.error('[SOCIO_SOLICITUDES]', tareasErr);
      return NextResponse.json({ message: tareasErr.message || 'Error al cargar tareas' }, { status: 500 });
    }

    const tareaMap = new Map((tareasRows ?? []).map((t) => [t.id, t as TareaMini]));
    const obraIds = new Set<string>();
    for (const tid of tareaIds) {
      const tr = tareaMap.get(tid);
      if (tr?.obra_id) obraIds.add(tr.obra_id);
    }

    const { data: obrasRows, error: obrasErr } = await supabase
      .from('obras')
      .select('id, name, address')
      .in('id', [...obraIds]);

    if (obrasErr) {
      console.error('[SOCIO_SOLICITUDES]', obrasErr);
      return NextResponse.json({ message: obrasErr.message || 'Error al cargar obras' }, { status: 500 });
    }

    const obraMeta = new Map((obrasRows ?? []).map((o) => [o.id, o]));

    type RowWithTarea = { id: string; estado: string | null; tarea: TareaMini };
    const enriched: RowWithTarea[] = [];
    for (const r of rows) {
      const tid = r.tarea_id as string | null;
      if (!tid) continue;
      const t = tareaMap.get(tid);
      if (!t) continue;
      enriched.push({ id: r.id, estado: r.estado, tarea: t });
    }

    const byObra = new Map<string, RowWithTarea[]>();
    for (const e of enriched) {
      const oid = e.tarea.obra_id;
      if (!oid) continue;
      const list = byObra.get(oid) ?? [];
      list.push(e);
      byObra.set(oid, list);
    }

    const solicitudes = [...byObra.entries()].map(([obraId, list]) => {
      const meta = obraMeta.get(obraId);
      const obra_name = meta?.name?.trim() || 'Obra';
      const direccion = (meta?.address ?? '').trim() || 'Dirección no indicada';
      const zona =
        direccion.includes(',') ?
          direccion.split(',').pop()?.trim() || direccion.slice(0, 48)
        : direccion.slice(0, 48);

      const fechas = list
        .map((x) => x.tarea.fecha_inicio_estimada)
        .filter((x): x is string => Boolean(x))
        .sort();
      const fecha_inicio_estimada = fechas[0] ?? null;

      let maxDur: number | null = null;
      for (const x of list) {
        const d = duracionEntreTareas(x.tarea);
        if (d != null) {
          maxDur = maxDur == null ? d : Math.max(maxDur, d);
        }
      }

      const estadosNorm = list.map((x) => (x.estado || 'PENDIENTE').toUpperCase());
      const hayPendiente = estadosNorm.some((s) => s === 'PENDIENTE');
      const estado_solicitud =
        hayPendiente ? ('RECIBIENDO_PRESUPUESTOS' as const) : ('PRESUPUESTO_ENVIADO' as const);
      const tiene_presupuesto_socio = !hayPendiente;

      const n = list.length;
      const titles = list.map((x) => x.tarea.title).filter(Boolean) as string[];
      const tipo_trabajo =
        n === 1 && titles[0] ? titles[0] : `${n} tareas para presupuestar · ${obra_name}`;

      const etapas = [...new Set(list.map((x) => x.tarea.etapa).filter(Boolean))] as string[];
      const etapa = etapas.length === 1 ? etapas[0] : etapas.length > 1 ? etapas.slice(0, 2).join(' · ') : null;

      const diasPres = list.map((x) => x.tarea.dias_presupuesto).filter((d): d is number => d != null && d > 0);
      let urgencia: 'ALTA' | 'MEDIA' | 'BAJA' = 'MEDIA';
      if (diasPres.some((d) => d <= 2)) urgencia = 'ALTA';
      else if (diasPres.some((d) => d <= 7)) urgencia = 'MEDIA';
      else urgencia = 'BAJA';

      const inicio_estimado_dias = daysUntil(fecha_inicio_estimada);

      return {
        obra_id: obraId,
        obra_name,
        direccion_completa: direccion,
        zona,
        fecha_inicio_estimada,
        duracion_estimada_dias: maxDur,
        tipo_trabajo,
        etapa,
        estado_solicitud,
        tiene_presupuesto_socio,
        urgencia,
        cantidad_tareas: n,
        inicio_estimado_dias,
      };
    });

    return NextResponse.json({ solicitudes });
  } catch (e) {
    console.error('[SOCIO_SOLICITUDES]', e);
    const msg = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
