/** Public pages stay readable while signed out, including after client navigation. */
export function isPublicPath(path: string): boolean {
  return path === '/' || ['/auth', '/obra-check', '/inversores', '/home', '/acceder']
    .some((prefix) => path === prefix || path.startsWith(prefix + '/'));
}

export function safeReturnPath(value: string | null | undefined, fallback = '/inversores'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return fallback;
  try {
    const url = new URL(value, 'https://grows.local');
    if (url.origin !== 'https://grows.local' || url.pathname.startsWith('/auth')) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
