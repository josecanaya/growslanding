import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALIAS_RE = /^[a-zA-Z0-9._-]{6,40}$/;
const NUM22_RE = /^[0-9]{22}$/;

function cleanStr(value: unknown, max = 200): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
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

/** PATCH /api/socio/metodos-retiro/[id] */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;
    const sb = ctx.supabase as any;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    // Confirmar propiedad
    const { data: existing } = await sb
      .from('socio_metodos_retiro')
      .select('id, socio_id')
      .eq('id', id)
      .maybeSingle();
    if (!existing || existing.socio_id !== ctx.socio.id) {
      return NextResponse.json(
        { ok: false, message: 'Método de retiro no encontrado' },
        { status: 404 },
      );
    }

    const patch: Record<string, unknown> = {};
    const titular = cleanStr(body.titular, 200);
    if (titular !== undefined) {
      if (!titular) return NextResponse.json({ ok: false, message: 'El titular no puede quedar vacío.' }, { status: 400 });
      patch.titular = titular;
    }
    const banco = cleanStr(body.banco, 120);
    if (banco !== undefined) patch.banco = banco;

    const cvu = cleanStr(body.cvu, 22);
    if (cvu !== undefined) {
      if (cvu && !NUM22_RE.test(cvu)) {
        return NextResponse.json({ ok: false, message: 'El CVU debe tener 22 dígitos.' }, { status: 400 });
      }
      patch.cvu = cvu;
    }
    const cbu = cleanStr(body.cbu, 22);
    if (cbu !== undefined) {
      if (cbu && !NUM22_RE.test(cbu)) {
        return NextResponse.json({ ok: false, message: 'El CBU debe tener 22 dígitos.' }, { status: 400 });
      }
      patch.cbu = cbu;
    }
    const alias = cleanStr(body.alias, 40);
    if (alias !== undefined) {
      if (alias && !ALIAS_RE.test(alias)) {
        return NextResponse.json(
          { ok: false, message: 'El alias debe tener entre 6 y 40 caracteres (letras, números, punto, guion).' },
          { status: 400 },
        );
      }
      patch.alias = alias;
    }

    let setPrincipal = false;
    if (body.es_principal !== undefined) {
      const flag = Boolean(body.es_principal);
      patch.es_principal = flag;
      setPrincipal = flag;
    }

    if (setPrincipal) {
      await sb
        .from('socio_metodos_retiro')
        .update({ es_principal: false })
        .eq('socio_id', ctx.socio.id)
        .eq('activo', true)
        .neq('id', id);
    }

    const { data: updated, error } = await sb
      .from('socio_metodos_retiro')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo actualizar el método de retiro', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, metodo: updated });
  } catch (e) {
    console.error('[PATCH /api/socio/metodos-retiro/:id]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}

/** DELETE /api/socio/metodos-retiro/[id] — Soft delete (activo=false). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;
    const sb = ctx.supabase as any;

    const { data: existing } = await sb
      .from('socio_metodos_retiro')
      .select('id, socio_id, es_principal')
      .eq('id', id)
      .maybeSingle();
    if (!existing || existing.socio_id !== ctx.socio.id) {
      return NextResponse.json(
        { ok: false, message: 'Método de retiro no encontrado' },
        { status: 404 },
      );
    }

    const { error } = await sb
      .from('socio_metodos_retiro')
      .update({ activo: false, es_principal: false })
      .eq('id', id);
    if (error) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo eliminar el método de retiro', detail: error.message },
        { status: 500 },
      );
    }

    // Reasignar principal a otro activo si correspondía
    if (existing.es_principal) {
      const { data: candidato } = await sb
        .from('socio_metodos_retiro')
        .select('id')
        .eq('socio_id', ctx.socio.id)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (candidato?.id) {
        await sb
          .from('socio_metodos_retiro')
          .update({ es_principal: true })
          .eq('id', candidato.id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/socio/metodos-retiro/:id]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}
