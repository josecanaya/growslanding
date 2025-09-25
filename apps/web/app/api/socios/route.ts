import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

import { ensureOrgForUser } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

const schema = z.object({
  nombre: z.string().min(2),
  contacto: z.string().optional(),
  rol: z.enum(['funcional', 'autonomo']).default('funcional'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);

    const supabaseAuth = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession();

    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'No autenticado' }), {
        status: 401,
      });
    }

    const org = await ensureOrgForUser(
      session.user.id,
      session.user.user_metadata?.full_name ?? session.user.email ?? 'Organización'
    );

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
