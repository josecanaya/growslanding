import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import { inferOrgIdForSocio } from '@/lib/socios/inferOrgIdForSocio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PerfilExtraRow = {
  socio_id: string;
  apellido: string | null;
  especialidades_secundarias: string[] | null;
  descripcion: string | null;
  localidad: string | null;
  experiencia: string | null;
  avatar_url: string | null;
};

const MAX_TXT = 500;

function clean(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function cleanArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => clean(v, 80))
    .filter((v): v is string => Boolean(v))
    .slice(0, 12);
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

async function buildPayload(supabase: ReturnType<typeof createServiceSupabaseClient>, socio: { id: string; org_id: string | null; email: string | null; nombre: string | null }) {
  const sb = supabase as any;
  const { data: socioRow } = await sb
    .from('socios')
    .select('id, nombre, email, telefono, especialidad, org_id, estado')
    .eq('id', socio.id)
    .maybeSingle();

  const { data: extraRow } = await sb
    .from('socio_perfil_extra')
    .select('socio_id, apellido, especialidades_secundarias, descripcion, localidad, experiencia, avatar_url')
    .eq('socio_id', socio.id)
    .maybeSingle();

  const extra = (extraRow ?? {}) as Partial<PerfilExtraRow>;

  const inferred =
    socio.org_id == null || socio.org_id === '' ? await inferOrgIdForSocio(supabase, socio.id) : null;
  const effective_org_id = socio.org_id || inferred || null;

  return {
    ok: true,
    socio: {
      id: socio.id,
      org_id: socio.org_id,
      effective_org_id,
      email: socioRow?.email ?? socio.email,
      nombre: socioRow?.nombre ?? socio.nombre,
      telefono: socioRow?.telefono ?? null,
      especialidad: socioRow?.especialidad ?? null,
      estado: socioRow?.estado ?? null,
      apellido: extra.apellido ?? null,
      especialidades_secundarias: extra.especialidades_secundarias ?? [],
      descripcion: extra.descripcion ?? null,
      localidad: extra.localidad ?? null,
      experiencia: extra.experiencia ?? null,
      avatar_url: extra.avatar_url ?? null,
    },
  };
}

/** GET /api/socio/perfil — Perfil ampliado del socio autenticado. */
export async function GET() {
  try {
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;
    const payload = await buildPayload(ctx.supabase, ctx.socio);
    return NextResponse.json(payload);
  } catch (e) {
    console.error('[GET /api/socio/perfil]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}

/** PATCH /api/socio/perfil — Actualiza datos del socio + perfil extra. */
export async function PATCH(request: Request) {
  try {
    const ctx = await autenticarSocio();
    if ('error' in ctx) return ctx.error;

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    const nombre = clean(body.nombre, 120);
    const apellido = clean(body.apellido, 120);
    const telefono = clean(body.telefono, 40);
    const email = clean(body.email, 200);
    const especialidad = clean(body.especialidad, 120);
    const descripcion = clean(body.descripcion, MAX_TXT);
    const localidad = clean(body.localidad, 200);
    const experiencia = clean(body.experiencia, MAX_TXT);
    const avatar_url = clean(body.avatar_url, 1000);
    const especialidades_secundarias = cleanArray(body.especialidades_secundarias);

    const sb = ctx.supabase as any;

    const socioPatch: Record<string, unknown> = {};
    if (nombre !== null) socioPatch.nombre = nombre;
    if (telefono !== null) socioPatch.telefono = telefono;
    if (email !== null) socioPatch.email = email;
    if (especialidad !== null) socioPatch.especialidad = especialidad;

    if (Object.keys(socioPatch).length > 0) {
      const { error: socioErr } = await sb
        .from('socios')
        .update(socioPatch)
        .eq('id', ctx.socio.id);
      if (socioErr) {
        return NextResponse.json(
          { ok: false, message: 'No se pudieron guardar tus datos básicos', detail: socioErr.message },
          { status: 500 },
        );
      }
    }

    const extraPatch: Record<string, unknown> = {
      socio_id: ctx.socio.id,
    };
    if (apellido !== null) extraPatch.apellido = apellido;
    if (descripcion !== null) extraPatch.descripcion = descripcion;
    if (localidad !== null) extraPatch.localidad = localidad;
    if (experiencia !== null) extraPatch.experiencia = experiencia;
    if (avatar_url !== null) extraPatch.avatar_url = avatar_url;
    if (Array.isArray(body.especialidades_secundarias)) {
      extraPatch.especialidades_secundarias = especialidades_secundarias;
    }

    const { error: extraErr } = await sb
      .from('socio_perfil_extra')
      .upsert(extraPatch, { onConflict: 'socio_id' });

    if (extraErr) {
      return NextResponse.json(
        { ok: false, message: 'No se pudo guardar el perfil profesional', detail: extraErr.message },
        { status: 500 },
      );
    }

    const payload = await buildPayload(ctx.supabase, ctx.socio);
    return NextResponse.json(payload);
  } catch (e) {
    console.error('[PATCH /api/socio/perfil]', e);
    return NextResponse.json({ ok: false, message: 'Error interno' }, { status: 500 });
  }
}
