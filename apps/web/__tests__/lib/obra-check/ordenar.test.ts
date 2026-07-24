import { describe, it, expect } from 'vitest';
import { ordenarTareas } from '@/lib/obra-check/ordenar';
import type { ObraCheckTask } from '@/lib/obra-check/types';

function task(id: string, over: Partial<ObraCheckTask> = {}): ObraCheckTask {
  return {
    id,
    nombre: over.nombre ?? id,
    fase: over.fase ?? null,
    rubro: over.rubro ?? null,
    duracionDias: over.duracionDias ?? 1,
    unidad: over.unidad ?? 'm2',
    cantidad: over.cantidad ?? null,
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

  it('encadena fases: el camino crítico atraviesa toda la obra y la duración se suma', () => {
    // Estructura: E1(3) → E2(2); Instalaciones: I1(4) e I2(1) sin deps declaradas;
    // Terminaciones: T1(2). Las fases van en secuencia: Estructura → Instalaciones → Terminaciones.
    const tasks: ObraCheckTask[] = [
      task('E1', { fase: 'Estructura', duracionDias: 3 }),
      task('E2', { fase: 'Estructura', duracionDias: 2, predecesoras: ['E1'] }),
      task('I1', { fase: 'Instalaciones', duracionDias: 4 }),
      task('I2', { fase: 'Instalaciones', duracionDias: 1 }),
      task('T1', { fase: 'Terminaciones', duracionDias: 2 }),
    ];

    const res = ordenarTareas(tasks);

    // Duración total = 5 (Estructura) + 4 (rama larga de Instalaciones) + 2 (Terminaciones) = 11.
    expect(res.cpm.duracionTotalDias).toBe(11);

    const byId = new Map(res.tasks.map((t) => [t.id, t]));
    // El crítico cruza las TRES fases: E1→E2→I1→T1. I2 tiene holgura.
    expect(byId.get('E1')!.esCritica).toBe(true);
    expect(byId.get('E2')!.esCritica).toBe(true);
    expect(byId.get('I1')!.esCritica).toBe(true);
    expect(byId.get('T1')!.esCritica).toBe(true);
    expect(byId.get('I2')!.esCritica).toBe(false);

    // Las predecesoras persistidas siguen siendo solo intra-fase (las virtuales no se guardan).
    expect(byId.get('I1')!.predecesoras).toEqual([]);
    expect(byId.get('T1')!.predecesoras).toEqual([]);

    // Orden: Estructura antes que Instalaciones antes que Terminaciones.
    const orderIds = res.tasks.map((t) => t.id);
    expect(orderIds.indexOf('E2')).toBeLessThan(orderIds.indexOf('I1'));
    expect(orderIds.indexOf('I1')).toBeLessThan(orderIds.indexOf('T1'));
  });

  it('multi-fase sin dependencias declaradas: igual encadena por fases con warning', () => {
    const tasks: ObraCheckTask[] = [
      task('E1', { fase: 'Estructura', duracionDias: 3 }),
      task('T1', { fase: 'Terminaciones', duracionDias: 2 }),
    ];
    const res = ordenarTareas(tasks);
    expect(res.cpm.duracionTotalDias).toBe(5);
    expect(res.tasks.every((t) => t.esCritica)).toBe(true);
    expect(res.warnings.some((w) => w.kind === 'sin_dependencias')).toBe(true);
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
