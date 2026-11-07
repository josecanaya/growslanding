import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  pathname: '/inversores', replace: vi.fn(), getSession: vi.fn(),
  unsubscribe: vi.fn(), reset: vi.fn(), setUser: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => state.pathname,
  useRouter: () => router,
}));
const router = { replace: state.replace };
vi.mock('@/lib/auth', () => ({ clearClientSessionArtifacts: vi.fn() }));
vi.mock('@/lib/auth/enforce-socio-single-session', () => ({ enforceSocioSingleSession: vi.fn() }));
vi.mock('@/lib/config', () => ({ RELAX_CLIENT_AUTH_THROTTLE: true }));
vi.mock('@/lib/store/authStore', () => ({ useAuthStore: (selector: (v: unknown) => unknown) => selector({ setUser: state.setUser, reset: state.reset }) }));
vi.mock('@/lib/supabase/browser-client', () => ({ getBrowserSupabaseClient: () => client }));
const client = { auth: { getSession: state.getSession, onAuthStateChange: () => ({ data: { subscription: { unsubscribe: state.unsubscribe } } }) } };
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

beforeEach(() => {
  vi.clearAllMocks();
  state.pathname = '/inversores';
  state.getSession.mockResolvedValue({ data: { session: null }, error: null });
});

it('does not send an anonymous feed visitor to login, including after mount', async () => {
  renderHook(() => useCurrentUser());
  await act(async () => {});
  expect(state.getSession).not.toHaveBeenCalled();
  expect(state.replace).not.toHaveBeenCalled();
});

it('checks session when navigating from the feed into a protected space', async () => {
  const hook = renderHook(() => useCurrentUser());
  state.pathname = '/socio/panel';
  hook.rerender();
  await waitFor(() => expect(state.replace).toHaveBeenCalledWith('/auth/login'));
});

it('does not redirect after returning from a protected page to the feed', async () => {
  let resolve: (v: unknown) => void = () => {};
  state.pathname = '/socio/panel';
  state.getSession.mockReturnValue(new Promise((done) => { resolve = done; }));
  const hook = renderHook(() => useCurrentUser());
  state.pathname = '/inversores';
  hook.rerender();
  await act(async () => resolve({ data: { session: null }, error: null }));
  expect(state.replace).not.toHaveBeenCalled();
});
