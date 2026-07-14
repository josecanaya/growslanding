import { describe, it, expect } from 'vitest';
import { ordenarTareas } from '@/lib/obra-check/ordenar';
import type { ObraCheckTask } from '@/lib/obra-check/types';

function task(id: string, over: Partial<ObraCheckTask> = {}): ObraCheckTask {
  return {
    id,
    nombre: over.nombre ?? id,
    rubro: over.rubro ?? null,
    duracionDias: over.duracionDias ?? 1,
    inicio: over.inicio ?? null,
    fin: over.fin ?? null,
    predecesoras: over.predecesoras ?? [],
    responsableLabel: null,
    blockId: null,
    origen: 'chat',
    ...over,
  };
}

describe('ordenarTareas', () => {
  it('con dependencias calcula CPM y camino crítico', () => {
    const tasks: ObraCheckTask[] = [
      task('A', { duracionDias: 2 }),
      task('B', { duracionDias: 3, predecesoras: ['A'] }),
      task('C', { duracionDias: 1, predecesoras: ['A'] }),
      task('D', { duracionDias: 2, predecesoras: ['B', 'C'] }),
    ];

    const res = ordenarTareas(tasks);

    // Camino crítico A→B→D = 2+3+2 = 7 días.
    expect(res.cpm.duracionTotalDias).toBe(7);
    expect(res.cpm.tareasCriticas).toBe(3);

    const byId = new Map(res.tasks.map((t) => [t.id, t]));
    expect(byId.get('A')!.esCritica).toBe(true);
    expect(byId.get('B')!.esCritica).toBe(true);
    expect(byId.get('D')!.esCritica).toBe(true);
    expect(byId.get('C')!.esCritica).toBe(false); // tiene holgura

    // Orden por Early Start: A primero, D último.
    expect(res.tasks[0]!.id).toBe('A');
    expect(res.tasks[res.tasks.length - 1]!.id).toBe('D');
    expect(res.warnings).toHaveLength(0);
  });

  it('sin dependencias ordena por secuencia constructiva y avisa', () => {
    const tasks: ObraCheckTask[] = [
      task('pint', { rubro: 'pintura' }),
      task('fund', { rubro: 'fundaciones' }),
      task('mamp', { rubro: 'mamposteria' }),
    ];

    const res = ordenarTareas(tasks);

    expect(res.tasks.map((t) => t.id)).toEqual(['fund', 'mamp', 'pint']);
    expect(res.cpm.duracionTotalDias).toBe(0);
    expect(res.warnings.some((w) => w.kind === 'sin_dependencias')).toBe(true);
  });

  it('con ciclo hace fallback y avisa', () => {
    const tasks: ObraCheckTask[] = [
      task('X', { predecesoras: ['Y'] }),
      task('Y', { predecesoras: ['X'] }),
    ];

    const res = ordenarTareas(tasks);
    expect(res.warnings.some((w) => w.kind === 'ciclo_detectado')).toBe(true);
    expect(res.tasks).toHaveLength(2);
  });

  it('asigna cada tarea a un bloque', () => {
    const tasks: ObraCheckTask[] = [
      task('a', { rubro: 'pintura', duracionDias: 1 }),
      task('b', { rubro: 'pintura', duracionDias: 1, predecesoras: ['a'] }),
    ];
    const res = ordenarTareas(tasks);
    expect(res.blocks.length).toBeGreaterThan(0);
    expect(res.tasks.every((t) => t.blockId !== null)).toBe(true);
  });
});
