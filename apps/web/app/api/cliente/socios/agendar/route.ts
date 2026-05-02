import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { Database } from '@/lib/types/supabase.gen';
import {
  agendarSocioEnOrganizacion,
  resolveOrgForClienteAgenda,
  type SocioSourceRecord,
} from '@/lib/socios/agendar-socio';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const bodySchema = z.object({
  socioId: z.string().uuid(),
  source: z.enum(['qr', 'id', 'email', 'manual']),
});

const metodoMap = {
  qr: 'qr' as const,
  id: 'id_publico' as const,
  email: 'email' as const,
  manual: 'id_publico' as const,
};

/**
 * POST /api/cliente/socios/agendar
 * Agendar por id de socio ya resuelto (tras buscar en UI).
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
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
        { success: false, error: 'Necesitás una organización activa para agendar socios.' },
        { status: 403 },
      );
    }

    const supabase = createServiceSupabaseClient();
    const { data: row, error: sErr } = await (supabase as any)
      .from('socios')
      .select('id, org_id, nombre, email, telefono, estado, especialidad, public_codigo')
      .eq('id', body.socioId)
      .maybeSingle();

    if (sErr) throw sErr;
    const socio = row as SocioSourceRecord | null;
    if (!socio) {
      return NextResponse.json(
        { success: false, error: 'No encontramos un socio con ese ID.' },
        { status: 404 },
      );
    }

    const result = await agendarSocioEnOrganizacion({
      org,
      sourceSocio: socio,
      metodo: metodoMap[body.source],
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        socio_id: result.socio_id,
        alreadyInAgenda: result.alreadyInAgenda,
      },
    });
  } catch (e) {
    console.error('[CLIENTE_SOCIOS_AGENDAR]', e);
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos.' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error al agendar.' },
      { status: 500 },
    );
  }
}
