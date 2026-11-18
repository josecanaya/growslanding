import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GrowsFeed from '@/components/grows/GrowsFeed';
import { emptyPublication } from '@/lib/obras/publication';

const withRound = {
  ...emptyPublication('Pasaje Alvear'),
  id: '569e1eda-3fcb-453a-b394-d8a1a536648e',
  visible: true,
  progress: 31,
  milestones: [{ title: 'Fundaciones', status: 'validado' as const }, { title: 'Estructura', status: 'en_curso' as const }],
  simulation: { dia: 37, corrida: '123', fecha: '2026-11-17T12:00:00.000Z', avance_fisico_pct: 31, certificado_pct: 20, pagado_pct: 10, rondas: [{ estado: 'abierta', mcu_integradas: 40 }] },
};
const plain = { ...emptyPublication('Casa patio'), id: '11111111-1111-1111-1111-111111111111', visible: true };

describe('GROWS social feed', () => {
  it('posts validated milestones and filters open rounds', () => {
    render(<GrowsFeed projects={[withRound, plain]} requestedObra={false} unavailable={false} account={{ role: 'inversor' }} />);

    expect(screen.getByText('Fundaciones', { selector: 'strong' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Ver oportunidad/ }).getAttribute('href')).toContain('#inversion');
    expect(screen.getByRole('heading', { name: 'Oportunidades abiertas' })).toBeTruthy();
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Con inversión' }));
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Ver actividad de Casa patio' })).toBeNull();
  });
});

describe('GROWS social actions', () => {
  const social = { [withRound.id]: { follows: 3, supports: 5, comments: 2, following: false, supported: true } };

  it('shows counts and sends visitors to login', () => {
    render(<GrowsFeed projects={[withRound]} requestedObra={false} unavailable={false} account={null} social={social} />);
    expect(screen.getByRole('link', { name: 'Apoyar · 5' }).getAttribute('href')).toContain('/auth/login');
    expect(screen.getByRole('link', { name: 'Comentar en Pasaje Alvear' }).getAttribute('href')).toContain('#comentarios');
  });

  it('lets signed-in users support, follow and read comments', () => {
    render(<GrowsFeed projects={[withRound]} project={withRound} requestedObra={false} unavailable={false} account={{ role: 'inversor' }} social={social}
      comments={[{ id: 'c1', authorName: 'Ana', authorRole: 'inversor', body: '¿Cuándo termina la estructura?', createdAt: '2026-11-17T12:00:00.000Z' }]} />);
    expect(screen.getByRole('button', { name: 'Seguir' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('3 seguidores')).toBeTruthy();
    expect(screen.getByText('¿Cuándo termina la estructura?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeTruthy();
  });

  it('hides social actions when the tables are not available', () => {
    render(<GrowsFeed projects={[withRound]} requestedObra={false} unavailable={false} account={{ role: 'inversor' }} social={null} />);
    expect(screen.queryByRole('button', { name: /Apoyar/ })).toBeNull();
  });
});
