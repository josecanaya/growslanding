import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { normalizeRole } from '@/lib/roles';
import { displayPublicSocioCode } from '@/lib/socios/public-code';

export const runtime = 'nodejs';

const QR_SCOPE_SOCIO = 'socio_asociacion';

type SocioQrRecord = {
  id: string;
  org_id: string | null;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  estado: string | null;
  especialidad: string | null;
};

type AuthUserForSocio = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

const PUBLIC_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function buildAgendaUrlByPublicCode(request: Request, displayCode: string) {
  const origin =
    request.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(request.url).origin;
  const url = new URL('/cliente/agenda-socios', origin);
  url.searchParams.set('code', displayCode);
  return url.toString();
}

function buildAssociationUrl(request: Request, token: string) {
  const origin =
    request.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(request.url).origin;
  const url = new URL('/cliente/agenda-socios', origin);
  url.searchParams.set('agendar_socio', token);
  return url.toString();
}

async function ensurePublicCodigo(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  socioId: string,
): Promise<string | null> {
  const { data: row, error: readErr } = await (supabase as any)
    .from('socios')
    .select('public_codigo')
    .eq('id', socioId)
    .maybeSingle();

  if (readErr) {
    const msg = String(readErr.message || '').toLowerCase();
    if (readErr.code === '42703' || msg.includes('public_codigo')) {
      return null;
    }
    throw readErr;
  }

  const existing = (row as { public_codigo?: string | null } | null)?.public_codigo;
  if (existing) {
    return existing;
  }

  for (let attempt = 0; attempt < 14; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += PUBLIC_CODE_ALPHABET[Math.floor(Math.random() * PUBLIC_CODE_ALPHABET.length)];
    }

    const { data: updated, error: updErr } = await (supabase as any)
      .from('socios')
      .update({ public_codigo: code })
      .eq('id', socioId)
      .is('public_codigo', null)
      .select('public_codigo')
      .maybeSingle();

    if (!updErr && (updated as { public_codigo?: string } | null)?.public_codigo) {
      return (updated as { public_codigo: string }).public_codigo;
    }

    if (updErr?.code === '23505') {
      continue;
    }

    if (updErr) {
      const msg = String(updErr.message || '').toLowerCase();
      if (updErr.code === '42703' || msg.includes('public_codigo')) {
        return null;
      }
      throw updErr;
    }

    const { data: again } = await (supabase as any)
      .from('socios')
      .select('public_codigo')
      .eq('id', socioId)
      .maybeSingle();

    const c = (again as { public_codigo?: string | null } | null)?.public_codigo;
    if (c) {
      return c;
    }
  }

  return null;
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = String(error.message || '').toLowerCase();
  return error.code === '42703' || error.code === 'PGRST204' || message.includes('column');
}

async function updateSocioBestEffort(socioId: string, data: Record<string, unknown>) {
  const supabase = createServiceSupabaseClient();

  const { error } = await (supabase as any)
    .from('socios')
    .update(data)
    .eq('id', socioId);

  if (error && !isMissingColumnError(error)) {
    throw error;
  }
}

async function findSocioByUserId(userId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await (supabase as any)
    .from('socios')
    .select('id, org_id, nombre, email, telefono, estado, especialidad')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    const missingUserIdColumn =
      isMissingColumnError(error) ||
      String(error.message || '').toLowerCase().includes('user_id');

    if (!missingUserIdColumn) {
      throw error;
    }
  }

  return (data as SocioQrRecord | null) ?? null;
}

async function findSocioByEmail(email: string | null) {
  if (!email) {
    return null;
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from('socios')
    .select('id, org_id, nombre, email, telefono, estado, especialidad')
    .eq('email', email)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SocioQrRecord | null) ?? null;
}

async function createSocioForUser(user: AuthUserForSocio) {
  const supabase = createServiceSupabaseClient();
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    'Socio constructor';

  const insertPayload = {
    nombre: displayName,
    email: user.email ?? null,
    estado: 'activo',
    especialidad: 'constructor',
    user_id: user.id,
  };

  const { data, error } = await (supabase as any)
    .from('socios')
    .insert(insertPayload)
    .select('id, org_id, nombre, email, telefono, estado, especialidad')
    .single();

  if (error && isMissingColumnError(error)) {
    const { data: fallbackData, error: fallbackError } = await (supabase as any)
      .from('socios')
      .insert({
        nombre: displayName,
        email: user.email ?? null,
        estado: 'activo',
        especialidad: 'constructor',
      })
      .select('id, org_id, nombre, email, telefono, estado, especialidad')
      .single();

    if (fallbackError) {
      throw fallbackError;
    }

    return fallbackData as SocioQrRecord;
  }

  if (error?.code === '23502' && String(error.message || '').includes('org_id')) {
    throw new Error(
      'La tabla socios todavía exige org_id. Aplicá la migración que permite socios sin organización para generar QR antes de asociarlos.',
    );
  }

  if (error) {
    throw error;
  }

  return data as SocioQrRecord;
}

async function resolveSocioProfileForUser(user: AuthUserForSocio) {
  const byUserId = await findSocioByUserId(user.id);
  if (byUserId) {
    return byUserId;
  }

  const byEmail = await findSocioByEmail(user.email ?? null);
  if (byEmail) {
    await updateSocioBestEffort(byEmail.id, {
      user_id: user.id,
      email: byEmail.email ?? user.email ?? null,
      estado: byEmail.estado ?? 'activo',
    });
    return {
      ...byEmail,
      email: byEmail.email ?? user.email ?? null,
      estado: byEmail.estado ?? 'activo',
    };
  }

  return createSocioForUser(user);
}

async function cuentaEsSoloClienteSinPerfilSocio(userId: string): Promise<boolean> {
  const supabase = createServiceSupabaseClient();
  const any = supabase as any;
  const { data: orgRow } = await any.from('organizations').select('id').eq('user_id', userId).maybeSingle();
  if (!orgRow) {
    return false;
  }
  const { data: socioRow } = await any.from('socios').select('id').eq('user_id', userId).maybeSingle();
  return !socioRow;
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const role = normalizeRole(
      (user.app_metadata as Record<string, unknown> | undefined)?.role ??
        (user.user_metadata as Record<string, unknown> | undefined)?.role,
    );

    if (role === 'CLIENTE_TECNICO' || role === 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Solo un perfil constructor puede mostrar el QR de socio.',
        },
        { status: 403 },
      );
    }

    if (role !== 'SOCIO') {
      const tieneSocioVinculado = Boolean(await findSocioByUserId(user.id));
      if (!tieneSocioVinculado && (await cuentaEsSoloClienteSinPerfilSocio(user.id))) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Esta cuenta es de cliente/arquitecto. Iniciá sesión con un usuario constructor para ver tu QR.',
          },
          { status: 403 },
        );
      }
    }

    const socio = await resolveSocioProfileForUser({
      id: user.id,
      email: user.email ?? null,
      app_metadata: user.app_metadata as Record<string, unknown>,
      user_metadata: user.user_metadata as Record<string, unknown>,
    });

    if (!socio) {
      return NextResponse.json(
        {
          success: false,
          error: 'No encontramos tu perfil de socio constructor.',
        },
        { status: 404 },
      );
    }

    if (socio.estado && socio.estado.toLowerCase() === 'inactivo') {
      return NextResponse.json(
        { success: false, error: 'El socio está inactivo y no puede mostrar QR para ser agendado.' },
        { status: 403 },
      );
    }

    const supabase = createServiceSupabaseClient();
    const { data: existingToken, error: tokenError } = await (supabase as any)
      .from('qr_tokens')
      .select('id, token')
      .eq('scope', QR_SCOPE_SOCIO)
      .eq('ref_id', socio.id)
      .eq('enabled', true)
      .limit(1)
      .maybeSingle();

    if (tokenError) {
      throw tokenError;
    }

    let token = (existingToken as { token: string } | null)?.token ?? null;

    if (!token) {
      token = randomBytes(24).toString('base64url');

      const { data: createdToken, error: createTokenError } = await (supabase as any)
        .from('qr_tokens')
        .insert({
          token,
          ref_id: socio.id,
          scope: QR_SCOPE_SOCIO,
          enabled: true,
        })
        .select('id, token')
        .single();

      if (createTokenError) {
        throw createTokenError;
      }

      token = (createdToken as { token: string }).token;
    }

    const publicCodigo = await ensurePublicCodigo(supabase, socio.id);
    const publicCodeDisplay = displayPublicSocioCode(publicCodigo);
    const associationUrl = buildAssociationUrl(request, token);
    const agendaUrlByCode = publicCodeDisplay ? buildAgendaUrlByPublicCode(request, publicCodeDisplay) : null;
    const qrUrl = agendaUrlByCode ?? associationUrl;

    return NextResponse.json({
      success: true,
      data: {
        token,
        publicCodigo: publicCodeDisplay,
        publicCodigoDb: publicCodigo,
        associationUrl,
        qrUrl,
        agendaUrlByCode,
        socio: {
          id: socio.id,
          nombre: socio.nombre,
          email: socio.email,
          oficio: socio.especialidad ?? null,
        },
      },
    });
  } catch (error) {
    console.error('[SOCIO_MI_QR_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo generar el QR del socio',
      },
      { status: 500 },
    );
  }
}
