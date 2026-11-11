/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeOfferingsPanel.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las prácticas ofrecidas a un paralelo mediante pruebas de regresión.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PracticeOfferingsPanel } from './PracticeOfferingsPanel';
import { apiRequest } from '../../../api/client';
jest.mock('../../auth/context/AuthContext', () => ({ useAuth: () => ({ token: 'test' }) }));
jest.mock('../../../api/client', () => ({ apiRequest: jest.fn(), unwrapPage: p => Array.isArray(p) ? p : p?.content || [] }));
const mockConfirm = jest.fn(async () => true);
jest.mock('../../../components/ui/ConfirmDialog', () => ({ useConfirm: () => mockConfirm }));
let assigned;
beforeEach(() => {
 assigned = false; mockConfirm.mockReset().mockResolvedValue(true); apiRequest.mockReset();
 apiRequest.mockImplementation(async (path, options) => {
  if (path.endsWith('/practice-offerings')) return [{ id: 30, name: 'Observación', capacity: 10, assignedStudents: assigned ? 1 : 0, enrollmentOpen: true }];
  if (path.endsWith('/practice-roster')) return [{ id: 7, username: 'ana', names: 'Ana' }];
  if (path.endsWith('/enrollments')) return assigned ? [{ practiceId: 30, student: 'ana', status: 'APPROVED' }] : [];
  if (path.endsWith('/groups')) return [{ id: 5, name: 'Grupo escuela', active: true }];
  if (path === '/api/practice-offerings/30/students' && options.method === 'POST') { assigned = true; return { status: 'APPROVED' }; }
  return {};
 });
});
test('tutor assigns a roster student to the selected practice and group, without creation controls', async () => {
 const changed = jest.fn();render(<PracticeOfferingsPanel courseId={10} canCreate={false} onAssigned={changed} />);
 await screen.findByRole('option', { name: /Observación/ });
 expect(screen.queryByRole('button', { name: 'Crear práctica' })).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Práctica para asignar'), { target: { value: '30' } });
 fireEvent.change(screen.getByLabelText('Grupo para los estudiantes'), { target: { value: '5' } });
 fireEvent.click(screen.getByRole('button', { name: 'Inscribir ana' }));
 await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/practice-offerings/30/students', expect.objectContaining({ method: 'POST', body: { studentId: 7, groupId: 5 } })));
 expect(await screen.findByRole('button', { name: 'Inscrito ana' })).toBeDisabled();expect(changed).toHaveBeenCalledTimes(1);
});
test('declining confirmation sends no enrollment', async () => {
 mockConfirm.mockResolvedValueOnce(false);render(<PracticeOfferingsPanel courseId={10} canCreate={false} />);
 await screen.findByRole('option', { name: /Observación/ });
 fireEvent.change(screen.getByLabelText('Práctica para asignar'), { target: { value: '30' } });
 fireEvent.click(screen.getByRole('button', { name: 'Inscribir ana' }));
 await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
 expect(apiRequest.mock.calls.some(([p]) => p.endsWith('/students'))).toBe(false);
});
test('administration creates a practice independently from its academic parallel', async () => {
 render(<PracticeOfferingsPanel courseId={10} canCreate />);await screen.findByRole('option', { name: /Observación/ });
 fireEvent.change(screen.getByLabelText('Nombre de la práctica'), { target: { value: 'Práctica docente' } });
 fireEvent.change(screen.getByLabelText('Cupos de la práctica'), { target: { value: '12' } });
 apiRequest.mockImplementationOnce(async () => ({ id: 31 }));fireEvent.click(screen.getByRole('button', { name: 'Crear práctica' }));
 await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/courses/10/practice-offerings', expect.objectContaining({ method: 'POST', body: { name: 'Práctica docente', capacity: 12, startDate: null, endDate: null } })));
});
