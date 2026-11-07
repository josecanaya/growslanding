import type { User } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { resolveOrgContext } from '@/lib/orgs';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import { profileRoles } from './profile-roles';

export async function activateProfile(user: User, role: 'SOCIO' | 'CLIENTE_TECNICO') {
  const db = createServiceSupabaseClient();
  const name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Mi espacio').slice(0, 200);
  let orgId: string | null = null;
  if (role === 'CLIENTE_TECNICO') {
    const { org } = await resolveOrgContext(user.id, name, user.email_confirmed_at ? user.email : null);
    orgId = org.id;
  } else {
    const socio = await resolveSocioRecordForAuthUser(db, {
      id: user.id, email: user.email_confirmed_at ? user.email : null,
    });
    if (socio && socio.user_id && socio.user_id !== user.id) {
      throw new Error('Ese perfil ya está vinculado a otra cuenta.');
    }
    if (socio && !socio.user_id) {
      const linked = await db.from('socios').update({ user_id: user.id, estado: 'activo' })
        .eq('id', socio.id).is('user_id', null).select('id');
      if (linked.error || !linked.data?.length) {
        const check = await db.from('socios').select('id').eq('id', socio.id).eq('user_id', user.id).maybeSingle();
        if (check.error || !check.data) throw new Error('No se pudo vincular el perfil de contratista.');
      }
    }
    if (!socio) {
      // Stable ID makes profile creation safe to retry across tabs.
      const result = await db.from('socios').insert({
        id: user.id, user_id: user.id, nombre: name,
        email: user.email_confirmed_at ? user.email : null, estado: 'activo',
      });
      if (result.error) {
        const existing = await db.from('socios').select('id').eq('id', user.id).eq('user_id', user.id).maybeSingle();
        if (existing.error || !existing.data) throw new Error('No se pudo habilitar el perfil de contratista.');
      }
    }
  }
  // Both operational spaces are available to an account. Object permissions remain per obra.
  const roles = [...new Set([...profileRoles(user), 'SOCIO', 'CLIENTE_TECNICO'])];
  const { error } = await db.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, roles, role: profileRoles(user).includes('ADMIN') ? 'ADMIN' : role },
    user_metadata: {
      ...user.user_metadata, role,
      ...(orgId ? { org_id: orgId } : {}),
    },
  });
  if (error) throw new Error('No se pudo actualizar el perfil.');
  return { orgId, role, roles };
}
