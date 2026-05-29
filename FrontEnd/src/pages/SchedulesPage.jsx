import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Clock3, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api/client';
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
  WEDNESDAY: 'Miercoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sabado',
  SUNDAY: 'Domingo',
};

const ASSISTED_STATUSES = new Set(['PRESENT', 'LATE']);

export function SchedulesPage() {
  const { roles } = useAuth();
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const canOperateSchedules =
    roles.includes('ROLE_TUTOR_INSTITUCIONAL') || roles.includes('ROLE_DIRECTORA_INSTITUCION');
  const canFilterSchedules = !isStudent || canOperateSchedules;

  if (isStudent && !canOperateSchedules) {
    return <StudentScheduleView />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Asistencia"
        title="Horarios y asistencias"
        description="Organiza jornadas de practica y registra la asistencia de estudiantes."
      />
      <EndpointConsole enableListFilters={canFilterSchedules} modules={SCHEDULE_MODULES} />
    </>
  );
}

function StudentScheduleView() {
  const { token } = useAuth();
  const [schedules, setSchedules] = useState([]);
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
  }, [token]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const attendances = useMemo(() => flattenAttendances(schedules), [schedules]);
  const summary = useMemo(() => summarizeAttendances(attendances), [attendances]);

  return (
    <>
      <PageHeader
        eyebrow="Asistencia"
        title="Mi horario"
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
          <Metric icon={Clock3} label="Tiempo asistido" value={formatMinutes(summary.assistedMinutes)} />
          <Metric label="Asistencias" value={summary.presentCount} />
          <Metric label="Atrasos" value={summary.lateCount} />
          <Metric label="Faltas" value={summary.absentCount} />
          <Metric label="Justificadas" value={summary.justifiedCount} />
        </div>
      </SectionCard>

      <div className="space-y-5">
        {loading && !schedules.length ? (
          <SectionCard title="Horario semanal">
            <EmptyState text="Cargando horarios" />
          </SectionCard>
        ) : schedules.length ? (
          schedules.map((schedule) => (
            <SectionCard
              key={schedule.id}
              title={schedule.courseName || 'Horario de practicas'}
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
          <SectionCard title="Horario semanal">
            <EmptyState text="Aun no tienes horarios registrados." />
          </SectionCard>
        )}
      </div>

      <SectionCard
        title="Asistencias y faltas"
        action={<span className="text-sm font-bold text-muted">{attendances.length} asistencias</span>}
      >
        <DataTable
          columns={attendanceColumns}
          emptyText="Aun no hay asistencias registradas."
          loading={loading}
          rows={attendances}
        />
      </SectionCard>
    </>
  );
}

function Metric({ icon: Icon = CalendarClock, label, value }) {
  return (
    <div className="border-l border-[#c8d2cd] px-4 py-2 first:border-l-0 dark:border-slate-700">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-muted">
        <Icon aria-hidden="true" size={16} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-[#20282d] dark:text-slate-50">{value}</p>
    </div>
  );
}

function ScheduleMatrix({ periods }) {
  const timeRows = buildTimeRows(periods);

  if (!timeRows.length) {
    return <EmptyState text="No hay periodos registrados" />;
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-[#dbe3ed] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.055)] dark:border-slate-700 dark:bg-surface">
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead className="bg-[#d7e4e9] text-left text-xs font-extrabold uppercase text-[#475569] dark:bg-[#172033] dark:text-slate-300">
            <tr>
              <th className="border-b border-[#dbe3ed] px-4 py-3 dark:border-slate-700" scope="col">Hora</th>
              {DAY_ORDER.map((day) => (
                <th className="border-b border-[#dbe3ed] px-4 py-3 dark:border-slate-700" key={day} scope="col">
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRows.map((row) => (
              <tr className="even:bg-[#e6efea] hover:bg-[#dbe8ed] dark:even:bg-slate-950/40 dark:hover:bg-sky-300/10" key={row.slot}>
                <th className="border-b border-[#edf2f7] bg-[#eef3f2] px-4 py-3 text-left font-extrabold text-[#40525a] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200" scope="row">
                  {row.slot}
                </th>
                {DAY_ORDER.map((day) => (
                  <td className="border-b border-[#edf2f7] px-4 py-3 align-top text-[#263241] dark:border-slate-800 dark:text-ink" key={day}>
                    {row.byDay[day]?.length ? (
                      <div className="space-y-2">
                        {row.byDay[day].map((period) => (
                          <div key={period.id || `${period.dayOfWeek}-${period.startTime}-${period.place}`}>
                            <p className="font-bold text-[#20282d] dark:text-slate-100">{period.place || 'Practicas'}</p>
                            {period.notes && <p className="text-xs text-muted">{period.notes}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
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
  { key: 'day', header: 'Dia', render: (row) => DAY_LABELS[row.scheduledDayOfWeek] || '-' },
  { key: 'courseName', header: 'Curso' },
  {
    key: 'scheduledTime',
    header: 'Horario',
    render: (row) => formatTimeRange(row.scheduledStartTime, row.scheduledEndTime),
  },
  {
    key: 'registeredTime',
    header: 'Registro',
    render: (row) => formatTimeRange(row.startTime, row.endTime),
  },
  { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'totalMinutes', header: 'Tiempo', render: (row) => formatMinutes(row.totalMinutes) },
  { key: 'observations', header: 'Observaciones', render: (row) => row.observations || '-' },
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

function summarizeAttendances(attendances) {
  return attendances.reduce(
    (summary, attendance) => {
      if (attendance.status === 'PRESENT') {
        summary.presentCount += 1;
      }

      if (attendance.status === 'LATE') {
        summary.lateCount += 1;
      }

      if (attendance.status === 'ABSENT') {
        summary.absentCount += 1;
      }

      if (attendance.status === 'JUSTIFIED') {
        summary.justifiedCount += 1;
      }

      if (ASSISTED_STATUSES.has(attendance.status)) {
        summary.assistedMinutes += Number(attendance.totalMinutes || 0);
      }

      return summary;
    },
    {
      assistedMinutes: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      justifiedCount: 0,
    }
  );
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
