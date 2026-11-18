export const IS_DEV_MODE =
  process.env.NEXT_PUBLIC_DEV_MODE?.toLowerCase() === 'true';

/**
 * En desarrollo (o con NEXT_PUBLIC_RELAX_AUTH_RATE_LIMIT=true), evitamos el
 * “bloqueo local” largo (`supabase_rate_limit_until`, flags PKCE rate_limited,
 * redirecciones a `error=rate_limit`). Supabase puede seguir devolviendo 429
 * en el servidor; esto solo deja reintentar sin castigar minutos en el cliente.
 */
export const RELAX_CLIENT_AUTH_THROTTLE =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_RELAX_AUTH_RATE_LIMIT === 'true';

/**
 * Los flujos de autenticación vuelven al origen que guardó el verificador PKCE.
 * La URL configurada se usa únicamente al generar enlaces fuera del navegador.
 */
export function getAppWebUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return 'https://growsapp2.vercel.app';
}
