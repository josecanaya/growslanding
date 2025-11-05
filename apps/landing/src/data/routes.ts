/**
 * Centralized route definitions for GROWS platform
 * Single source of truth for all application routes
 */

export const routes = {
  // Home
  home: '/',
  landing: '/',
  
  // Auth
  auth: {
    base: '/auth',
    login: '/auth/login',
    signup: '/auth/signup',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  // Client pages
  clientes: {
    base: '/clientes',
    dashboard: '/clientes/dashboard',
    obras: '/clientes/obras',
    tareas: '/clientes/tareas',
    cuadrillas: '/clientes/cuadrillas',
    notificaciones: '/clientes/notificaciones',
    calendario: '/clientes/calendario',
    cuenta: '/clientes/cuenta',
  },

  // Socio pages
  socios: {
    base: '/socios',
    panel: '/socios/panel',
    tareas: '/socios/tareas',
    miCuadrilla: '/socios/mi-cuadrilla',
    notificaciones: '/socios/notificaciones',
    perfil: '/socios/perfil',
  },

  // Sistema pages
  sistema: {
    base: '/sistema',
    reputacion: '/sistema/sistema-reputacion',
    dashboard: '/sistema/dashboard',
    reportes: '/sistema/reportes',
  },

  // Role specific pages
  roles: {
    arquitecto: '/es/roles/arquitecto-tecnico',
    socio: '/es/roles/socio-constructor',
  },

  // API endpoints
  api: {
    leads: '/api/leads',
  },

  // External
  external: {
    app: process.env.NEXT_PUBLIC_APP_URL || 'https://grows.app',
    docs: 'https://docs.grows.app',
    blog: 'https://blog.grows.app',
  },
} as const;

// Helper function to get full URL
export function getFullUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `${routes.external.app}${path}`;
}

// Helper function to get locale-specific route
export function getLocalizedRoute(route: string, locale: string = 'es'): string {
  // For now, all routes are in Spanish
  // In the future, implement proper i18n routing
  return route.replace('/es/', `/${locale}/`);
}

