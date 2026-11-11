/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseRoster.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de los paralelos académicos mediante pruebas de regresión.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CourseRoster } from './CourseRoster';
import { apiRequest } from '../api/client';
jest.mock('../api/client', () => ({ apiRequest: jest.fn() }));
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 'fixture', roles: ['ROLE_DIRECTOR_PRACTICAS'] }) }));
jest.mock('./ui/ConfirmDialog', () => ({ useConfirm: () => jest.fn().mockResolvedValue(true) }));
jest.mock('./ui/EntitySelect', () => ({ EntitySelect: ({ value, onChange }) => <select aria-label="Elegir estudiante" value={value} onChange={e => onChange(e.target.value)}><option value="">Elegir</option><option value="7">Ana</option></select> }));
jest.mock('./ui/DataTable', () => ({ DataTable: ({ rows, columns }) => <div>{rows.map(row => <div key={row.id}>{row.username}{columns.find(column => column.key === 'actions').render(row)}</div>)}</div> }));
beforeEach(() => jest.clearAllMocks());
test('assigns an academic membership and then refreshes the roster', async () => {
  let assigned = false;
  apiRequest.mockImplementation(async (_path, options) => {
    if (options.method === 'PUT') { assigned = true; return {}; }
    return assigned ? [{ id: 7, username: 'ana', active: true }] : [];
  });
  render(<CourseRoster courseId={10} courseName="Paralelo A" />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Actualizar pertenencias' })).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Elegir estudiante'), { target: { value: '7' } });
  fireEvent.click(screen.getByRole('button', { name: 'Asignar al paralelo' }));
  await screen.findByText('Estudiante asignado al paralelo');
  expect(apiRequest).toHaveBeenCalledWith('/api/courses/10/students/7', { token: 'fixture', method: 'PUT' });
  expect(screen.getByText('ana')).toBeInTheDocument();
});
test('withdraws membership explicitly and keeps an option to restore it', async () => {
  let active = true;
  apiRequest.mockImplementation(async (_path, options) => {
    if (options.method === 'DELETE') { active = false; return; }
    return [{ id: 7, username: 'ana', active }];
  });
  render(<CourseRoster courseId={10} courseName="Paralelo A" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retirar pertenencia' }));
  await screen.findByText('Pertenencia retirada');
  expect(apiRequest).toHaveBeenCalledWith('/api/courses/10/students/7', { token: 'fixture', method: 'DELETE' });
  expect(screen.getByRole('button', { name: 'Restaurar pertenencia' })).toBeInTheDocument();
});
