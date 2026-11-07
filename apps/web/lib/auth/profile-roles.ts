import { normalizeRole, type UserRole } from '@/lib/roles';

type Identity = { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> };

export function profileRoles(user: Identity): UserRole[] {
  const trusted = user.app_metadata ?? {};
  const roles = new Set<UserRole>();
  for (const item of Array.isArray(trusted.roles) ? trusted.roles : []) {
    const role = normalizeRole(item);
    if (role) roles.add(role);
  }
  const primary = normalizeRole(trusted.role);
  if (primary) roles.add(primary);
  // Existing self-selected operational profiles remain usable. Admin is server-issued only.
  const legacy = normalizeRole(user.user_metadata?.role);
  if (legacy && legacy !== 'ADMIN') roles.add(legacy);
  return [...roles];
}

export function roleForPath(user: Identity, pathname: string): UserRole | null {
  const roles = profileRoles(user);
  const wanted = pathname.startsWith('/socio') ? 'SOCIO' : pathname.startsWith('/cliente') ? 'CLIENTE_TECNICO' : null;
  if (wanted && roles.includes(wanted)) return wanted;
  if (roles.includes('ADMIN')) return 'ADMIN';
  return normalizeRole(user.app_metadata?.role) ?? roles[0] ?? null;
}
