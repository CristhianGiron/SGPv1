/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PdfPreviewDialog.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de los documentos PDF mediante pruebas de regresión.
 */

import { act, render, screen } from '@testing-library/react';
import { PdfPreviewDialog } from './PdfPreviewDialog';
import { apiBlob } from '../../api/client';
jest.mock('../../api/client', () => ({ apiBlob: jest.fn() }));
jest.mock('../../features/auth/context/AuthContext', () => ({ useAuth: () => ({ token: 'private-token' }) }));
beforeEach(() => { apiBlob.mockReset(); URL.createObjectURL = jest.fn(() => 'blob:private-preview'); URL.revokeObjectURL = jest.fn(); });
test('fetches the authorized PDF without exposing the token in the iframe and frees its URL on close', async () => {
  apiBlob.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }));
  const view = render(<PdfPreviewDialog path="/api/activity-plans/1/pdf/preview" onClose={() => {}} />);
  expect(await screen.findByTitle('Documento PDF de vista previa')).toHaveAttribute('src', 'blob:private-preview');
  expect(apiBlob).toHaveBeenCalledWith('/api/activity-plans/1/pdf/preview', 'private-token');
  view.unmount(); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:private-preview');
});
test('closing during loading ignores the late PDF response', async () => {
  let finish; apiBlob.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<PdfPreviewDialog path="/api/final-reports/1/pdf/preview" onClose={() => {}} />);
  view.unmount(); await act(async () => finish(new Blob(['%PDF'])));
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
