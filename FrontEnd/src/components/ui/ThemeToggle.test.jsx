/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ThemeToggle.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Theme Toggle mediante pruebas de regresión.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.removeItem('sgp-theme-mode');
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    window.localStorage.removeItem('sgp-theme-mode');
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  test('activa el modo oscuro con la clase dark de Tailwind', async () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: /modo oscuro/i }));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
    });
    expect(document.documentElement).toHaveClass('theme-dark');
    expect(screen.getByRole('button', { name: /modo claro/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('sincroniza varios switches montados en la misma pantalla', async () => {
    render(
      <>
        <ThemeToggle />
        <ThemeToggle />
      </>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /modo oscuro/i })[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /modo claro/i })).toHaveLength(2);
    });
  });
});
