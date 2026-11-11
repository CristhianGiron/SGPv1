/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CatalogWorkflowPage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Catalog Workflow Page mediante pruebas de regresión.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CatalogWorkflowPage, scopedCatalogResource } from './CatalogWorkflowPage';
import { apiRequest } from '../api/client';
import { UNIVERSITY_CATALOG_RESOURCES, PRACTICE_CATALOG_RESOURCES } from '../config/resources';
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({ token: 'test', roles: ['ROLE_ADMIN'] }) }));
jest.mock('../api/client', () => ({ apiRequest: jest.fn(), unwrapPage: value => Array.isArray(value) ? value : value?.content || [] }));
jest.mock('../components/ui/ConfirmDialog', () => ({ useConfirm: () => jest.fn() }));
jest.mock('../components/ui/PageHeader', () => ({ PageHeader: ({ title }) => <h1>{title}</h1> }));
test.each([
 ['faculties', { institutionId: 1 }, { institutionId: 2 }],
 ['careers', { institutionId: 1, facultyId: 2 }, { facultyId: 8 }],
 ['academic-cycles', { institutionId: 1, facultyId: 2, careerId: 3 }, { careerId: 9 }],
 ['university-subjects', { academicCycleId: 4 }, { academicCycleId: 9 }],
 ['grades', { institutionId: 1 }, { institutionId: 3 }],
 ['grade-parallels', { institutionId: 1, gradeId: 5 }, { gradeId: 8 }],
 ['practice-subjects', { institutionId: 1, gradeId: 5, gradeParallelId: 6 }, { gradeId: 5, gradeParallelId: 8 }],
])('%s filters out records from other parents', (id, fixed, foreign) => {
 const resource = [...UNIVERSITY_CATALOG_RESOURCES, ...PRACTICE_CATALOG_RESOURCES].find(row => row.id === id);
 const scoped = scopedCatalogResource(resource, fixed, {}, jest.fn());
 expect(scoped.rowFilter({ ...fixed })).toBe(true);
 expect(scoped.rowFilter({ ...fixed, ...foreign })).toBe(false);
 expect(scoped.fixedValues).toEqual(fixed);
});
test('opening a university only shows its faculties and creates within that university', async () => {
 apiRequest.mockImplementation(async (path, options) => {
  if (path === '/api/institutions/1') return { id: 1, type: 'UNIVERSIDAD', name: 'Universidad seleccionada' };
  if (path === '/api/faculties' && !options?.method) return [{ id: 10, name: 'Facultad propia', institutionId: 1 }, { id: 20, name: 'Facultad ajena', institutionId: 2 }];
  return {};
 });
 render(<CatalogWorkflowPage kind="universities" route="universities?institutionId=1" />);
 expect(await screen.findByText('Facultad propia')).toBeInTheDocument();
 expect(screen.queryByText('Facultad ajena')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
 expect(screen.queryByLabelText('Universidad')).not.toBeInTheDocument();
 expect(screen.getByText(/Se guardará dentro de: Universidad seleccionada/)).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nueva facultad' } });
 fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'NF-1' } });
 fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
 await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/faculties', expect.objectContaining({ method: 'POST', body: expect.objectContaining({ institutionId: 1, name: 'Nueva facultad' }) })));
});
test('changing query parameters cannot combine unrelated hierarchy records', async () => {
 apiRequest.mockImplementation(async path => path === '/api/institutions/1' ? { id: 1, type: 'UNIVERSIDAD' } : { id: 10, institutionId: 2 });
 render(<CatalogWorkflowPage kind="universities" route="universities?institutionId=1&facultyId=10" />);
 expect(await screen.findByRole('alert')).toHaveTextContent('misma estructura');
 expect(screen.queryByRole('button', { name: 'Agregar' })).not.toBeInTheDocument();
});
