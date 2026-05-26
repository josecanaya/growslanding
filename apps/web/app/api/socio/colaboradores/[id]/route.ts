import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

async function obtenerColaboradorOwned(supabase: ReturnType<typeof createServiceSupabaseClient>, id: string, socioId: string) {
  const sb = supabase as any;
  const { data } = await sb
    .from('socio_colaboradores')
    .select('id, socio_id')
    .eq('id', id)
    .maybeSingle();
  if (!data || data.socio_id !== socioId) return null;
  return data;
}

/** PATCH /api/socio/colaboradores/[id] — Editar colaborador o activar/desactivar. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;
    const own = await obtenerColaboradorOwned(ctx.supabase, id, ctx.socio.id);
    if (!own) {
      return NextResponse.json({ ok: false, message: 'Colaborador no encontrado' }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    const nombre = cleanStr(body.nombre, 120);
    if (nombre !== undefined) {
      if (!nombre) {
        return NextResponse.json({ ok: false, message: 'El nombre no puede quedar vacío.' }, { status: 400 });
      }
      patch.nombre = nombre;
    }
    const apellido = cleanStr(body.apellido, 120);
    if (apellido !== undefined) patch.apellido = apellido;
    const dni = cleanStr(body.dni, 30);
    if (dni !== undefined) patch.dni = dni;
    const telefono = cleanStr(body.telefono, 40);
    if (telefono !== undefined) patch.telefono = telefono;
    const especialidad = cleanStr(body.especialidad, 120);
    if (especialidad !== undefined) patch.especialidad = especialidad;
    const categoria = cleanStr(body.categoria, 80);
    if (categoria !== undefined) patch.categoria = categoria;
    const foto_url = cleanStr(body.foto_url, 1000);
    if (foto_url !== undefined) patch.foto_url = foto_url;
    const observaciones = cleanStr(body.observaciones, 500);
    if (observaciones !== undefined) patch.observaciones = observaciones;
    if (body.activo !== undefined) patch.activo = Boolean(body.activo);

    const sb = ctx.supabase as any;
    const { data: updated, error } = await sb
      .from('socio_colaboradores')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo actualizar el colaborador', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, colaborador: updated });
  } catch (e) {
    console.error('[PATCH /api/socio/colaboradores/:id]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}

/** DELETE /api/socio/colaboradores/[id] — Hard delete del colaborador del socio. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;
    const own = await obtenerColaboradorOwned(ctx.supabase, id, ctx.socio.id);
    if (!own) {
      return NextResponse.json({ ok: false, message: 'Colaborador no encontrado' }, { status: 404 });
    }

    const sb = ctx.supabase as any;
    const { error } = await sb.from('socio_colaboradores').delete().eq('id', id);
    if (error) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo eliminar el colaborador', detail: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/socio/colaboradores/:id]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}
