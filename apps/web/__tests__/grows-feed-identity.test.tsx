import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ getUser: vi.fn(), updateUser: vi.fn(), onAuthStateChange: vi.fn() }));
vi.mock('@/lib/supabase/browser-client', () => ({ getBrowserSupabaseClient: () => ({ auth }) }));
import { useFeedIdentity } from '@/components/grows/useFeedIdentity';
beforeEach(() => { vi.clearAllMocks(); auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }); });
it('lee el perfil de una identidad verificada y guarda únicamente una preferencia de presentación', async () => {
  const user = { id: 'one', app_metadata: { role: 'SOCIO' }, user_metadata: {} };
  auth.getUser.mockResolvedValue({ data: { user }, error: null });
  auth.updateUser.mockResolvedValue({ data: { user: { ...user, user_metadata: { grows_feed_profile: 'inversor' } } }, error: null });
  const hook = renderHook(() => useFeedIdentity());
  await waitFor(() => expect(hook.result.current.profile).toBe('contratista'));
  await act(async () => hook.result.current.chooseProfile('inversor'));
  expect(auth.updateUser).toHaveBeenCalledWith({ data: { grows_feed_profile: 'inversor' } });
  expect(hook.result.current.profile).toBe('inversor');
});
it('no guarda el perfil cuando la sesión vence', async () => {
  auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('expired') });
  const hook = renderHook(() => useFeedIdentity());
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  await expect(hook.result.current.chooseProfile('profesional')).rejects.toThrow('sesión venció');
  expect(auth.updateUser).not.toHaveBeenCalled();
  expect(hook.result.current.user).toBeNull();
});
