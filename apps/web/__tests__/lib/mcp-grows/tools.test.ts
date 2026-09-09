import { afterEach, describe, expect, it, vi } from 'vitest';
import { callGrowsMcpTool } from '@/lib/mcp-grows/tools';

const result = (value: any) => JSON.parse(value.content[0].text);
afterEach(() => vi.unstubAllEnvs());
describe('MCP scope and proposals', () => {
  it('fails closed before accessing service-role data without organization', async () => {
    vi.stubEnv('GROWS_MCP_ORG_ID', '');
    const from = vi.fn();
    const response = await callGrowsMcpTool({ from } as any, 'listar_obras_vivas', {});
    expect(response.isError).toBe(true);
    expect(result(response).error).toContain('MCP_SCOPE_REQUIRED');
    expect(from).not.toHaveBeenCalled();
  });
  it('requires explicit A/B, revision, key and kind before writing', async () => {
    vi.stubEnv('GROWS_MCP_ORG_ID', 'org');
    const from = vi.fn();
    const response = await callGrowsMcpTool({ from } as any, 'proponer_paso', { obra_id: 'obra', mensaje: 'Construir muro' });
    expect(response.isError).toBe(true);
    expect(from).not.toHaveBeenCalled();
  });
  it('uses one atomic revision-checked save and preserves metadata without inventing edges', async () => {
    vi.stubEnv('GROWS_MCP_ORG_ID', 'org');
    const query: any = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle: vi.fn(async () => ({ data: { id: 'obra', org_id: 'org' }, error: null })) };
    const snapshot = { obra: { name: 'Obra', canvas_ui: { revision: 4, hilo: [] } }, revision: 4, nodes: [{ id: 'A', type: 'estado', metadata: { custom: true } }, { id: 'B', type: 'estado' }], edges: [], budgetGroups: [], checklistItems: [], budgetGroupTasks: [] };
    const rpc = vi.fn(async (name) => ({ data: name === 'read_canvas_snapshot' ? snapshot : { revision: 5 }, error: null }));
    const response = await callGrowsMcpTool({ from: () => query, rpc } as any, 'proponer_paso', { obra_id: 'obra', mensaje: 'Construir muro', base_revision: 4, idempotency_key: 'one', from_node_id: 'A', to_node_id: 'B', transform_kind: 'ejecucion' });
    expect(response.isError).not.toBe(true);
    const save = rpc.mock.calls.find(([name]) => name === 'save_canvas_snapshot') as any;
    expect(save[1].p_expected_revision).toBe(4);
    expect(save[1].p_snapshot.edges).toEqual([]);
    expect(save[1].p_snapshot.nodes[0].metadata.custom).toBe(true);
    const proposal = save[1].p_snapshot.nodes[2];
    expect(proposal.executor_kind).toBe('sin_asignar');
    expect(proposal.graph_status).toBe('propuesta');
    expect(proposal.from_node_id).toBe('A');
    expect(proposal.metadata.propuesta.autor_tipo).toBe('agente');
    expect(query.eq).toHaveBeenCalledWith('org_id', 'org');
  });
});
