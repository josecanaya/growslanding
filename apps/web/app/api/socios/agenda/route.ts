import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveOrgForClienteAgenda } from '@/lib/socios/agendar-socio';

export const runtime = 'nodejs';

/**
 * GET /api/socios/agenda
 * Contactos de obra agendados por la organización del usuario cliente.
 */
export async function GET() {
  try {
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

    const org = await resolveOrgForClienteAgenda({
      id: user.id,
      email: user.email,
      app_metadata: user.app_metadata as Record<string, unknown>,
      user_metadata: user.user_metadata as Record<string, unknown>,
    });

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Necesitás una organización activa.' },
        { status: 403 },
      );
    }

    const supabase = createServiceSupabaseClient();
    const { data: agendaRows, error } = await (supabase as any)
      .from('cliente_socio_agenda')
      .select('id, socio_id, source_socio_id, metodo, estado, created_at')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false });

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: [],
          warning: 'Aplicá la migración cliente_socio_agenda para ver el historial de agenda.',
        });
      }
      throw error;
    }

    const rows = (agendaRows ?? []) as Array<{
      id: string;
      socio_id: string;
      source_socio_id: string | null;
      metodo: string;
      estado: string;
      created_at: string;
    }>;

    const socioIds = [...new Set(rows.map((r) => r.socio_id))];
    let socioMap = new Map<string, Record<string, unknown>>();

    if (socioIds.length > 0) {
      const { data: socios, error: sociosError } = await supabase
        .from('socios')
        .select('id, nombre, email, telefono, estado, org_id, especialidad')
        .in('id', socioIds);

      if (sociosError) {
        throw sociosError;
      }

      socioMap = new Map((socios ?? []).map((s) => [s.id, s as Record<string, unknown>]));
    }

    const data = rows.map((r) => ({
      ...r,
      socio: socioMap.get(r.socio_id) ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[SOCIOS_AGENDA_GET]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al listar agenda de socios',
      },
      { status: 500 },
    );
  }
}
