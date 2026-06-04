import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { buildSolicitudesPorObra } from '@/lib/socio/build-solicitudes-oportunidad';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type TareaMini = {
  id: string;
  title: string | null;
  etapa: string | null;
  obra_id: string;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  dias_presupuesto: number | null;
};

/**
 * GET /api/socio/solicitudes
 * - solicitudes: obras con presupuestos PENDIENTE (oportunidades para enviar)
 * - seguimiento: obras con presupuestos ENVIADO (esperando respuesta del cliente)
 * Los APROBADO no se listan acá (trabajo en ejecución → Obras / Ahora).
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

    const allRows = presupRows ?? [];
    const rowsOportunidad = allRows.filter((r: { estado: string | null }) => {
      const s = (r.estado || 'PENDIENTE').toUpperCase();
      return s === 'PENDIENTE';
    });
    const rowsSeguimiento = allRows.filter((r: { estado: string | null }) => {
      const s = (r.estado || '').toUpperCase();
      return s === 'ENVIADO';
    });

    const tareaIds = [
      ...new Set(
        [...rowsOportunidad, ...rowsSeguimiento]
          .map((r: { tarea_id: string | null }) => r.tarea_id)
          .filter(Boolean),
      ),
    ] as string[];

    if (tareaIds.length === 0) {
      return NextResponse.json({ solicitudes: [], seguimiento: [] });
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

    const solicitudes = buildSolicitudesPorObra(
      rowsOportunidad,
      tareaMap,
      obraMeta,
      new Set(['PENDIENTE']),
    );
    const seguimiento = buildSolicitudesPorObra(
      rowsSeguimiento,
      tareaMap,
      obraMeta,
      new Set(['ENVIADO']),
    );

    return NextResponse.json({ solicitudes, seguimiento });
  } catch (e) {
    console.error('[SOCIO_SOLICITUDES]', e);
    const msg = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
