import { createServiceSupabaseClient } from '../supabase-server';

let cachedPlatformOrgId: string | null = null;

/**
 * ID de la organización que representa la billetera de GROWS (comisiones de plataforma).
 * Configurar en `GROWS_PLATFORM_ORG_ID`. Si falta, intenta resolver por nombre.
 */
export async function resolveGrowsPlatformOrgId(): Promise<string | null> {
  if (process.env.GROWS_PLATFORM_ORG_ID?.trim()) {
    return process.env.GROWS_PLATFORM_ORG_ID.trim();
  }

  if (cachedPlatformOrgId) {
    return cachedPlatformOrgId;
  }

  const supabase = createServiceSupabaseClient();
  const supabaseAny = supabase as any;

  const { data: byEnvName } = await supabaseAny
    .from('organizations')
    .select('id')
    .ilike('name', '%grows%')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (byEnvName?.id) {
    cachedPlatformOrgId = String(byEnvName.id);
    return cachedPlatformOrgId;
  }

  const { data: legacy } = await supabaseAny
    .from('organizaciones')
    .select('id')
    .ilike('nombre', '%grows%')
    .limit(1)
    .maybeSingle();

  if (legacy?.id) {
    cachedPlatformOrgId = String(legacy.id);
    return cachedPlatformOrgId;
  }

  return null;
}
