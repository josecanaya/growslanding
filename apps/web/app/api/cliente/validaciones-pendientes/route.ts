import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { TareaFsmService } from '@/lib/services/tarea-fsm.service';
import {
  ESTADO_BLOQUE_FINAL,
  ESTADO_BLOQUE_PARA_VALIDAR,
  normalizeEstadoBloqueParaOperacion,
} from '@/lib/domain/estados-core';
import { evidenciaPublicUrl } from '@/lib/cliente/evidencia-display';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const IN_CHUNK = 80;

type TareaRow = {
  id: string;
  title?: string | null;
  descripcion?: string | null;
  estado?: string | null;
  obra_id?: string | null;
  responsable?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  cuadrilla_id?: string | null;
  org_id?: string | null;
};

type SubtareaRow = {
  id: string;
  tarea_id?: string | null;
  estado?: string | null;
  fecha?: string | null;
  orden?: number | null;
  bloque_index?: number | null;
  evidencia_url?: string | null;
  evidencia_cargada?: boolean | null;
  validado_en_obra_at?: string | null;
  monto_estimado?: number | null;
};

async function fetchInChunks<T>(
  ids: string[],
  run: (chunk: string[]) => Promise<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    const chunk = ids.slice(i, i + IN_CHUNK);
    const { data, error } = await run(chunk);
    if (error) throw error;
    if (data?.length) out.push(...data);
  }
  return out;
}

export async function GET(request: NextRequest) {
  try {
    const obraId = request.nextUrl.searchParams.get('obra_id')?.trim() ?? '';

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
    if (!allowedOrgIds.length) {
      return NextResponse.json({ success: false, error: 'Sin organización accesible' }, { status: 403 });
    }

    let subsQuery = supabaseAny
      .from('tareas_subtareas')
      .select(
        'id, tarea_id, estado, fecha, orden, bloque_index, evidencia_url, evidencia_cargada, validado_en_obra_at, monto_estimado, tareas!inner(id, title, descripcion, estado, obra_id, org_id, responsable, fecha_inicio_real, fecha_fin_real, fecha_inicio, fecha_fin, cuadrilla_id)',
      )
      .eq('estado', ESTADO_BLOQUE_PARA_VALIDAR)
      .in('tareas.org_id', allowedOrgIds);
    if (obraId) subsQuery = subsQuery.eq('tareas.obra_id', obraId);

    const { data: pendientesSubs, error: pErr } = await subsQuery;

    if (pErr) {
      console.warn('[validaciones-pendientes] subtareas para_validar:', pErr.message);
    }

    const pendientesRows = (pendientesSubs ?? []) as SubtareaRow[];

    if (!pendientesRows.length) {
      return NextResponse.json({
        success: true,
        data: { tareas: [], pendientesCount: 0, obras: [] },
      });
    }

    const tareaIdsFromSubs: string[] = [
      ...new Set(
        pendientesRows
          .map((r) => r.tarea_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const todasLasTareas = await fetchInChunks<TareaRow>(tareaIdsFromSubs, (chunk) =>
      supabaseAny
        .from('tareas')
        .select(
          'id, title, descripcion, estado, obra_id, responsable, fecha_inicio_real, fecha_fin_real, fecha_inicio, fecha_fin, cuadrilla_id, org_id',
        )
        .in('id', chunk)
        .in('org_id', allowedOrgIds),
    );

    if (!todasLasTareas.length) {
      return NextResponse.json({
        success: true,
        data: { tareas: [], pendientesCount: 0, obras: [] },
      });
    }

    const tareaIds = todasLasTareas.map((t) => t.id);
    const montoTareaMap = new Map<string, number>();
    const bloquesCountPorTarea = new Map<string, number>();
    if (tareaIds.length) {
      const presupuestos = await fetchInChunks<{
        tarea_id?: string;
        monto?: number;
        estado?: string;
      }>(tareaIds, (chunk) =>
        supabaseAny.from('tareas_presupuestos').select('tarea_id, monto, estado').in('tarea_id', chunk),
      );
      presupuestos.forEach((row) => {
        if (row.tarea_id && String(row.estado ?? '').toUpperCase() === 'APROBADO') {
          montoTareaMap.set(row.tarea_id, Number(row.monto ?? 0));
        }
      });

      const allSubsCount = await fetchInChunks<{ tarea_id?: string | null }>(tareaIds, (chunk) =>
        supabaseAny.from('tareas_subtareas').select('tarea_id').in('tarea_id', chunk),
      );
      allSubsCount.forEach((row) => {
        const tid = row.tarea_id;
        if (tid) bloquesCountPorTarea.set(tid, (bloquesCountPorTarea.get(tid) ?? 0) + 1);
      });
    }

    const subtareasPorTarea = new Map<string, unknown[]>();

    const resolveMontoBloque = (row: SubtareaRow, tareaId: string): number | null => {
      const directo = Number(row.monto_estimado ?? 0);
      if (Number.isFinite(directo) && directo > 0) return directo;
      const montoTarea = montoTareaMap.get(tareaId);
      if (!montoTarea || montoTarea <= 0) return null;
      const count = Math.max(1, bloquesCountPorTarea.get(tareaId) ?? 1);
      return Number((montoTarea / count).toFixed(2));
    };

    const mergeSub = (row: SubtareaRow) => {
      const tid = row.tarea_id;
      if (!tid) return;
      const estadoNorm = normalizeEstadoBloqueParaOperacion(row.estado ?? 'pendiente');
      if (estadoNorm !== ESTADO_BLOQUE_PARA_VALIDAR) return;

      const montoDirecto = resolveMontoBloque(row, tid);
      const item = {
        id: row.id,
        estado: estadoNorm,
        montoEstimado: montoDirecto,
        montoValidado: null,
        fecha: row.fecha ?? null,
        orden: row.orden ?? row.bloque_index ?? null,
        bloque_index: row.bloque_index ?? null,
        evidencia_url: row.evidencia_url ?? null,
        evidencia_cargada: row.evidencia_cargada ?? false,
        evidenciaPublicUrl: evidenciaPublicUrl(row.evidencia_url),
        validadoEnObraAt: row.validado_en_obra_at ?? null,
      };
      const prev = (subtareasPorTarea.get(tid) ?? []) as typeof item[];
      subtareasPorTarea.set(tid, [...prev, item]);
    };

    pendientesRows.forEach(mergeSub);

    const obraIds = [...new Set(todasLasTareas.map((t) => t.obra_id).filter(Boolean))] as string[];
    const obrasMap = new Map<string, string>();
    if (obraIds.length) {
      const obras = await fetchInChunks<{ id: string; name?: string }>(obraIds, (chunk) =>
        supabaseAny.from('obras').select('id, name').in('id', chunk),
      );
      obras.forEach((o) => obrasMap.set(o.id, o.name?.trim() || 'Obra sin nombre'));
    }

    const tareas = todasLasTareas
      .map((row) => {
        const id = String(row.id);
        const subtareas = (subtareasPorTarea.get(id) ?? []) as Array<{
          evidencia_url?: string | null;
        }>;
        if (!subtareas.length) return null;

        const evidencias = subtareas
          .filter((s) => s.evidencia_url?.trim())
          .map((s) => {
            const u = evidenciaPublicUrl(s.evidencia_url);
            return u ? { url: u, path: String(s.evidencia_url) } : null;
          })
          .filter(Boolean);

        return {
          id,
          titulo: String(row.title ?? row.descripcion ?? 'Tarea sin título'),
          descripcion: row.descripcion ?? null,
          obraId: String(row.obra_id),
          obraNombre: obrasMap.get(String(row.obra_id)) ?? 'Obra sin nombre',
          responsable: row.responsable ?? null,
          cuadrillaNombre: null,
          fechaInicio: row.fecha_inicio_real ?? row.fecha_inicio ?? null,
          fechaFin: row.fecha_fin_real ?? row.fecha_fin ?? null,
          evidencias,
          estadoOficial: TareaFsmService.mapLegacyToOficial(String(row.estado ?? '')),
          subtareas,
        };
      })
      .filter(Boolean);

    const obrasPendientes = new Map<string, { id: string; nombre: string; count: number }>();
    for (const t of tareas) {
      const obraIdKey = t!.obraId;
      const prev = obrasPendientes.get(obraIdKey);
      const bloques = (t!.subtareas as unknown[]).length;
      if (prev) {
        prev.count += bloques;
      } else {
        obrasPendientes.set(obraIdKey, {
          id: obraIdKey,
          nombre: t!.obraNombre,
          count: bloques,
        });
      }
    }

    const pendientesCount = tareas.reduce(
      (acc, t) => acc + ((t!.subtareas as unknown[])?.length ?? 0),
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        tareas,
        pendientesCount,
        obras: [...obrasPendientes.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      },
    });
  } catch (e) {
    console.error('[GET validaciones-pendientes]', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
