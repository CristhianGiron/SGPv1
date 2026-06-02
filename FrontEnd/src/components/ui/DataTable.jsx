import { useMemo, useState } from 'react';
import { CheckCircle2, SlidersHorizontal, XCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Modal } from './Modal';
import { formatValue } from '../../utils/format';

const tableShellClass =
  'min-w-0 max-w-full overflow-hidden rounded-lg border border-[#dbe3ed] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.055)] dark:border-slate-700 dark:bg-surface';

const tableClass =
  'w-max min-w-full border-separate border-spacing-0 text-sm';

const tableHeadClass =
  'bg-[#d7e4e9] text-left text-xs font-extrabold uppercase text-[#475569] dark:bg-[#172033] dark:text-slate-300';

const tableCellClass =
  'border-b border-[#edf2f7] px-4 py-3 align-middle text-[#263241] dark:border-slate-800 dark:text-ink';

const fieldLabelClass =
  'mb-1.5 block text-[0.82rem] font-extrabold text-[#34443b] dark:text-slate-300';

const fieldClass =
  'min-h-[2.65rem] w-full rounded-lg border border-[#c8d2cd] bg-[#f5f4ed] px-3 py-2.5 text-sm text-[#20282d] outline-none transition-[background-color,border-color,box-shadow] placeholder:text-slate-400 hover:border-[#aebdb6] focus:border-[#074462] focus:ring-4 focus:ring-[#074462]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:focus:border-sky-300 dark:focus:ring-sky-300/20';

const secondaryButtonClass =
  'inline-flex min-h-[2.55rem] w-full items-center justify-center rounded-lg border border-[#529914] bg-transparent px-4 py-2 text-sm font-extrabold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-surface dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]';

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
  const dataColumns = actionColumn
    ? visibleColumns.filter((column) => column.key !== 'actions')
    : visibleColumns;
  const renderedColumns = actionColumn ? [...dataColumns, actionColumn] : visibleColumns;
  const mobileDataGridTemplateColumns = dataColumns
    .map((column) => (isParagraphColumn(column.key) ? 'minmax(18rem, 28rem)' : 'minmax(max-content, max-content)'))
    .concat(actionColumn ? ['max-content'] : [])
    .join(' ');
  const desktopDataGridTemplateColumns = dataColumns
    .map((column) => (isParagraphColumn(column.key) ? 'minmax(16rem, 2fr)' : 'minmax(0, 1fr)'))
    .concat(actionColumn ? ['max-content'] : [])
    .join(' ');
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
      ) : !actionColumn ? (
        <div className={tableShellClass} aria-busy={loading || undefined}>
          <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-max min-w-full table-auto border-separate border-spacing-0 text-sm lg:w-full">
              <thead className={tableHeadClass}>
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      className={`border-b border-[#dbe3ed] px-4 py-3 font-extrabold dark:border-slate-700 ${isParagraphColumn(column.key) ? 'min-w-[22rem]' : 'whitespace-nowrap'}`}
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
                    className="even:bg-[#e6efea] hover:bg-[#dbe8ed] dark:even:bg-slate-950/40 dark:hover:bg-sky-300/10"
                    key={row[keyField] || `${keyField}-${rowIndex}`}
                  >
                    {visibleColumns.map((column) => (
                      <td
                        className={`${tableCellClass} min-w-0 break-words ${isParagraphColumn(column.key) ? 'min-w-[22rem] whitespace-pre-wrap' : 'whitespace-nowrap'}`}
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
      ) : (
        <div className={tableShellClass} aria-busy={loading || undefined}>
          <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <div
              className="data-table-grid grid w-max min-w-full text-sm"
              role="table"
              style={{
                '--data-table-columns-mobile': mobileDataGridTemplateColumns,
                '--data-table-columns-desktop': desktopDataGridTemplateColumns,
              }}
            >
              {renderedColumns.map((column) => (
                <div
                  className={`border-b border-[#dbe3ed] bg-[#d7e4e9] px-4 py-3 text-left text-xs font-extrabold uppercase text-[#475569] dark:border-slate-700 dark:bg-[#172033] dark:text-slate-300 ${column.key === 'actions' ? 'sticky right-0 z-30 whitespace-nowrap shadow-[-10px_0_18px_rgba(15,23,42,0.08)]' : isParagraphColumn(column.key) ? 'break-words' : 'whitespace-nowrap'}`}
                  key={column.key}
                  role="columnheader"
                >
                  {column.header}
                </div>
              ))}

              {effectiveRows.flatMap((row, rowIndex) =>
                renderedColumns.map((column) => {
                  const rowKey = row[keyField] || `${keyField}-${rowIndex}`;
                  const evenRow = rowIndex % 2 === 1;
                  const isActionColumn = column.key === 'actions';
                  const cellTone = evenRow
                    ? 'bg-[#e6efea] dark:bg-slate-950/40'
                    : 'bg-white dark:bg-surface';

                  return (
                    <div
                      className={`${tableCellClass} min-h-[3.25rem] min-w-0 ${cellTone} hover:bg-[#dbe8ed] dark:hover:bg-sky-300/10 ${isActionColumn ? 'sticky right-0 z-20 whitespace-nowrap shadow-[-10px_0_18px_rgba(15,23,42,0.08)]' : isParagraphColumn(column.key) ? 'whitespace-pre-wrap break-words' : 'whitespace-nowrap'}`}
                      key={`${rowKey}-${column.key}`}
                      role="cell"
                    >
                      {column.render ? column.render(row) : formatValue(row[column.key], column.key)}
                    </div>
                  );
                })
              )}
            </div>
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
    <div className="rounded-lg border border-[#c8d2cd] bg-[#eef3f2] p-3 dark:border-slate-700 dark:bg-surface">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
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
      <p className="mt-3 text-xs font-bold text-muted">
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
                  className="border-b border-[#dbe3ed] px-4 py-3 font-extrabold dark:border-slate-700"
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
                      className="block h-3.5 rounded-full bg-slate-200 dark:bg-slate-700"
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
