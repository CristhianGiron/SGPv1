import { useEffect, useMemo, useState } from 'react';
import { apiRequest, isAccessDeniedError, unwrapPage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { joinText } from '../../utils/format';
import { filterInactiveForNonAdmin } from '../../utils/visibility';

const fieldClass =
  'min-h-[2.65rem] w-full rounded-lg border border-line bg-field px-3 py-2.5 text-sm text-heading outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted hover:border-line-strong focus:border-primary-strong focus:ring-4 focus:ring-focus-soft disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-muted dark:border-line dark:bg-page dark:text-heading dark:placeholder:text-muted dark:hover:border-line-strong dark:focus:border-info dark:focus:ring-focus-soft';

export function EntitySelect({
  value,
  onChange,
  path,
  rows,
  placeholder = 'Seleccionar registro',
  searchPlaceholder = 'Buscar por nombre',
  getOptionLabel = defaultOptionLabel,
  disabled = false,
  required = false,
  emptyText = 'No hay opciones disponibles',
  rowFilter,
}) {
  const { token, roles } = useAuth();
  const [loadedRows, setLoadedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const sourceRows = rows || loadedRows;
  const filteredRows = useMemo(
    () => (rowFilter ? sourceRows.filter(rowFilter) : sourceRows),
    [rowFilter, sourceRows]
  );
  const visibleRows = useMemo(
    () => filterInactiveForNonAdmin(filteredRows, roles),
    [roles, filteredRows]
  );

  useEffect(() => {
    let active = true;

    if (rows || !path) {
      return undefined;
    }

    async function loadRows() {
      setLoading(true);
      setError('');

      try {
        const payload = await apiRequest(path, { token });

        if (active) {
          setLoadedRows(unwrapPage(payload));
        }
      } catch (requestError) {
        if (active) {
          setError(isAccessDeniedError(requestError) ? '' : requestError.message);
          setLoadedRows([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRows();

    return () => {
      active = false;
    };
  }, [path, rows, token]);

  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return visibleRows;
    }

    return visibleRows.filter((row) =>
      getOptionLabel(row).toLowerCase().includes(normalizedQuery)
    );
  }, [getOptionLabel, query, visibleRows]);

  return (
    <div className="grid gap-2">
      <input
        className={`${fieldClass} min-h-10 py-2`}
        disabled={disabled || loading || Boolean(error)}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={loading ? 'Cargando registros...' : searchPlaceholder}
        type="search"
        value={query}
      />
      <select
        className={fieldClass}
        disabled={disabled || loading || Boolean(error)}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : '')}
        required={required}
        value={value ?? ''}
      >
        <option value="">{error || placeholder}</option>
        {options.map((row) => (
          <option key={row.id} value={row.id}>
            {getOptionLabel(row)}
          </option>
        ))}
      </select>
      {!loading && !error && visibleRows.length === 0 && (
        <p className="text-xs text-body">{emptyText}</p>
      )}
      {query && options.length === 0 && visibleRows.length > 0 && (
        <p className="text-xs text-body">No hay coincidencias.</p>
      )}
    </div>
  );
}

export function defaultOptionLabel(row) {
  if (!row) {
    return 'Registro';
  }

  const fullName = joinText(row.names, row.lastNames);
  const student = row.studentFullName || row.studentUsername || row.student;
  const institution = row.institutionName || row.educationalInstitutionName || row.institution;
  const base =
    row.name ||
    row.title ||
    row.courseName ||
    fullName ||
    row.username ||
    row.code ||
    institution ||
    student ||
    'Registro';

  const secondary =
    (row.code && row.code !== base && row.code) ||
    (student && student !== base && student) ||
    (institution && institution !== base && institution) ||
    '';

  return secondary ? `${base} - ${secondary}` : String(base);
}
