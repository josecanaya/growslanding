
// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ user: vi.fn(), activate: vi.fn() }));
vi.mock('@/lib/auth/session-user', () => ({ getSessionUser: mocks.user }));
vi.mock('@/lib/auth/activate-profile', () => ({ activateProfile: mocks.activate }));
import { POST } from '@/app/api/auth/set-role/route';

const request = (body: unknown) => new Request('https://grows.test/api/auth/set-role', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: 'current' });
  mocks.activate.mockResolvedValue({ role: 'SOCIO', roles: ['SOCIO', 'CLIENTE_TECNICO'] });
});
it('requires an authenticated account to activate a profile', async () => {
  mocks.user.mockResolvedValue(null);
  expect((await POST(request({ role: 'SOCIO' }))).status).toBe(401);
  expect(mocks.activate).not.toHaveBeenCalled();
});
it('rejects admin grants and changes targeting another account', async () => {
  expect((await POST(request({ role: 'ADMIN' }))).status).toBe(400);
  expect((await POST(request({ role: 'SOCIO', user_id: 'other' }))).status).toBe(400);
  expect(mocks.activate).not.toHaveBeenCalled();
});
it('activates an operational profile for the authenticated identity', async () => {
  expect((await POST(request({ role: 'SOCIO' }))).status).toBe(200);
  expect(mocks.activate).toHaveBeenCalledWith({ id: 'current' }, 'SOCIO');
});
