/**
 * Configuración centralizada para URLs de la aplicación
 */

/** URL de la app web. NEXT_PUBLIC_APP_URL permite apuntar a otro entorno. */
export function getAppWebUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');
  if (configuredUrl) return configuredUrl;

  const hostname = typeof window === 'undefined' ? '' : window.location.hostname;
  const local = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
  if (process.env.NODE_ENV === 'development' || local) return 'http://localhost:3000';

  return 'https://app.grows.com.ar';
}

/**
 * Obtiene la URL completa de una ruta específica en la app web
 * @param path - Ruta relativa en la app web (ej: '/auth/login', '/cliente-tecnico')
 */
export function getAppWebUrlFor(path: string): string {
  const baseUrl = getAppWebUrl();
  // Asegurarse de que el path empiece con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * URLs comunes de la app web para facilitar el uso
 */
export const APP_WEB_URLS = {
  home: () => getAppWebUrlFor('/'),
  login: () => getAppWebUrlFor('/auth/login'),
  register: () => getAppWebUrlFor('/auth/register'),
  signup: () => getAppWebUrlFor('/auth/register'),
  clienteTecnico: () => getAppWebUrlFor('/cliente-tecnico'),
} as const;
