/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useButtonTooltips.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo use Button Tooltips mediante pruebas de regresión.
 */

import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useButtonTooltips } from './useButtonTooltips';

function TooltipTestScreen() {
  const [showMore, setShowMore] = useState(false);
  useButtonTooltips();

  return (
    <>
      <button type="button">Guardar cambios</button>
      <button aria-label="Abrir ayuda" type="button" />
      <button title="Texto propio" type="button">Acción</button>
      <button onClick={() => setShowMore(true)} type="button">Mostrar</button>
      {showMore && <button type="button">Nuevo botón</button>}
    </>
  );
}

test('adds native tooltips to existing and dynamically rendered buttons without replacing explicit titles', async () => {
  render(<TooltipTestScreen />);

  expect(screen.getByRole('button', { name: 'Guardar cambios' })).toHaveAttribute('title', 'Guardar cambios');
  expect(screen.getByRole('button', { name: 'Abrir ayuda' })).toHaveAttribute('title', 'Abrir ayuda');
  expect(screen.getByRole('button', { name: 'Acción' })).toHaveAttribute('title', 'Texto propio');

  fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Nuevo botón' })).toHaveAttribute('title', 'Nuevo botón');
  });
});
