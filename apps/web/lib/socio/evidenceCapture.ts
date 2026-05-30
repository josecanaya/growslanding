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

function inferImageMime(file: File): string {
  const t = String(file.type ?? '').toLowerCase();
  if (t.startsWith('image/')) return t;
  const n = file.name || '';
  if (/\.png$/i.test(n)) return 'image/png';
  if (/\.webp$/i.test(n)) return 'image/webp';
  if (/\.gif$/i.test(n)) return 'image/gif';
  if (/\.(heic|heif)$/i.test(n)) return 'image/heic';
  return 'image/jpeg';
}

/**
 * Tras volver de la cámara nativa, el `File` del input puede quedar invalidado.
 * Leemos el buffer de inmediato y devolvemos una copia estable en memoria.
 */
export async function stabilizeImageFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  if (!buffer.byteLength) {
    throw new Error('La foto quedó vacía. Volvé a intentar.');
  }
  const mime = inferImageMime(file);
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const name =
    file.name && !/^image_\d+\.(jpg|jpeg)$/i.test(file.name)
      ? file.name
      : `camera-${Date.now()}.${ext}`;
  return new File([buffer], name, { type: mime, lastModified: Date.now() });
}
