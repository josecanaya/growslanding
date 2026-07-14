import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectXmlToTasks } from '@/lib/obra-check/xmlAdapter';

// Reutiliza un template real de canvas (formato MS Project) ya versionado en el repo.
const XML_PATH = resolve(
  __dirname,
  '../../../public/canvas-templates/casa/casa_1p_2amb_chica.xml',
);

describe('projectXmlToTasks', () => {
  it('convierte un Project XML real a tareas hoja con dependencias', () => {
    const xml = readFileSync(XML_PATH, 'utf-8');
    const res = projectXmlToTasks(xml);

    expect(res.tasks.length).toBeGreaterThan(0);
    expect(res.tasks.every((t) => t.origen === 'project_xml')).toBe(true);

    // Todas las tareas hoja tienen id único.
    const ids = new Set(res.tasks.map((t) => t.id));
    expect(ids.size).toBe(res.tasks.length);

    // Al menos una tarea trae precedencias resueltas a ids existentes.
    const conPred = res.tasks.filter((t) => t.predecesoras.length > 0);
    expect(conPred.length).toBeGreaterThan(0);
    for (const t of conPred) {
      for (const p of t.predecesoras) {
        expect(ids.has(p)).toBe(true);
      }
    }

    // El nombre del proyecto se propaga.
    expect(res.projectName).toContain('Casa');
  });
});
