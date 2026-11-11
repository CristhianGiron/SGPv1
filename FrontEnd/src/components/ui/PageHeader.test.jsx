/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PageHeader.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Page Header mediante pruebas de regresión.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

jest.mock('../../api/client', () => ({
  apiRequest: jest.fn().mockResolvedValue([]),
  apiUrl: jest.fn((path) => path),
}));

test('shows contextual screen guidance from the discreet information control', async () => {
  await act(async () => {
    render(
      <PageHeader
        description="Consulta las fotografías de práctica."
        eyebrow="Evidencias"
        title="Evidencias fotograficas"
      />
    );
    await Promise.resolve();
  });

  fireEvent.click(screen.getByRole('button', { name: 'Información sobre Evidencias fotograficas' }));

  expect(screen.getByRole('dialog', { name: 'Acerca de Evidencias fotograficas' })).toBeInTheDocument();
  expect(screen.getByText(/buscar por estudiante, paralelo o descripción/i)).toBeInTheDocument();
});
