import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import { inferOrgIdForSocio } from '@/lib/socios/inferOrgIdForSocio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function cleanStr(value: unknown, max = 200): string | null {
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

/** GET /api/socio/colaboradores — Lista colaboradores activos del socio. */
export async function GET(request: Request) {
  try {
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;
    const sb = ctx.supabase as any;
    const url = new URL(request.url);
    const incluirInactivos = url.searchParams.get('incluir_inactivos') === '1';

    let q = sb
      .from('socio_colaboradores')
      .select(
        'id, socio_id, org_id, nombre, apellido, dni, telefono, especialidad, categoria, foto_url, observaciones, activo, created_at, updated_at',
      )
      .eq('socio_id', ctx.socio.id)
      .order('activo', { ascending: false })
      .order('created_at', { ascending: false });

    if (!incluirInactivos) {
      q = q.eq('activo', true);
    }

    const { data, error } = await q;

    if (error) {
      return NextResponse.json(
        { ok: false, message: 'No se pudieron cargar los colaboradores', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, colaboradores: data ?? [] });
  } catch (e) {
    console.error('[GET /api/socio/colaboradores]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}

/** POST /api/socio/colaboradores — Alta de colaborador. */
export async function POST(request: Request) {
  try {
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;
    const sb = ctx.supabase as any;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const nombre = cleanStr(body.nombre, 120);
    if (!nombre) {
      return NextResponse.json({ ok: false, message: 'El nombre es obligatorio.' }, { status: 400 });
    }
    const apellido = cleanStr(body.apellido, 120);
    const dni = cleanStr(body.dni, 30);
    const telefono = cleanStr(body.telefono, 40);
    const especialidad = cleanStr(body.especialidad, 120);
    const categoria = cleanStr(body.categoria, 80);
    const foto_url = cleanStr(body.foto_url, 1000);
    const observaciones = cleanStr(body.observaciones, 500);

    let orgId = ctx.socio.org_id;
    if (!orgId) {
      const inferred = await inferOrgIdForSocio(ctx.supabase, ctx.socio.id);
      orgId = inferred || null;
    }

    const { data: inserted, error } = await sb
      .from('socio_colaboradores')
      .insert({
        socio_id: ctx.socio.id,
        org_id: orgId,
        nombre,
        apellido,
        dni,
        telefono,
        especialidad,
        categoria,
        foto_url,
        observaciones,
        activo: true,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo crear el colaborador', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, colaborador: inserted });
  } catch (e) {
    console.error('[POST /api/socio/colaboradores]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}
