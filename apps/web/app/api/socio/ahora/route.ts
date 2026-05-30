import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { obtenerDatosSocioAhora } from '@/lib/socio/socio-ahora.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/socio/ahora
 * Tarea operativa, progreso y bloques del socio (service role tras auth).
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();

    if (authErr || !user?.id) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const tareaId = request.nextUrl.searchParams.get('tareaId');

    const data = await obtenerDatosSocioAhora({
      userId: user.id,
      userEmail: user.email ?? null,
      tareaId,
    });

    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    console.error('[GET /api/socio/ahora]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
