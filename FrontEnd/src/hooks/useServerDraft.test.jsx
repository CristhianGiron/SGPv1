/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useServerDraft.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo use Server Draft mediante pruebas de regresión.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { useServerDraft } from './useServerDraft';
import { apiRequest } from '../api/client';
jest.mock('../api/client', () => ({ apiRequest: jest.fn() }));
const synced = jest.fn();
function Example({ scope = 'activity-plans:7:new' }) {
  const [value, setValue] = useState({ title: '' });
  const draft = useServerDraft(scope, 'test-token', true, setValue, synced);
  return <><input aria-label="Texto" value={value.title} onChange={event => { const next = { title: event.target.value }; setValue(next); draft.change(next); }} />
    <p role="status">{draft.status}</p>{draft.recovery && <button onClick={draft.recover}>Recuperar</button>}<button onClick={draft.clear}>Limpiar</button><button onClick={draft.retry}>Reintentar</button><button onClick={() => draft.useCurrent(value)}>Conservar</button></>;
}
const empty = { revision: 0, content: null };
const tick = async (ms = 0) => { await act(async () => { jest.advanceTimersByTime(ms); }); };
beforeEach(() => { jest.useFakeTimers(); apiRequest.mockReset(); synced.mockReset(); });
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

test('debounces edits and saves Spanish text to the server', async () => {
  apiRequest.mockResolvedValueOnce(empty).mockResolvedValueOnce({ revision: 1 });
  render(<Example />); await tick();
  fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Educación de María Muñoz' } });
  await tick(800); expect(apiRequest).toHaveBeenCalledTimes(1);
  await tick(500);
  expect(apiRequest.mock.calls[1][1].body).toEqual({ revision: 0, content: JSON.stringify({ title: 'Educación de María Muñoz' }) });
  expect(screen.getByRole('status')).toHaveTextContent('Guardado en el servidor');
  expect(synced).toHaveBeenCalledTimes(1);
});

test('another device can recover a server copy only after an explicit choice', async () => {
  apiRequest.mockResolvedValueOnce({ revision: 8, content: '{"title":"Desde otro equipo"}', savedAt: '2026-11-06T10:00:00' });
  render(<Example />); await tick();
  expect(screen.getByLabelText('Texto')).toHaveValue('');
  fireEvent.click(screen.getByText('Recuperar'));
  expect(screen.getByLabelText('Texto')).toHaveValue('Desde otro equipo');
  await tick(2000); expect(apiRequest).toHaveBeenCalledTimes(1);
});

test('serializes edits made while an earlier save is pending and uses the returned revision', async () => {
  let finish;
  apiRequest.mockResolvedValueOnce(empty).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ revision: 2 });
  render(<Example />); await tick();
  fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Primero' } }); await tick(1300);
  fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Segundo' } }); await tick(1300);
  expect(apiRequest).toHaveBeenCalledTimes(2);
  await act(async () => finish({ revision: 1 }));
  expect(apiRequest.mock.calls[2][1].body).toEqual({ revision: 1, content: '{"title":"Segundo"}' });
  expect(synced).toHaveBeenCalledTimes(1);
});

test('a conflict stops writes and offers the version from the other device', async () => {
  apiRequest.mockResolvedValueOnce(empty).mockRejectedValueOnce(Object.assign(new Error('conflict'), { status: 409 }))
    .mockResolvedValueOnce({ revision: 3, content: '{"title":"Versión externa"}', savedAt: '2026-11-06T11:00:00' });
  render(<Example />); await tick();
  fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Mi versión' } }); await tick(1300);
  expect(screen.getByLabelText('Texto')).toHaveValue('Mi versión');
  fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Sigo escribiendo' } }); await tick(3000);
  expect(apiRequest).toHaveBeenCalledTimes(3);
  fireEvent.click(screen.getByText('Recuperar')); expect(screen.getByLabelText('Texto')).toHaveValue('Versión externa');
});

test('clearing waits for an in-flight save so an old response cannot resurrect the draft', async () => {
  let finish;
  apiRequest.mockResolvedValueOnce(empty).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ revision: 2 });
  render(<Example />); await tick();
  fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Avance' } }); await tick(1300);
  fireEvent.click(screen.getByText('Limpiar')); await tick();
  expect(apiRequest).toHaveBeenCalledTimes(2);
  await act(async () => finish({ revision: 1 }));
  expect(apiRequest.mock.calls[2][1].body).toEqual({ revision: 1, content: null });
});

test('a slow previous-scope response cannot expose its draft in a different practice', async () => {
  let finish;
  apiRequest.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce(empty);
  const view = render(<Example />); await tick();
  view.rerender(<Example scope="activity-plans:8:new" />); await tick();
  await act(async () => finish({ revision: 4, content: '{"title":"Otra práctica"}' }));
  expect(screen.queryByText('Recuperar')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Texto')).toHaveValue('');
});

test('a draft cleared on another device cannot be silently resurrected by a stale client', async () => {
  apiRequest.mockResolvedValueOnce(empty).mockRejectedValueOnce(Object.assign(new Error('conflict'), { status: 409 }))
    .mockResolvedValueOnce({ revision: 2, content: null }).mockResolvedValueOnce({ revision: 3 });
  render(<Example />); await tick();
  fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Copia atrasada' } }); await tick(1300);
  expect(screen.getByRole('status')).toHaveTextContent('fue retirada');
  await tick(3000); expect(apiRequest).toHaveBeenCalledTimes(3);
  expect(screen.getByLabelText('Texto')).toHaveValue('Copia atrasada');
  fireEvent.click(screen.getByText('Conservar')); await tick(1300);
  expect(apiRequest.mock.calls[3][1].body).toEqual({ revision: 2, content: '{"title":"Copia atrasada"}' });
});
