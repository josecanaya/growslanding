/**
 * Perfil de socio para la sesión actual vía API (service role), evitando RLS del cliente.
 */
export type SocioContextDto = {
  id: string;
  org_id: string | null;
  /** org en fila socio o inferida desde tareas / presupuestos (para socios con org_id null). */
  effective_org_id: string | null;
  email: string | null;
  nombre: string | null;
};

/** Evita decenas de GET /api/socio/context (cada uno llama getUser en Supabase) → rate limit 429. */
const CACHE_TTL_MS = 25_000;
const NEGATIVE_CACHE_MS = 8_000;

let inflight: Promise<SocioContextDto | null> | null = null;
let cached: { value: SocioContextDto | null; until: number } | null = null;

export function invalidateSocioContextClientCache(): void {
  inflight = null;
  cached = null;
}

function normalizeSocio(s: SocioContextDto): SocioContextDto {
  return {
    ...s,
    effective_org_id:
      s.effective_org_id ?? (s.org_id && s.org_id !== '' ? s.org_id : null),
  };
}

export async function fetchSocioContextClient(): Promise<SocioContextDto | null> {
  const now = Date.now();
  if (cached && now < cached.until) {
    return cached.value;
  }
  if (inflight) {
    return inflight;
  }

  inflight = (async (): Promise<SocioContextDto | null> => {
    try {
      const res = await fetch('/api/socio/context', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 429) {
        console.warn('[fetchSocioContextClient] Rate limit en /api/socio/context; usando último perfil cacheado si existe');
        if (cached?.value) return cached.value;
        return null;
      }

      if (!res.ok) {
        cached = { value: null, until: now + NEGATIVE_CACHE_MS };
        return null;
      }

      const body = (await res.json()) as { ok?: boolean; socio?: SocioContextDto | null };
      if (!body?.ok || !body?.socio?.id) {
        cached = { value: null, until: now + NEGATIVE_CACHE_MS };
        return null;
      }

      const value = normalizeSocio(body.socio);
      cached = { value, until: Date.now() + CACHE_TTL_MS };
      return value;
    } catch {
      return cached && now < cached.until ? cached.value : null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
