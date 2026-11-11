/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AcademicTables.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente AcademicTables de la interfaz del SGP.
 */

import { EmptyState } from "../../../../components/ui/EmptyState";

export function ActivityPlanScheduleMatrix({ weeks = [] }) {
  const schedule = buildScheduleMatrix(weeks);

  if (!schedule.weekColumns.length || !schedule.rows.length) {
    return <EmptyState text="Aún no hay información agregada en el cronograma." />;
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-sm border border-table-border bg-panel dark:border-line dark:bg-surface">
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-collapse text-[11px] leading-tight text-table-ink dark:text-heading">
          <colgroup>
            <col className="w-[52%]" />
            {schedule.weekColumns.map((week) => (
              <col key={week.key} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                className="border border-table-border bg-table-header px-2 py-2 text-center font-serif text-[12px] font-medium uppercase text-table-ink dark:border-line dark:bg-table-header"
                colSpan={schedule.weekColumns.length + 1}
              >
                CRONOGRAMA DE ACTIVIDADES PRÁCTICAS PARA EL DESARROLLO DEL PIS
              </th>
            </tr>
            <tr>
              <th className="border border-table-border bg-table-header px-2 py-1.5 text-center font-serif font-medium text-table-ink dark:border-line dark:bg-table-header">
                Actividades
              </th>
              {schedule.monthGroups.map((month) => (
                <th
                  className="border border-table-border bg-table-header px-2 py-1.5 text-center font-serif font-medium text-table-ink dark:border-line dark:bg-table-header"
                  colSpan={month.span}
                  key={month.key}
                >
                  {month.label}
                </th>
              ))}
            </tr>
            <tr>
              <th className="border border-table-border bg-table-header px-2 py-1.5 text-center font-serif font-medium text-table-ink dark:border-line dark:bg-table-header">
                Semanas
              </th>
              {schedule.weekColumns.map((week) => (
                <th
                  className="border border-table-border bg-table-header px-1 py-1.5 text-center font-serif font-medium text-table-ink dark:border-line dark:bg-table-header"
                  key={week.key}
                >
                  {week.weekNumber}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.rows.map((row, rowIndex) => (
              <tr key={`${row.weekKey}-${rowIndex}`}>
                <td className="break-words border border-table-border px-1.5 py-1 font-serif text-[10.5px] leading-snug text-table-ink dark:border-line dark:text-heading">
                  {row.activity}
                </td>
                {schedule.weekColumns.map((week) => {
                  const active = week.key === row.weekKey;

                  return (
                    <td
                      aria-label={active ? `Semana ${week.weekNumber}: ${row.activity}` : `Semana ${week.weekNumber}`}
                      className="h-6 border border-table-border p-0 dark:border-line"
                      key={week.key}
                    >
                      {active && (
                        <span
                          className="block h-full min-h-6 w-full"
                          style={{ backgroundColor: row.color }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActivityWeeksAcademicTable({ weeks = [] }) {
  const rows = normalizeActivityWeeks(weeks);

  if (!rows.length) {
    return <EmptyState text="Aún no hay actividades agregadas." />;
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-sm border border-table-border bg-panel dark:border-line dark:bg-surface">
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-collapse font-serif text-[12px] leading-relaxed text-table-ink dark:text-heading lg:w-full">
          <colgroup>
            <col className="w-[7.5rem]" />
            <col />
          </colgroup>
          <tbody>
            {rows.map((week) => (
              <tr key={week.key}>
                <th className="border border-table-border bg-table-header px-2 py-4 text-center font-medium uppercase text-table-ink dark:border-line dark:bg-table-header">
                  SEMANA {week.weekNumber}
                </th>
                <th className="border border-table-border bg-table-header px-4 py-3 text-center font-medium uppercase text-table-ink dark:border-line dark:bg-table-header">
                  {week.dateRange}
                </th>
              </tr>
            )).flatMap((headerRow, index) => {
              const week = rows[index];

              return [
                headerRow,
                <tr key={`${week.key}-body`}>
                  <th className="border border-table-border px-2 py-8 text-center font-medium text-table-ink dark:border-line dark:text-heading">
                    Actividad
                  </th>
                  <td className="border border-table-border px-6 py-4 align-top dark:border-line">
                    <ul className="m-0 list-disc space-y-3 pl-5">
                      {week.activities.map((activity, activityIndex) => (
                        <li className="pl-2" key={`${week.key}-activity-${activityIndex}`}>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function isActivityPlanSchedule(moduleId, collectionKey) {
  return moduleId === 'activity-plans' && collectionKey === 'scheduleWeeks';
}

export function isActivityWeeksCollection(collectionKey) {
  return collectionKey === 'activityWeeks';
}

function normalizeActivityWeeks(weeks = []) {
  return [...weeks]
    .filter((week) => week && (week.weekNumber || week.activities || week.startDate || week.endDate))
    .sort((first, second) => Number(first.weekNumber || 0) - Number(second.weekNumber || 0))
    .map((week, index) => {
      const weekNumber = Number(week.weekNumber || index + 1);

      return {
        key: `${weekNumber}-${week.startDate || ''}-${index}`,
        weekNumber,
        dateRange: academicWeekRange(week.startDate, week.endDate),
        activities: splitScheduledActivities(week.activities),
      };
    });
}

function academicWeekRange(startDate, endDate) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (!start && !end) {
    return 'FECHAS POR DEFINIR';
  }

  if (!start) {
    return `HASTA ${formatAcademicDate(end)}`;
  }

  if (!end || start.getTime() === end.getTime()) {
    return formatAcademicDate(start);
  }

  return `DEL ${formatAcademicDate(start)} AL ${formatAcademicDate(end)}`;
}

function formatAcademicDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date).toUpperCase();
}

function parseLocalDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

const SCHEDULE_MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const SCHEDULE_CELL_COLORS = [
  'var(--color-chart-4)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-7)',
  'var(--color-success)',
  'var(--color-chart-1)',
  'var(--color-chart-9)',
  'var(--color-chart-6)',
  'var(--color-warning)',
  'var(--color-chart-10)',
  'var(--color-chart-8)',
  'var(--color-danger)',
];

function buildScheduleMatrix(weeks = []) {
  const weekColumns = normalizeScheduleWeeks(weeks);
  const monthGroups = buildScheduleMonthGroups(weekColumns);
  const rows = weekColumns.flatMap((week, weekIndex) =>
    splitScheduledActivities(week.scheduledActivities).map((activity, activityIndex) => ({
      activity,
      color: SCHEDULE_CELL_COLORS[(weekIndex + activityIndex) % SCHEDULE_CELL_COLORS.length],
      weekKey: week.key,
    })),
  );

  return {
    monthGroups,
    rows,
    weekColumns,
  };
}

function normalizeScheduleWeeks(weeks = []) {
  return [...weeks]
    .filter((week) => week && (week.weekNumber || week.scheduledActivities || week.startDate || week.endDate))
    .sort((first, second) => Number(first.weekNumber || 0) - Number(second.weekNumber || 0))
    .map((week, index) => {
      const weekNumber = Number(week.weekNumber || index + 1);

      return {
        ...week,
        key: `${weekNumber}-${week.startDate || ''}-${index}`,
        monthLabel: scheduleMonthLabel(week.startDate || week.endDate),
        weekNumber,
      };
    });
}

function buildScheduleMonthGroups(weeks) {
  return weeks.reduce((groups, week) => {
    const label = week.monthLabel || 'Mes';
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.label === label) {
      lastGroup.span += 1;
      return groups;
    }

    groups.push({
      key: `${label}-${groups.length}`,
      label,
      span: 1,
    });

    return groups;
  }, []);
}

function scheduleMonthLabel(value) {
  if (!value) {
    return 'Mes';
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'Mes';
  }

  return SCHEDULE_MONTH_LABELS[date.getMonth()] || 'Mes';
}

function splitScheduledActivities(value) {
  const activities = String(value || '')
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return activities.length ? activities : ['Actividad programada'];
}

