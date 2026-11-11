/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionalLetterhead.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las instituciones mediante pruebas de regresión.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EndpointConsole } from './EndpointConsole';
import { DOCUMENT_MODULES } from '../config/endpointModules';
import { apiRequest } from '../api/client';

const mockAuth = { token: 'test', roles: ['ROLE_TUTOR_INSTITUCIONAL'] };
const mockConfirm = jest.fn(async () => true);
jest.mock('../auth/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../api/client', () => ({ apiRequest: jest.fn(), apiBlob: jest.fn(), unwrapPage: value => value || [], getApiBaseUrl: () => '' }));
jest.mock('./ui/ConfirmDialog', () => ({ useConfirm: () => mockConfirm }));

const record = {
  id: 9, status: 'SUBMITTED', studentFullName: 'Estudiante',
  completedHours: 46, completedMinutes: 55, reportDate: '2026-11-04',
  conclusion1: 'Conclusión guardada', conclusion2: '', conclusion3: '',
  recommendation1: 'Recomendación guardada', recommendation2: '', recommendation3: '',
};

beforeEach(() => {
  mockConfirm.mockResolvedValue(true);
  window.location.hash = '#documents/final-reports?id=9&operation=actions';
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
  apiRequest.mockReset();
  apiRequest.mockImplementation(async (path, options) => {
    if (options?.method) return { ...record, letterheadImageUrl: null };
    return path.endsWith('/9') ? record : [record];
  });
});

afterEach(() => { window.location.hash = ''; });

test('the institutional L3 form loads saved values and submits its letterhead with them', async () => {
  render(<EndpointConsole activeModuleId="final-reports" modules={DOCUMENT_MODULES} showModuleSwitcher={false} />);
  const input = await screen.findByLabelText('Membrete institucional del L.3');
  expect(await screen.findByDisplayValue('Conclusión guardada')).toBeInTheDocument();
  expect(screen.getByDisplayValue('46')).toBeInTheDocument();
  expect(screen.getByDisplayValue('55')).toBeInTheDocument();
  const image = new File(['png'], 'membrete.png', { type: 'image/png' });
  fireEvent.change(input, { target: { files: [image] } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar comentarios institucionales' }));
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/final-reports/9/institutional-section', expect.objectContaining({ method: 'PATCH', body: expect.any(FormData) })));
  const request = apiRequest.mock.calls.find(([path, options]) => path.endsWith('/institutional-section') && options?.method);
  expect(request[1].body.get('image')).toBe(image);
  const data = request[1].body.get('data');
  const json = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(data); });
  expect(JSON.parse(json)).toMatchObject({ completedHours: 46, completedMinutes: 55, conclusion1: 'Conclusión guardada' });
});

test('an invalid attachment is rejected in the same form', async () => {
  render(<EndpointConsole activeModuleId="final-reports" modules={DOCUMENT_MODULES} showModuleSwitcher={false} />);
  const input = await screen.findByLabelText('Membrete institucional del L.3');
  fireEvent.change(input, { target: { files: [new File(['pdf'], 'membrete.pdf', { type: 'application/pdf' })] } });
  expect(await screen.findByText('Selecciona una imagen JPG o PNG.')).toBeInTheDocument();
  expect(screen.queryByAltText('Vista previa de la imagen elegida')).not.toBeInTheDocument();
});
