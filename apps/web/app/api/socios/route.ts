import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { resolveOrgContext } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

/**
 * GET /api/socios
 * Lista socios / cuadrillas de la organización del usuario (owner o líder invitado).
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const { org } = await resolveOrgContext(
      user.id,
      user.user_metadata?.full_name ?? user.email ?? 'Organización',
      user.email
    );

    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('socios')
      .select('id, nombre, contacto, email, estado, rol, org_id, created_at')
      .eq('org_id', org.id)
      .order('nombre', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al listar socios';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

const schema = z.object({
  nombre: z.string().min(2),
  contacto: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ message: 'No autenticado' }), {
        status: 401,
      });
    }

    const { org, role } = await resolveOrgContext(
      user.id,
      user.user_metadata?.full_name ?? user.email ?? 'Organización',
      user.email
    );

    if (role !== 'owner') {
      return new Response(JSON.stringify({ message: 'Solo el cliente puede crear socios manualmente' }), {
        status: 403,
      });
    }

    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('socios')
      .insert({
        org_id: org.id,
        nombre: payload.nombre,
        contacto: payload.contacto ?? null,
        rol: 'constructor',
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ id: data.id }), { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al crear socio';
    return new Response(JSON.stringify({ message }), { status: 400 });
  }
}
