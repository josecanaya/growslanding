/**
 * Configuración centralizada para URLs de la aplicación
 */

/**
 * Obtiene la URL base de la aplicación web (app principal de GROWS)
 * En desarrollo, usa localhost:3000 (puerto por defecto de Next.js)
 * En producción, usa la variable de entorno NEXT_PUBLIC_APP_URL
 */
export function getAppWebUrl(): string {
  // PRIORIDAD 1: Si estamos en desarrollo (NODE_ENV === 'development'), usar localhost
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // PRIORIDAD 2: Si estamos en cliente y en localhost, usar localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '0.0.0.0' ||
                        window.location.hostname.includes('localhost');
    
    if (isLocalhost || isDevelopment) {
      // En desarrollo, la app web normalmente corre en el puerto 3000
      // Ajusta este puerto si tu configuración es diferente
      return 'http://localhost:3000';
    }
  }
  
  // PRIORIDAD 3: Si estamos en servidor y es desarrollo, usar localhost
  if (isDevelopment) {
    return 'http://localhost:3000';
  }
  
  // PRIORIDAD 4: Si hay una variable de entorno definida, usarla
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // PRIORIDAD 5: Default de producción (solo si realmente estamos en producción)
  return 'http://app.grows.com.ar';
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
