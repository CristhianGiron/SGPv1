/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ModuleTabs.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Module Tabs mediante pruebas de regresión.
 */

import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModuleTab, ModuleTabs } from './ModuleTabs';

function Example() {
  const [selected, setSelected] = useState('Registros');
  return <ModuleTabs aria-label="Documentos">{['Registros', 'Deshabilitada', 'Nuevo'].map((label) => (
    <ModuleTab key={label} active={selected === label} disabled={label === 'Deshabilitada'} onClick={() => setSelected(label)}>{label}</ModuleTab>
  ))}</ModuleTabs>;
}

test('moves focus and selection with arrows, skips disabled tabs and wraps', () => {
  render(<Example />);
  const first = screen.getByRole('tab', { name: 'Registros' });
  const last = screen.getByRole('tab', { name: 'Nuevo' });
  first.focus();
  fireEvent.keyDown(first, { key: 'ArrowRight' });
  expect(last).toHaveFocus();
  expect(last).toHaveAttribute('aria-selected', 'true');
  expect(first).toHaveAttribute('tabindex', '-1');
  fireEvent.keyDown(last, { key: 'ArrowRight' });
  expect(first).toHaveFocus();
  fireEvent.keyDown(first, { key: 'End' });
  expect(last).toHaveFocus();
  fireEvent.keyDown(last, { key: 'Home' });
  expect(first).toHaveFocus();
});

test('supports an empty tab without recursive label resolution', () => {
  render(<ModuleTabs><ModuleTab active aria-label="Resumen" /></ModuleTabs>);
  expect(screen.getByRole('tab', { name: 'Resumen' })).toBeInTheDocument();
});
