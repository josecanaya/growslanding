import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import { queryConocimientoGraphify } from '@/lib/conocimiento/queryConocimientoGraphify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const historyMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
});

const bodySchema = z.object({
  mensaje: z.string().trim().min(1).max(500),
  history: z.array(historyMessageSchema).max(12).optional().default([]),
});

/**
 * POST /api/socio/conocimiento/chat
 * Graphify/MCP recupera contexto desde grows-conocimiento y un LLM responde
 * usando ese contexto + historial. No toca wallet, tareas ni FSM.
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();
    if (authErr || !user?.id) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const socio = await resolveSocioRecordForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });
    if (!socio) {
      return NextResponse.json({ message: 'No hay perfil de socio.' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ message: 'Consulta o historial inválido.' }, { status: 400 });
    }

    const result = await queryConocimientoGraphify(
      parsed.data.mensaje,
      parsed.data.history,
    );

    return NextResponse.json({
      success: result.ok,
      data: { reply: result.text, source: result.source ?? 'fallback' },
    });
  } catch (e) {
    console.error('[POST /api/socio/conocimiento/chat]', e);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
