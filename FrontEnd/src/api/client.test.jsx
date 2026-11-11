/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          client.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo client mediante pruebas de regresión.
 */

import { apiRequest, toQuery } from './client';

describe('Transporte de texto en español', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('conserva nombres, signos y tildes al enviar y recibir JSON', async () => {
    const payload = {
      nombre: 'María José Muñoz Peñafiel',
      pregunta: '¿Qué aprendió el niño? ¡Educación y lingüística!',
      pegado: 'Evaluacio\u0301n',
    };
    global.fetch = jest.fn(async (_url, request) => {
      expect(request.headers['Content-Type']).toBe('application/json; charset=UTF-8');
      expect(JSON.parse(request.body)).toEqual(payload);
      return {
        ok: true,
        headers: { get: () => 'application/json; charset=UTF-8' },
        json: async () => JSON.parse(request.body),
      };
    });

    await expect(apiRequest('/api/practice-forms', { method: 'POST', body: payload })).resolves.toEqual(payload);
  });

  test('mantiene los campos en español al adjuntar una imagen', async () => {
    const body = new FormData();
    body.append('nombre', 'Institución de Educación Básica');
    body.append('imagen', new Blob(['imagen']), 'membrete.png');
    global.fetch = jest.fn(async (_url, request) => {
      expect(request.body).toBe(body);
      expect(request.body.get('nombre')).toBe('Institución de Educación Básica');
      // El navegador debe generar el boundary de multipart/form-data.
      expect(request.headers['Content-Type']).toBeUndefined();
      return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ id: 1 }) };
    });

    await expect(apiRequest('/api/images', { method: 'POST', body })).resolves.toEqual({ id: 1 });
  });

  test('codifica las búsquedas sin perder ñ, ü ni tildes', () => {
    const search = 'Muñoz, pedagogía y lingüística';
    expect(new URLSearchParams(toQuery({ search })).get('search')).toBe(search);
  });
});
