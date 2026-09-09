export const MAX_CONTEXT_FILE_BYTES = 20 * 1024 * 1024;
const EXTENSIONS = new Set(['pdf','png','jpg','jpeg','webp','txt','md','csv','docx','xlsx','ifc','dwg','dxf']);
export function validateContextFile(file: { name: string; size: number }, category: string, description: string) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(category)) return 'Categoría inválida.';
  if (!file.size || file.size > MAX_CONTEXT_FILE_BYTES) return 'El archivo debe pesar entre 1 byte y 20 MB.';
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!EXTENSIONS.has(extension)) return 'Formato no admitido. Usá PDF, imagen, documento, plano o texto.';
  if (description.length > 4000) return 'La nota no puede superar 4000 caracteres.';
  return null;
}
export function contextStoragePath(url: string, obraId: string) {
  let path: string;
  try {
    if (url.startsWith('legajo://')) path = url.slice(9);
    else {
      const parsed = new URL(url);
      const marker = /^\/storage\/v1\/object\/(?:public|sign|authenticated)\/legajo\/(.+)$/;
      const match = parsed.pathname.match(marker);
      if (!match) return null;
      path = decodeURIComponent(match[1]);
    }
  } catch { return null; }
  if (!path.startsWith(`${obraId}/`) || path.includes('\\') || path.split('/').some((p) => !p || p === '.' || p === '..')) return null;
  return path;
}
