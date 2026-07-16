import { describe, it, expect } from 'vitest';
import { sugerirBloques } from '@/lib/obra-check/sugerirBloques';
import type { ObraCheckTask } from '@/lib/obra-check/types';

function t(id: string, rubro: string | null, orden: number): ObraCheckTask {
  return {
    id,
    nombre: id,
    fase: null,
    rubro,
    duracionDias: 1,
    inicio: null,
    fin: null,
    predecesoras: [],
    responsableLabel: null,
    blockId: null,
    origen: 'chat',
    orden,
  };
}

describe('sugerirBloques', () => {
  it('agrupa tareas consecutivas del mismo rubro', () => {
    const tasks = [
      t('a', 'mamposteria', 0),
      t('b', 'mamposteria', 1),
      t('c', 'pintura', 2),
    ];
    const blocks = sugerirBloques(tasks);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.taskIds).toEqual(['a', 'b']);
    expect(blocks[0]!.nombre).toBe('Mampostería');
    expect(blocks[1]!.taskIds).toEqual(['c']);
  });

  it('parte bloques de más de 8 tareas', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => t(`e${i}`, 'instalacion_electrica', i));
    const blocks = sugerirBloques(tasks);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.taskIds).toHaveLength(8);
    expect(blocks[1]!.taskIds).toHaveLength(2);
  });

  it('rubro null cae en bloque Varios', () => {
    const blocks = sugerirBloques([t('x', null, 0)]);
    expect(blocks[0]!.nombre).toBe('Varios');
    expect(blocks[0]!.rubro).toBeNull();
  });
});
