import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { Database } from '@/lib/types/supabase.gen';
import {
  agendarSocioEnOrganizacion,
  normalizeQrTokenInput,
  resolveOrgForClienteAgenda,
  resolveSourceSocioByEmail,
  resolveSourceSocioByPublicCodigo,
  resolveSourceSocioByQrToken,
  resolveSourceSocioByTelefono,
} from '@/lib/socios/agendar-socio';

export const runtime = 'nodejs';

const bodySchema = z.discriminatedUnion('metodo', [
  z.object({
    metodo: z.literal('qr'),
    token: z.string().min(3),
  }),
  z.object({
    metodo: z.literal('id_publico'),
    codigo: z.string().min(4),
  }),
  z.object({
    metodo: z.literal('email'),
    email: z.string().email(),
  }),
  z.object({
    metodo: z.literal('telefono'),
    telefono: z.string().min(6),
  }),
]);

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = bodySchema.parse(json);

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const org = await resolveOrgForClienteAgenda({
      id: user.id,
      email: user.email,
      app_metadata: user.app_metadata as Record<string, unknown>,
      user_metadata: user.user_metadata as Record<string, unknown>,
    });

    if (!org) {
      return NextResponse.json(
        {
          success: false,
          error: 'Necesitás una organización activa para agendar socios.',
        },
        { status: 403 },
      );
    }

    let resolved:
      | Awaited<ReturnType<typeof resolveSourceSocioByQrToken>>
      | Awaited<ReturnType<typeof resolveSourceSocioByPublicCodigo>>
      | Awaited<ReturnType<typeof resolveSourceSocioByEmail>>
      | Awaited<ReturnType<typeof resolveSourceSocioByTelefono>>;

    if (body.metodo === 'qr') {
      const raw = normalizeQrTokenInput(body.token);
      let r = await resolveSourceSocioByQrToken(raw);
      if ('error' in r) {
        const asCode = await resolveSourceSocioByPublicCodigo(raw);
        if (!('error' in asCode)) {
          r = asCode;
        }
      }
      resolved = r;
    } else if (body.metodo === 'id_publico') {
      resolved = await resolveSourceSocioByPublicCodigo(body.codigo);
    } else if (body.metodo === 'email') {
      resolved = await resolveSourceSocioByEmail(body.email);
    } else {
      resolved = await resolveSourceSocioByTelefono(body.telefono);
    }

    if ('error' in resolved) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status },
      );
    }

    const result = await agendarSocioEnOrganizacion({
      org,
      sourceSocio: resolved.sourceSocio,
      metodo: body.metodo,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        socio_id: result.socio_id,
        alreadyInOrg: result.alreadyInOrg,
        alreadyInAgenda: result.alreadyInAgenda,
      },
      message: result.message,
    });
  } catch (error) {
    console.error('[SOCIOS_AGENDAR]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos para agendar socio.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo agendar el socio.',
      },
      { status: 500 },
    );
  }
}
