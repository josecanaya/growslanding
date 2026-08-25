import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import { buscarEnCorpusAsync } from '@/lib/conocimiento/buscarEnCorpus';
import { queryConocimientoMcp } from '@/lib/conocimiento/queryConocimientoMcp';
import { responderConConocimiento } from '@/lib/conocimiento/responderConConocimiento';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const bodySchema = z.object({
  mensaje: z.string().trim().min(1).max(2000),
  historial: z
    .array(
      z.object({
        role: z.enum(['user', 'horizonte', 'assistant', 'conocimiento']),
        text: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
});

/**
 * POST /api/socio/conocimiento/chat
 * Corpus/Graphify → LLM. No wallet ni FSM.
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
      return NextResponse.json({ message: 'Escribí una pregunta.' }, { status: 400 });
    }

    const mensaje = parsed.data.mensaje;
    const corpus = await buscarEnCorpusAsync(mensaje, 3);
    let grafoText = '';
    try {
      const mcp = await queryConocimientoMcp(mensaje);
      grafoText = [mcp.queryText, mcp.godText].filter(Boolean).join('\n\n').slice(0, 3500);
    } catch {
      grafoText = '';
    }

    const historial = (parsed.data.historial ?? []).map((h) => ({
      role: (h.role === 'user' ? 'user' : 'horizonte') as 'user' | 'horizonte',
      text: h.text,
    }));

    const resp = await responderConConocimiento({
      mensaje,
      objetivo: null,
      contexto: {
        corpus,
        grafoText,
        fuente: corpus.length || grafoText ? 'local' : 'vacio',
      },
      historial,
      anotoPaso: null,
    });

    return NextResponse.json({
      success: true,
      data: { reply: resp.text, via: resp.via },
    });
  } catch (e) {
    console.error('[POST /api/socio/conocimiento/chat]', e);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
