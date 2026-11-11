/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeWorkspacePage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Practice Workspace Page mediante pruebas de regresión.
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PracticeWorkspacePage } from './PracticeWorkspacePage';
import { apiRequest } from '../api/client';
let mockRoles = ['ROLE_ESTUDIANTE'];
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 'test', roles: mockRoles, profile: { id: 1 } }) }));
jest.mock('../api/client', () => ({ apiRequest: jest.fn(), unwrapPage: value => Array.isArray(value) ? value : value?.content || [], apiBlob: jest.fn(), isAccessDeniedMessage: () => false }));
jest.mock('../components/ui/PageHeader', () => ({ PageHeader: ({ title, description, action }) => <header><h1>{title}</h1><p>{description}</p>{action}</header> }));
jest.mock('../components/ui/ConfirmDialog', () => ({ useConfirm: () => jest.fn() }));
const practices = [
 { id: 7, courseId: 10, courseName: 'Práctica de informática', studentFullName: 'Ana', status: 'APPROVED', courseActive: true },
 { id: 8, courseId: 20, courseName: 'Práctica anterior', studentFullName: 'Luis', status: 'COMPLETED', archived: true },
];
beforeEach(() => { mockRoles = ['ROLE_ESTUDIANTE']; apiRequest.mockReset(); apiRequest.mockImplementation(async path => path === '/api/enrollments/practices' ? practices : path === '/api/practice-photos/me' ? [{ id: 1, enrollmentId: 7, description: 'Evidencia actual' }, { id: 2, enrollmentId: 8, description: 'Evidencia de otra práctica' }] : path === '/api/enrollments/me' ? practices : []); });
test('student starts with current practice cards, can open a practice and find history', async () => {
 render(<PracticeWorkspacePage />);
 const card = await screen.findByRole('button', { name: /Práctica de informática.*Abrir práctica/ });
 expect(screen.queryByRole('button', { name: /Práctica anterior.*Abrir práctica/ })).not.toBeInTheDocument();
 fireEvent.click(card);expect(window.location.hash).toBe('#practices/7');
 fireEvent.change(screen.getByLabelText('Estado de las prácticas'), { target: { value: 'history' } });
 expect(screen.getByRole('button', { name: /Práctica anterior.*Abrir práctica/ })).toBeInTheDocument();
});
test('tutor opens a parallel before seeing its students', async () => {
 mockRoles = ['ROLE_TUTOR_PRACTICAS'];render(<PracticeWorkspacePage />);
 fireEvent.click(await screen.findByRole('button', { name: /Práctica de informática/ }));
 expect(screen.getByRole('button', { name: /Ana.*Abrir práctica/ })).toBeInTheDocument();
 expect(screen.queryByRole('button', { name: /Luis.*Abrir práctica/ })).not.toBeInTheDocument();
});
test('workspace retains only selected practice photos and carries the practice into the upload form', async () => {
 render(<PracticeWorkspacePage route="practices/7/photos" />);
 expect(await screen.findByText('Evidencia actual')).toBeInTheDocument();
 expect(screen.queryByText('Evidencia de otra práctica')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('tab', { name: 'Subir evidencia' }));
 expect(screen.queryByLabelText('Paralelo de práctica')).not.toBeInTheDocument();
 expect(screen.queryByText(/paralelos activos/)).not.toBeInTheDocument();
 const file = new File(['fixture'], 'evidencia.png', { type: 'image/png' });
 fireEvent.change(screen.getByLabelText('Fotografia'), { target: { files: [file] } });
 apiRequest.mockResolvedValueOnce({ id: 3, enrollmentId: 7, description: 'Nueva evidencia' });
 fireEvent.click(screen.getByRole('button', { name: 'Subir evidencia' }));
 await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/practice-photos', expect.objectContaining({ method: 'POST' })));
 const [, request] = apiRequest.mock.calls.find(([path, options]) => path === '/api/practice-photos' && options?.method === 'POST');
 expect(request.body.get('enrollmentId')).toBe('7');
 expect(request.body.get('file')).toBe(file);
});
test('unknown practice cannot render any operational sections', async () => {
 render(<PracticeWorkspacePage route="practices/999/photos" />);
 expect(await screen.findByRole('heading', { name: 'Práctica no disponible' })).toBeInTheDocument();
 expect(screen.queryByRole('navigation', { name: 'Secciones de la práctica' })).not.toBeInTheDocument();
});
test('institution director sees institutional tasks without requesting other roles enrollment lists', async () => {
 mockRoles = ['ROLE_DIRECTORA_INSTITUCION'];render(<PracticeWorkspacePage />);
 expect(screen.getByRole('heading', { name: 'Mi institución' })).toBeInTheDocument();
 expect(screen.getByRole('button', { name: /Entrevistas asignadas/ })).toBeInTheDocument();
 expect(apiRequest.mock.calls.some(([path]) => path === '/api/enrollments/practices')).toBe(false);
});
test('completed practice hides upload and delete actions', async () => {
 render(<PracticeWorkspacePage route="practices/8/photos" />);
 expect(await screen.findByText('Evidencia de otra práctica')).toBeInTheDocument();
 expect(screen.queryByRole('tab', { name: 'Subir evidencia' })).not.toBeInTheDocument();
 expect(screen.queryByRole('button', { name: /Eliminar/ })).not.toBeInTheDocument();
 expect(within(screen.getByRole('navigation', { name: 'Secciones de la práctica' })).getByLabelText('Apartado de la práctica')).toHaveValue('photos');
});
test('documents open a choice of authorized documents before mounting a document form', async () => {
 render(<PracticeWorkspacePage route="practices/7/documents" />);
 const document = await screen.findByRole('button', { name: /L.2. Plan de Actividades/ });
 expect(apiRequest.mock.calls.some(([path]) => path.startsWith('/api/activity-plans'))).toBe(false);
 fireEvent.click(document);
 expect(window.location.hash).toBe('#practices/7/documents/activity-plans');
});
test('a role cannot open an unrelated workspace section by editing the URL', async () => {
 mockRoles = ['ROLE_TUTOR_INSTITUCIONAL'];
 render(<PracticeWorkspacePage route="practices/7/observation-forms" />);
 expect(await screen.findByText('Esta sección no está disponible para tu rol.')).toBeInTheDocument();
 expect(apiRequest.mock.calls.some(([path]) => path.includes('/observations'))).toBe(false);
});
test('student sees distinct assigned practices of one parallel without self enrollment controls', async () => {
 apiRequest.mockResolvedValue([
  { id: 70, courseId: 10, courseName: 'Paralelo A', practiceName: 'Observación docente', status: 'APPROVED', courseActive: true },
  { id: 71, courseId: 10, courseName: 'Paralelo A', practiceName: 'Intervención docente', status: 'APPROVED', courseActive: true },
 ]);
 render(<PracticeWorkspacePage />);
 expect(await screen.findByRole('button', { name: /Observación docente.*Abrir práctica/ })).toBeInTheDocument();
 expect(screen.getByRole('button', { name: /Intervención docente.*Abrir práctica/ })).toBeInTheDocument();
 expect(screen.queryByRole('button', { name: /Solicitar|Inscribirme|Cancelar inscripción/ })).not.toBeInTheDocument();
 expect(apiRequest.mock.calls.some(([path]) => path.includes('/courses'))).toBe(false);
});
