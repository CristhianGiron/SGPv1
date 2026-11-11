/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AccountsPage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las cuentas de usuario mediante pruebas de regresión.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { AccountsPage } from './AccountsPage';
import { apiRequest } from '../../../api/client';
jest.mock('../../auth/context/AuthContext', () => ({ useAuth: () => ({ token: 'test' }) }));
jest.mock('../../../api/client', () => ({ apiRequest: jest.fn(), toQuery: () => '?page=0&size=200', unwrapPage: value => value?.content || value || [] }));
jest.mock('../../../components/ui/ConfirmDialog', () => ({ useConfirm: () => jest.fn() }));
jest.mock('../../../components/ui/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));
test('administrator chooses a role and a user before account actions appear', async () => {
 apiRequest.mockResolvedValue({ content: [{ id: 1, username: 'ana', names: 'Ana', lastNames: 'Torres', roles: ['ROLE_ESTUDIANTE'], enabled: true }, { id: 2, username: 'tutor', names: 'Pedro', roles: ['ROLE_TUTOR_PRACTICAS'], enabled: true }] });
 render(<AccountsPage />);
 fireEvent.click(await screen.findByRole('button', { name: /^Estudiante/ }));
 const open = await screen.findByRole('button', { name: 'Abrir ana' });
 expect(screen.queryByRole('button', { name: 'Abrir tutor' })).not.toBeInTheDocument();
 fireEvent.click(open);
 expect(screen.getByRole('heading', { name: 'Ana Torres' })).toBeInTheDocument();
 expect(screen.getByText('Cuenta seleccionada')).toBeInTheDocument();
 expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
});
