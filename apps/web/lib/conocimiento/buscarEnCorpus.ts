import fs from 'node:fs';
import path from 'node:path';
import { resolveConocimientoRoot } from '@/lib/conocimiento/paths';

export type CorpusHit = { file: string; excerpt: string };

const STOP = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'al', 'y', 'o', 'que', 'qué',
  'como', 'cómo', 'para', 'con', 'por', 'en', 'es', 'me', 'mi', 'se', 'si', 'no',
  'hay', 'the', 'a', 'vos', 'quiero', 'necesito', 'hacer', 'sobre', 'este', 'esta',
]);

/** Archivos clave si no hay disco local (p. ej. Vercel). */
const PACK_REMOTO = [
  '01_construccion/09_arquitectura/2026-08-19_como-conversar-arquitectura.md',
  '01_construccion/09_arquitectura/2026-08-19_tipologias-vivienda.md',
  '01_construccion/09_arquitectura/2026-08-19_programa-servido-servidor.md',
  '01_construccion/09_arquitectura/2026-08-19_el-corte-manda.md',
  '01_construccion/09_arquitectura/2026-08-19_luz-orientacion-clima.md',
  '00_grows/2026-08-18_atomo-grafo-vivo.md',
  '00_grows/2026-08-18_modelo-chat-mcp-horizonte.md',
];

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/i)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !STOP.has(w));
}

function walkMd(dir: string, acc: string[], depth = 0): void {
  if (depth > 6 || acc.length > 160) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, acc, depth + 1);
    else if (e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('_')) acc.push(p);
  }
}

function excerptAround(body: string, words: string[]): string {
  const lower = body.toLowerCase();
  let idx = -1;
  for (const w of words) {
    idx = lower.indexOf(w);
    if (idx >= 0) break;
  }
  if (idx < 0) idx = 0;
  const start = Math.max(0, body.lastIndexOf('\n', idx - 1) + 1);
  return body.slice(start, start + 900).replace(/\s+/g, ' ').trim();
}

function scoreText(hay: string, words: string[]): number {
  let score = 0;
  for (const w of words) {
    if (!hay.includes(w)) continue;
    score += 2;
    if (hay.includes(` ${w} `) || hay.startsWith(w)) score += 1;
  }
  if (hay.includes('arquitectura') || hay.includes('tipolog')) score += 0.5;
  return score;
}

function rankDocs(
  docs: Array<{ file: string; raw: string }>,
  words: string[],
  limit: number,
): CorpusHit[] {
  const scored: Array<{ file: string; score: number; excerpt: string }> = [];
  for (const d of docs) {
    const hay = `${d.file} ${d.raw}`.toLowerCase();
    const score = scoreText(hay, words);
    if (score < 2) continue;
    scored.push({ file: d.file, score, excerpt: excerptAround(d.raw, words) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ file, excerpt }) => ({ file, excerpt }));
}

async function packDesdeGithub(words: string[], limit: number): Promise<CorpusHit[]> {
  const repo =
    process.env.GROWS_CONOCIMIENTO_GITHUB?.trim() || 'josecanaya/grows';
  const base = `https://raw.githubusercontent.com/${repo}/main/corpus`;
  const docs: Array<{ file: string; raw: string }> = [];
  await Promise.all(
    PACK_REMOTO.map(async (rel) => {
      try {
        const res = await fetch(`${base}/${rel}`);
        if (!res.ok) return;
        const raw = await res.text();
        if (raw.length > 2) docs.push({ file: rel, raw });
      } catch {
        /* ignore */
      }
    }),
  );
  return rankDocs(docs, words, limit);
}

export function buscarEnCorpus(pregunta: string, limit = 3): CorpusHit[] {
  const root = resolveConocimientoRoot();
  const words = tokens(pregunta);
  if (words.length === 0) return [];

  if (root) {
    const corpus = path.join(root, 'corpus');
    if (fs.existsSync(corpus)) {
      const files: string[] = [];
      walkMd(corpus, files);
      const docs: Array<{ file: string; raw: string }> = [];
      for (const file of files) {
        try {
          const raw = fs.readFileSync(file, 'utf8');
          if (raw.length > 80_000) continue;
          docs.push({
            file: path.relative(corpus, file).replace(/\\/g, '/'),
            raw,
          });
        } catch {
          continue;
        }
      }
      return rankDocs(docs, words, limit);
    }
  }
  return [];
}

/** Local sync + remoto async (Vercel). */
export async function buscarEnCorpusAsync(pregunta: string, limit = 3): Promise<CorpusHit[]> {
  const local = buscarEnCorpus(pregunta, limit);
  if (local.length > 0) return local;
  const words = tokens(pregunta);
  if (words.length === 0) return [];
  return packDesdeGithub(words, limit);
}
