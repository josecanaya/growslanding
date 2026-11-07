import { describe, expect, it } from 'vitest';
import { isPublicPath, safeReturnPath } from '@/lib/auth/public-paths';
import { profileRoles, roleForPath } from '@/lib/auth/profile-roles';
import { emptyPublication, readPublication } from '@/lib/obras/publication';
import { comparableQuotes, type WorkQuote } from '@/lib/obras/procurement';

describe('public entry and role continuity', () => {
  it('keeps feed, building and access pages public with exact boundaries', () => {
    for (const path of ['/', '/inversores', '/inversores/index.html', '/home', '/acceder', '/auth/login']) expect(isPublicPath(path)).toBe(true);
    for (const path of ['/socio/panel', '/cliente/dashboard', '/obras/123', '/inversores-private', '/authentication']) expect(isPublicPath(path)).toBe(false);
  });
  it('rejects external and auth-loop return URLs', () => {
    for (const path of ['//evil.com', '/\\evil.com', '/auth/callback', 'https://evil.com', '/\n/evil.com']) expect(safeReturnPath(path)).toBe('/inversores');
    expect(safeReturnPath('/acceder?sector=trabajo&obra=123')).toBe('/acceder?sector=trabajo&obra=123');
  });
  it('uses the requested operational space and keeps server-issued admin separate', () => {
    const user = { app_metadata: { role: 'CLIENTE_TECNICO', roles: ['CLIENTE_TECNICO', 'SOCIO'] } };
    expect(roleForPath(user, '/socio/panel')).toBe('SOCIO');
    expect(roleForPath(user, '/cliente/dashboard')).toBe('CLIENTE_TECNICO');
    expect(profileRoles({ user_metadata: { role: 'ADMIN' } })).toEqual([]);
    expect(profileRoles({ user_metadata: { role: 'SOCIO' } })).toEqual(['SOCIO']);
  });
});

describe('publication boundary', () => {
  it('defaults private and strips fields outside the reviewed public projection', () => {
    const draft = emptyPublication('Obra nueva');
    expect(draft.visible).toBe(false);
    const parsed = readPublication({ ...draft, org_id: 'private', quotes: [{ monto: 50 }], publicationToken: 'secret' });
    expect(parsed).not.toHaveProperty('org_id');
    expect(parsed).not.toHaveProperty('quotes');
    expect(parsed).not.toHaveProperty('publicationToken');
  });
  it('rejects malformed publications and insecure cover URLs', () => {
    expect(readPublication({ ...emptyPublication('Obra'), progress: 110 })).toBeNull();
    expect(readPublication({ ...emptyPublication('Obra'), coverUrl: 'javascript:alert(1)' })).toBeNull();
    expect(readPublication({ visible: true })).toBeNull();
  });
});

describe('quotation comparison', () => {
  const quote = (patch: Partial<WorkQuote>): WorkQuote => ({
    id: 'q', tarea_id: 'task', socio_id: 'socio', monto: 100, moneda: 'ARS', cantidad: 1,
    unidad: 'm2', dias_reales: 3, estado: 'ENVIADO', notas: null, ...patch,
  });
  it('never mixes currency or different scopes and excludes unsubmitted requests', () => {
    const groups = comparableQuotes([
      quote({ id: 'a', monto: 200 }), quote({ id: 'b', monto: 100 }),
      quote({ id: 'usd', moneda: 'USD' }), quote({ id: 'scope', cantidad: 10 }),
      quote({ id: 'draft', estado: 'SOLICITADO', monto: 1 }),
      quote({ id: 'unknown', moneda: null }), quote({ id: 'zero', monto: 0 }),
    ]);
    expect(groups).toHaveLength(3);
    expect(groups[0].quotes.map((item) => item.id)).toEqual(['b', 'a']);
    expect(groups.flatMap((item) => item.quotes).map((item) => item.id)).not.toContain('draft');
  });
});
