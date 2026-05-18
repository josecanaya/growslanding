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
 * URL base para enlaces mágicos, OAuth `redirectTo`, etc.
 *
 * En el navegador sobre localhost (cualquier host/puerto), **siempre** usamos
 * `window.location.origin` para que coincida con cookies PKCE y con la URL que
 * Supabase/Google devuelven. Si `NEXT_PUBLIC_APP_URL` apuntara a producción,
 * el login con Google en local fallaría aunque el proyecto esté bien.
 */
export function getAppWebUrl(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    const isLocalDevHost =
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '0.0.0.0' ||
      h === '[::1]' ||
      h.endsWith('.local');
    if (isLocalDevHost) {
      return `${window.location.protocol}//${window.location.host}`;
    }
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return 'https://app.grows.com.ar';
}