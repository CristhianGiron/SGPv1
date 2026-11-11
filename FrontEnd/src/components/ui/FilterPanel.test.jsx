/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FilterPanel.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Filter Panel mediante pruebas de regresión.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { FilterPanel } from './FilterPanel';
import { SecondaryButton } from './ActionBar';
import { DataTable } from './DataTable';
function Fixture() {
 const [search, setSearch] = useState('');
 return <FilterPanel activeCount={0} hasActiveFilters={Boolean(search)} onClear={() => setSearch('')} action={<SecondaryButton>Enviados</SecondaryButton>}
 search={<label>Buscar<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>}><label>Estado<select><option>Todos</option></select></label></FilterPanel>;
}
test('search, filters, clear and document actions share one toolbar and retain their behavior', () => {
 render(<Fixture />);
 const toolbar = screen.getByRole('group', { name: 'Búsqueda y acciones del listado' });
 expect(within(toolbar).getByRole('button', { name: 'Enviados' })).toBeInTheDocument();
 fireEvent.change(within(toolbar).getByRole('searchbox'), { target: { value: 'Ana' } });
 expect(within(toolbar).getByRole('button', { name: 'Filtros' })).toBeInTheDocument();
 fireEvent.click(within(toolbar).getByRole('button', { name: 'Limpiar' }));
 expect(within(toolbar).getByRole('searchbox')).toHaveValue('');
 fireEvent.click(within(toolbar).getByRole('button', { name: 'Filtros' }));
 expect(screen.getByRole('dialog', { name: 'Filtros' })).toBeInTheDocument();
});
test('table actions and search stay available while the table loads without rows', () => {
 const refresh = jest.fn();
 render(<DataTable columns={[{ key: 'name', header: 'Nombre' }]} rows={[]} loading enableFilters toolbarActions={<SecondaryButton onClick={refresh}>Actualizar</SecondaryButton>} />);
 const toolbar = screen.getByRole('group', { name: 'Búsqueda y acciones del listado' });
 expect(within(toolbar).getByRole('searchbox')).toBeInTheDocument();
 fireEvent.click(within(toolbar).getByRole('button', { name: 'Actualizar' }));expect(refresh).toHaveBeenCalledTimes(1);
});
