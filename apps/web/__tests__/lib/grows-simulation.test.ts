import { describe, expect, it } from 'vitest';
import { act, createScenarios, inspectScenario, visibleActivity } from '@/lib/obras/simulation';

describe('laboratorio compartido de obras', () => {
  it('crea quince obras únicas con dependencias válidas y participaciones', () => {
    const obras = createScenarios();
    expect(new Set(obras.map(o => o.id)).size).toBe(15);
    for (const obra of obras) {
      expect(obra.professional && obra.contractor && obra.investor).toBeTruthy();
      for (const block of obra.blocks) for (const id of block.dependsOn) expect(obra.blocks.some(b => b.id === id)).toBe(true);
    }
  });
  it.each(createScenarios())('$name: evidencia → validación → actualización compartida', original => {
    let obra = original;
    if (obra.blocks[1].state === 'en_curso') obra = act(obra, 'contratista', { type: 'evidence', text: 'Acta ficticia de inspección' });
    expect(inspectScenario(obra).progress).toBe(33);
    expect(inspectScenario(obra).blocked).toHaveLength(1);
    obra = act(obra, 'profesional', { type: 'validate' });
    expect(inspectScenario(obra).progress).toBe(67);
    expect(inspectScenario(obra).blocked).toHaveLength(0);
    expect(visibleActivity(obra, 'inversor').at(-1)?.text).toContain('Validó');
    expect(original.blocks[1].state).not.toBe('validado');
  });
  it('impide validar al contratista e inversor, y no permite validar sin evidencia', () => {
    const [ready, pending] = createScenarios();
    expect(() => act(ready, 'contratista', { type: 'validate' })).toThrow();
    expect(() => act(ready, 'inversor', { type: 'validate' })).toThrow();
    expect(() => act(pending, 'profesional', { type: 'validate' })).toThrow();
    expect(() => act(pending, 'publico', { type: 'comment', text: 'Hola' })).toThrow();
  });
  it('no muestra conversaciones internas al visitante ni inversor', () => {
    const obra = createScenarios()[0];
    for (const role of ['inversor', 'publico'] as const) expect(visibleActivity(obra, role).every(e => e.visibility === 'publica')).toBe(true);
    expect(visibleActivity(obra, 'contratista')).toHaveLength(3);
  });
  it('solo incorpora una propuesta después de aceptación y evita duplicados', () => {
    const obra = createScenarios()[0];
    const proposed = act(obra, 'profesional', { type: 'propose' });
    expect(proposed.blocks).toHaveLength(3);
    expect(() => act(proposed, 'inversor', { type: 'accept' })).toThrow();
    const accepted = act(proposed, 'profesional', { type: 'accept' });
    expect(accepted.blocks).toHaveLength(4);
    expect(() => act(accepted, 'profesional', { type: 'accept' })).toThrow();
    expect(obra.blocks).toHaveLength(3);
  });
  it('mantiene las interacciones aisladas por obra', () => {
    const obras = createScenarios();
    const updated = act(obras[0], 'inversor', { type: 'comment', text: '¿Cuándo revisamos el hito?' });
    expect(updated.activity).toHaveLength(4);
    expect(obras[1].activity).toHaveLength(3);
    expect(act(updated, 'publico', { type: 'follow' }).following).toBe(true);
  });
});
