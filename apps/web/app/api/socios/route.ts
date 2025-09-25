import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

import { resolveOrgContext } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

const schema = z.object({
  nombre: z.string().min(2),
  contacto: z.string().optional(),
  rol: z.enum(['funcional', 'autonomo']).default('funcional'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
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
      return new Response(JSON.stringify({ message: 'Solo el cliente técnico puede crear socios manualmente' }), {
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
        rol: payload.rol,
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
