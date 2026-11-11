/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActionBar.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Action Bar mediante pruebas de regresión.
 */

import { render, screen } from '@testing-library/react';
import { PrimaryButton, SecondaryButton } from './ActionBar';

describe('ActionBar buttons', () => {
  test('supports icon-only buttons without recursively resolving an empty label', () => {
    render(
      <>
        <PrimaryButton aria-label="Crear documento" />
        <SecondaryButton>{null}</SecondaryButton>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Crear documento' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('resolves labels from nested React elements', () => {
    render(
      <PrimaryButton>
        <span>
          Guardar <strong>documento</strong>
        </span>
      </PrimaryButton>,
    );

    expect(screen.getByRole('button', { name: 'Guardar documento' })).toHaveAttribute(
      'title',
      'Guardar documento',
    );
  });
});

test('colors actions by meaning without changing their labels or enabled state', () => {
 render(<><PrimaryButton>Aprobar</PrimaryButton><SecondaryButton>Eliminar registro</SecondaryButton><SecondaryButton disabled>Reabrir práctica</SecondaryButton><SecondaryButton>Cancelar</SecondaryButton></>);
 expect(screen.getByRole('button', { name: 'Aprobar' })).toHaveAttribute('data-intent', 'success');
 expect(screen.getByRole('button', { name: 'Eliminar registro' })).toHaveAttribute('data-intent', 'danger');
 expect(screen.getByRole('button', { name: 'Reabrir práctica' })).toBeDisabled();
 expect(screen.getByRole('button', { name: 'Reabrir práctica' })).toHaveAttribute('data-intent', 'warning');
 expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute('data-intent', 'neutral');
});
