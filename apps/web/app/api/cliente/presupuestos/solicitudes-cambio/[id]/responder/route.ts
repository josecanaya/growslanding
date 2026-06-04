import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { responderSolicitudCambioPresupuesto } from '@/lib/services/presupuesto-solicitud-cambio.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  accion: z.enum(['aceptar', 'rechazar']),
  respuesta_cliente: z.string().max(2000).nullable().optional(),
});

const ERROR_MESSAGES: Record<string, string> = {
  FORBIDDEN: 'No tenés permiso para responder esta solicitud.',
  NOT_FOUND: 'Solicitud no encontrada.',
  NOT_PENDING: 'Esta solicitud ya fue respondida.',
  PRESUPUESTO_NO_APROBADO: 'El presupuesto ya no está en estado aprobado.',
};

function mapErrorToStatus(msg: string): number {
  if (msg === 'FORBIDDEN') return 403;
  if (msg === 'NOT_FOUND') return 404;
  if (msg === 'NOT_PENDING' || msg === 'PRESUPUESTO_NO_APROBADO') return 400;
  return 500;
}

/**
 * POST /api/cliente/presupuestos/solicitudes-cambio/[id]/responder
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: solicitudId } = await context.params;
    if (!solicitudId) {
      return NextResponse.json({ success: false, error: 'Falta id de solicitud' }, { status: 400 });
    }

    const body = schema.parse(await request.json());

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const result = await responderSolicitudCambioPresupuesto(supabase as any, {
      solicitudId,
      userId: user.id,
      accion: body.accion,
      respuestaCliente: body.respuesta_cliente ?? null,
    });

    return NextResponse.json({
      success: true,
      accion: body.accion,
      monto_nuevo: result.montoNuevo ?? null,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES[msg] ?? msg },
      { status: mapErrorToStatus(msg) },
    );
  }
}
