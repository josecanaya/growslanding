import type { Scenario } from './simulation';

export type UnitPackage = { id: string; title: string; area: number; rooms: number; priceCents: number; description: string };
export function packagesFor(obra: Pick<Scenario, 'id' | 'type'>): UnitPackage[] {
  if (!['Edificio', 'Vivienda', 'Reforma'].includes(obra.type)) return [];
  const index = Number(obra.id.replace('demo-', '')) - 1;
  if (!Number.isInteger(index) || index < 0 || index > 14) return [];
  const apartment = obra.type === 'Edificio';
  return [
    { id: `${obra.id}-unidad-a`, title: apartment ? 'Departamento 2A' : 'Casa Jardín', area: apartment ? 68 : 112, rooms: 3, priceCents: (98000 + index * 4000) * 100, description: apartment ? 'Dos dormitorios, balcón y estar integrado.' : 'Dos dormitorios, patio propio y espacio de trabajo.' },
    { id: `${obra.id}-unidad-b`, title: apartment ? 'Departamento 3B' : 'Casa Terraza', area: apartment ? 94 : 148, rooms: 4, priceCents: (132000 + index * 5000) * 100, description: apartment ? 'Tres dormitorios, balcón terraza y cocina integrada.' : 'Tres dormitorios, terraza y jardín privado.' },
  ];
}

// A unit price is apportioned across milestones, separately from MCU subscriptions.
export function packageStages(unit: UnitPackage) {
  const stages = [
    { id: 'proyecto', title: 'Proyecto y documentación', percent: 20, detail: 'Definición de la unidad, alcance y documentación acordada.' },
    { id: 'estructura', title: 'Fundaciones y estructura', percent: 30, detail: 'Hito de estructura revisado por la dirección de obra.' },
    { id: 'instalaciones', title: 'Cerramientos e instalaciones', percent: 25, detail: 'Instalaciones y cerramientos completos, con evidencia de avance.' },
    { id: 'terminaciones', title: 'Terminaciones', percent: 20, detail: 'Revestimientos, equipamiento y terminaciones de la unidad.' },
    { id: 'entrega', title: 'Inspección y entrega', percent: 5, detail: 'Revisión final y condiciones de entrega acordadas.' },
  ];
  let allocated = 0;
  return stages.map((stage, index) => {
    const amountCents = index === stages.length - 1 ? unit.priceCents - allocated : Math.floor(unit.priceCents * stage.percent / 100);
    allocated += amountCents;
    return { ...stage, amountCents };
  });
}
