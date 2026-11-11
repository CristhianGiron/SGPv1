/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EndpointConsole.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Endpoint Console mediante pruebas de regresión.
 */

import { render, screen, within } from '@testing-library/react';
import { EndpointConsole } from './EndpointConsole';
import { apiRequest } from '../api/client';
import { DOCUMENT_MODULES } from '../config/endpointModules';
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 'test', roles: ['ROLE_ADMIN'] }) }));
jest.mock('../api/client', () => ({ apiRequest: jest.fn(async () => []), unwrapPage: value => value || [], getApiBaseUrl: () => '' }));
jest.mock('./ui/ConfirmDialog', () => ({ useConfirm: () => jest.fn() }));
test('L.6 keeps Enviados beside search and omits filters without alternatives', async () => {
 render(<EndpointConsole activeModuleId="completed-records" modules={DOCUMENT_MODULES} enableListFilters showModuleSwitcher={false} />);
 const toolbar = await screen.findByRole('group', { name: 'Búsqueda y acciones del listado' });
 expect(within(toolbar).getByRole('searchbox')).toBeInTheDocument();
 expect(within(toolbar).getByRole('button', { name: 'Enviados' })).toBeInTheDocument();
 expect(within(toolbar).queryByRole('button', { name: 'Filtros' })).not.toBeInTheDocument();
 expect(within(toolbar).getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
});


test('review filters remain available when students and document states differ', async () => {
 apiRequest.mockImplementation(async path => path.endsWith('/summary') ? [
  {id:1,studentFullName:'Ana',courseName:'Paralelo A',status:'SUBMITTED'},
  {id:2,studentFullName:'Luis',courseName:'Paralelo B',status:'APPROVED'},
 ] : []);
 render(<EndpointConsole activeModuleId="completed-records" modules={DOCUMENT_MODULES} enableListFilters showModuleSwitcher={false} />);
 expect(await screen.findByRole('button',{name:'Filtros'})).toBeInTheDocument();
});
