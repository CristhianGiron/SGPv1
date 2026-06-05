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
  const canComplete = roles.includes('ROLE_DIRECTOR_PRACTICAS');
  const canArchive = roles.includes('ROLE_ADMIN');
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
  const [groupBy, setGroupBy] = useState('academicCycle');

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
  const practiceGroups = useMemo(
    () => buildPracticeGroups(filteredPractices, groupBy),
    [filteredPractices, groupBy]
  );
  const filteredArchivable = filteredPractices.filter(
    (practice) => practice.status === 'COMPLETED' && !practice.archived
  );

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

  async function runBatchArchive(rows, archived, confirmation, successMessage) {
    const enrollmentIds = rows
      .filter((practice) => practice.status === 'COMPLETED' && Boolean(practice.archived) !== archived)
      .map((practice) => practice.id);

    if (!enrollmentIds.length) {
      setError(archived
        ? 'No hay prácticas concluidas sin archivar en esta selección.'
        : 'No hay prácticas archivadas para recuperar en esta selección.');
      return;
    }

    const accepted = await confirm(confirmation);

    if (!accepted) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest('/api/enrollments/archive-batch', {
        method: 'PATCH',
        token,
        body: {
          enrollmentIds,
          archived,
        },
      });
      await loadPractices();
      setMessage(successMessage);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const columns = [

    /*PROVICIONALMENTE COMENTADO YA QUE SON DEMASIADAS COLUMNAS Y ME GUSTARÍA MEJOR QUE ESTA TABLA ESTE COMPUESTA POR PARALELO DE PRACTICAS Y AL ARCHIVAR O DESARCHIVAR ARCHIVAR TODO EL PARALELO DE PRACTICAS PERO QUE LUEGO TAMBIEN PUEDA DESARCHIVAR O ARCHIVAR ALGUNA PRACTICA DE FORMA INDIVIDUAL, PERO PARA ESO HAY QUE CAMBIAR EL MODELO DE DATOS Y LA API PRIMERO, ASÍ QUE POR AHORA LO COMENTO PARA SIMPLIFICAR LA TABLa
    { key: 'facultyName', header: 'Facultad', render: (row) => row.facultyName || '-' },
    { key: 'careerName', header: 'Carrera', render: (row) => row.careerName || '-' },
    { key: 'academicCycleName', header: 'Ciclo', render: (row) => row.academicCycleName || row.courseAcademicCycle || '-' },
    { key: 'courseName', header: 'Paralelo', render: (row) => row.courseName || '-' },*/
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

  if (canArchive || canComplete) {
    columns.push({
      key: 'actions',
      header: 'Acciones',
      render: (row) => {
        const actions = [];

        if (canComplete && row.status === 'APPROVED') {
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

        if (canArchive && row.status === 'COMPLETED' && !row.archived) {
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

        if (canArchive && row.status === 'COMPLETED' && row.archived) {
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

        }

        if (canComplete && row.status === 'COMPLETED' && row.archived) {
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

        if (canComplete && row.status === 'COMPLETED' && !row.archived) {
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

  const cohortColumns = [
    ...buildCohortIdentityColumns(groupBy),
    { key: 'total', header: 'Prácticas', render: (row) => row.total },
    { key: 'approved', header: 'Aprobadas', render: (row) => row.approved },
    { key: 'completed', header: 'Concluidas', render: (row) => row.completed },
    { key: 'archivable', header: 'Por archivar', render: (row) => row.archivable },
    { key: 'archived', header: 'Archivadas', render: (row) => row.archived },
    {
      key: 'state',
      header: 'Estado',
      render: (row) => (
        <StatusBadge status={row.archivable > 0 ? 'COMPLETED' : row.archived > 0 ? 'ARCHIVED' : 'APPROVED'} />
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <CohortArchiveActions
          loading={loading}
          row={row}
          onArchive={() =>
            runBatchArchive(
              row.rows,
              true,
              {
                title: 'Archivar cohorte de prácticas',
                description: 'Se archivarán las prácticas concluidas y sin archivar de esta cohorte. Las aprobadas o pendientes quedarán sin cambios.',
                details: row.label,
                confirmLabel: 'Archivar cohorte',
                tone: 'warning',
              },
              'Cohorte archivada'
            )
          }
          onUnarchive={() =>
            runBatchArchive(
              row.rows,
              false,
              {
                title: 'Desarchivar cohorte de prácticas',
                description: 'Se recuperarán las prácticas concluidas archivadas de esta cohorte.',
                details: row.label,
                confirmLabel: 'Desarchivar cohorte',
                tone: 'warning',
              },
              'Cohorte desarchivada'
            )
          }
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Prácticas"
        title="Archivo de prácticas"
        description="Consulta todas las prácticas visibles y archiva o recupera las concluidas desde una sola tabla."
        action={(
          <ActionBar>
            <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadPractices} type="button">
              Actualizar
            </SecondaryButton>
          </ActionBar>
        )}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      {canArchive && !filteredArchivable.length && filteredPractices.length > 0 && (
        <Alert tone="info">
          Para archivar, selecciona una cohorte con prácticas concluidas y usa la acción de su fila.
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard icon={RotateCcw} label="Pendientes" value={summary.pending} variant="d" />
        <SummaryCard icon={CheckCircle2} label="Aprobadas" value={summary.approved} variant="b" />
        <SummaryCard icon={CheckCircle2} label="Concluidas" value={summary.completed} variant="c" />
        <SummaryCard icon={Archive} label="Archivadas" value={summary.archived} variant="e" />
      </div>

      {!canArchive && (
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3 dark:border-line">
          <div>
            <h2 className="text-base font-medium text-heading dark:text-heading">Archivo por cohorte</h2>
            <p className="text-sm text-body dark:text-ink">
              Agrupa la lista filtrada para revisar prácticas por paralelo, ciclo o carrera.
            </p>
          </div>
          <Field label="Agrupar por">
            <Select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
              <option value="course">Paralelo</option>
              <option value="academicCycle">Ciclo</option>
              <option value="career">Carrera</option>
            </Select>
          </Field>
        </div>

        {practiceGroups.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {practiceGroups.map((group, index) => (
              <PracticeGroupPanel
                key={group.key}
                canArchive={canArchive}
                group={group}
                loading={loading}
                variant={['a', 'b', 'c', 'd', 'e'][index % 5]}
                onArchive={() =>
                  runBatchArchive(
                    group.rows,
                    true,
                    {
                      title: 'Archivar cohorte',
                      description: 'Se archivarán las prácticas concluidas y sin archivar de esta cohorte. Las pendientes o aprobadas quedarán sin cambios.',
                      details: group.label,
                      confirmLabel: 'Archivar cohorte',
                      tone: 'warning',
                    },
                    'Cohorte archivada'
                  )
                }
                onUnarchive={() =>
                  runBatchArchive(
                    group.rows,
                    false,
                    {
                      title: 'Desarchivar cohorte',
                      description: 'Se recuperarán las prácticas concluidas archivadas de esta cohorte.',
                      details: group.label,
                      confirmLabel: 'Desarchivar cohorte',
                      tone: 'warning',
                    },
                    'Cohorte desarchivada'
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-surface-soft p-5 text-sm text-body dark:border-line dark:bg-surface-soft dark:text-ink">
            No hay prácticas para agrupar con los filtros actuales.
          </div>
        )}
      </section>
      )}

      <SectionCard title={canArchive ? 'Cohortes de práctica' : 'Lista de prácticas'}>
        {canArchive && (
          <div className="mb-3 rounded-lg border border-line bg-surface-soft p-3 dark:border-line dark:bg-surface-soft">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] md:items-end">
              <div>
                <h3 className="text-sm font-medium text-heading dark:text-heading">Vista por cohorte</h3>
                <p className="mt-1 text-sm text-body dark:text-ink">
                  Define cómo se agrupa la tabla principal para archivar prácticas.
                </p>
              </div>
              <Field label="Cohorte">
                <Select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
                  <option value="academicCycle">Por ciclo</option>
                  <option value="course">Por paralelo</option>
                  <option value="career">Por carrera</option>
                  <option value="faculty">Por facultad</option>
                </Select>
              </Field>
            </div>
          </div>
        )}

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
          summary={canArchive
            ? `${practiceGroups.length} cohorte(s), ${filteredPractices.length} práctica(s)`
            : `${filteredPractices.length} de ${practices.length} resultados`}
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
          {canArchive ? (
            <DataTable
              columns={cohortColumns}
              keyField="key"
              loading={loading}
              rows={practiceGroups}
            />
          ) : (
            <DataTable
              columns={columns}
              loading={loading}
              rows={filteredPractices.slice().sort(comparePractices)}
            />
          )}
        </div>
      </SectionCard>
    </>
  );
}

function SummaryCard({ icon: Icon, label, value, variant }) {
  return (
    <section className={`sgp-visual-card sgp-visual-card-${variant} min-h-28 rounded-lg border p-4 shadow-card`}>
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium uppercase leading-tight">{label}</span>
          <span className="mt-3 block text-3xl font-medium leading-none text-heading dark:text-heading">{value}</span>
        </div>
        <span className="sgp-visual-card-icon grid h-10 w-10 flex-none place-items-center rounded-full border-4 border-panel shadow-card">
          <Icon aria-hidden="true" size={19} />
        </span>
      </div>
    </section>
  );
}

function CohortArchiveActions({ loading, row, onArchive, onUnarchive }) {
  const actions = [
    {
      key: 'archive',
      label: 'Archivar cohorte',
      icon: Archive,
      disabled: loading || row.archivable <= 0,
      onClick: onArchive,
    },
    {
      key: 'unarchive',
      label: 'Desarchivar cohorte',
      icon: ArchiveRestore,
      disabled: loading || row.archived <= 0,
      onClick: onUnarchive,
    },
  ];

  return <ActionMenu actions={actions} label="Acciones de cohorte" />;
}

function PracticeGroupPanel({ canArchive, group, loading, onArchive, onUnarchive, variant = 'a' }) {
  const hasArchivable = group.archivable > 0;
  const hasArchived = group.archived > 0;
  const completionText = group.pending + group.approved > 0
    ? `${group.pending + group.approved} sin concluir`
    : 'Lista para archivo';

  return (
    <article className={`sgp-visual-card sgp-visual-card-${variant} rounded-lg border p-4 shadow-card`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="relative min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide">
            {group.scopeLabel}
          </p>
          <h3 className="mt-1 truncate text-base font-medium text-heading dark:text-heading" title={group.label}>
            {group.label}
          </h3>
          <p className="mt-1 text-sm">
            {completionText}
          </p>
        </div>
        <StatusBadge status={group.archivable > 0 ? 'COMPLETED' : group.archived > 0 ? 'ARCHIVED' : 'APPROVED'} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <GroupMetric label="Total" value={group.total} />
        <GroupMetric label="Concluidas" value={group.completed} />
        <GroupMetric label="Por archivar" value={group.archivable} />
        <GroupMetric label="Archivadas" value={group.archived} />
      </div>

      {canArchive && (
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton
            disabled={loading || !hasArchivable}
            icon={Archive}
            loading={loading}
            onClick={onArchive}
            type="button"
          >
            Archivar cohorte
          </PrimaryButton>
          <SecondaryButton
            disabled={loading || !hasArchived}
            icon={ArchiveRestore}
            loading={loading}
            onClick={onUnarchive}
            type="button"
          >
            Desarchivar
          </SecondaryButton>
        </div>
      )}
    </article>
  );
}

function GroupMetric({ label, value }) {
  return (
    <div className="relative rounded-md border border-inverse/30 bg-inverse/20 px-3 py-2">
      <div className="text-xs font-medium">{label}</div>
      <div className="text-lg font-medium text-heading dark:text-heading">{value}</div>
    </div>
  );
}

function buildCohortIdentityColumns(groupBy) {
  if (groupBy === 'faculty') {
    return [
      { key: 'label', header: 'Facultad', render: (row) => row.label },
      { key: 'careerCount', header: 'Carreras', render: (row) => row.careerCount },
      { key: 'academicCycleCount', header: 'Ciclos', render: (row) => row.academicCycleCount },
      { key: 'courseCount', header: 'Paralelos', render: (row) => row.courseCount },
    ];
  }

  if (groupBy === 'career') {
    return [
      { key: 'label', header: 'Carrera', render: (row) => row.label },
      { key: 'facultyNames', header: 'Facultad', render: (row) => row.facultyNames || '-' },
      { key: 'academicCycleCount', header: 'Ciclos', render: (row) => row.academicCycleCount },
      { key: 'courseCount', header: 'Paralelos', render: (row) => row.courseCount },
    ];
  }

  if (groupBy === 'course') {
    return [
      { key: 'label', header: 'Paralelo', render: (row) => row.label },
      { key: 'academicCycleNames', header: 'Ciclo', render: (row) => row.academicCycleNames || '-' },
      { key: 'careerNames', header: 'Carrera', render: (row) => row.careerNames || '-' },
    ];
  }

  return [
    { key: 'label', header: 'Ciclo', render: (row) => row.label },
    { key: 'careerNames', header: 'Carrera', render: (row) => row.careerNames || '-' },
    { key: 'courseCount', header: 'Paralelos', render: (row) => row.courseCount },
  ];
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

function buildPracticeGroups(practices, groupBy) {
  const groups = new Map();

  practices.forEach((practice) => {
    const group = getPracticeGroup(practice, groupBy);

    if (!groups.has(group.key)) {
      groups.set(group.key, {
        ...group,
        rows: [],
        total: 0,
        pending: 0,
        approved: 0,
        completed: 0,
        archived: 0,
        archivable: 0,
        facultySet: new Set(),
        careerSet: new Set(),
        academicCycleSet: new Set(),
        courseSet: new Set(),
      });
    }

    const current = groups.get(group.key);
    current.rows.push(practice);
    current.total += 1;
    current.pending += practice.status === 'PENDING' ? 1 : 0;
    current.approved += practice.status === 'APPROVED' ? 1 : 0;
    current.completed += practice.status === 'COMPLETED' ? 1 : 0;
    current.archived += practice.archived ? 1 : 0;
    current.archivable += practice.status === 'COMPLETED' && !practice.archived ? 1 : 0;
    addSetValue(current.facultySet, practice.facultyName);
    addSetValue(current.careerSet, practice.careerName);
    addSetValue(current.academicCycleSet, practice.academicCycleName || practice.courseAcademicCycle);
    addSetValue(current.courseSet, practice.courseName);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      facultyNames: Array.from(group.facultySet).sort(compareText).join(', '),
      careerNames: Array.from(group.careerSet).sort(compareText).join(', '),
      academicCycleNames: Array.from(group.academicCycleSet).sort(compareText).join(', '),
      careerCount: group.careerSet.size,
      academicCycleCount: group.academicCycleSet.size,
      courseCount: group.courseSet.size,
    }))
    .sort((left, right) => {
      const byScope = compareText(left.scopeLabel, right.scopeLabel);
      return byScope !== 0 ? byScope : compareText(left.label, right.label);
    });
}

function addSetValue(set, value) {
  const normalized = String(value || '').trim();

  if (normalized) {
    set.add(normalized);
  }
}

function getPracticeGroup(practice, groupBy) {
  if (groupBy === 'faculty') {
    return {
      key: `faculty:${getPracticeFilterValue(practice, 'faculty')}`,
      label: practice.facultyName || 'Sin facultad',
      scopeLabel: 'Facultad',
    };
  }

  if (groupBy === 'career') {
    return {
      key: `career:${getPracticeFilterValue(practice, 'career')}`,
      label: practice.careerName || 'Sin carrera',
      scopeLabel: practice.facultyName || 'Carrera',
    };
  }

  if (groupBy === 'academicCycle') {
    return {
      key: `cycle:${getPracticeFilterValue(practice, 'academicCycle')}`,
      label: practice.academicCycleName || practice.courseAcademicCycle || 'Sin ciclo',
      scopeLabel: practice.careerName || 'Ciclo',
    };
  }

  return {
    key: `course:${getPracticeFilterValue(practice, 'course')}`,
    label: practice.courseName || 'Sin paralelo',
    scopeLabel: [
      practice.careerName,
      practice.academicCycleName || practice.courseAcademicCycle,
    ].filter(Boolean).join(' / ') || 'Paralelo',
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
