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
