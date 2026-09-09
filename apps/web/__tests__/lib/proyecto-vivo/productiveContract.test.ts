import { describe, it, expect } from 'vitest';
import { aggregateExecutionStatus, aggregateGraphExecution } from '@/lib/proyecto-vivo/aggregateExecution';
import { publicationBlockReason } from '@/lib/proyecto-vivo/publicationContract';
import { normalizeProductiveRelation } from '@/lib/proyecto-vivo/relationSemantics';

describe('productive contract', () => {
  it('normalizes depends-on and keeps information outside scheduling', () => {
    expect(normalizeProductiveRelation('b', 'a', 'depende_de')).toMatchObject({ sourceId: 'a', targetId: 'b', temporal: true });
    expect(normalizeProductiveRelation('a', 'b', 'afecta')).toMatchObject({ blocks: false, temporal: false });
    expect(normalizeProductiveRelation('a', 'b', 'habilita')).toMatchObject({ blocks: true, temporal: false });
  });
  it('requires every task and does not start at publication', () => {
    expect(aggregateExecutionStatus([])).toBe('propuesta');
    expect(aggregateExecutionStatus(['pendiente'])).toBe('propuesta');
    expect(aggregateExecutionStatus(['validada', 'pendiente'])).toBe('en_curso');
    expect(aggregateExecutionStatus(['validada', 'validada'])).toBe('realizada');
    expect(aggregateExecutionStatus(['validada', 'rechazada'])).toBe('en_curso');
  });
  it('converges only when both branches are validated and reopens on rejection', () => {
    const nodes = [
      { id: 't1', type: 'tarea', transform_kind: 'ejecucion', to_node_id: 'b', graph_status: 'en_curso' },
      { id: 't2', type: 'tarea', transform_kind: 'ejecucion', to_node_id: 'b', graph_status: 'en_curso' },
      { id: 'b', type: 'estado', graph_status: 'alcanzado' },
    ];
    expect(aggregateGraphExecution(nodes, [{ canvas_node_id: 't1', estado: 'validada' }, { canvas_node_id: 't2', estado: 'rechazada' }], []).get('b')).toBe('fantasma');
    nodes[2].graph_status = 'fantasma';
    expect(aggregateGraphExecution(nodes, [{ canvas_node_id: 't1', estado: 'validada' }, { canvas_node_id: 't2', estado: 'validada' }], []).get('b')).toBe('alcanzado');
  });
  it('blocks unaccepted modern transformations and foreign endpoints, preserves legacy', () => {
    const node = { id: 't', type: 'tarea', transform_kind: 'ejecucion', from_node_id: 'a', to_node_id: 'b' };
    const endpoints = [{ id: 'a', type: 'estado' }, { id: 'b', type: 'estado' }];
    expect(publicationBlockReason(node, endpoints, true)).toBeTruthy();
    const accepted = { ...node, metadata: { orquestador: { estado: 'aceptada' } } };
    expect(publicationBlockReason(accepted, endpoints, true)).toBeNull();
    expect(publicationBlockReason(accepted, endpoints.slice(0, 1), true)).toBeTruthy();
    expect(publicationBlockReason({ id: 'old', type: 'tarea' }, [], false)).toBeNull();
  });
});
