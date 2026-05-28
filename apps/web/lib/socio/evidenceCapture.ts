/**
 * La cámara en móviles suele devolver `File` sin `type`, `application/octet-stream`
 * o nombres genéricos; la galería suele tener `image/jpeg`.
 * Sin esto, `file.type.startsWith('image/')` rechaza fotos válidas tomadas ahí mismo.
 */
export function fileLooksLikeImage(file: File): boolean {
  const t = String(file.type ?? '').toLowerCase();
  if (t.startsWith('image/')) return true;
  if (t === 'application/octet-stream' || t === 'binary/octet-stream') {
    const n = file.name || '';
    if (/\.(jpe?g|png|gif|webp|heic|heif|bmp|dng)$/i.test(n)) return true;
    return typeof file.size === 'number' && file.size > 0;
  }
  if (!t && typeof file.size === 'number' && file.size > 0) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|dng)$/i.test(file.name || '');
}
