import { expect, it } from 'vitest';
import { feedProfile, obraReturnPath } from '@/lib/obras/feed-profile';
it('resuelve perfil recordado y compatibilidad con perfiles operativos', () => {
  expect(feedProfile({ user_metadata: { grows_feed_profile: 'inversor' }, app_metadata: { role: 'SOCIO' } })).toBe('inversor');
  expect(feedProfile({ app_metadata: { role: 'SOCIO' } })).toBe('contratista');
  expect(feedProfile({ app_metadata: { role: 'CLIENTE_TECNICO' } })).toBe('profesional');
  expect(feedProfile({ user_metadata: { role: 'ADMIN', grows_feed_profile: 'ADMIN' } })).toBeNull();
  expect(obraReturnPath('demo-15')).toBe('/inversores/simulacion?obra=demo-15');
});
