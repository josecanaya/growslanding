import fs from 'node:fs';
import path from 'node:path';
import { resolveConocimientoRoot } from '@/lib/conocimiento/paths';

export type CorpusHit = { file: string; excerpt: string };

const STOP = new Set([
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'de',
  'del',
  'al',
  'y',
  'o',
  'que',
  'qué',
  'como',
  'cómo',
  'para',
  'con',
  'por',
  'en',
  'es',
  'me',
  'mi',
  'se',
  'si',
  'no',
  'hay',
  'the',
  'a',
]);

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9áéíóúñ]+/i)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !STOP.has(w));
}

function walkMd(dir: string, acc: string[], depth = 0): void {
  if (depth > 6 || acc.length > 120) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, acc, depth + 1);
    else if (e.isFile() && e.name.endsWith('.md')) acc.push(p);
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
  const start = Math.max(0, idx - 80);
  return body.slice(start, start + 700).replace(/\s+/g, ' ').trim();
}

export function buscarEnCorpus(pregunta: string, limit = 2): CorpusHit[] {
  const root = resolveConocimientoRoot();
  if (!root) return [];
  const corpus = path.join(root, 'corpus');
  if (!fs.existsSync(corpus)) return [];
  const words = tokens(pregunta);
  if (words.length === 0) return [];

  const files: string[] = [];
  walkMd(corpus, files);
  const scored: Array<{ file: string; score: number; excerpt: string }> = [];
  for (const file of files) {
    let raw = '';
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (raw.length > 80_000) continue;
    const hay = `${path.basename(file)} ${raw}`.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (hay.includes(w)) score += 1;
    }
    if (score === 0) continue;
    scored.push({
      file: path.relative(corpus, file).replace(/\\/g, '/'),
      score,
      excerpt: excerptAround(raw, words),
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ file, excerpt }) => ({ file, excerpt }));
}
