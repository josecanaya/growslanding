import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import GrowsFeed from '@/components/grows/GrowsFeed';
import { emptyPublication, publicationSchema, readPublication } from '@/lib/obras/publication';

const run = {
  dia: 37,
  corrida: '44225428280',
  fecha: '2026-11-18T02:44:16Z',
  avance_fisico_pct: 30.71,
  certificado_pct: 22.2,
  pagado_pct: 21.09,
  rondas: [{ estado: 'cerrada_exitosa', mcu_integradas: 2580 }],
};

const work = {
  ...emptyPublication('Pasaje Alvear'),
  id: '569e1eda-3fcb-453a-b394-d8a1a536648e',
  visible: true,
  simulation: run,
};

it('reads approved public map points and validates the automated run independently', () => {
  const complete = { ...work, mapPoint: { lat: -32.94, lng: -60.63 }, simulation: { ...run, privateValue: 'discard' } };
  expect(readPublication(complete)).toMatchObject({ mapPoint: complete.mapPoint, simulation: run });
  expect(readPublication(complete)?.simulation).not.toHaveProperty('privateValue');
  expect(readPublication({ ...complete, simulation: { ...run, dia: 113 } })?.simulation).toBeUndefined();
  expect(readPublication({ ...complete, mapPoint: { lat: -95, lng: 20 } })).toBeNull();
  expect(publicationSchema.parse(complete)).not.toHaveProperty('simulation');
});

it('connects the feed, map and work-specific run', () => {
  const { rerender } = render(<GrowsFeed projects={[work]} requestedObra={false} unavailable={false} account={null} />);
  expect(screen.getByRole('link', { name: 'Ver mapa' }).getAttribute('href')).toBe('/inversores?mapa=1');
  expect(screen.getByRole('link', { name: 'Ver oportunidad' }).getAttribute('href')).toContain('#inversion');

  rerender(<GrowsFeed projects={[work]} project={work} requestedObra unavailable={false} account={null} />);
  expect(screen.getByRole('link', { name: 'Ver en mapa' }).getAttribute('href')).toContain(`mapa=1&obra=${work.id}`);
  expect(screen.getByRole('heading', { name: 'Inversión y rondas' })).toBeTruthy();
  expect(screen.getByText('Cerrada con objetivo alcanzado')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Ver corrida de la automatización' }).getAttribute('href')).toContain(run.corrida);
});
