import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/lib/types/supabase.gen';
import { normalizeRole } from '@/lib/roles';
import {
  resolveSocioFromQrPaste,
  resolveSourceSocioByEmail,
  resolveSourceSocioByPublicCodigo,
} from '@/lib/socios/agendar-socio';
import { displayPublicSocioCode } from '@/lib/socios/public-code';

export const runtime = 'nodejs';

function sanitizePublicSocio(
  s: {
    id: string;
    nombre: string | null;
    email: string | null;
    telefono: string | null;
    especialidad: string | null;
    estado: string | null;
    public_codigo?: string | null;
  },
  opts: { maskEmail: boolean },
) {
  const emailOut =
    opts.maskEmail && s.email
      ? maskEmail(s.email)
      : s.email;
  return {
    id: s.id,
    publicCode: displayPublicSocioCode(s.public_codigo ?? undefined),
    name: s.nombre,
    oficio: s.especialidad,
    zona: null as string | null,
    rating: null as number | null,
    email: emailOut,
    telefono: s.telefono,
    estado: s.estado,
  };
}

function maskEmail(e: string) {
  const [a, b] = e.split('@');
  if (!b) return '●●●';
  if (a.length <= 2) return `●●@${b}`;
  return `${a.slice(0, 2)}…@${b}`;
}

/**
 * GET /api/socios/resolve?code=SOC-XXX o ?email=x@y.z
 * Datos públicos para pantalla “Agendar socio” (usuario autenticado).
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const role = normalizeRole(
      (user.app_metadata as Record<string, unknown> | undefined)?.role ??
        (user.user_metadata as Record<string, unknown> | undefined)?.role,
    );
    if (role === 'SOCIO') {
      return NextResponse.json(
        { success: false, error: 'Solo cliente o arquitecto pueden buscar socios para agendar.' },
        { status: 403 },
      );
    }

    const code = req.nextUrl.searchParams.get('code')?.trim();
    const email = req.nextUrl.searchParams.get('email')?.trim();
    const paste = req.nextUrl.searchParams.get('paste')?.trim();

    const n = [code, email, paste].filter(Boolean).length;
    if (n === 0) {
      return NextResponse.json(
        { success: false, error: 'Indicá code, email o paste.' },
        { status: 400 },
      );
    }
    if (n > 1) {
      return NextResponse.json(
        { success: false, error: 'Usá solo uno: code, email o paste.' },
        { status: 400 },
      );
    }

    let resolved;
    if (paste) {
      resolved = await resolveSocioFromQrPaste(paste);
    } else if (code) {
      resolved = await resolveSourceSocioByPublicCodigo(code);
    } else {
      resolved = await resolveSourceSocioByEmail(email!);
    }

    if ('error' in resolved) {
      const msg =
        resolved.status === 404
          ? paste
            ? 'No encontramos un socio con ese ID.'
            : code
              ? 'No encontramos un socio con ese ID.'
              : 'No encontramos un socio con ese email.'
          : resolved.error;
      return NextResponse.json({ success: false, error: msg }, { status: resolved.status });
    }

    const s = resolved.sourceSocio;
    const payload = sanitizePublicSocio(s, { maskEmail: false });

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (e) {
    console.error('[SOCIOS_RESOLVE]', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error al buscar socio.' },
      { status: 500 },
    );
  }
}
