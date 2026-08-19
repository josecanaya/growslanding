import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveConocimientoRoot } from '@/lib/proyecto-vivo/orquestador/appendPatronAnonimo';

const DEFAULT_PYTHON = 'C:\\Python312\\python.exe';

export function conocimientoGraphPath(): string | null {
  const root = resolveConocimientoRoot();
  if (!root) return null;
  const graph = path.join(root, 'graphify-out', 'graph.json');
  return fs.existsSync(graph) ? graph : null;
}

/** Consulta Graphify sobre grows-conocimiento. No usa wallet ni FSM. */
export function queryConocimientoGraphify(pregunta: string): Promise<{ ok: boolean; text: string }> {
  const root = resolveConocimientoRoot();
  if (!root) {
    return Promise.resolve({
      ok: false,
      text: 'No está la carpeta grows-conocimiento. Definí GROWS_CONOCIMIENTO_ROOT.',
    });
  }
  const python = process.env.GROWS_GRAPHIFY_PYTHON?.trim() || DEFAULT_PYTHON;
  const q = pregunta.replace(/\s+/g, ' ').trim().slice(0, 500);

  return new Promise((resolve) => {
    const child = spawn(python, ['-m', 'graphify', 'query', q], {
      cwd: root,
      windowsHide: true,
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, text: 'La consulta al conocimiento tardó demasiado.' });
    }, 40000);
    child.stdout.on('data', (d) => {
      out += String(d);
    });
    child.stderr.on('data', (d) => {
      err += String(d);
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ ok: false, text: e.message });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const text = (out.trim() || err.trim() || 'Sin respuesta del grafo.').slice(0, 8000);
      resolve({ ok: code === 0 && out.trim().length > 0, text });
    });
  });
}
