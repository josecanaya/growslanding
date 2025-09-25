import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

import { resolveOrgContext } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

const schema = z.object({
  obra_id: z.string().uuid(),
  tipo: z.string().min(2),
  descripcion: z.string().min(5),
  referente_id: z.string().uuid().optional(),
  socio_ids: z.array(z.string().uuid()).default([]),
  precedencias: z.array(z.string().uuid()).default([]),
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

    const { org } = await resolveOrgContext(
      user.id,
      user.user_metadata?.full_name ?? user.email ?? 'Organización',
      user.email
    );

    const supabase = createServiceSupabaseClient();

    const { data: obra } = await supabase
      .from('obras')
      .select('id, org_id')
      .eq('id', payload.obra_id)
      .maybeSingle();

    if (!obra || obra.org_id !== org.id) {
      return new Response(JSON.stringify({ message: 'La obra no pertenece a tu organización' }), {
        status: 403,
      });
    }

    if (payload.referente_id) {
      const { data: referente } = await supabase
        .from('socios')
        .select('id, org_id')
        .eq('id', payload.referente_id)
        .maybeSingle();
      if (!referente || referente.org_id !== org.id) {
        return new Response(JSON.stringify({ message: 'El referente no pertenece a tu organización' }), {
          status: 403,
        });
      }
    }

    if (payload.socio_ids.length > 0) {
      const { data: socios } = await supabase
        .from('socios')
        .select('id')
        .in('id', payload.socio_ids)
        .eq('org_id', org.id);
      const sociosValidos = socios?.map((s) => s.id) ?? [];
      const faltantes = payload.socio_ids.filter((id) => !sociosValidos.includes(id));
      if (faltantes.length > 0) {
        return new Response(JSON.stringify({ message: 'Algunos socios no pertenecen a tu organización' }), {
          status: 403,
        });
      }
    }

    if (payload.precedencias.length > 0) {
      const { data: precedentes } = await supabase
        .from('tareas')
        .select('id, obra:obras(org_id)')
        .in('id', payload.precedencias);
      const invalidas = (precedentes ?? []).filter((t) => t.obra?.org_id !== org.id);
      if (invalidas.length > 0) {
        return new Response(JSON.stringify({ message: 'Precedencias fuera de tu organización' }), {
          status: 403,
        });
      }
    }

    const { data: tarea, error } = await supabase
      .from('tareas')
      .insert({
        obra_id: payload.obra_id,
        tipo: payload.tipo,
        descripcion: payload.descripcion,
        referente_id: payload.referente_id ?? null,
        socio_ids: payload.socio_ids,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    if (payload.precedencias.length > 0) {
      const { error: precedenciaError } = await supabase
        .from('tarea_precedencias')
        .insert(
          payload.precedencias.map((dep) => ({
            tarea_id: tarea.id,
            depende_de: dep,
          }))
        );
      if (precedenciaError) {
        throw precedenciaError;
      }
    }

    return new Response(JSON.stringify({ id: tarea.id }), { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al crear la tarea';
    return new Response(JSON.stringify({ message }), { status: 400 });
  }
}
