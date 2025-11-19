import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Intentar obtener org_id desde los metadatos del usuario
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const orgIdFromMetadata = (userMeta.org_id as string | undefined) ?? (appMeta.org_id as string | undefined);

  let org: { id: string; plan_actual: string | null } | null = null;
  let orgError: any = null;

  if (orgIdFromMetadata) {
    // Buscar por el org_id de los metadatos
    const { data, error } = await (supabase as any)
      .from('organizations')
      .select('id, plan_actual')
      .eq('id', orgIdFromMetadata)
      .maybeSingle();
    
    org = data;
    orgError = error;
  }

  // 2. Si no se encontró por metadatos, buscar por owner_user_id
  if (!org && !orgError) {
    const { data, error } = await (supabase as any)
      .from('organizations')
      .select('id, plan_actual')
      .eq('owner_user_id', user.id)
      .maybeSingle();
    
    org = data;
    orgError = error;
  }

  // 3. Si aún no se encontró, buscar en la tabla de miembros
  if (!org && !orgError) {
    const { data: miembro } = await (supabase as any)
      .from('miembro_organizacion')
      .select('org_id')
      .eq('usuario_id', user.id)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (miembro?.org_id) {
      const { data, error } = await (supabase as any)
        .from('organizations')
        .select('id, plan_actual')
        .eq('id', miembro.org_id)
        .maybeSingle();
      
      org = data;
      orgError = error;
    }
  }

  if (orgError) {
    console.error('[subscription/plan] Error fetching organization:', orgError);
    return NextResponse.json({ planId: 'FREE', orgId: null });
  }

  if (!org) {
    // No hay organización para este usuario, retornar plan FREE
    return NextResponse.json({ planId: 'FREE', orgId: null });
  }

  return NextResponse.json({
    planId: org?.plan_actual ?? 'FREE',
    orgId: org?.id ?? null,
  });
}


