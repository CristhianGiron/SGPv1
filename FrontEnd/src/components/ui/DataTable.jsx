import { useMemo, useState } from 'react';
import { CheckCircle2, SlidersHorizontal, XCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Modal } from './Modal';
import { formatValue } from '../../utils/format';

const tableShellClass =
  'sgp-table-shell min-w-0 max-w-full overflow-hidden rounded-lg border border-line bg-panel shadow-card dark:border-line dark:bg-surface';

const tableClass =
  'w-max min-w-full table-auto border-separate border-spacing-0 text-sm lg:w-full';

const tableHeadClass =
  'bg-[var(--module-table)] text-left text-xs font-medium uppercase text-[color:var(--module-table-ink)] dark:bg-[var(--module-table)] dark:text-[color:var(--module-table-ink)]';

const tableCellClass =
  'border-b border-line-soft px-3 py-2.5 align-middle text-body dark:border-line dark:text-ink';

const fieldLabelClass =
  'mb-1.5 block text-[0.82rem] font-medium text-body dark:text-ink';

const fieldClass =
  'min-h-[2.5rem] w-full rounded-lg border border-line bg-field px-3 py-2 text-sm text-heading outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted hover:border-line-strong focus:border-primary-strong focus:ring-4 focus:ring-focus-soft disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-muted dark:border-line dark:bg-page dark:text-heading dark:placeholder:text-muted dark:hover:border-line-strong dark:focus:border-info dark:focus:ring-focus-soft';

const secondaryButtonClass =
  'inline-flex min-h-[2.5rem] items-center justify-center rounded-lg border border-accent bg-accent-soft px-3 py-2 text-sm font-medium text-accent-strong transition-colors hover:border-accent-strong hover:bg-accent hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 disabled:cursor-not-allowed disabled:opacity-60 dark:border-accent/40 dark:bg-accent-soft dark:text-accent-strong dark:hover:border-accent dark:hover:bg-hover-soft';

export function DataTable({
  columns,
  rows,
  emptyText = 'Aun no hay registros para mostrar.',
  enableFilters = false,
  filterFields,
  keyField = 'id',
  loading = false,
}) {
  const visibleColumns = columns.filter((column) => column.key !== 'id' && column.header !== 'ID');
  const actionColumn = visibleColumns.find((column) => column.key === 'actions');
  const renderedColumns = actionColumn
    ? [...visibleColumns.filter((column) => column.key !== 'actions'), actionColumn]
    : visibleColumns;
  const availableFilterFields = useMemo(
    () => (filterFields || buildDefaultFilterFields(rows)).filter((field) => fieldHasOptions(rows, field)),
    [filterFields, rows]
  );
  const [filters, setFilters] = useState({
    search: '',
    fields: {},
  });
  const filteredRows = useMemo(
    () => (enableFilters ? filterRows(rows || [], filters, availableFilterFields) : rows),
    [availableFilterFields, enableFilters, filters, rows]
  );
  const effectiveRows = enableFilters ? filteredRows : rows;
  const hasFilters = hasActiveFilters(filters);

  if (loading && !effectiveRows?.length) {
    return <TableSkeleton columns={visibleColumns} />;
  }

  return (
    <div className="min-w-0 max-w-full space-y-3">
      {enableFilters && (
        <TableFilters
          fields={availableFilterFields}
          filters={filters}
          rows={rows || []}
          totalCount={rows?.length || 0}
          visibleCount={effectiveRows?.length || 0}
          onChange={setFilters}
        />
      )}

      {!effectiveRows?.length ? (
        <EmptyState text={hasFilters ? 'No se encontraron resultados con los filtros aplicados.' : emptyText} />
      ) : (
        <div className={tableShellClass} aria-busy={loading || undefined}>
          <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <table className={tableClass}>
              <colgroup>
                {renderedColumns.map((column) => (
                  <col key={column.key} style={getColumnStyle(column.key)} />
                ))}
              </colgroup>
              <thead className={tableHeadClass}>
                <tr>
                  {renderedColumns.map((column) => (
                    <th
                      className={`${getHeaderCellClass(column.key)} ${getHeaderWrapClass(column.key)}`}
                      key={column.key}
                      scope="col"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {effectiveRows.map((row, rowIndex) => (
                  <tr
                    className={`${rowIndex % 2 === 1 ? 'bg-panel-soft dark:bg-page/40' : 'bg-panel dark:bg-surface'} hover:bg-info-soft dark:hover:bg-info-soft`}
                    key={row[keyField] || `${keyField}-${rowIndex}`}
                  >
                    {renderedColumns.map((column) => (
                      <td
                        className={`${getBodyCellClass(column.key)} ${getCellWrapClass(column.key)}`}
                        key={column.key}
                      >
                        {column.render ? column.render(row) : formatValue(row[column.key], column.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TableFilters({ fields, filters, rows, totalCount, visibleCount, onChange }) {
  const hasFilters = hasActiveFilters(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const selectedFieldCount = Object.values(filters.fields || {}).filter(Boolean).length;

  function setSearch(value) {
    onChange((current) => ({
      ...current,
      search: value,
    }));
  }

  function setFieldFilter(fieldKey, value) {
    onChange((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [fieldKey]: value,
      },
    }));
  }

  function clearFilters() {
    onChange({
      search: '',
      fields: {},
    });
  }

  return (
    <div className="rounded-lg border border-line bg-panel-soft p-3 dark:border-line dark:bg-surface">
      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,34rem)_auto] lg:items-end lg:justify-between">
        <label className="block min-w-0 max-w-xl">
          <span className={fieldLabelClass}>Buscar</span>
          <input
            className={fieldClass}
            placeholder="Texto, paralelo o estudiante"
            type="search"
            value={filters.search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="flex items-end gap-2">
          {fields.length > 0 && (
            <button className={secondaryButtonClass} onClick={() => setFiltersOpen(true)} type="button">
              <span className="inline-flex items-center justify-center gap-2">
                <SlidersHorizontal size={16} />
                {selectedFieldCount ? `Filtros (${selectedFieldCount})` : 'Filtros'}
              </span>
            </button>
          )}
          <button className={secondaryButtonClass} disabled={!hasFilters} onClick={clearFilters} type="button">
            <span className="inline-flex items-center justify-center gap-2">
              <XCircle size={16} />
              Limpiar
            </span>
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-body">
        {visibleCount} de {totalCount} resultados
      </p>
      <Modal
        maxWidth="max-w-3xl"
        onClose={() => setFiltersOpen(false)}
        open={filtersOpen}
        title="Filtros"
      >
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <label className="block" key={field.key}>
                  <span className={fieldLabelClass}>{field.label}</span>
                  <select
                    className={fieldClass}
                    value={filters.fields?.[field.key] || ''}
                    onChange={(event) => setFieldFilter(field.key, event.target.value)}
                  >
                    <option value="">Todos</option>
                    {buildFilterOptions(rows, field).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className={secondaryButtonClass} disabled={!hasFilters} onClick={clearFilters} type="button">
                <span className="inline-flex items-center justify-center gap-2">
                  <XCircle size={16} />
                  Limpiar
                </span>
              </button>
              <button className={secondaryButtonClass} onClick={() => setFiltersOpen(false)} type="button">
                <span className="inline-flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  Aplicar
                </span>
              </button>
            </div>
      </Modal>
    </div>
  );
}

function buildDefaultFilterFields(rows = []) {
  const fields = [];

  if (rows.some((row) => getStudentValue(row))) {
    fields.push({
      key: 'student',
      label: 'Estudiante',
      getValue: getStudentValue,
    });
  }

  if (rows.some((row) => getCourseValue(row))) {
    fields.push({
      key: 'course',
      label: 'Paralelo',
      getValue: getCourseValue,
    });
  }

  if (rows.some((row) => getStatusValue(row) !== '')) {
    fields.push({
      key: 'status',
      label: 'Estado',
      getValue: getStatusValue,
      format: (value) => formatValue(value, 'status'),
    });
  }

  return fields;
}

function fieldHasOptions(rows, field) {
  return buildFilterOptions(rows || [], field).length > 0;
}

function buildFilterOptions(rows, field) {
  const options = new Map();

  rows.forEach((row) => {
    const rawValue = field.getValue(row);

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return;
    }

    const value = String(rawValue);

    if (!options.has(value)) {
      options.set(value, {
        value,
        label: field.format ? field.format(rawValue) : value,
      });
    }
  });

  return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

function filterRows(rows, filters, fields) {
  if (!hasActiveFilters(filters)) {
    return rows;
  }

  return rows.filter((row) => {
    if (filters.search && !matchesSearch(row, filters.search)) {
      return false;
    }

    return fields.every((field) => {
      const selected = filters.fields?.[field.key];

      if (!selected) {
        return true;
      }

      return String(field.getValue(row)) === selected;
    });
  });
}

function isParagraphColumn(key = '') {
  return /activities|scheduledActivities|developedActivities|description|presentation|objective|methodology|antecedents|conclusion|recommendation|observation|observations|notes|feedback|suggestions|resources|approval|evidence|summary|result/i.test(key);
}

function isCompactColumn(key = '') {
  return /^(actions|status|state|enabled|active|locked|archived|deleted|visible|read|id)$/i.test(key)
    || /(status|state|date|at|count|total|number|code|cedula|phone|role)$/i.test(key);
}

function getColumnStyle(key = '') {
  if (key === 'actions') {
    return { width: '5.25rem' };
  }

  if (/^(status|state|enabled|active|locked|archived|deleted|visible|read)$/i.test(key)) {
    return { width: '8rem' };
  }

  if (/^(id|code|codigo|cedula|phone|number)$/i.test(key) || /(code|codigo|cedula|phone|number)$/i.test(key)) {
    return { width: '8.5rem' };
  }

  if (/(date|at)$/i.test(key)) {
    return { width: '11rem' };
  }

  if (isParagraphColumn(key)) {
    return { width: '24rem' };
  }

  if (/(student|name|nombre|title|titulo|institution|community|comunidad|career|faculty|course|parallel|paralelo|cohort|ciclo)$/i.test(key)) {
    return { width: '16rem' };
  }

  return { width: '12rem' };
}

function getHeaderCellClass(key = '') {
  const stickyClass = key === 'actions'
    ? 'sticky right-0 z-30 bg-[var(--module-table)] text-center shadow-[-10px_0_18px_-18px_rgba(0,0,0,0.45)] dark:bg-[var(--module-table)]'
    : 'bg-[var(--module-table)] dark:bg-[var(--module-table)]';

  return `border-b border-[color:var(--module-table-border)] px-3 py-2.5 text-left font-medium dark:border-[color:var(--module-table-border)] ${stickyClass}`;
}

function getBodyCellClass(key = '') {
  const stickyClass = key === 'actions'
    ? 'sticky right-0 z-20 bg-inherit text-center shadow-[-10px_0_18px_-18px_rgba(0,0,0,0.45)]'
    : 'bg-inherit';

  return `${tableCellClass} min-w-0 ${stickyClass}`;
}

function getHeaderWrapClass(key = '') {
  if (isCompactColumn(key)) {
    return 'whitespace-nowrap';
  }

  if (isParagraphColumn(key)) {
    return 'min-w-[18rem] whitespace-normal break-words [overflow-wrap:anywhere]';
  }

  return 'min-w-[10rem] max-w-[18rem] whitespace-normal break-words [overflow-wrap:anywhere]';
}

function getCellWrapClass(key = '') {
  if (isCompactColumn(key)) {
    return 'whitespace-nowrap';
  }

  if (isParagraphColumn(key)) {
    return 'min-w-[18rem] whitespace-pre-wrap break-words [overflow-wrap:anywhere]';
  }

  return 'min-w-[10rem] max-w-[18rem] whitespace-normal break-words [overflow-wrap:anywhere]';
}

function hasActiveFilters(filters) {
  return Boolean(filters?.search?.trim())
    || Object.values(filters?.fields || {}).some((value) => Boolean(value));
}

function matchesSearch(row, search) {
  const terms = normalizeText(search).split(/\s+/).filter(Boolean);
  const haystack = normalizeText(flattenValues(row).join(' '));

  return terms.every((term) => haystack.includes(term));
}

function flattenValues(value, depth = 0) {
  if (value === undefined || value === null || depth > 3) {
    return [];
  }

  if (typeof value !== 'object') {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenValues(item, depth + 1));
  }

  return Object.values(value).flatMap((item) => flattenValues(item, depth + 1));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .trim();
}

function getStudentValue(row) {
  return firstValue([
    row?.studentFullName,
    row?.studentUsername,
    row?.student,
    row?.student?.fullName,
    row?.student?.username,
    row?.enrollment?.studentFullName,
    row?.enrollment?.student?.username,
    row?.account?.username,
    row?.accountUsername,
  ]);
}

function getCourseValue(row) {
  return firstValue([
    row?.courseName,
    row?.course?.name,
    row?.enrollment?.courseName,
  ]);
}

function getStatusValue(row) {
  return row?.status ?? row?.active ?? row?.enabled ?? '';
}

function firstValue(values) {
  const value = values.find((item) => item !== undefined && item !== null && item !== '');

  if (value && typeof value === 'object') {
    return firstValue([value.fullName, value.name, value.username, value.id]);
  }

  return value || '';
}

function TableSkeleton({ columns }) {
  return (
    <div className={tableShellClass} aria-busy="true">
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
        <table className={tableClass}>
          <thead className={tableHeadClass}>
            <tr>
              {columns.map((column) => (
                <th
                  className="border-b border-line px-3 py-2.5 font-medium dark:border-line"
                  key={column.key}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, columnIndex) => (
                  <td className={tableCellClass} key={column.key}>
                    <span
                      className="block h-3.5 rounded-full bg-panel-soft dark:bg-table-header"
                      style={{ width: `${columnIndex === 0 ? 50 : 78}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
