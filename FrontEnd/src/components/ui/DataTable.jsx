/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DataTable.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente DataTable de la interfaz del SGP.
 */

import { useEffect, useMemo, useState } from 'react';
import { SecondaryButton } from './ActionBar';
import { FilterPanel } from './FilterPanel';
import { ListToolbar } from './ListToolbar';
import { EmptyState } from './EmptyState';
import { formatValue } from '../../utils/format';
import { Modal } from './Modal';
import { usePracticeWorkspace } from '../../contexts/PracticeWorkspaceContext';
import { relevantTableColumns, isSecondaryColumn } from '../../utils/tablePresentation';
import { useCompactViewport } from '../../hooks/useCompactViewport';

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
  'min-h-11 w-full rounded-lg border border-line bg-field px-3 py-2 text-sm text-heading outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted hover:border-line-strong focus:border-primary-strong focus:ring-4 focus:ring-focus-soft disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-muted dark:border-line dark:bg-page dark:text-heading dark:placeholder:text-muted dark:hover:border-line-strong dark:focus:border-info dark:focus:ring-focus-soft';

export function DataTable({
  columns,
  rows,
  emptyText = 'Aún no hay registros para mostrar.',
  enableFilters = false,
  filterFields,
  keyField = 'id',
  loading = false,
  toolbarActions,
  ownRecords = false,
  contextColumns = [],
}) {
  const compact = useCompactViewport();
  const practice = usePracticeWorkspace();
  const visibleColumns = relevantTableColumns(columns, { practice, ownRecords, contextColumns });
  const columnSignature = visibleColumns.map(column => `${column.key}:${isSecondaryColumn(column)}`).join('|');
  const [hiddenColumns, setHiddenColumns] = useState(() => visibleColumns.filter(isSecondaryColumn).map(column => column.key));
  useEffect(() => {
    setHiddenColumns(visibleColumns.filter(isSecondaryColumn).map(column => column.key));
    // Column definitions can be recreated while editing; reset only when their policy changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSignature]);
  const [detailRow, setDetailRow] = useState(null);
  useEffect(() => { setDetailRow(null); }, [columnSignature, practice?.id]);
  const selectedColumns = visibleColumns.filter(column => !hiddenColumns.includes(column.key));
  const detailColumns = visibleColumns.filter(column => hiddenColumns.includes(column.key) && column.key !== 'actions');
  const actionColumn = selectedColumns.find(column => column.key === 'actions');
  const showDetails = row => <SecondaryButton onClick={() => setDetailRow(row)}>Más datos</SecondaryButton>;
  const renderedColumns = [
    ...selectedColumns.filter(column => column.key !== 'actions'),
    ...(actionColumn || detailColumns.length ? [{
      ...(actionColumn || { key: 'actions', header: 'Detalle' }),
      render: row => <div className="flex flex-wrap items-center justify-end gap-2">{detailColumns.length > 0 && showDetails(row)}{actionColumn && (actionColumn.render ? actionColumn.render(row) : formatValue(row.actions, 'actions'))}</div>,
    }] : []),
  ];
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
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  const count = effectiveRows?.length || 0;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(page, totalPages);
  useEffect(() => { setPage(1); }, [filters, pageSize]);
  const pageRows = (effectiveRows || []).slice((currentPage-1)*pageSize, currentPage*pageSize);

  return (
    <div className="min-w-0 max-w-full space-y-3">
      {enableFilters && (
        <TableFilters
          columns={visibleColumns}
          hiddenColumns={hiddenColumns}
          onColumnsChange={setHiddenColumns}
          action={toolbarActions}
          fields={availableFilterFields}
          filters={filters}
          rows={rows || []}
          totalCount={rows?.length || 0}
          visibleCount={effectiveRows?.length || 0}
          onChange={setFilters}
        />
      )}

      <Modal open={Boolean(detailRow)} onClose={() => setDetailRow(null)} title="Más datos del registro" description="Información complementaria del registro seleccionado." maxWidth="max-w-2xl">
        {detailRow && <dl className="grid gap-4 sm:grid-cols-2">{[...selectedColumns.filter(column => column.key !== 'actions').slice(0, 1), ...detailColumns].map(column => <div className="min-w-0" key={column.key}><dt className="text-sm text-muted">{column.header}</dt><dd className="mt-1 break-words text-heading">{column.render ? column.render(detailRow) : formatValue(detailRow[column.key], column.key)}</dd></div>)}</dl>}
      </Modal>
      {!enableFilters && toolbarActions && <ListToolbar actions={toolbarActions} />}
      {loading && !effectiveRows?.length ? <TableSkeleton columns={visibleColumns} /> : !effectiveRows?.length ? (
        <EmptyState text={hasFilters ? 'No se encontraron resultados con los filtros aplicados.' : emptyText} />
      ) : (
        <div className={tableShellClass} aria-busy={loading || undefined}>
          {compact ? <MobileRecords columns={renderedColumns} rows={pageRows} keyField={keyField} /> : <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
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
                {pageRows.map((row, rowIndex) => (
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
          </div>}
          {count>10 && <nav aria-label="Paginación de resultados" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-body">
            <label className="flex items-center gap-2">Por página<select aria-label="Resultados por página" className="rounded-lg border border-line bg-field p-2 text-heading" value={pageSize} onChange={event => setPageSize(Number(event.target.value))}>{[10,25,50].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
            <span>{(currentPage-1)*pageSize+1}–{Math.min(currentPage*pageSize,count)} de {count}</span>
            <div className="flex items-center gap-2"><SecondaryButton disabled={currentPage===1} onClick={() => setPage(currentPage-1)}>Anterior</SecondaryButton><span>Página {currentPage} de {totalPages}</span><SecondaryButton disabled={currentPage===totalPages} onClick={() => setPage(currentPage+1)}>Siguiente</SecondaryButton></div>
          </nav>}
        </div>
      )}
    </div>
  );
}

function MobileRecords({ columns, rows, keyField }) {
  const dataColumns = columns.filter(column => column.key !== 'actions');
  const primary = dataColumns.find(column => ['name','title','studentFullName','courseName'].includes(column.key)) || dataColumns[0];
  const status = dataColumns.find(column => ['status','enabled'].includes(column.key) && column !== primary);
  const rest = dataColumns.filter(column => column !== primary && column !== status);
  const actions = columns.find(column => column.key === 'actions');
  const value = (column,row) => column.render ? column.render(row) : formatValue(row[column.key],column.key);
  const fields = (selected,row) => <dl className="grid gap-2 text-sm">{selected.map(column => <div key={column.key} className="min-w-0"><dt className="text-muted">{column.header}</dt><dd className="mt-0.5 break-words [overflow-wrap:anywhere] text-heading">{value(column,row)}</dd></div>)}</dl>;
  return <ul aria-label="Resultados del listado" className="divide-y divide-line">{rows.map((row,index) => <li key={row[keyField] || index} className="space-y-3 p-4">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm text-muted">{primary?.header}</p><div className="mt-1 break-words font-semibold text-heading">{primary && value(primary,row)}</div></div>{status && <div className="flex-none">{value(status,row)}</div>}</div>
    {fields(rest.slice(0,2),row)}
    {rest.length > 2 && <details className="text-sm"><summary className="min-h-11 cursor-pointer py-2 font-medium text-primary">Más datos del registro</summary>{fields(rest.slice(2),row)}</details>}
    {actions && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-2">{value(actions,row)}</div>}
  </li>)}</ul>;
}

function TableFilters({ columns, hiddenColumns, onColumnsChange, action, fields, filters, rows, totalCount, visibleCount, onChange }) {
  const hasFilters = hasActiveFilters(filters);
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

  return <FilterPanel viewKey={columns.map(column => column.key).join(",") + window.location.hash} savedValue={filters} onRestore={onChange} activeCount={selectedFieldCount} action={action} showFilters
    hasActiveFilters={hasFilters} onClear={clearFilters} summary={`${visibleCount} de ${totalCount} resultados`}
    search={<label className="block"><span className={fieldLabelClass}>Buscar</span><input className={fieldClass} placeholder="Buscar en el listado" type="search" value={filters.search} onChange={event => setSearch(event.target.value)} /></label>}>
    <fieldset className="space-y-2 sm:col-span-2 lg:col-span-3"><legend className="mb-2 text-sm font-semibold text-heading">Columnas visibles</legend><div className="flex flex-wrap gap-4">{columns.filter(column => column.key!=='actions').map(column => <label className="flex items-center gap-2 text-sm text-body" key={column.key}><input type="checkbox" checked={!hiddenColumns.includes(column.key)} disabled={!hiddenColumns.includes(column.key) && columns.filter(item => item.key!=='actions' && !hiddenColumns.includes(item.key)).length===1} onChange={event => onColumnsChange(event.target.checked ? hiddenColumns.filter(key => key!==column.key) : [...hiddenColumns,column.key])} />{column.header}</label>)}</div></fieldset>
    {fields.map(field => <label className="block" key={field.key}><span className={fieldLabelClass}>{field.label}</span><select className={fieldClass} value={filters.fields?.[field.key] || ''} onChange={event => setFieldFilter(field.key, event.target.value)}><option value="">Todos</option>{buildFilterOptions(rows, field).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
  </FilterPanel>;
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
  return buildFilterOptions(rows || [], field).length > 1;
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
