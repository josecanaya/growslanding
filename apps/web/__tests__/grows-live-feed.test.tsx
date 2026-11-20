import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GrowsFeed from '@/components/grows/GrowsFeed';
import { accountRole } from '@/lib/obras/feed-profile';
import { emptyPublication } from '@/lib/obras/publication';

const work = {
  ...emptyPublication('Pasaje Alvear'),
  id: '569e1eda-3fcb-453a-b394-d8a1a536648e',
  visible: true,
  progress: 31,
  investorNotes: 'Financiamiento del ensayo',
  contractorNotes: 'Paquetes de contratación',
};

describe('GROWS community feed', () => {
  it('uses the account profile and ignores the simulation preference', () => {
    expect(accountRole({
      app_metadata: { role: 'CLIENTE_TECNICO', roles: ['SOCIO', 'CLIENTE_TECNICO'] },
      user_metadata: { grows_feed_profile: 'inversor' },
    })).toBe('profesional');
    expect(accountRole({ app_metadata: { role: 'INVERSOR' } })).toBe('inversor');
    expect(accountRole({ user_metadata: { role: 'SOCIO' } })).toBe('contratista');
    expect(accountRole({ user_metadata: { grows_feed_profile: 'inversor', role: 'ADMIN' } })).toBeNull();
  });

  it('shows a visual publication and no profile picker', () => {
    render(<GrowsFeed projects={[work]} requestedObra={false} unavailable={false} account={{ role: 'contratista' }} />);

    expect(screen.getByRole('heading', { name: 'Tu comunidad, en obra.' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Render conceptual de Pasaje Alvear' }).getAttribute('src')).toBe('/images/obras/pasaje-alvear.webp');
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('31');
    expect(screen.getByText('Contratista')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /inversor|proyectista|contratista/i })).toBeNull();
    expect(screen.getByRole('link', { name: 'Mi espacio' }).getAttribute('href')).toBe('/socio/panel');
  });

  it('opens the feed after login even when a visitor starts from a detail link', () => {
    render(<GrowsFeed projects={[work]} project={work} requestedObra unavailable={false} account={null} />);

    expect(screen.getByRole('link', { name: 'Ingresar' }).getAttribute('href')).toBe('/auth/login?redirect=%2Finversores');
    expect(screen.queryByText(work.investorNotes)).toBeNull();
    expect(screen.queryByText(work.contractorNotes)).toBeNull();
  });
  it('shows a frozen trial round and sister projects without exposing private tasks', () => {
    const project={...work,sisterIds:['a0192026-1119-4000-8000-000000000001'],round:{version:1,goal:127256.8,closes:'2026-12-20',conditions:'Condiciones del ensayo',fingerprint:'abc123',mode:'ensayo' as const}};
    render(<GrowsFeed projects={[project]} project={project} requestedObra unavailable={false} account={null}/>);
    expect(screen.getByText('Condiciones del ensayo')).toBeTruthy();
    expect(screen.getByText('Ensayo sin recepción de dinero ni emisión de MCU.')).toBeTruthy();
    expect(screen.getByRole('heading',{name:'Obras hermanas'})).toBeTruthy();
    expect(screen.queryByText('El plan que respalda la ronda')).toBeNull();
  });

});
