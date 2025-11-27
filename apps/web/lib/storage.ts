import { randomUUID } from 'node:crypto';
import { createServiceSupabaseClient } from './supabase-server';

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
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, { contentType: mime, upsert: false });

  if (error || !data) {
    throw new Error(`No se pudo subir el archivo: ${error?.message ?? 'desconocido'}`);
  }

  return { path: data.path };
}

export async function uploadPhoto(dataUrl: string) {
  // El bucket se llama 'evidencias' según el contexto del proyecto
  return uploadToBucket('evidencias', dataUrl);
}

export async function uploadSignature(dataUrl: string) {
  return uploadToBucket('signatures', dataUrl);
}

export async function uploadActaPdf(pdfBytes: Uint8Array, path: string) {
  const targetPath = path.startsWith('actas/') ? path : `actas/${path}`;
  const supabase = createServiceSupabaseClient();
  const uploadToActas = async () =>
    supabase.storage
      .from('actas')
      .upload(targetPath.replace(/^actas\//, ''), pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

  let data;
  let error;
  ({ data, error } = await uploadToActas());

  // Si falta el bucket, intentar crearlo y reintentar una vez
  if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('bucket not found')) {
    try {
      await supabase.storage.createBucket('actas', { public: false });
      ({ data, error } = await uploadToActas());
    } catch (e) {
      // Si falla la creación, mantener el error original
    }
  }

  if (error || !data) {
    throw new Error(`No se pudo guardar el PDF del acta: ${error?.message ?? 'desconocido'}`);
  }

  return { path: `actas/${data.path}` };
}
