import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { TareaAsignacionService } from '@/lib/tareas';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tareaId } = await params;
    const body = await request.json();
    const socio_id = body?.socio_id;

    if (!socio_id) {
      return NextResponse.json(
        { success: false, error: 'socio_id es requerido' },
        { status: 400 },
      );
    }

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

    const result = await TareaAsignacionService.asignarSocio({
      tareaId,
      socioId: socio_id,
      actorUserId: user.id,
      actorEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      tarea_id: result.tareaId,
      socio_id: result.socioId,
      socio_nombre: result.socioNombre,
    });
  } catch (error) {
    console.error('[PATCH /api/tareas/[id]/asignar]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg.includes('agenda') || msg.includes('organización') ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
