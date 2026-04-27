import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { normalizeRole } from '@/lib/roles';

export const runtime = 'nodejs';

const QR_SCOPE_SOCIO = 'socio_asociacion';

const requestSchema = z.object({
  token: z.string().min(3),
});

type OrganizationRecord = {
  id: string;
  name: string | null;
};

type SocioSourceRecord = {
  id: string;
  org_id: string | null;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  estado: string | null;
  especialidad: string | null;
};

function normalizeQrToken(raw: string) {
  const trimmed = raw.trim();

  try {
    const url = new URL(trimmed);
    const queryToken =
      url.searchParams.get('asociar_socio') ||
      url.searchParams.get('token') ||
      url.searchParams.get('code');

    if (queryToken) {
      return queryToken.trim();
    }

    const lastSegment = url.pathname.split('/').filter(Boolean).pop();
    if (lastSegment) {
      return lastSegment.trim();
    }
  } catch {
    // No es URL: se trata como token plano o payload escaneado.
  }

  return trimmed
    .replace(/^grows:socio:/i, '')
    .replace(/^\/socio\/qr\//i, '')
    .replace(/^\/cliente\/cuadrillas\?asociar_socio=/i, '')
    .trim();
}

function isMissingOptionalColumn(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = String(error.message || '').toLowerCase();
  return error.code === '42703' || error.code === 'PGRST204' || message.includes('column');
}

async function getClienteOrganization(user: {
  id: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}) {
  const role = normalizeRole(user.app_metadata?.role ?? user.user_metadata?.role);

  if (role !== 'CLIENTE_TECNICO' && role !== 'ADMIN') {
    return null;
  }

  const metadataOrgId =
    (user.user_metadata?.org_id as string | undefined) ??
    (user.app_metadata?.org_id as string | undefined) ??
    null;

  const supabase = createServiceSupabaseClient();

  if (metadataOrgId) {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', metadataOrgId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as OrganizationRecord;
    }
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as OrganizationRecord | null) ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token: rawToken } = requestSchema.parse(body);
    const token = normalizeQrToken(rawToken);

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

    const org = await getClienteOrganization({
      id: user.id,
      app_metadata: user.app_metadata as Record<string, unknown>,
      user_metadata: user.user_metadata as Record<string, unknown>,
    });

    if (!org) {
      return NextResponse.json(
        {
          success: false,
          error: 'El usuario cliente no tiene una organización activa.',
        },
        { status: 403 },
      );
    }

    const supabase = createServiceSupabaseClient();
    const { data: qrToken, error: qrError } = await (supabase as any)
      .from('qr_tokens')
      .select('id, ref_id, enabled, scope')
      .eq('token', token)
      .eq('scope', QR_SCOPE_SOCIO)
      .maybeSingle();

    if (qrError) {
      throw qrError;
    }

    const qrRecord = qrToken as
      | { id: string; ref_id: string; enabled: boolean | null; scope: string | null }
      | null;

    if (!qrRecord || qrRecord.enabled === false) {
      return NextResponse.json(
        { success: false, error: 'QR de socio inválido o deshabilitado.' },
        { status: 404 },
      );
    }

    const { data: sourceSocio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, nombre, email, telefono, estado, especialidad')
      .eq('id', qrRecord.ref_id)
      .maybeSingle();

    if (socioError) {
      throw socioError;
    }

    const socio = sourceSocio as SocioSourceRecord | null;

    if (!socio) {
      return NextResponse.json(
        { success: false, error: 'Socio no encontrado para este QR.' },
        { status: 404 },
      );
    }

    if (socio.estado && socio.estado.toLowerCase() === 'inactivo') {
      return NextResponse.json(
        { success: false, error: 'El socio está inactivo.' },
        { status: 403 },
      );
    }

    if (!socio.email && !socio.telefono) {
      return NextResponse.json(
        {
          success: false,
          error: 'El socio no tiene email ni teléfono para asociarlo de forma segura.',
        },
        { status: 400 },
      );
    }

    if (socio.org_id === org.id) {
      return NextResponse.json({
        success: true,
        data: {
          socio_id: socio.id,
          alreadyAssociated: true,
        },
        message: 'El socio ya pertenece a esta organización.',
      });
    }

    let existingQuery = supabase
      .from('socios')
      .select('id, estado, nombre, email, telefono')
      .eq('org_id', org.id);

    if (socio.email) {
      existingQuery = existingQuery.eq('email', socio.email);
    } else {
      existingQuery = existingQuery.eq('telefono', socio.telefono as string);
    }

    const { data: existingSocio, error: existingError } =
      await existingQuery.maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingSocio) {
      if ((existingSocio.estado || '').toLowerCase() === 'inactivo') {
        const { error: activateError } = await supabase
          .from('socios')
          .update({ estado: 'activo' })
          .eq('id', existingSocio.id);

        if (activateError) {
          throw activateError;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          socio_id: existingSocio.id,
          alreadyAssociated: true,
        },
        message: 'El socio ya estaba asociado a tu organización.',
      });
    }

    const insertPayloadBase = {
      org_id: org.id,
      nombre: socio.nombre || socio.email || socio.telefono || 'Socio constructor',
      email: socio.email,
      telefono: socio.telefono,
      estado: 'activo',
      especialidad: socio.especialidad,
    };

    const { data: insertedSocio, error: insertError } = await (supabase as any)
      .from('socios')
      .insert({
        ...insertPayloadBase,
        rol: 'constructor',
      })
      .select('id, nombre, email')
      .single();

    if (insertError && isMissingOptionalColumn(insertError)) {
      const { data: fallbackSocio, error: fallbackError } = await supabase
        .from('socios')
        .insert(insertPayloadBase)
        .select('id, nombre, email')
        .single();

      if (fallbackError) {
        throw fallbackError;
      }

      return NextResponse.json({
        success: true,
        data: {
          socio_id: fallbackSocio.id,
          socio: fallbackSocio,
        },
        message: 'Socio asociado correctamente a tu organización.',
      });
    }

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: {
        socio_id: insertedSocio.id,
        socio: insertedSocio,
      },
      message: 'Socio asociado correctamente a tu organización.',
    });
  } catch (error) {
    console.error('[ASOCIAR_SOCIO_QR_ERROR]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Código QR inválido.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo asociar el socio por QR.',
      },
      { status: 500 },
    );
  }
}
