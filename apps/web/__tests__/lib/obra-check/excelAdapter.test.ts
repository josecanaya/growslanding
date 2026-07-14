import { describe, it, expect } from 'vitest';
import { excelToTasks, parseDuracion, parseFecha, parsePredecesoras } from '@/lib/obra-check/excelAdapter';

describe('parsers de celda', () => {
  it('parseDuracion interpreta unidades', () => {
    expect(parseDuracion('5')).toBe(5);
    expect(parseDuracion('3 días')).toBe(3);
    expect(parseDuracion('2 semanas')).toBe(14);
    expect(parseDuracion('8 hs')).toBe(1);
    expect(parseDuracion(null)).toBeNull();
    expect(parseDuracion('sin dato')).toBeNull();
  });

  it('parseFecha normaliza dd/mm/yyyy e ISO', () => {
    expect(parseFecha('2026-07-14')).toBe('2026-07-14');
    expect(parseFecha('14/07/2026')).toBe('2026-07-14');
    expect(parseFecha('1/3/26')).toBe('2026-03-01');
    expect(parseFecha('no es fecha')).toBeNull();
  });

  it('parsePredecesoras extrae ids ignorando tipo/lag', () => {
    expect(parsePredecesoras('3;5')).toEqual(['3', '5']);
    expect(parsePredecesoras('3, 5')).toEqual(['3', '5']);
    expect(parsePredecesoras('2FS+3d')).toEqual(['2']);
    expect(parsePredecesoras(null)).toEqual([]);
  });
});

describe('excelToTasks', () => {
  it('detecta header, mapea columnas y resuelve predecesoras por nº de fila', () => {
    const rows: unknown[][] = [
      ['Plan de obra - Casa Belgrano', '', '', ''], // fila título
      ['Tarea', 'Duración (días)', 'Responsable', 'Predecesoras'], // header
      ['Excavación de fundaciones', '3', 'Juan', ''], // fila datos 1
      ['Hormigón de platea', '2', 'Juan', '1'], // fila datos 2
      ['Mampostería de PB', '5', 'Pedro', '2'], // fila datos 3
      ['Instalación eléctrica PB', '4', 'Luis', '3'], // fila datos 4
      ['Pintura interior', '3', '', '4'], // fila datos 5
    ];

    const result = excelToTasks({ rows, origen: 'excel' });

    expect(result.headerRowIndex).toBe(1);
    expect(result.mapping.nombre).toBe(0);
    expect(result.mapping.duracion).toBe(1);
    expect(result.mapping.responsable).toBe(2);
    expect(result.mapping.predecesoras).toBe(3);
    expect(result.confidence).toBeGreaterThan(0.7);

    expect(result.tasks).toHaveLength(5);

    const t1 = result.tasks[0]!;
    expect(t1.nombre).toBe('Excavación de fundaciones');
    expect(t1.duracionDias).toBe(3);
    expect(t1.rubro).toBe('movimiento_suelos');
    expect(t1.responsableLabel).toBe('Juan');
    expect(t1.predecesoras).toEqual([]);

    // La tarea 2 depende de la 1 (resuelto a su id).
    expect(result.tasks[1]!.predecesoras).toEqual([t1.id]);
    expect(result.tasks[4]!.rubro).toBe('pintura');
  });

  it('emite warning cuando no se detecta la columna de nombre', () => {
    const rows: unknown[][] = [
      ['col_x', 'col_y'],
      ['a', 'b'],
    ];
    const result = excelToTasks({ rows });
    expect(result.mapping.nombre).toBeUndefined();
    expect(result.warnings.some((w) => w.kind === 'columna_no_detectada')).toBe(true);
    expect(result.tasks).toHaveLength(0);
  });

  it('ignora filas sin nombre', () => {
    const rows: unknown[][] = [
      ['Tarea', 'Duración'],
      ['Revoque grueso', '2'],
      ['', ''],
      [null, '5'],
      ['Pintura', '1'],
    ];
    const result = excelToTasks({ rows });
    expect(result.tasks).toHaveLength(2);
  });
});
