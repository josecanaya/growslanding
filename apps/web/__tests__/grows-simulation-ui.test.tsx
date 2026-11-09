import { act as reactAct, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const identity = vi.hoisted(() => ({ user: { id: 'user-1', user_metadata: { name: 'Ana Torres' } } as any, profile: 'profesional' as string | null, ready: true, chooseProfile: vi.fn() }));
vi.mock('@/components/grows/useFeedIdentity', () => ({ useFeedIdentity: () => identity }));
import Simulation from '@/components/grows/Simulation';
beforeEach(() => { identity.user = { id: 'user-1', user_metadata: { name: 'Ana Torres' } }; identity.profile = 'profesional'; identity.ready = true; identity.chooseProfile.mockReset(); window.history.replaceState(null, '', '/inversores/simulacion'); });
afterEach(cleanup);
it('abre una obra y comparte la validación entre participaciones', () => {
  window.scrollTo = vi.fn();
  render(<Simulation />);
  fireEvent.click(screen.getByRole('button', { name: 'Abrir Casa Patio' }));
  expect(screen.getByRole('heading', { name: 'Casa Patio' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Trabajos' }));
  fireEvent.click(screen.getByRole('button', { name: 'Validar avance' }));
  identity.profile = 'inversor';
  expect(screen.getByText('67% de hitos validados')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Actividad' }));
  expect(screen.getByText('Validó Estructura. Se habilita Mampostería.')).toBeTruthy();
  expect(screen.queryByText(/Acta ficticia/)).toBeNull();
});
it('mantiene el feed público y pide login solo al abrir una obra', () => {
  identity.user = null; identity.profile = null;
  render(<Simulation />);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Abrir Casa Patio' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toBe('/auth/login?redirect=%2Finversores%2Fsimulacion%3Fobra%3Ddemo-1');
  expect(screen.queryByRole('heading', { name: 'Casa Patio' })).toBeNull();
});
it('recupera la obra del enlace después de iniciar sesión y solicita perfil si falta', async () => {
  window.history.replaceState(null, '', '/inversores/simulacion?obra=demo-2');
  identity.profile = null;
  render(<Simulation />);
  expect(screen.getByRole('heading', { name: '¿Cómo participás en Grows?' })).toBeTruthy();
  await reactAct(async () => { fireEvent.click(screen.getByRole('button', { name: /Inversor Hitos/ })); });
  expect(identity.chooseProfile).toHaveBeenCalledWith('inversor');
});
it('un inversor entra directamente a su vista sin selector de prueba', () => {
  identity.profile = 'inversor';
  window.history.replaceState(null, '', '/inversores/simulacion?obra=demo-3');
  render(<Simulation />);
  expect(screen.getByRole('heading', { name: 'Taller del Sur' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'La evolución de tu obra' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Explorá acciones MCU' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Inversión' }).className).toContain('font-semibold');
  expect(screen.queryByRole('button', { name: 'Profesional' })).toBeNull();
});
it('filtra publicaciones guardadas sin instructivos', () => {
  window.scrollTo = vi.fn();
  render(<Simulation />);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Casa Patio' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Guardados' })[0]);
  expect(screen.getByAltText('Obra Casa Patio en Rosario')).toBeTruthy();
  expect(screen.queryByAltText('Obra Ribera Norte en Santa Fe')).toBeNull();
  expect(screen.queryByText('Escenario a resolver')).toBeNull();
});
