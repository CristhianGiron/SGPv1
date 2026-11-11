/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          pagination.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo pagination mediante pruebas de regresión.
 */

import { fetchAllPages } from './pagination';

test('retrieves every page and preserves filters and credentials', async () => {
  const options = { token: 'fixture' };
  const request = jest.fn()
    .mockResolvedValueOnce({ content: [{ id: 1 }], number: 0, totalPages: 3, last: false })
    .mockResolvedValueOnce({ content: [{ id: 2 }], number: 1, totalPages: 3, last: false })
    .mockResolvedValueOnce({ content: [{ id: 3 }], number: 2, totalPages: 3, last: true });
  await expect(fetchAllPages(request, '/api/courses?active=true&size=1', options)).resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  expect(request).toHaveBeenNthCalledWith(2, '/api/courses?active=true&size=1&page=1', options);
  expect(request).toHaveBeenNthCalledWith(3, '/api/courses?active=true&size=1&page=2', options);
});

test('supports unpaged endpoints', async () => {
  const request = jest.fn().mockResolvedValue([{ id: 7 }]);
  await expect(fetchAllPages(request, '/api/records')).resolves.toEqual([{ id: 7 }]);
  expect(request).toHaveBeenCalledTimes(1);
});

test('rejects a server that returns the same page again', async () => {
  const request = jest.fn().mockResolvedValue({ content: [{ id: 1 }], number: 0, totalPages: 2, last: false });
  await expect(fetchAllPages(request, '/api/records')).rejects.toThrow('No se pudo completar');
});

test('does not silently return a partial list if a later page fails', async () => {
  const request = jest.fn().mockResolvedValueOnce({ content: [{ id: 1 }], totalPages: 2 }).mockRejectedValueOnce(new Error('Sin conexión'));
  await expect(fetchAllPages(request, '/api/records')).rejects.toThrow('Sin conexión');
});
