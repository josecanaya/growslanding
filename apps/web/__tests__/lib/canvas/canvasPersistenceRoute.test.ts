import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), planning: vi.fn(), read: vi.fn(), save: vi.fn(),
  obra: vi.fn(), mapper: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }));
vi.mock('@supabase/auth-helpers-nextjs', () => ({ createRouteHandlerClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('@/lib/supabase-server', () => ({ createServiceSupabaseClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.obra }) }) }) }) }));
vi.mock('@/lib/canvas/canvasPersistenceServer', async (original) => ({
  ...await original<typeof import('@/lib/canvas/canvasPersistenceServer')>(),
  listCanvasPlanningOrgIds: mocks.planning, readCanvasSnapshot: mocks.read, saveCanvasSnapshot: mocks.save,
}));
vi.mock('@/lib/canvas/canvasSupabaseMapper', () => ({ persistedToSupabaseRows: mocks.mapper, supabaseRowsToPersisted: (data: unknown) => data }));
vi.mock('@/lib/canvas/canvasMultinivelStorage', () => ({ composeCanvasPersisted: (data: unknown) => data }));
import { GET, PUT } from '@/app/api/obras/[id]/canvas/route';
import type { NextRequest } from 'next/server';

const params = { params: Promise.resolve({ id: 'obra' }) };
const body = { expectedRevision: 4, obraNombre: 'Obra', projectKind: 'edificio_multifamiliar', nodes: [], edges: [], budgetGroups: [], pathIds: [] };
const request = (payload: unknown) => new Request('http://localhost/api/obras/obra/canvas', { method: 'PUT', body: JSON.stringify(payload) }) as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'u', email: 'u@example.com' } }, error: null });
  mocks.planning.mockResolvedValue(['org']);
  mocks.obra.mockResolvedValue({ data: { org_id: 'org' }, error: null });
  mocks.mapper.mockReturnValue({ nodes: [], edges: [] });
  mocks.save.mockResolvedValue({ data: { revision: 5 }, error: null });
});

describe('canvas snapshot API', () => {
  it('rejects incomplete payloads before any mutation', async () => {
    expect((await PUT(request({}), params)).status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('does not grant planning access through socio membership', async () => {
    mocks.planning.mockResolvedValue([]);
    expect((await PUT(request(body), params)).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('uses a single atomic save with expected revision', async () => {
    expect((await PUT(request(body), params)).status).toBe(200);
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(mocks.save.mock.calls[0].slice(1,4)).toEqual(['obra','org',4]);
  });
  it('returns conflict rather than retrying destructive replacement', async () => {
    mocks.save.mockResolvedValue({ error: { code: '40001' } });
    expect((await PUT(request(body), params)).status).toBe(409);
    expect(mocks.save).toHaveBeenCalledOnce();
  });
  it('does not return an empty successful canvas on database failure', async () => {
    mocks.read.mockResolvedValue({ error: { code: 'XX000' } });
    const response = await GET(request(body), params);
    expect(response.status).toBe(500);
    expect((await response.json()).success).toBe(false);
  });
  it('fails closed when the migration is absent', async () => {
    mocks.save.mockResolvedValue({ error: { code: 'PGRST202' } });
    expect((await PUT(request(body), params)).status).toBe(503);
  });
});
