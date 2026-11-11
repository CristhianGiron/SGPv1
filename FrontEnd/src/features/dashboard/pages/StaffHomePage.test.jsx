/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          StaffHomePage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Staff Home Page mediante pruebas de regresión.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { StaffHomePage } from './StaffHomePage';
let mockRoles = ['ROLE_ADMIN'];
jest.mock('../../auth/context/AuthContext', () => ({ useAuth: () => ({ roles: mockRoles }) }));
jest.mock('../../../components/ui/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));
test('administrator starts from tasks and opens the guided user flow', () => {
 mockRoles = ['ROLE_ADMIN'];render(<StaffHomePage />);
 fireEvent.click(screen.getByRole('button', { name: /Gestionar usuarios/ }));
 expect(window.location.hash).toBe('#accounts');
});
test.each(['ROLE_TUTOR_PRACTICAS', 'ROLE_TUTOR_INSTITUCIONAL'])('tutor home does not offer administrator tasks: %s', role => {
 mockRoles = [role];render(<StaffHomePage />);
 expect(screen.queryByRole('button', { name: /Gestionar usuarios|Organizar estructura/ })).not.toBeInTheDocument();
 expect(screen.getByRole('button', { name: /Seguimiento y pendientes/ })).toBeInTheDocument();
});
