/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          practiceCompletion.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo practice Completion mediante pruebas de regresión.
 */

import { practiceCompletionConfirmation } from './practiceCompletion';
import { apiRequest } from '../api/client';
jest.mock('../api/client', () => ({ apiRequest: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

test('loads warnings and hours before offering manual completion', async () => {
  apiRequest.mockResolvedValue({ warnings: ['L.3: documento sin registrar.'], approvedRecordMinutes: 125, institutionalReportMinutes: null, attendanceMinutes: 120 });
  const result = await practiceCompletionConfirmation('/api/enrollments/7/complete', { details: 'Ana' }, 'token');
  expect(apiRequest).toHaveBeenCalledWith('/api/enrollments/7/completion-summary', { token: 'token' });
  expect(result.confirmLabel).toBe('Concluir con advertencias');
  expect(result.details).toContain('L.3: documento sin registrar.');
  expect(result.details).toContain('2 h 5 min');
  expect(result.description).toContain('decisión manual');
});
test('keeps completion manual even without warnings', async () => {
  apiRequest.mockResolvedValue({ warnings: [], approvedRecordMinutes: 120, institutionalReportMinutes: 120, attendanceMinutes: 120 });
  expect((await practiceCompletionConfirmation('/api/enrollments/7/complete', {}, 'token')).confirmLabel).toBe('Concluir práctica');
});
test('does not silently close if the advisory check is unavailable', async () => {
  apiRequest.mockRejectedValue(new Error('Servicio no disponible'));
  await expect(practiceCompletionConfirmation('/api/enrollments/7/complete', {}, 'token')).rejects.toThrow('Servicio no disponible');
  apiRequest.mockResolvedValue({});
  await expect(practiceCompletionConfirmation('/api/enrollments/7/complete', {}, 'token')).rejects.toThrow('No se pudo comprobar');
});
test('other actions keep their existing confirmation without fetching a completion summary', async () => {
  const options = { title: 'Cerrar inscripciones' };
  expect(await practiceCompletionConfirmation('/api/courses/7/lock', options, 'token')).toBe(options);
  expect(apiRequest).not.toHaveBeenCalled();
});
