import { roleForPath } from '@/lib/auth/profile-roles';
import type { Role } from './simulation';

// Presentation preference for fictitious works. Real obra permissions remain server-side.
export function feedProfile(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): Role | null {
  const preference = user.user_metadata?.grows_feed_profile;
  if (preference === 'profesional' || preference === 'contratista' || preference === 'inversor') return preference;
  const role = String(user.app_metadata?.role || '').toUpperCase();
  if (role === 'SOCIO') return 'contratista';
  if (role === 'CLIENTE_TECNICO') return 'profesional';
  if (role === 'INVERSOR' || role === 'INVESTOR') return 'inversor';
  return null;
}

export function obraReturnPath(id: string) {
  return '/inversores/simulacion?obra=' + encodeURIComponent(id);
}

type AccountIdentity = Parameters<typeof roleForPath>[0];

export function accountRole(user: AccountIdentity): Role | 'admin' | null {
  const primary = String(user.app_metadata?.role ?? '').toUpperCase();
  if (primary === 'INVERSOR' || primary === 'INVESTOR') return 'inversor';
  switch (roleForPath(user, '/inversores')) {
    case 'ADMIN': return 'admin';
    case 'CLIENTE_TECNICO': return 'profesional';
    case 'SOCIO': return 'contratista';
    default: return null;
  }
}
