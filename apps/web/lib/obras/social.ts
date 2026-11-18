import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export type ObraSocial = { follows: number; supports: number; comments: number; following: boolean; supported: boolean };
export type ObraComment = { id: string; authorName: string; authorRole: string | null; body: string; createdAt: string };

export const socialActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.enum(['follow', 'unfollow', 'support', 'unsupport']) }),
  z.object({ action: z.literal('comment'), body: z.string().trim().min(1).max(1000) }),
]);

export const emptySocial: ObraSocial = { follows: 0, supports: 0, comments: 0, following: false, supported: false };

// Las tablas sociales todavía no están en los tipos generados.
function db() {
  return createServiceSupabaseClient() as unknown as SupabaseClient;
}

/** Contadores y estado del usuario para varias obras. Devuelve null si las tablas no existen o falla la consulta. */
export async function loadSocial(obraIds: string[], userId: string | null): Promise<Record<string, ObraSocial> | null> {
  if (!obraIds.length) return {};
  try {
    const client = db();
    const [follows, supports, comments] = await Promise.all([
      client.from('obra_follows').select('obra_id, user_id').in('obra_id', obraIds),
      client.from('obra_supports').select('obra_id, user_id').in('obra_id', obraIds),
      client.from('obra_comments').select('obra_id').in('obra_id', obraIds),
    ]);
    if (follows.error || supports.error || comments.error) return null;
    const result: Record<string, ObraSocial> = Object.fromEntries(obraIds.map((id) => [id, { ...emptySocial }]));
    for (const row of follows.data ?? []) {
      const item = result[row.obra_id];
      if (!item) continue;
      item.follows += 1;
      if (row.user_id === userId) item.following = true;
    }
    for (const row of supports.data ?? []) {
      const item = result[row.obra_id];
      if (!item) continue;
      item.supports += 1;
      if (row.user_id === userId) item.supported = true;
    }
    for (const row of comments.data ?? []) if (result[row.obra_id]) result[row.obra_id].comments += 1;
    return result;
  } catch {
    return null;
  }
}

export async function loadComments(obraId: string): Promise<ObraComment[] | null> {
  try {
    const { data, error } = await db().from('obra_comments')
      .select('id, author_name, author_role, body, created_at')
      .eq('obra_id', obraId).order('created_at', { ascending: true }).limit(200);
    if (error) return null;
    return (data ?? []).map((row) => ({ id: row.id, authorName: row.author_name, authorRole: row.author_role, body: row.body, createdAt: row.created_at }));
  } catch {
    return null;
  }
}

type Author = { id: string; name: string; role: string | null };

export async function applySocialAction(obraId: string, author: Author, input: z.infer<typeof socialActionSchema>): Promise<ObraComment | null> {
  const client = db();
  const key = { obra_id: obraId, user_id: author.id };
  let error: { message: string } | null = null;
  switch (input.action) {
    case 'follow': ({ error } = await client.from('obra_follows').upsert(key, { ignoreDuplicates: true })); break;
    case 'unfollow': ({ error } = await client.from('obra_follows').delete().match(key)); break;
    case 'support': ({ error } = await client.from('obra_supports').upsert(key, { ignoreDuplicates: true })); break;
    case 'unsupport': ({ error } = await client.from('obra_supports').delete().match(key)); break;
    case 'comment': {
      const { data, error: insertError } = await client.from('obra_comments')
        .insert({ ...key, author_name: author.name, author_role: author.role, body: input.body })
        .select('id, author_name, author_role, body, created_at').single();
      if (insertError) throw new Error(insertError.message);
      return { id: data.id, authorName: data.author_name, authorRole: data.author_role, body: data.body, createdAt: data.created_at };
    }
  }
  if (error) throw new Error(error.message);
  return null;
}

export function authorName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const raw = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario';
  return String(raw).trim().slice(0, 120) || 'Usuario';
}
