import fs from 'node:fs';
import path from 'node:path';

export type PatronAnonimo = {
  evento: 'aceptada' | 'realizada';
  transform_kind: string | null;
  verbo: string;
  estado_a: string | null;
  estado_b: string | null;
};

function sanitizeTitle(value: string | null | undefined): string | null {
  if (!value) return null;
  const t = value.replace(/\s+/g, ' ').trim().slice(0, 120);
  return t.length > 0 ? t : null;
}

function slug(value: string): string {
  const s = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return s || 'patron';
}

export function resolveConocimientoRoot(): string | null {
  const fromEnv = process.env.GROWS_CONOCIMIENTO_ROOT?.trim();
  if (fromEnv) return fromEnv;
  const candidates = [
    path.resolve(process.cwd(), '../../../../grows-conocimiento'),
    path.resolve(process.cwd(), '../../../grows-conocimiento'),
    'C:\\Users\\Usuario\\Desktop\\Jose\\grows-conocimiento',
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'corpus', '02_patrones'))) return c;
  }
  return null;
}

export function formatPatronMarkdown(patron: PatronAnonimo, fechaIso: string): string {
  const dia = fechaIso.slice(0, 10);
  return [
    `# ${dia} — ${patron.verbo}`,
    '',
    `- evento: ${patron.evento}`,
    `- transform_kind: ${patron.transform_kind ?? 'desconocido'}`,
    `- A: ${patron.estado_a ?? '—'}`,
    `- T: ${patron.verbo}`,
    `- B: ${patron.estado_b ?? '—'}`,
    '',
  ].join('\n');
}

/** Append-only. Nunca ids de obra/org ni montos. No tira si el repo hermano no está. */
export function appendPatronAnonimo(patron: PatronAnonimo): { ok: boolean; path?: string } {
  const root = resolveConocimientoRoot();
  if (!root) return { ok: false };
  const dir = path.join(root, 'corpus', '02_patrones');
  try {
    fs.mkdirSync(dir, { recursive: true });
    const now = new Date().toISOString();
    const stamp = now.replace(/[:.]/g, '-').slice(0, 19);
    const verbo = sanitizeTitle(patron.verbo) ?? 'transformacion';
    const file = path.join(dir, `${stamp}_${slug(verbo)}.md`);
    fs.writeFileSync(
      file,
      formatPatronMarkdown(
        {
          evento: patron.evento,
          transform_kind: patron.transform_kind,
          verbo,
          estado_a: sanitizeTitle(patron.estado_a),
          estado_b: sanitizeTitle(patron.estado_b),
        },
        now,
      ),
      'utf8',
    );
    return { ok: true, path: file };
  } catch {
    return { ok: false };
  }
}
