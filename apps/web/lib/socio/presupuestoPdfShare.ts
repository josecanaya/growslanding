import { generarPresupuestoPDFBytes } from '@/lib/pdf/generarPresupuestoPDF';

type ObraPdf = {
  id: string;
  name: string;
  direccion_completa?: string | null;
  cantidad_plantas?: number | null;
  fecha_inicio?: string | null;
  cliente?: string | null;
};

type PresupuestoPdfInput = Parameters<typeof generarPresupuestoPDFBytes>[0];

export function buildPresupuestoPdfBlob(params: Omit<PresupuestoPdfInput, 'fechaGeneracion'>): Blob | null {
  const bytes = generarPresupuestoPDFBytes({
    ...params,
    fechaGeneracion: new Date(),
  });
  if (!bytes) return null;
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

export function downloadPresupuestoPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function sharePresupuestoPdf(
  blob: Blob,
  filename: string,
  titulo: string,
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: titulo,
      text: titulo,
      files: [file],
    });
    return 'shared';
  }
  downloadPresupuestoPdf(blob, filename);
  return 'downloaded';
}

export function openWhatsAppPresupuesto(texto: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
