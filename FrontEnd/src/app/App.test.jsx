/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          App.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo App mediante pruebas de regresión.
 */

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /iniciar sesi[oó]n/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
});
