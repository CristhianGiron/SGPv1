/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AppLayout.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo App Layout mediante pruebas de regresión.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import AccessibilityWidget from '../../components/accessibility/AccessibilityWidget';
import { AppLayout } from './AppLayout';

jest.mock('../../features/auth/context/AuthContext', () => ({ useAuth: () => ({ profile: { names: 'Ana', roles: ['ROLE_ESTUDIANTE'] }, roles: ['ROLE_ESTUDIANTE'], logout: jest.fn(), token: '' }) }));
jest.mock('../../hooks/useThemeMode', () => ({ useThemeMode: () => ({ isDark: false }) }));
jest.mock('../../components/Avatar', () => ({ Avatar: () => <span>Avatar</span> }));
jest.mock('../../features/notifications/components/NotificationBell', () => ({ NotificationBell: () => <button>Avisos</button> }));
jest.mock('../../components/ui/ThemeToggle', () => ({ ThemeToggle: () => null }));

test('keeps navigation expanded across routes until the user collapses it', () => {
  const { rerender } = render(<AppLayout route="dashboard"><h1>Inicio</h1></AppLayout>);
  expect(screen.getByRole('button', { name: 'Contraer menu' })).toHaveAttribute('aria-expanded', 'true');
  rerender(<AppLayout route="photos"><h1>Evidencias</h1></AppLayout>);
  expect(screen.getByRole('button', { name: 'Contraer menu' })).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Contraer menu' }));
  rerender(<AppLayout route="profile"><h1>Perfil</h1></AppLayout>);
  expect(screen.getByRole('button', { name: 'Expandir menu' })).toHaveAttribute('aria-expanded', 'false');
});

test('skip link focuses content without replacing the hash route and respects role navigation', () => {
  window.location.hash = '#/photos';
  render(<AppLayout route="photos"><h1>Evidencias</h1></AppLayout>);
  fireEvent.click(screen.getByRole('link', { name: 'Saltar al contenido' }));
  expect(document.getElementById('sgp-main-content')).toHaveFocus();
  expect(window.location.hash).toBe('#/photos');
  const nav = screen.getByRole('navigation', { name: 'Principal' });
  expect(within(nav).getByRole('button', { name: 'Mis prácticas' })).toBeInTheDocument();
  expect(within(nav).queryByRole('button', { name: 'Mis evidencias' })).not.toBeInTheDocument();
  expect(within(nav).queryByRole('button', { name: 'Usuarios' })).not.toBeInTheDocument();
});

test('identifies the selected document in the location trail', () => {
  render(<AppLayout route="documents" routeChild="activity-plans"><h1>Documento</h1></AppLayout>);
  const trail = screen.getByRole('navigation', { name: 'Ubicación actual' });
  expect(within(trail).getByText('L.2. Plan de Actividades')).toHaveAttribute('aria-current', 'page');
});


test('the command search shortcut opens, focuses and closes the platform search', () => {
  render(<AppLayout route="dashboard"><h1>Inicio</h1></AppLayout>);
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
  expect(screen.getByRole('button', { name: 'Buscar en la plataforma' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByPlaceholderText('Buscar pantallas, módulos, textos o acciones')).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('button', { name: 'Buscar en la plataforma' })).toHaveAttribute('aria-expanded', 'false');
});


test('Escape closes accessibility first and then the mobile menu without leaving scroll locked',()=>{
 document.body.style.overflow='auto';
 render(<><AppLayout route="dashboard"><h1>Inicio</h1></AppLayout><AccessibilityWidget/></>);
 fireEvent.click(screen.getByTitle('Abrir menu'));
 fireEvent.click(screen.getByRole('button',{name:'Abrir herramientas de accesibilidad'}));
 fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.queryByRole('dialog',{name:'Accesibilidad'})).not.toBeInTheDocument();
 expect(screen.getByRole('dialog',{name:'Menu principal'})).toBeInTheDocument();
 expect(document.body.style.overflow).toBe('hidden');
 fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.queryByRole('dialog',{name:'Menu principal'})).not.toBeInTheDocument();
 expect(document.body.style.overflow).toBe('auto');
 document.body.style.overflow='';
});
