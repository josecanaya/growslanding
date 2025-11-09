export type UserRole = 'ADMIN' | 'CLIENTE_TECNICO' | 'SOCIO';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  CLIENTE_TECNICO: 'Cliente Técnico',
  SOCIO: 'Socio',
};

export function normalizeRole(value: unknown): UserRole | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const upper = value.toUpperCase();
  if (upper === 'ADMIN' || upper === 'CLIENTE_TECNICO' || upper === 'SOCIO') {
    return upper as UserRole;
  }

  return null;
}

export function getDefaultRouteForRole(role: UserRole | null): string {
  switch (role) {
    case 'ADMIN':
    case 'CLIENTE_TECNICO':
      return '/cliente/dashboard';
    case 'SOCIO':
      return '/socio';
    default:
      return '/auth/login';
  }
}
