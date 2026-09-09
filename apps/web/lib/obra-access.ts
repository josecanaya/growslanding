import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { listAccessibleOrgIds } from '@/lib/orgs';
import type { Database } from '@/lib/types/supabase.gen';

export class ObraAccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function requireObraAccess(obraId: string, write = false) {
  const cookieStore = await cookies();
  const auth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) throw new ObraAccessError(401, 'Iniciá sesión para acceder a la obra.');
  const supabase = createServiceSupabaseClient();
  const { data: obra, error: obraError } = await supabase.from('obras').select('id, org_id').eq('id', obraId).maybeSingle();
  if (obraError) throw new ObraAccessError(503, 'No se pudo comprobar el acceso.');
  if (!obra) throw new ObraAccessError(404, 'Obra no encontrada.');
  if (write) {
    const { data: owner, error: ownerError } = await supabase.from('organizations').select('id').eq('id', obra.org_id).eq('user_id', user.id).maybeSingle();
    if (ownerError) throw new ObraAccessError(503, 'No se pudo comprobar el permiso.');
    let leader = false;
    if (!owner && user.email) {
      const result = await (supabase as any).from('leader_invites').select('org_id').eq('org_id', obra.org_id).eq('email', user.email).eq('status', 'accepted').limit(1);
      if (result.error) throw new ObraAccessError(503, 'No se pudo comprobar el permiso.');
      leader = result.data?.length > 0;
    }
    if (!owner && !leader) throw new ObraAccessError(403, 'Solo el responsable o coordinador puede modificar el plan y sus documentos.');
  } else {
    const orgs = await listAccessibleOrgIds(supabase, user.id, user.email);
    if (!orgs.includes(obra.org_id)) throw new ObraAccessError(403, 'Sin acceso a esta obra.');
  }
  return { supabase, user, orgId: obra.org_id };
}
