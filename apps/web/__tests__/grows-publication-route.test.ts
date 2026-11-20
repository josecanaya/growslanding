// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ access: vi.fn(), read: vi.fn(), save: vi.fn() }));
vi.mock('@/lib/obra-access', () => ({
  requireObraAccess: mocks.access,
  ObraAccessError: class extends Error { constructor(public status: number, message: string) { super(message); } },
}));
vi.mock('@/lib/canvas/canvasPersistenceServer', () => ({
  readCanvasSnapshot: mocks.read, saveCanvasSnapshot: mocks.save,
  canvasPersistenceError: () => ({ status: 409, message: 'La obra cambió.' }),
}));
import { PUT } from '@/app/api/obras/[id]/publicacion/route';
import { emptyPublication } from '@/lib/obras/publication';
import { ObraAccessError } from '@/lib/obra-access';

const params = { params: Promise.resolve({ id: 'obra' }) };
const request = (revision: number) => new Request('https://grows.test/api/obras/obra/publicacion', {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ revision, publication: { ...emptyPublication('Obra'), visible: true } }),
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.access.mockResolvedValue({ supabase: {rpc:mocks.save}, orgId: 'org', user:{id:'owner'} });
  mocks.read.mockResolvedValue({ data: {
    revision: 3, obra: { name: 'Obra', canvas_project_kind: null, canvas_ui: {} },
    nodes: [{ id: 'keep' }], edges: [], budgetGroups: [], checklistItems: [], budgetGroupTasks: [],
  }, error: null });
  mocks.save.mockResolvedValue({ error: null });
});

it('requires planning permission and rejects unauthorized publication', async () => {
  mocks.access.mockRejectedValue(new ObraAccessError(403, 'Sin permiso'));
  const response = await PUT(request(3), params);
  expect(response.status).toBe(403);
  expect(mocks.save).not.toHaveBeenCalled();
});

it('rejects stale revisions without changing the canvas', async () => {
  const response = await PUT(request(2), params);
  expect(response.status).toBe(409);
  expect(mocks.save).not.toHaveBeenCalled();
});

it('updates only publication with actor and expected revision, without replacing canvas rows', async () => {
  mocks.save.mockResolvedValue({data:{revision:4,publication:{visible:true}},error:null});
  const response = await PUT(request(3), params);
  expect(response.status).toBe(200);
  expect(mocks.access).toHaveBeenCalledWith('obra', true);
  expect(mocks.save).toHaveBeenCalledWith('project_studio_action',expect.objectContaining({p_obra:'obra',p_actor:'owner',p_data:expect.objectContaining({action:'publication',revision:3})}));
  expect(mocks.save.mock.calls[0][1].p_data).not.toHaveProperty('nodes');
});

it('returns conflict if the database detects a concurrent edit', async () => {
  mocks.save.mockResolvedValue({ error: { code: '40001' } });
  expect((await PUT(request(3), params)).status).toBe(409);
});
