import { NextRequest, NextResponse } from 'next/server';

import { resolveSocioSession } from '@/lib/socio/resolve-socio-session';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

/** POST /api/socio/notificaciones/tarea-completada */
export async function POST(request: NextRequest) {
  try {
    const session = await resolveSocioSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const orgId = typeof body?.org_id === 'string' ? body.org_id.trim() : '';
    const obraId = typeof body?.obra_id === 'string' ? body.obra_id.trim() : null;
    const tareaId = typeof body?.tarea_id === 'string' ? body.tarea_id.trim() : null;

    if (!orgId) {
      return NextResponse.json({ ok: false, error: 'org_id es requerido' }, { status: 400 });
    }

    const supabaseAny = createServiceSupabaseClient() as any;
    const { data: orgData } = await supabaseAny
      .from('organizations')
      .select('user_id')
      .eq('id', orgId)
      .maybeSingle();

    if (!orgData?.user_id) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { error } = await supabaseAny.from('notificaciones').insert({
      titulo: 'Tarea completada',
      mensaje: 'Todas las subtareas de la tarea han sido completadas',
      tipo: 'avance',
      remitente_id: session.user.id,
      destinatario_id: orgData.user_id,
      org_id: orgId,
      obra_id: obraId,
      tarea_id: tareaId,
      leida: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[notificaciones/tarea-completada]', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/socio/notificaciones/tarea-completada]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
