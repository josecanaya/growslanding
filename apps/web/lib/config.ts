export const IS_DEV_MODE =
  process.env.NEXT_PUBLIC_DEV_MODE?.toLowerCase() === 'true';

/**
 * Obtiene la URL base de la aplicación web
 * En desarrollo, usa localhost:3000
 * En producción, usa app.grows.com.ar o la variable de entorno NEXT_PUBLIC_APP_URL
 */
export function getAppWebUrl(): string {
  // En desarrollo, usar localhost
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '0.0.0.0' ||
                        window.location.hostname.includes('localhost');
    
    if (isLocalhost || isDevelopment) {
      return 'http://localhost:3000';
    }
  }
  
  if (isDevelopment) {
    return 'http://localhost:3000';
  }
  
  // Si hay una variable de entorno definida, usarla
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Default de producción: app.grows.com.ar
  return 'https://app.grows.com.ar';
}