import { describe, expect, it } from 'vitest';
import { calcularCronograma, curvaS } from '@/lib/circuito/cronograma';

const base = {
  fechaInicio: '2026-01-01',
  tareas: [{ id: 'A', duracion: 10 }, { id: 'B', duracion: 5 }, { id: 'C', duracion: 5 }, { id: 'D', duracion: 3 }],
  precedencias: [{ tarea: 'B', dependeDe: 'A' }, { tarea: 'C', dependeDe: 'A' }, { tarea: 'D', dependeDe: 'B', lag: 2 }, { tarea: 'D', dependeDe: 'C' }],
};
const de = (c: ReturnType<typeof calcularCronograma>, id: string) => c.tareas.find((t) => t.id === id)!;

describe('cronograma', () => {
  it('calcula fechas, holguras y ruta crítica con dependencias y demoras', () => {
    const c = calcularCronograma(base);
    expect(de(c, 'A')).toMatchObject({ inicio: '2026-01-01', fin: '2026-01-10', critica: true });
    expect(de(c, 'B')).toMatchObject({ es: 10, ef: 15, critica: true });
    expect(de(c, 'C')).toMatchObject({ es: 10, ef: 15, holgura: 2, critica: false });
    expect(de(c, 'D')).toMatchObject({ es: 17, ef: 20 });
    expect(c.rutaCritica).toEqual(['A', 'B', 'D']);
    expect(c.fin).toBe('2026-01-20');
  });
  it('un recurso compartido impide que dos tareas se superpongan', () => {
    const c = calcularCronograma({ ...base, restricciones: [{ tarea: 'B', tipo: 'recurso', recursoClave: 'grua' }, { tarea: 'C', tipo: 'recurso', recursoClave: 'grua' }] });
    expect(de(c, 'B').ef).toBeLessThanOrEqual(de(c, 'C').es);
    expect(c.duracionTotal).toBe(23);
    expect(de(c, 'C').motivoInicio).toContain('recurso compartido');
  });
  it('una compra o inspección pendiente fija el inicio; cumplida deja de condicionar', () => {
    const pendiente = calcularCronograma({ ...base, restricciones: [{ tarea: 'B', tipo: 'compra', fechaDisponible: '2026-01-21', estado: 'pendiente' }] });
    expect(de(pendiente, 'B')).toMatchObject({ inicio: '2026-01-21', motivoInicio: 'compra' });
    const cumplida = calcularCronograma({ ...base, restricciones: [{ tarea: 'B', tipo: 'compra', fechaDisponible: '2026-01-21', estado: 'cumplida' }] });
    expect(de(cumplida, 'B').inicio).toBe('2026-01-11');
  });
  it('reprogramar corre lo no iniciado y respeta lo real', () => {
    const c = calcularCronograma({ ...base, tareas: [{ id: 'A', duracion: 10, inicioReal: '2026-01-01', finReal: '2026-01-12', avance: 100 }, ...base.tareas.slice(1)], noAntesDe: '2026-02-01' });
    expect(de(c, 'A').fin).toBe('2026-01-12');
    expect(de(c, 'B').inicio).toBe('2026-02-01');
  });
  it('proyecta el resto de una tarea en curso desde la fecha de corte', () => {
    const c = calcularCronograma({ ...base, tareas: [{ id: 'A', duracion: 10, inicioReal: '2026-01-01', avance: 50 }, ...base.tareas.slice(1)], fechaCorte: '2026-01-15' });
    expect(de(c, 'A').ef).toBe(19);
  });
  it('rechaza dependencias circulares y es determinista', () => {
    expect(() => calcularCronograma({ ...base, precedencias: [...base.precedencias, { tarea: 'A', dependeDe: 'D' }] })).toThrow(/circulares/);
    expect(calcularCronograma(base)).toEqual(calcularCronograma(base));
  });
  it('la curva S separa planificado, físico, certificado y pagado', () => {
    const puntos = curvaS({ lineaBase: [{ inicio: '2026-01-01', fin: '2026-01-10', costo: 1000 }], fisico: [{ fecha: '2026-01-05', monto: 400 }],
      certificado: [{ fecha: '2026-01-08', monto: 300 }], pagado: [{ fecha: '2026-01-09', monto: 285 }], pasoDias: 3 });
    const fin = puntos[puntos.length - 1];
    expect(fin).toMatchObject({ fecha: '2026-01-10', planificado: 1000, fisico: 400, certificado: 300, pagado: 285 });
    expect(puntos[1]).toMatchObject({ fecha: '2026-01-04', planificado: 400, fisico: 0 });
  });
});
