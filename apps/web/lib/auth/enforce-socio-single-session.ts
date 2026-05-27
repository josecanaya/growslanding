import type { Session } from '@supabase/supabase-js';

import { normalizeRole } from '@/lib/roles';

/** Mínimo necesario para evitar incompatibilidad de genéricos entre clientes Supabase. */
type SupabaseAuthSignOutClient = {
  auth: {
    signOut: (options?: { scope?: 'global' | 'local' | 'others' }) => Promise<{
      error: Error | null;
    }>;
  };
};

/**
 * Cierra sesiones Supabase del mismo usuario en otros dispositivos/pestañas.
 * Solo aplica al rol SOCIO.
 */
export async function enforceSocioSingleSession(
  supabase: SupabaseAuthSignOutClient,
  session: Session | null | undefined,
): Promise<void> {
  if (!session?.user) return;

  const appMeta = (session.user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const role = normalizeRole(
    (appMeta.role as string | undefined) ?? (userMeta.role as string | undefined),
  );

  if (role !== 'SOCIO') return;

  try {
    await supabase.auth.signOut({ scope: 'others' });
  } catch (err) {
    console.warn('[SOCIO_SINGLE_SESSION] No se pudieron cerrar otras sesiones:', err);
  }
}
