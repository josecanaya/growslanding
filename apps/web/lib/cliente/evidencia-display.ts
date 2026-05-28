/** URL usable en `<img>`: absoluta o path en bucket `evidencias`. */
export function evidenciaPublicUrl(
  raw: string | null | undefined,
  supabaseUrl?: string,
): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const base = (supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  if (!base) return t;
  const path = t.replace(/^\/+/, '');
  return `${base}/storage/v1/object/public/evidencias/${path}`;
}
