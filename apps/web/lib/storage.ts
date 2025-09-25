import { randomUUID } from 'node:crypto';
import { supabase } from './supabase';

type UploadResult = {
  path: string;
};

function decodeDataUrl(dataUrl: string) {
  const match = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/u.exec(dataUrl ?? '');
  if (!match?.groups) {
    throw new Error('Formato de media inválido');
  }

  const { mime, data } = match.groups;
  const buffer = Buffer.from(data, 'base64');
  return { mime, buffer };
}

async function uploadToBucket(bucket: string, dataUrl: string): Promise<UploadResult> {
  const { mime, buffer } = decodeDataUrl(dataUrl);
  const extension = mime.split('/')[1] ?? 'bin';
  const fileName = `${randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, { contentType: mime, upsert: false });

  if (error || !data) {
    throw new Error(`No se pudo subir el archivo: ${error?.message ?? 'desconocido'}`);
  }

  return { path: data.path };
}

export async function uploadPhoto(dataUrl: string) {
  return uploadToBucket('photos', dataUrl);
}

export async function uploadSignature(dataUrl: string) {
  return uploadToBucket('signatures', dataUrl);
}

export async function uploadActaPdf(pdfBytes: Uint8Array, path: string) {
  const targetPath = path.startsWith('actas/') ? path : `actas/${path}`;
  const { data, error } = await supabase.storage
    .from('actas')
    .upload(targetPath.replace(/^actas\//, ''), pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error || !data) {
    throw new Error(`No se pudo guardar el PDF del acta: ${error?.message ?? 'desconocido'}`);
  }

  return { path: `actas/${data.path}` };
}
