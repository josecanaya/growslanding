import { describe, expect, it } from 'vitest';
import { parseProjectXml } from '@/lib/project/importProjectXml';
import { buildCanvasImportBundle } from '@/lib/project/projectImportToCanvas';

function wrapProject(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Project xmlns="http://schemas.microsoft.com/project">
<Title>Obras demo</Title>
${inner}
</Project>`;
}

/** Task MSP mínima */
function task(
  uid: number,
  outline: string,
  name: string,
  opts: { summary?: boolean; duration?: string; outlineLevel?: number } = {},
) {
  const lvl = opts.outlineLevel ?? outline.split('.').length;
  const sum = opts.summary ?? false;
  return `<Task><UID>${uid}</UID><ID>${uid}</ID><Name>${name}</Name><OutlineNumber>${outline}</OutlineNumber><OutlineLevel>${lvl}</OutlineLevel><Summary>${sum ? '1' : '0'}</Summary><Duration>${opts.duration ?? 'P1DT0H0M0S'}</Duration><PercentComplete>0</PercentComplete></Task>`;
}

describe('parseProjectXml + buildCanvasImportBundle', () => {
  it('un solo nivel Outline con hijos: perfil adaptable simple; ningún filler en canvas', () => {
    /** Dos nodos nivel 1 MSP evitan collapsedRoot y dejan solo un tier agrupador. */
    const xml = wrapProject(`
      ${task(1, '1', 'Macro A', { summary: true })}
      ${task(2, '101', 'Macro B', { summary: false })}
      ${task(3, '1.1', 'Tarea')}
    `);
    const preview = parseProjectXml(xml);
    expect(preview.collapsedRootUid).toBeNull();
    expect(preview.groupingTierCount).toBe(1);
    expect(preview.adaptiveImportKind).toBe('simple');
    expect(preview.structureTierLabels.length).toBe(1);
    expect(preview.maxOutlineDepthDetected).toBeGreaterThanOrEqual(2);

    const bundle = buildCanvasImportBundle(preview);
    expect(bundle.projectKind).toBe('simple');
    expect(bundle.nodes.every((n) => !/\(planta\)|\(sector\)|\(ambiente\)/i.test(n.title))).toBe(true);

    const idByUid = (u: number) => bundle.nodes.find((n) => n.importSourceUid === u)?.id;
    expect(idByUid(3)).toBeTruthy();
    expect(bundle.nodes.find((n) => n.importSourceUid === 3)?.parentId).toBe(idByUid(1));
  });

  it('aplana niveles fantasmas MSP (resumen con un solo hijo hoja ejecutable)', () => {
    /** Estructura típica: fase macro → grupo resumen → trabajo real como hoja. */
    /** Segundo nivel-1 Outline evita collapsedRoot MSP (solo una línea nivel mínimo). */
    const xml = wrapProject(`
      ${task(50, '98', 'Otro nivel-1 MSP', { summary: false })}
      ${task(1, '1', 'Preparación', { summary: true, duration: 'PT0H0M0S' })}
      ${task(2, '1.1', '(planta) Limpieza terreno grupo', { summary: true, duration: 'PT0H0M0S' })}
      ${task(3, '1.1.1', 'Limpieza general del terreno (planta)')}
    `);
    const preview = parseProjectXml(xml);
    expect(preview.warnings.some((w) => w.kind === 'msp_phantom_promoted')).toBe(true);
    expect(preview.nodesPreview.find((n) => n.sourceUid === 2)).toBeUndefined();
    const trabajo = preview.nodesPreview.find((n) => n.sourceUid === 3)!;
    expect(trabajo.growsType).toBe('tarea');
    /** Queda como hermanas bajo macro: sin inventar nivel planta intermediario si era solo MSP. */
    expect(trabajo.parentSourceUid).toBe(1);

    const bundle = buildCanvasImportBundle(preview);
    const n3 = bundle.nodes.find((n) => n.importSourceUid === 3)!;
    expect(n3.type).toBe('tarea');
    expect(n3.parentId).toBe(bundle.nodes.find((n) => n.importSourceUid === 1)?.id);
  });

  it('jerarquía profunda MSP: phantom collapse reduce tierras; preview y bundle coinciden', () => {
    /** Dos nodos nivel 1 MSP evitan collapsedRoot y permiten tiers; la cadena 1→1.1→… típicamente aplana niveles fantasmas Summary+0dur. */
    const xml = wrapProject(`
      ${task(1, '1', 'Bloque 1', { summary: true })}
      ${task(9, '2', 'Bloque 2 stub', { summary: false })}
      ${task(2, '1.1', 'Nivel 2', { summary: true })}
      ${task(3, '1.1.1', 'Nivel 3', { summary: true })}
      ${task(4, '1.1.1.1', 'Nivel 4', { summary: true })}
      ${task(5, '1.1.1.1.1', 'Ejecutar')}
    `);
    const preview = parseProjectXml(xml);
    expect(preview.collapsedRootUid).toBeNull();
    expect(preview.warnings.some((w) => w.kind === 'msp_phantom_promoted')).toBe(true);
    expect(preview.structureTierLabels.length).toBe(preview.groupingTierCount);

    const bundle = buildCanvasImportBundle(preview);
    expect(bundle.projectKind).toBe(preview.adaptiveImportKind);
    expect(bundle.nodes.every((x) => x.importSourceUid != null)).toBe(true);
    expect(bundle.nodes.length).toBe(preview.nodesPreview.length);
  });
});
