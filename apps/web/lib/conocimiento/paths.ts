import fs from 'node:fs';
import path from 'node:path';
import { resolveConocimientoRoot } from '@/lib/proyecto-vivo/orquestador/appendPatronAnonimo';

const DEFAULT_PYTHON = 'C:\\Python312\\python.exe';

export { resolveConocimientoRoot };

export function resolveConocimientoPython(): string {
  return process.env.GROWS_GRAPHIFY_PYTHON?.trim() || DEFAULT_PYTHON;
}

export function conocimientoGraphPath(): string | null {
  const root = resolveConocimientoRoot();
  if (!root) return null;
  const graph = path.join(root, 'graphify-out', 'graph.json');
  return fs.existsSync(graph) ? graph : null;
}
