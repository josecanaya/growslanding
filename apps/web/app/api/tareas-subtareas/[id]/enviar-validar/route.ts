import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { SubtareaEnviarValidarService } from '@/lib/tareas';

function statusFromMessage(msg: string): number {
  if (msg === 'FORBIDDEN_ACTION' || msg.includes('permiso')) return 403;
  if (msg.includes('evidencia') || msg === 'EVIDENCIA_REQUERIDA') return 409;
  if (msg.includes('en progreso')) return 409;
  if (msg === 'Subtarea no encontrada') return 404;
  if (msg.includes('No autenticado') || msg.includes('perfil de socio')) return 403;
  return 500;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const evidenciaUrl = typeof body?.evidenciaUrl === 'string' ? body.evidenciaUrl : null;
    const videoUrl = typeof body?.videoUrl === 'string' ? body.videoUrl : null;
    const problemas = typeof body?.problemas === 'string' ? body.problemas : null;

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

    const result = await SubtareaEnviarValidarService.ejecutar({
      subtareaId: id,
      user: { id: user.id, email: user.email ?? null },
      evidenciaUrl,
      videoUrl,
      problemas,
    });

    return NextResponse.json({ success: true, subtarea: result.subtarea });
  } catch (error) {
    console.error('[ENVIAR_VALIDAR_SUBTAREA]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    const code = (error as Error & { code?: string }).code;
    return NextResponse.json(
      {
        success: false,
        error: code ?? msg,
        message: msg,
      },
      { status: statusFromMessage(code ?? msg) },
    );
  }
}
