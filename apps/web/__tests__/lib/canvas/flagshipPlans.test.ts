import { describe, it, expect } from 'vitest';
import { projectXmlToTasks } from '@/lib/obra-check/xmlAdapter';
import {
  buildStructuredPlanTemplateXml,
  countStructuredPlanTasks,
} from '@/lib/canvas/buildStructuredPlanTemplateXml';
import { FLAGSHIP_PLANS } from '@/lib/canvas/flagshipPlans';

/** Mismo criterio de fase que PanelFases (Obra Check). */
function inferPhase(nombre: string, rubro: string | null): string {
  const text = `${rubro ?? ''} ${nombre}`.toLowerCase();
  if (/demolic|suelo|fundac|estructura|mampost/.test(text)) return 'Estructura';
  if (/electri|sanitar|gas|instal/.test(text)) return 'Instalaciones';
  if (/pint|limpieza|revoque|piso|carpinter|techo/.test(text)) return 'Terminaciones';
  return 'Preparacion';
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const phaseFromName = (n: string) => {
  const x = normalize(n);
  if (x.startsWith('prepar')) return 'Preparacion';
  if (x.startsWith('estruct')) return 'Estructura';
  if (x.startsWith('instal')) return 'Instalaciones';
  return 'Terminaciones';
};

describe('flagshipPlans', () => {
  it('hay exactamente 2 planes por tipo (casa / reforma / edificio)', () => {
    const porTipo = FLAGSHIP_PLANS.reduce<Record<string, number>>((acc, p) => {
      acc[p.segment] = (acc[p.segment] ?? 0) + 1;
      return acc;
    }, {});
    expect(porTipo).toEqual({ casa: 2, reforma: 2, edificio: 2 });
  });

  it('slugs únicos', () => {
    const slugs = FLAGSHIP_PLANS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  for (const plan of FLAGSHIP_PLANS) {
    describe(plan.slug, () => {
      const xml = buildStructuredPlanTemplateXml(plan.spec);
      const res = projectXmlToTasks(xml);

      it('convierte a todas las tareas hoja, sin nodos basura', () => {
        expect(res.tasks.length).toBe(countStructuredPlanTasks(plan.spec));
        const junk = res.tasks.filter((t) => t.nombre.trim().length <= 1 || t.nombre === '—');
        expect(junk).toEqual([]);
      });

      it('es un plan denso (muchas tareas reales)', () => {
        expect(res.tasks.length).toBeGreaterThanOrEqual(20);
      });

      it('tiene precedencias resueltas a ids existentes', () => {
        const ids = new Set(res.tasks.map((t) => t.id));
        const conPred = res.tasks.filter((t) => t.predecesoras.length > 0);
        expect(conPred.length).toBeGreaterThan(res.tasks.length / 2);
        for (const t of conPred) {
          for (const p of t.predecesoras) expect(ids.has(p)).toBe(true);
        }
      });

      it('cada tarea cae en la fase de Obra Check que le corresponde por su nombre', () => {
        const intended = new Map<string, string>();
        for (const ph of plan.spec.phases) {
          for (const task of ph.tasks) intended.set(task.name, phaseFromName(ph.name));
        }
        for (const task of res.tasks) {
          const want = intended.get(task.nombre);
          if (want) expect(inferPhase(task.nombre, task.rubro)).toBe(want);
        }
      });
    });
  }
});
