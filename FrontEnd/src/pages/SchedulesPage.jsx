/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SchedulesPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta las jornadas de prácticas y los registros de asistencia según los permisos de cada usuario.
 */

import { AgendaView } from '../components/ui/AgendaView';
import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';
import { usePracticeRequest } from '../contexts/PracticeWorkspaceContext';
import { workflowCopy } from '../config/roleExperience';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { summarizeAttendances } from '../utils/practiceIndicators';
import { CalendarClock, Clock3, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { SecondaryButton } from '../components/ui/ActionBar';
import { DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SCHEDULE_MODULES } from '../config/endpointModules';
import { EndpointConsole } from '../components/EndpointConsole';

const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_LABELS = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};


export function SchedulesPage() {
  const { roles } = useAuth();
  const [view, setView] = useState('records');
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const canOperateSchedules =
    roles.includes('ROLE_TUTOR_INSTITUCIONAL');
  const canFilterSchedules = !isStudent || canOperateSchedules;

  if (isStudent && !canOperateSchedules) {
    return <StudentScheduleView />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Asistencia"
        title="Jornadas y asistencias"
        description={workflowCopy('schedules', roles)}
        helpText={workflowCopy('schedules', roles)}
      />
      <ModuleTabs><ModuleTab active={view==='agenda'} onClick={() => setView('agenda')}>Agenda semanal</ModuleTab><ModuleTab active={view==='records'} onClick={() => setView('records')}>Gestión y registros</ModuleTab></ModuleTabs>
      {view==='agenda' ? <ManagedAgenda roles={roles} /> : <EndpointConsole enableListFilters={canFilterSchedules} modules={SCHEDULE_MODULES} />}
    </>
  );
}

function ManagedAgenda({ roles }) {
 const apiRequest = usePracticeRequest();
 const { token } = useAuth();
 const [schedules,setSchedules] = useState(null), [error,setError] = useState(''), [retry,setRetry] = useState(0);
 const path = roles.includes('ROLE_TUTOR_INSTITUCIONAL') ? '/api/practice-schedules/managed' : roles.includes('ROLE_DIRECTORA_INSTITUCION') ? '/api/practice-schedules/institution-review' : '/api/practice-schedules/review';
 useEffect(() => {
  let active=true;setError('');setSchedules(null);
  apiRequest(path,{token}).then(rows => {if(active) setSchedules(Array.isArray(rows) ? rows : []);}).catch(error => {if(active) setError(error.message);});
  return () => {active=false;};
 },[apiRequest,token,path,retry]);
 return <SectionCard title="Agenda semanal" action={<SecondaryButton onClick={() => setRetry(value => value+1)}>Actualizar agenda</SecondaryButton>}>{error ? <Alert tone="error">{error}</Alert> : schedules ? <AgendaView schedules={schedules} /> : <p role="status">Cargando jornadas…</p>}</SectionCard>;
}

function StudentScheduleView() {
  const apiRequest = usePracticeRequest();
  const { token } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [view,setView] = useState('agenda');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await apiRequest('/api/practice-schedules/me', { token });
      setSchedules(Array.isArray(payload) ? payload : []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token, apiRequest]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const attendances = useMemo(() => flattenAttendances(schedules), [schedules]);
  const summary = useMemo(() => summarizeAttendances(attendances), [attendances]);

  return (
    <>
      <PageHeader
        eyebrow="Asistencia"
        title="Mis jornadas"
        description="Consulta tus jornadas, asistencias, faltas y tiempo acumulado."
        action={
          <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadSchedules} type="button">
            Actualizar
          </SecondaryButton>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      <SectionCard title="Resumen">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Clock3} label="Tiempo asistido" value={loading || error ? '—' : formatMinutes(summary.assistedMinutes)} />
          <Metric label="Asistencias" value={loading || error ? '—' : summary.presentCount} />
          <Metric label="Atrasos" value={loading || error ? '—' : summary.lateCount} />
          <Metric label="Faltas" value={loading || error ? '—' : summary.absentCount} />
          <Metric label="Justificadas" value={loading || error ? '—' : summary.justifiedCount} />
        </div>
      </SectionCard>

      <ModuleTabs><ModuleTab active={view==='agenda'} onClick={() => setView('agenda')}>Agenda semanal</ModuleTab><ModuleTab active={view==='records'} onClick={() => setView('records')}>Jornadas y asistencias</ModuleTab></ModuleTabs>
      {view==='agenda' ? <SectionCard title="Agenda semanal">{loading ? <p role="status">Cargando jornadas…</p> : !error && <AgendaView schedules={schedules} />}</SectionCard> : <>
      <div className="space-y-5">
        {loading && !schedules.length ? (
          <SectionCard title="Jornadas programadas">
            <EmptyState text="Cargando jornadas" />
          </SectionCard>
        ) : schedules.length ? (
          schedules.map((schedule) => (
            <SectionCard
              key={schedule.id}
              title={schedule.courseName || 'Jornada'}
              description={[
                schedule.educationalInstitutionName,
                formatDateRange(schedule.startDate, schedule.endDate),
              ]
                .filter(Boolean)
                .join(' | ')}
            >
              <ScheduleMatrix periods={schedule.periods || []} />
            </SectionCard>
          ))
        ) : (
          <SectionCard title="Jornadas programadas">
            <EmptyState text="Aún no tienes jornadas registradas." />
          </SectionCard>
        )}
      </div>

      <SectionCard
        title="Asistencias y faltas"
        action={<span className="text-sm font-medium text-body">{attendances.length} asistencias</span>}
      >
        <DataTable
          columns={attendanceColumns}
          emptyText="Aun no hay asistencias registradas."
          loading={loading}
          rows={attendances}
        />
      </SectionCard>
      </>}
    </>
  );
}

function Metric({ icon: Icon = CalendarClock, label, value }) {
  return (
    <div className="sgp-color-card rounded-lg border border-line px-4 py-3 shadow-card dark:border-line">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-body">
        <Icon aria-hidden="true" size={16} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-heading dark:text-heading">{value}</p>
    </div>
  );
}

function ScheduleMatrix({ periods }) {
  const timeRows = buildTimeRows(periods);

  if (!timeRows.length) {
    return <EmptyState text="No hay períodos registrados" />;
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-line bg-panel shadow-card dark:border-line dark:bg-surface">
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead className="bg-table-header text-left text-xs font-medium uppercase text-table-ink dark:bg-table-header dark:text-table-ink">
            <tr>
              <th className="border-b border-line px-4 py-3 dark:border-line" scope="col">Hora</th>
              {DAY_ORDER.map((day) => (
                <th className="border-b border-line px-4 py-3 dark:border-line" key={day} scope="col">
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRows.map((row) => (
              <tr className="even:bg-panel-soft hover:bg-info-soft dark:even:bg-page/40 dark:hover:bg-info-soft" key={row.slot}>
                <th className="border-b border-line-soft bg-panel-soft px-4 py-3 text-left font-semibold text-nav-text dark:border-line dark:bg-surface dark:text-body" scope="row">
                  {row.slot}
                </th>
                {DAY_ORDER.map((day) => (
                  <td className="border-b border-line-soft px-4 py-3 align-top text-body dark:border-line dark:text-ink" key={day}>
                    {row.byDay[day]?.length ? (
                      <div className="space-y-2">
                        {row.byDay[day].map((period) => (
                          <div key={period.id || `${period.dayOfWeek}-${period.startTime}-${period.place}`}>
                            <p className="font-medium text-heading dark:text-heading">{period.place || 'Jornada'}</p>
                            {period.notes && <p className="text-xs text-body">{period.notes}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-body dark:text-ink">-</span>
                    )}
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

const attendanceColumns = [
  { key: 'attendanceDate', header: 'Fecha', render: (row) => formatLocalDate(row.attendanceDate) },
  { key: 'day', secondary: true, header: 'Día', render: (row) => DAY_LABELS[row.scheduledDayOfWeek] || '-' },
  { key: 'courseName', header: 'Paralelo' },
  {
    key: 'scheduledTime',
    header: 'Jornada',
    render: (row) => formatTimeRange(row.scheduledStartTime, row.scheduledEndTime),
  },
  {
    key: 'registeredTime',
    header: 'Registro',
    render: (row) => formatTimeRange(row.startTime, row.endTime),
  },
  { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'totalMinutes', header: 'Tiempo', render: (row) => formatMinutes(row.totalMinutes) },
  { key: 'observations', secondary: true, header: 'Observaciones', render: (row) => row.observations || '-' },
];

function flattenAttendances(schedules) {
  return schedules
    .flatMap((schedule) =>
      (schedule.attendances || []).map((attendance) => ({
        ...attendance,
        courseName: schedule.courseName,
      }))
    )
    .sort((left, right) => compareDates(right.attendanceDate, left.attendanceDate));
}

function buildTimeRows(periods) {
  const rows = new Map();

  periods.forEach((period) => {
    const slot = formatTimeRange(period.startTime, period.endTime);

    if (!rows.has(slot)) {
      rows.set(slot, {
        slot,
        sortKey: period.startTime || '',
        byDay: Object.fromEntries(DAY_ORDER.map((day) => [day, []])),
      });
    }

    rows.get(slot).byDay[period.dayOfWeek]?.push(period);
  });

  return [...rows.values()].sort((left, right) => left.sortKey.localeCompare(right.sortKey));
}

function compareDates(left, right) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return -1;
  }

  if (!right) {
    return 1;
  }

  return String(left).localeCompare(String(right));
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return '';
  }

  return `${formatLocalDate(startDate)} - ${formatLocalDate(endDate)}`;
}

function formatLocalDate(value) {
  if (!value) {
    return '-';
  }

  const [datePart] = String(value).split('T');
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(year, month - 1, day));
}

function formatTime(value) {
  if (!value) {
    return null;
  }

  return String(value).slice(0, 5);
}

function formatTimeRange(startTime, endTime) {
  const start = formatTime(startTime);
  const end = formatTime(endTime);

  if (!start && !end) {
    return '-';
  }

  return [start, end].filter(Boolean).join(' - ');
}

function formatMinutes(totalMinutes) {
  const minutesValue = Number(totalMinutes || 0);
  const hours = Math.floor(minutesValue / 60);
  const minutes = minutesValue % 60;

  return `${hours}h ${minutes}min`;
}
