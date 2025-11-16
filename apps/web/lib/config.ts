export const IS_DEV_MODE =
  process.env.NEXT_PUBLIC_DEV_MODE?.toLowerCase() === 'true';

/**
 * Obtiene la URL base de la aplicación web
 * En desarrollo, usa localhost:3000
 * En producción, siempre usa app.grows.com.ar (no window.location.origin)
 * para asegurar que los callbacks de OAuth vayan al dominio correcto
 */
export function getAppWebUrl(): string {
  // Si hay una variable de entorno definida, usarla (útil para Vercel previews)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // En desarrollo o localhost, usar localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '0.0.0.0' ||
                        window.location.hostname.includes('localhost');
    
    if (isLocalhost) {
      return 'http://localhost:3000';
    }
  }
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    return 'http://localhost:3000';
  }
  
  // En producción, SIEMPRE usar app.grows.com.ar
  // Esto asegura que los callbacks de OAuth vayan al dominio correcto
  // incluso si el usuario está en grows.com.ar (landing)
  return 'https://app.grows.com.ar';
}