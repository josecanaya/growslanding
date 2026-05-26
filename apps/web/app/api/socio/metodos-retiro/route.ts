import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type MetodoInput = {
  titular?: unknown;
  banco?: unknown;
  cvu?: unknown;
  cbu?: unknown;
  alias?: unknown;
  es_principal?: unknown;
};

const ALIAS_RE = /^[a-zA-Z0-9._-]{6,40}$/;
const NUM22_RE = /^[0-9]{22}$/;

function cleanStr(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function validar(payload: MetodoInput): { ok: true; data: Record<string, unknown> } | { ok: false; message: string } {
  const titular = cleanStr(payload.titular, 200);
  if (!titular) return { ok: false, message: 'El titular es obligatorio.' };

  const banco = cleanStr(payload.banco, 120);
  const cvuRaw = cleanStr(payload.cvu, 22);
  const cbuRaw = cleanStr(payload.cbu, 22);
  const aliasRaw = cleanStr(payload.alias, 40);

  if (!cvuRaw && !cbuRaw && !aliasRaw) {
    return { ok: false, message: 'Tenés que cargar CVU, CBU o Alias.' };
  }

  const cvu = cvuRaw && !NUM22_RE.test(cvuRaw) ? null : cvuRaw;
  const cbu = cbuRaw && !NUM22_RE.test(cbuRaw) ? null : cbuRaw;
  if (cvuRaw && !cvu) return { ok: false, message: 'El CVU debe tener 22 dígitos.' };
  if (cbuRaw && !cbu) return { ok: false, message: 'El CBU debe tener 22 dígitos.' };

  const alias = aliasRaw;
  if (alias && !ALIAS_RE.test(alias)) {
    return { ok: false, message: 'El alias debe tener entre 6 y 40 caracteres (letras, números, punto, guion).' };
  }

  return {
    ok: true,
    data: {
      titular,
      banco,
      cvu,
      cbu,
      alias,
      es_principal: Boolean(payload.es_principal),
    },
  };
}

async function autenticarSocio() {
  const cookieStore = await cookies();
  const supabaseAuth = createRouteHandlerClient<Database>({
    cookies: () => cookieStore as any,
  });
  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser();

  if (authErr || !user?.id) {
    return { error: NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 }) };
  }

  const supabase = createServiceSupabaseClient();
  const socio = await resolveSocioRecordForAuthUser(supabase, {
    id: user.id,
    email: user.email ?? null,
  });

  if (!socio) {
    return {
      error: NextResponse.json(
        { ok: false, message: 'No encontramos tu perfil de socio.' },
        { status: 404 },
      ),
    };
  }

  return { supabase, user, socio };
}

/** GET /api/socio/metodos-retiro */
export async function GET() {
  try {
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;
    const sb = ctx.supabase as any;
    const { data, error } = await sb
      .from('socio_metodos_retiro')
      .select('id, socio_id, titular, banco, cvu, cbu, alias, es_principal, activo, created_at, updated_at')
      .eq('socio_id', ctx.socio.id)
      .eq('activo', true)
      .order('es_principal', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, message: 'No se pudieron cargar los métodos de retiro', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, metodos: data ?? [] });
  } catch (e) {
    console.error('[GET /api/socio/metodos-retiro]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}

/** POST /api/socio/metodos-retiro */
export async function POST(request: Request) {
  try {
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;
    const body = (await request.json().catch(() => ({}))) as MetodoInput;
    const v = validar(body);
    if (!v.ok) {
      return NextResponse.json({ ok: false, message: v.message }, { status: 400 });
    }

    const sb = ctx.supabase as any;

    // Si se solicita como principal, marcamos los otros como NO principales antes
    if (v.data.es_principal === true) {
      await sb
        .from('socio_metodos_retiro')
        .update({ es_principal: false })
        .eq('socio_id', ctx.socio.id)
        .eq('activo', true);
    } else {
      // Si todavía no tiene métodos, el primero queda como principal por defecto
      const { count } = await sb
        .from('socio_metodos_retiro')
        .select('id', { count: 'exact', head: true })
        .eq('socio_id', ctx.socio.id)
        .eq('activo', true);
      if (!count) v.data.es_principal = true;
    }

    const { data: insertRow, error } = await sb
      .from('socio_metodos_retiro')
      .insert({ ...v.data, socio_id: ctx.socio.id })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo guardar el método de retiro', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, metodo: insertRow });
  } catch (e) {
    console.error('[POST /api/socio/metodos-retiro]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}
