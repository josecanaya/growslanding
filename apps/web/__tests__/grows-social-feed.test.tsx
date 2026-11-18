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

    fireEvent.click(screen.getByRole('button', { name: 'Rondas abiertas' }));
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Ver actividad de Casa patio' })).toBeNull();
  });
});
