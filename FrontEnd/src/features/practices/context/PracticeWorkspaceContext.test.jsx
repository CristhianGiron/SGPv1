/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeWorkspaceContext.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Practice Workspace Context mediante pruebas de regresión.
 */

import { renderHook, act } from '@testing-library/react';
import { apiRequest } from '../../../api/client';
import { PracticeWorkspaceContext, scopePracticePayload, usePracticeRequest } from './PracticeWorkspaceContext';
jest.mock('../../../api/client', () => ({ apiRequest: jest.fn() }));
const practice = { id: 7, status: 'APPROVED', courseActive: true };
test.each(['activity-plans/me/summary', 'practice-reports/review/summary', 'final-reports/managed', 'activity-evaluations/me/summary', 'practice-follow-up-reports/managed', 'completed-activity-records/me/summary', 'practice-photos/review', 'practice-forms/assigned', 'practice-schedules/me', 'didactic-plans/managed'])('%s only retains records belonging to the selected practice', path => {
 expect(scopePracticePayload(`/api/${path}`, [{ id: 1, enrollmentId: 7 }, { id: 2, enrollmentId: 8 }, { id: 3 }], practice)).toEqual([{ id: 1, enrollmentId: 7 }]);
});
test('enrollment selection uses enrollment IDs, preserves catalogs and rejects foreign record details', () => {
 expect(scopePracticePayload('/api/enrollments/me', [{ id: 7 }, { id: 8 }], practice)).toEqual([{ id: 7 }]);
 const catalog = [{ id: 8 }];
 expect(scopePracticePayload('/api/grades', catalog, practice)).toBe(catalog);
 expect(() => scopePracticePayload('/api/practice-forms/9', { id: 9, enrollmentId: 8 }, practice)).toThrow(/otra práctica/);
});
test('changing enrollment in a creation payload is rejected before an API write', async () => {
 apiRequest.mockClear();
 const wrapper = ({ children }) => <PracticeWorkspaceContext.Provider value={practice}>{children}</PracticeWorkspaceContext.Provider>;
 const { result } = renderHook(usePracticeRequest, { wrapper });
 await act(async () => { await expect(result.current('/api/didactic-plans', { method: 'POST', body: { enrollmentId: 8 } })).rejects.toThrow(/práctica actual/); });
 expect(apiRequest).not.toHaveBeenCalled();
});
test('historical workspaces prevent creation while retaining read access', async () => {
 apiRequest.mockReset();apiRequest.mockResolvedValue([{ id: 1, enrollmentId: 7 }]);
 const wrapper = ({ children }) => <PracticeWorkspaceContext.Provider value={{ ...practice, status: 'COMPLETED' }}>{children}</PracticeWorkspaceContext.Provider>;
 const { result } = renderHook(usePracticeRequest, { wrapper });
 await expect(result.current('/api/practice-forms', { method: 'POST', body: { enrollmentId: 7 } })).rejects.toThrow(/consulta/);
 expect(await result.current('/api/practice-forms/me')).toHaveLength(1);
 expect(apiRequest).toHaveBeenCalledTimes(1);
});
