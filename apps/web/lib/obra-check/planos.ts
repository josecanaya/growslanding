import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const OBRA_CHECK_PLANOS_BUCKET = 'obra_check_planos';
export const MAX_PLANO_BYTES = 12 * 1024 * 1024;
export const ALLOWED_PLANO_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export type PlanoRow = {
  id: string;
  file_name: string;
  storage_path: string;
  mime: string;
  size_bytes: number;
  created_at: string;
};

async function ensureBucket(supabase: SupabaseClient) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets ?? []).some((b) => b.name === OBRA_CHECK_PLANOS_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(OBRA_CHECK_PLANOS_BUCKET, { public: false });
  }
}

export async function uploadObraCheckPlano(params: {
  sessionId: string;
  fileName: string;
  mime: string;
  buffer: Buffer;
}): Promise<{ id: string; fileName: string; path: string }> {
  if (!ALLOWED_PLANO_MIME.has(params.mime)) {
    throw new Error('Formato no permitido. Usá PDF, JPG, PNG o WEBP.');
  }
  if (params.buffer.length > MAX_PLANO_BYTES) {
    throw new Error('El archivo supera 12 MB.');
  }

  const supabase = createServiceSupabaseClient();
  await ensureBucket(supabase);

  const safeName = params.fileName.replace(/[^\w.\- ()áéíóúñÁÉÍÓÚÑ]/gi, '_').slice(0, 120);
  const ext = safeName.includes('.') ? safeName.split('.').pop() : params.mime.split('/')[1] || 'bin';
  const path = `${params.sessionId}/${randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(OBRA_CHECK_PLANOS_BUCKET)
    .upload(path, params.buffer, { contentType: params.mime, upsert: false });
  if (upErr) throw new Error(`No se pudo subir el plano: ${upErr.message}`);

  const db = supabase as unknown as SupabaseClient;
  const { data, error } = await db
    .from('obra_check_planos')
    .insert({
      session_id: params.sessionId,
      file_name: safeName || `plano.${ext}`,
      storage_path: path,
      mime: params.mime,
      size_bytes: params.buffer.length,
    })
    .select('id, file_name, storage_path')
    .single();

  if (error || !data) {
    await supabase.storage.from(OBRA_CHECK_PLANOS_BUCKET).remove([path]);
    throw new Error(error?.message ?? 'No se pudo registrar el plano.');
  }

  const row = data as { id: string; file_name: string; storage_path: string };
  return { id: row.id, fileName: row.file_name, path: row.storage_path };
}

export async function listObraCheckPlanos(
  db: SupabaseClient,
  sessionId: string,
): Promise<PlanoRow[]> {
  const { data } = await db
    .from('obra_check_planos')
    .select('id, file_name, storage_path, mime, size_bytes, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  return (data ?? []) as PlanoRow[];
}

export async function signedPlanoUrls(
  planos: PlanoRow[],
  expiresSec = 60 * 60 * 24 * 7,
): Promise<Array<{ id: string; nombre: string; mime: string; url: string; sizeBytes: number }>> {
  const supabase = createServiceSupabaseClient();
  const out: Array<{ id: string; nombre: string; mime: string; url: string; sizeBytes: number }> = [];
  for (const p of planos) {
    const { data } = await supabase.storage
      .from(OBRA_CHECK_PLANOS_BUCKET)
      .createSignedUrl(p.storage_path, expiresSec);
    if (data?.signedUrl) {
      out.push({
        id: p.id,
        nombre: p.file_name,
        mime: p.mime,
        url: data.signedUrl,
        sizeBytes: p.size_bytes,
      });
    }
  }
  return out;
}

export async function deleteObraCheckPlano(
  db: SupabaseClient,
  sessionId: string,
  planoId: string,
): Promise<void> {
  const { data } = await db
    .from('obra_check_planos')
    .select('id, storage_path')
    .eq('id', planoId)
    .eq('session_id', sessionId)
    .maybeSingle();
  if (!data) return;
  const row = data as { id: string; storage_path: string };
  const supabase = createServiceSupabaseClient();
  await supabase.storage.from(OBRA_CHECK_PLANOS_BUCKET).remove([row.storage_path]);
  await db.from('obra_check_planos').delete().eq('id', planoId).eq('session_id', sessionId);
}
