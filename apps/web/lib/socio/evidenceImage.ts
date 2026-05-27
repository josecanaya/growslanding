import { fileLooksLikeImage } from '@/lib/socio/evidenceCapture';

/** Comprime JPEG; si el canvas falla (HEIC, etc.), devuelve data URL cruda. */
export async function fileToEvidenceDataUrl(file: File, maxWidth = 1200): Promise<string> {
  if (!fileLooksLikeImage(file)) {
    throw new Error('El archivo no es una imagen válida.');
  }

  const raw = await readFileAsDataUrl(file);

  try {
    const compressed = await compressDataUrl(raw, maxWidth);
    if (compressed.startsWith('data:image/')) {
      return compressed;
    }
  } catch {
    /* fallback abajo */
  }

  if (raw.startsWith('data:image/')) {
    return raw;
  }

  throw new Error('No se pudo procesar la imagen. Probá otra foto o usá galería.');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string' && result.startsWith('data:')) {
        resolve(result);
      } else {
        reject(new Error('No se pudo leer la imagen'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl: string, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto del canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('No se pudo decodificar la imagen'));
    img.src = dataUrl;
  });
}
