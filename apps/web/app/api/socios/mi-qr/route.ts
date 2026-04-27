import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { normalizeRole } from '@/lib/roles';

export const runtime = 'nodejs';

const QR_SCOPE_SOCIO = 'socio_asociacion';

type SocioQrRecord = {
  id: string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  estado: string | null;
};

function buildAssociationUrl(request: Request, token: string) {
  const origin =
    request.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(request.url).origin;

  const url = new URL('/cliente/cuadrillas', origin);
  url.searchParams.set('asociar_socio', token);
  return url.toString();
}

async function findSocioForUser(userId: string, email: string | null) {
  const supabase = createServiceSupabaseClient();

  if (email) {
    const { data, error } = await supabase
      .from('socios')
      .select('id, nombre, email, telefono, estado')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as SocioQrRecord;
    }
  }

  const { data, error } = await (supabase as any)
    .from('socios')
    .select('id, nombre, email, telefono, estado')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    const missingUserIdColumn =
      error.code === '42703' ||
      error.code === 'PGRST204' ||
      String(error.message || '').toLowerCase().includes('user_id');

    if (!missingUserIdColumn) {
      throw error;
    }
  }

  return (data as SocioQrRecord | null) ?? null;
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

    if (role !== 'SOCIO') {
      return NextResponse.json(
        { success: false, error: 'Solo un socio puede generar su QR personal' },
        { status: 403 },
      );
    }

    const socio = await findSocioForUser(user.id, user.email ?? null);

    if (!socio) {
      return NextResponse.json(
        {
          success: false,
          error: 'No encontramos un perfil de socio asociado a tu usuario.',
        },
        { status: 404 },
      );
    }

    if (socio.estado && socio.estado.toLowerCase() === 'inactivo') {
      return NextResponse.json(
        { success: false, error: 'El socio está inactivo y no puede asociarse por QR.' },
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

    return NextResponse.json({
      success: true,
      data: {
        token,
        associationUrl: buildAssociationUrl(request, token),
        socio: {
          id: socio.id,
          nombre: socio.nombre,
          email: socio.email,
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
