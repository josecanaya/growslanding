import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { normalizeRole, type UserRole } from '@/lib/roles';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export type ClienteWalletAuthContext = {
  userId: string;
  email: string | null;
  orgId: string;
  role: UserRole;
};

export async function requireClienteWalletAuth(): Promise<ClienteWalletAuthContext> {
  const cookieStore = await cookies();
  const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    throw new Error('NO_AUTENTICADO');
  }

  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const role = normalizeRole(appMeta.role ?? userMeta.role);
  if (role !== 'CLIENTE_TECNICO' && role !== 'ADMIN') {
    throw new Error('FORBIDDEN_ROLE');
  }

  const supabase = createServiceSupabaseClient();
  const supabaseAny = supabase as any;

  const metadataOrgId =
    typeof userMeta.org_id === 'string'
      ? userMeta.org_id
      : typeof appMeta.org_id === 'string'
        ? appMeta.org_id
        : null;

  let orgId: string | null = null;
  if (metadataOrgId) {
    const { data: metadataOrg } = await supabaseAny
      .from('organizations')
      .select('id, user_id')
      .eq('id', metadataOrgId)
      .maybeSingle();
    if (metadataOrg?.user_id === user.id || role === 'ADMIN') {
      orgId = metadataOrg.id;
    }
  }

  if (!orgId) {
    const { data: ownerOrg } = await supabaseAny
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    orgId = ownerOrg?.id ?? null;
  }

  if (!orgId) {
    throw new Error('ORG_NO_ENCONTRADA');
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    orgId,
    role,
  };
}

export function statusFromClienteWalletAuthError(error: unknown): number {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === 'NO_AUTENTICADO') return 401;
  if (msg === 'FORBIDDEN_ROLE') return 403;
  if (msg === 'ORG_NO_ENCONTRADA') return 404;
  return 500;
}
