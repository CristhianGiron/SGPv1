/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ListFilters.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente ListFilters de la interfaz del SGP.
 */

import { Field, Input, Select } from "../../../../components/ui/FormControls";
import { FilterPanel } from "../../../../components/ui/FilterPanel";
import { countActiveSelectFilters, hasActiveFilters } from "./listFiltering";

export function ListFilters({ viewKey, onRestore, action, filters, options, showStudentFilter = true, showCourseFilter = true, totalCount, visibleCount, onChange, onClear }) {
  const hasChoices = [options.statuses, showStudentFilter ? options.students : [], showCourseFilter ? options.courses : [], options.tutors, options.cycles].some(choices => choices.length > 1);
  return <FilterPanel showFilters={hasChoices || countActiveSelectFilters(filters) > 0} viewKey={viewKey} savedValue={filters} onRestore={onRestore} activeCount={countActiveSelectFilters(filters)} action={action} hasActiveFilters={hasActiveFilters(filters)} onClear={onClear} summary={`${visibleCount} de ${totalCount} registros`}
    search={<Field label="Buscar"><Input placeholder="Buscar en estos registros" type="search" value={filters.search} onChange={event => onChange('search', event.target.value)} /></Field>}>
    <DocumentSelectFilter label="Estado" options={options.statuses} value={filters.status} onChange={value => onChange('status', value)} />
    {showStudentFilter && <DocumentSelectFilter label="Estudiante" options={options.students} value={filters.student} onChange={value => onChange('student', value)} />}
    {showCourseFilter && <DocumentSelectFilter label="Paralelo" options={options.courses} value={filters.course} onChange={value => onChange('course', value)} />}
    <DocumentSelectFilter label="Tutor" options={options.tutors} value={filters.tutor} onChange={value => onChange('tutor', value)} />
    <DocumentSelectFilter label="Ciclo" options={options.cycles} value={filters.cycle} onChange={value => onChange('cycle', value)} />
  </FilterPanel>;
}

function DocumentSelectFilter({ label, options, value, onChange }) {
  if (options.length < 2 && !value) return null;
  return (
    <Field label={label}>
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

