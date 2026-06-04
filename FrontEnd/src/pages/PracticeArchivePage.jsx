import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, ArchiveRestore, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ActionBar, PrimaryButton, SecondaryButton } from '../components/ui/ActionBar';
import { ActionMenu } from '../components/ui/ActionMenu';
import { Alert } from '../components/ui/Alert';
import { DataTable } from '../components/ui/DataTable';
import { Field, Input, Select } from '../components/ui/FormControls';
import { FilterPanel } from '../components/ui/FilterPanel';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { formatDateTime } from '../utils/format';

export function PracticeArchivePage() {
  const { token, roles } = useAuth();
  const confirm = useConfirm();
  const canArchive = roles.some((role) =>
    ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS', 'ROLE_TUTOR_PRACTICAS'].includes(role)
  );
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    query: '',
    faculty: '',
    career: '',
    academicCycle: '',
    course: '',
    status: '',
    archived: '',
  });

  const loadPractices = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await apiRequest('/api/enrollments/practices', { token });
      setPractices(Array.isArray(payload) ? payload : []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPractices();
  }, [loadPractices]);

  const summary = useMemo(() => buildSummary(practices), [practices]);
  const filteredPractices = useMemo(
    () => practices.filter((practice) => filterPractice(practice, filters)),
    [filters, practices]
  );
  const filterOptions = useMemo(
    () => buildFilterOptions(practices, filters),
    [filters, practices]
  );
  const pendingArchive = practices.filter((practice) => !practice.archived);
  const canArchiveAll = canArchive
    && pendingArchive.length > 0
    && pendingArchive.every((practice) => practice.status === 'COMPLETED');

  async function runPracticeAction(path, confirmation, successMessage) {
    const accepted = await confirm(confirmation);

    if (!accepted) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(path, { method: 'PATCH', token });
      await loadPractices();
      setMessage(successMessage);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function archiveAllCompleted() {
    runPracticeAction(
      '/api/enrollments/archive-completed',
      {
        title: 'Archivar prácticas concluidas',
        description: 'Se archivarán todas las prácticas visibles. Esta acción solo procede si todas están concluidas.',
        confirmLabel: 'Archivar todo',
        tone: 'warning',
      },
      'Prácticas archivadas'
    );
  }

  const columns = [
    { key: 'facultyName', header: 'Facultad', render: (row) => row.facultyName || '-' },
    { key: 'careerName', header: 'Carrera', render: (row) => row.careerName || '-' },
    { key: 'academicCycleName', header: 'Ciclo', render: (row) => row.academicCycleName || row.courseAcademicCycle || '-' },
    { key: 'courseName', header: 'Paralelo', render: (row) => row.courseName || '-' },
    { key: 'studentFullName', header: 'Estudiante', render: (row) => row.studentFullName || row.student || '-' },
    { key: 'groupName', header: 'Grupo', render: (row) => row.groupName || '-' },
    { key: 'practiceTutor', header: 'Tutor de prácticas', render: (row) => row.practiceTutor || '-' },
    { key: 'institutionalTutor', header: 'Tutor institucional', render: (row) => row.institutionalTutor || '-' },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'archived',
      header: 'Archivo',
      render: (row) => (
        <StatusBadge status={row.archived ? 'ARCHIVED' : 'ACTIVE'} />
      ),
    },
    { key: 'enrolledAt', header: 'Inscripción', render: (row) => formatDateTime(row.enrolledAt) },
    { key: 'archivedAt', header: 'Archivado', render: (row) => row.archivedAt ? formatDateTime(row.archivedAt) : '-' },
  ];

  if (canArchive) {
    columns.push({
      key: 'actions',
      header: 'Acciones',
      render: (row) => {
        const actions = [];

        if (row.status === 'APPROVED') {
          actions.push({
            key: 'complete',
            label: 'Concluir práctica',
            icon: CheckCircle2,
            onClick: () =>
              runPracticeAction(
                `/api/enrollments/${row.id}/complete`,
                {
                  title: 'Concluir práctica',
                  description: 'La práctica quedará marcada como concluida y luego podrá archivarse.',
                  details: row.studentFullName || row.student || row.courseName,
                  confirmLabel: 'Concluir',
                  tone: 'warning',
                },
                'Práctica concluida'
              ),
          });
        }

        if (row.status === 'COMPLETED' && !row.archived) {
          actions.push({
            key: 'archive',
            label: 'Archivar',
            icon: Archive,
            onClick: () =>
              runPracticeAction(
                `/api/enrollments/${row.id}/archive`,
                {
                  title: 'Archivar práctica',
                  description: 'La práctica se moverá al archivo histórico sin perder sus documentos ni registros.',
                  details: row.studentFullName || row.student || row.courseName,
                  confirmLabel: 'Archivar',
                  tone: 'warning',
                },
                'Práctica archivada'
              ),
          });
        }

        if (row.status === 'COMPLETED' && row.archived) {
          actions.push({
            key: 'unarchive',
            label: 'Desarchivar',
            icon: ArchiveRestore,
            onClick: () =>
              runPracticeAction(
                `/api/enrollments/${row.id}/unarchive`,
                {
                  title: 'Desarchivar práctica',
                  description: 'La práctica volverá a la lista activa de prácticas concluidas.',
                  details: row.studentFullName || row.student || row.courseName,
                  confirmLabel: 'Desarchivar',
                  tone: 'warning',
                },
                'Práctica desarchivada'
              ),
          });

          actions.push({
            key: 'reopen',
            label: 'Reabrir práctica',
            icon: RotateCcw,
            onClick: () =>
              runPracticeAction(
                `/api/enrollments/${row.id}/reopen`,
                {
                  title: 'Reabrir práctica',
                  description: 'La práctica volverá a quedar aprobada si el estudiante no tiene otra práctica activa.',
                  details: row.studentFullName || row.student || row.courseName,
                  confirmLabel: 'Reabrir',
                  tone: 'warning',
                },
                'Práctica reabierta'
              ),
          });
        }

        if (row.status === 'COMPLETED' && !row.archived) {
          actions.push({
            key: 'reopen',
            label: 'Reabrir práctica',
            icon: RotateCcw,
            onClick: () =>
              runPracticeAction(
                `/api/enrollments/${row.id}/reopen`,
                {
                  title: 'Reabrir práctica',
                  description: 'La práctica volverá a quedar aprobada si el estudiante no tiene otra práctica activa.',
                  details: row.studentFullName || row.student || row.courseName,
                  confirmLabel: 'Reabrir',
                  tone: 'warning',
                },
                'Práctica reabierta'
              ),
          });
        }

        return actions.length ? <ActionMenu actions={actions} /> : null;
      },
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Prácticas"
        title="Archivo de prácticas"
        description="Consulta todas las prácticas visibles y archiva o recupera las concluidas desde una sola tabla."
        action={(
          <ActionBar>
            {canArchive && (
              <PrimaryButton
                disabled={loading || !canArchiveAll}
                icon={Archive}
                loading={loading}
                onClick={archiveAllCompleted}
                type="button"
              >
                Archivar todo
              </PrimaryButton>
            )}
            <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadPractices} type="button">
              Actualizar
            </SecondaryButton>
          </ActionBar>
        )}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      {canArchive && !canArchiveAll && pendingArchive.length > 0 && (
        <Alert tone="info">
          El archivo masivo se activa cuando todas las prácticas sin archivar están concluidas.
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Pendientes" value={summary.pending} />
        <SummaryCard label="Aprobadas" value={summary.approved} />
        <SummaryCard label="Concluidas" value={summary.completed} />
        <SummaryCard label="Archivadas" value={summary.archived} />
      </div>

      <SectionCard title="Lista de prácticas">
        <FilterPanel
          activeCount={countActiveFilters(filters, ['query'])}
          hasActiveFilters={countActiveFilters(filters) > 0}
          onClear={() => setFilters(emptyFilters())}
          search={(
            <Field label="Buscar">
              <Input
                placeholder="Texto, paralelo o estudiante"
                type="search"
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              />
            </Field>
          )}
          summary={`${filteredPractices.length} de ${practices.length} resultados`}
          title="Filtrar prácticas"
        >
          <Field label="Facultad">
            <Select
              value={filters.faculty}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  faculty: event.target.value,
                  career: '',
                  academicCycle: '',
                  course: '',
                }))
              }
            >
              <option value="">Todas</option>
              {filterOptions.faculties.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Carrera">
            <Select
              disabled={!filterOptions.careers.length}
              value={filters.career}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  career: event.target.value,
                  academicCycle: '',
                  course: '',
                }))
              }
            >
              <option value="">Todas</option>
              {filterOptions.careers.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ciclo">
            <Select
              disabled={!filterOptions.academicCycles.length}
              value={filters.academicCycle}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  academicCycle: event.target.value,
                  course: '',
                }))
              }
            >
              <option value="">Todos</option>
              {filterOptions.academicCycles.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Paralelo">
            <Select
              disabled={!filterOptions.courses.length}
              value={filters.course}
              onChange={(event) => setFilters((current) => ({ ...current, course: event.target.value }))}
            >
              <option value="">Todos</option>
              {filterOptions.courses.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="COMPLETED">Concluidas</option>
            </Select>
          </Field>
          <Field label="Archivo">
            <Select
              value={filters.archived}
              onChange={(event) => setFilters((current) => ({ ...current, archived: event.target.value }))}
            >
              <option value="">Todos</option>
              <option value="false">Sin archivar</option>
              <option value="true">Archivadas</option>
            </Select>
          </Field>
        </FilterPanel>

        <div className="mt-5">
          <DataTable
            columns={columns}
            loading={loading}
            rows={filteredPractices.slice().sort(comparePractices)}
          />
        </div>
      </SectionCard>
    </>
  );
}

function SummaryCard({ label, value }) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-muted dark:text-muted">{label}</span>
        <span className="text-2xl font-extrabold text-heading dark:text-heading">{value}</span>
      </div>
    </SectionCard>
  );
}

function buildSummary(practices) {
  return practices.reduce(
    (current, practice) => ({
      pending: current.pending + (practice.status === 'PENDING' ? 1 : 0),
      approved: current.approved + (practice.status === 'APPROVED' ? 1 : 0),
      completed: current.completed + (practice.status === 'COMPLETED' ? 1 : 0),
      archived: current.archived + (practice.archived ? 1 : 0),
    }),
    {
      pending: 0,
      approved: 0,
      completed: 0,
      archived: 0,
    }
  );
}

function emptyFilters() {
  return {
    query: '',
    faculty: '',
    career: '',
    academicCycle: '',
    course: '',
    status: '',
    archived: '',
  };
}

function buildFilterOptions(practices, filters) {
  const byFaculty = practices.filter((practice) => matchesSelectFilters(practice, filters, ['faculty']));
  const byCareer = practices.filter((practice) => matchesSelectFilters(practice, filters, ['faculty', 'career']));
  const byCycle = practices.filter((practice) => matchesSelectFilters(practice, filters, ['faculty', 'career', 'academicCycle']));
  const byCourse = practices.filter((practice) => matchesSelectFilters(practice, filters, ['faculty', 'career', 'academicCycle', 'course']));

  return {
    faculties: buildOptions(byFaculty, 'facultyId', 'facultyName', 'Sin facultad'),
    careers: buildOptions(byCareer, 'careerId', 'careerName', 'Sin carrera'),
    academicCycles: buildOptions(byCycle, 'academicCycleId', 'academicCycleName', 'Sin ciclo', (practice) => practice.courseAcademicCycle),
    courses: buildOptions(byCourse, 'courseId', 'courseName', 'Sin paralelo'),
  };
}

function buildOptions(rows, idKey, labelKey, fallbackLabel, fallbackLabelGetter) {
  const map = new Map();

  rows.forEach((row) => {
    const label = row[labelKey] || fallbackLabelGetter?.(row) || fallbackLabel;
    const value = selectValue(row[idKey], label);

    if (!map.has(value)) {
      map.set(value, { value, label });
    }
  });

  return Array.from(map.values()).sort((left, right) => compareText(left.label, right.label));
}

function matchesSelectFilters(practice, filters, keys) {
  return keys.every((key) => {
    if (!filters[key]) {
      return true;
    }

    return getPracticeFilterValue(practice, key) === filters[key];
  });
}

function getPracticeFilterValue(practice, key) {
  if (key === 'faculty') {
    return selectValue(practice.facultyId, practice.facultyName || 'Sin facultad');
  }

  if (key === 'career') {
    return selectValue(practice.careerId, practice.careerName || 'Sin carrera');
  }

  if (key === 'academicCycle') {
    return selectValue(practice.academicCycleId, practice.academicCycleName || practice.courseAcademicCycle || 'Sin ciclo');
  }

  if (key === 'course') {
    return selectValue(practice.courseId, practice.courseName || 'Sin paralelo');
  }

  return '';
}

function selectValue(id, label) {
  return id !== undefined && id !== null
    ? String(id)
    : `text:${normalizeSearch(label || 'sin-datos')}`;
}

function comparePractices(left, right) {
  return [
    compareText(left.facultyName, right.facultyName),
    compareText(left.careerName, right.careerName),
    compareText(left.academicCycleName || left.courseAcademicCycle, right.academicCycleName || right.courseAcademicCycle),
    compareText(left.courseName, right.courseName),
    compareText(left.studentFullName || left.student, right.studentFullName || right.student),
  ].find((result) => result !== 0) || 0;
}

function compareText(left, right) {
  return String(left || '').localeCompare(String(right || ''), 'es', { sensitivity: 'base' });
}

function filterPractice(practice, filters) {
  if (!matchesSelectFilters(practice, filters, ['faculty', 'career', 'academicCycle', 'course'])) {
    return false;
  }

  if (filters.status && practice.status !== filters.status) {
    return false;
  }

  if (filters.archived && String(Boolean(practice.archived)) !== filters.archived) {
    return false;
  }

  if (!filters.query) {
    return true;
  }

  const haystack = [
    practice.studentFullName,
    practice.student,
    practice.courseName,
    practice.groupName,
    practice.practiceTutor,
    practice.institutionalTutor,
    practice.facultyName,
    practice.careerName,
    practice.academicCycleName,
    practice.courseAcademicCycle,
    practice.educationalInstitutionName,
  ].map(normalizeSearch).join(' ');

  return haystack.includes(normalizeSearch(filters.query));
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function countActiveFilters(filters, excludeKeys = []) {
  return Object.entries(filters || {})
    .filter(([key]) => !excludeKeys.includes(key))
    .filter(([, value]) => String(value || '').trim())
    .length;
}
