import { useState } from 'react';
import { Clock3 } from 'lucide-react';
import {
  extractNestedCollections,
  formatValue,
  labelFromKey,
} from '../utils/format';
import { getApiBaseUrl } from '../api/client';
import { DataTable } from './ui/DataTable';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';

const feedbackInlineClass = 'rounded-lg border-l-[3px] border-accent bg-accent-soft p-3 dark:border-accent dark:bg-accent-soft';
const feedbackMetaClass = 'mt-2 text-xs leading-5 text-accent-strong dark:text-accent-strong';

export function DataInspector({ data, moduleId, token }) {
  if (!data) {
    return <EmptyState text="Selecciona un documento para ver el detalle." />;
  }

  const collections = extractNestedCollections(data)
    .filter((collection) => !['feedbackComments', 'feedbackHistory'].includes(collection.key));
  const timeline = buildDocumentTimeline(data, moduleId);
  const groups = buildDetailGroups(data, moduleId, collections);
  const groupedCollectionKeys = new Set(
    groups.flatMap((group) => group.collections?.map((collection) => collection.key) || [])
  );
  const standaloneCollections = collections.filter((collection) => !groupedCollectionKeys.has(collection.key));

  return (
    <div className="min-w-0 max-w-full space-y-4">
      {timeline.length > 0 && <DocumentTimeline events={timeline} />}
      <DocumentApprovalStatus data={data} />

      {groups.length > 0 && (
        <div className="min-w-0 max-w-full space-y-4">
          {groups.map((group) => {
            const feedbackStatus = resolveSectionFeedbackStatus(data, group);
            const feedbackThread = buildSectionFeedbackThread(data, group);
            const showFeedbackThread = feedbackThread.length > 1
              || (feedbackThread.length === 1 && !sectionHasVisibleFeedback(group));

            return (
              <section
                className="sgp-color-card scroll-mt-24 min-w-0 max-w-full rounded-lg border border-line bg-panel-soft p-3 dark:border-line dark:bg-surface-soft"
                id={detailGroupDomId(group)}
                key={group.title}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-heading dark:text-heading">{group.title}</h3>
                  {feedbackStatus && (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${sectionStatusClass(feedbackStatus.tone)}`}>
                      {feedbackStatus.label}
                    </span>
                  )}
                </div>
                {group.items.length > 0 && (
                  <dl className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <div
                        className={`grid min-w-0 grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-3 text-sm max-sm:grid-cols-1 ${item.feedback ? feedbackInlineClass : ''}`}
                        key={item.key}
                      >
                        <dt className="min-w-0 break-words text-body dark:text-ink">{item.label}</dt>
                        <dd className="min-w-0 whitespace-pre-wrap break-words font-medium text-heading dark:text-heading">
                          <div className="min-w-0 break-words">{item.value}</div>
                          {item.feedbackMeta && (
                            <div className={feedbackMetaClass}>{formatFeedbackMeta(item.feedbackMeta)}</div>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {group.collections?.map((collection) => (
                  <div className="mt-3 min-w-0 max-w-full" key={collection.key}>
                    <h4 className="text-xs font-semibold uppercase text-body dark:text-ink">{collection.title}</h4>
                    <div className="mt-2 min-w-0 max-w-full">
                      {isActivityWeeksCollection(collection.key) ? (
                        <ActivityWeeksAcademicTable weeks={collection.rows} />
                      ) : isActivityPlanSchedule(moduleId, collection.key) ? (
                        <ActivityPlanScheduleMatrix weeks={collection.rows} />
                      ) : (
                        <DataTable
                          columns={makeColumns(collection.rows, data, moduleId, token)}
                          emptyText="Aun no hay informacion agregada."
                          rows={collection.rows}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {showFeedbackThread && <SectionFeedbackThread entries={feedbackThread} />}
              </section>
            );
          })}
        </div>
      )}

      {standaloneCollections.map((collection) => (
        <section className="sgp-color-card min-w-0 max-w-full rounded-lg border border-line bg-panel p-3 dark:border-line dark:bg-surface" key={collection.key}>
          <h3 className="text-sm font-medium text-heading dark:text-heading">{collection.title}</h3>
          <div className="mt-3 min-w-0 max-w-full">
            {isActivityWeeksCollection(collection.key) ? (
              <ActivityWeeksAcademicTable weeks={collection.rows} />
            ) : isActivityPlanSchedule(moduleId, collection.key) ? (
              <ActivityPlanScheduleMatrix weeks={collection.rows} />
            ) : (
              <DataTable
                columns={makeColumns(collection.rows, data, moduleId, token)}
                emptyText="Aun no hay informacion agregada."
                rows={collection.rows}
              />
            )}
          </div>
        </section>
      ))}

    </div>
  );
}

export function DocumentApprovalStatus({ data }) {
  if (!data) {
    return null;
  }

  const reviews = buildApprovalReviews(data);
  const hasApprovalData = reviews.length > 0
    || data.status
    || data.approvedAt
    || data.submittedAt;

  if (!hasApprovalData) {
    return null;
  }

  return (
    <section className="sgp-color-card rounded-lg border border-line bg-panel p-3 dark:border-line dark:bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-heading dark:text-heading">Estado de aprobacion</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${approvalToneClass(documentApprovalTone(data))}`}>
          {formatValue(data.status || 'DRAFT', 'status')}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {reviews.map((review) => (
          <article
            className="rounded-lg border border-line-soft bg-field-hover p-3 dark:border-line dark:bg-surface"
            key={review.key}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-sm font-semibold text-heading dark:text-heading">{review.label}</p>
              <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${approvalToneClass(review.tone)}`}>
                {review.status}
              </span>
            </div>
            <dl className="mt-2 grid gap-1 text-xs leading-5">
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                <dt className="font-medium text-body">Por</dt>
                <dd className="min-w-0 break-words text-heading dark:text-heading">{review.author || '-'}</dd>
              </div>
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                <dt className="font-medium text-body">Fecha</dt>
                <dd className="min-w-0 break-words text-heading dark:text-heading">{review.at ? formatValue(review.at, 'reviewedAt') : '-'}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      {data.approvedAt && (
        <p className="mt-3 text-xs font-medium text-accent-strong dark:text-accent-strong">
          Aprobacion final: {formatValue(data.approvedAt, 'approvedAt')}
        </p>
      )}
    </section>
  );
}

export function ActivityPlanScheduleMatrix({ weeks = [] }) {
  const schedule = buildScheduleMatrix(weeks);

  if (!schedule.weekColumns.length || !schedule.rows.length) {
    return <EmptyState text="Aun no hay informacion agregada en el cronograma." />;
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
                CRONOGRAMA DE ACTIVIDADES PRACTICAS PARA EL DESARROLLO DEL PIS
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
    return <EmptyState text="Aun no hay actividades agregadas." />;
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

function SectionFeedbackThread({ entries }) {
  return (
    <div className="mt-4 rounded-lg border-l-[3px] border-accent bg-success-soft p-3 dark:border-accent dark:bg-accent-soft">
      <h4 className="m-0 mb-2 text-xs font-semibold uppercase text-accent-strong dark:text-accent-strong">Retroalimentacion de la seccion</h4>
      <ol className="grid list-none gap-2 p-0 m-0">
        {entries.map((entry) => (
          <li className="border-t border-success/15 pt-2 first:border-t-0 first:pt-0 dark:border-accent/20" key={entry.id}>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold leading-5 text-success-strong dark:text-accent-strong">
              <span>{entry.meta ? formatFeedbackMeta(entry.meta) : 'Retroalimentación registrada'}</span>
              {entry.entryLabel && <span>{entry.entryLabel}</span>}
            </div>
            <p className="m-0 mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-body dark:text-heading">{entry.message}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DocumentTimeline({ events }) {
  const [open, setOpen] = useState(false);

  function handleGoToSection(targetId) {
    setOpen(false);
    window.setTimeout(() => scrollToDetailSection(targetId), 80);
  }

  return (
    <section className="sgp-color-card rounded-lg border border-line bg-panel p-3 dark:border-line dark:bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-heading dark:text-heading">Linea de tiempo</h3>
          <p className="mt-1 text-xs font-semibold text-body">
            Consulta los movimientos y revisiones del documento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-panel-soft px-2 py-1 text-xs font-medium text-body dark:bg-surface-soft dark:text-ink">
            {timelineCountLabel(events.length)}
          </span>
          <button
            className="inline-flex min-h-[2.25rem] items-center gap-2 rounded-lg border border-accent px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-accent dark:text-accent-strong dark:hover:bg-hover-soft dark:hover:text-inverse"
            onClick={() => setOpen(true)}
            type="button"
          >
            <Clock3 aria-hidden="true" size={16} />
            Ver linea de tiempo
          </button>
        </div>
      </div>

      <Modal
        description={`${timelineCountLabel(events.length)} registrados para este documento.`}
        maxWidth="max-w-3xl"
        onClose={() => setOpen(false)}
        open={open}
        title="Linea de tiempo"
      >
        <ol className="space-y-3">
          {events.map((event) => (
            <li className="grid gap-2 text-sm sm:grid-cols-[150px_1fr] sm:gap-3" key={event.id}>
              <time className="text-xs font-semibold text-body sm:pt-3">
                {formatValue(event.at, 'createdAt')}
              </time>
              <div className={`rounded-md border p-3 ${timelineToneClass(event.tone)}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="font-medium text-heading dark:text-heading">{event.title}</div>
                  {event.targetId && (
                    <button
                      className="rounded-lg border border-accent px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-accent dark:text-accent-strong dark:hover:bg-hover-soft"
                      onClick={() => handleGoToSection(event.targetId)}
                      type="button"
                    >
                      Ver apartado
                    </button>
                  )}
                </div>
                {event.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-body dark:text-body">
                    {event.description}
                  </p>
                )}
                {event.meta && (
                  <div className="mt-2 text-xs font-medium uppercase tracking-wide text-body">
                    {event.meta}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Modal>
    </section>
  );
}

function buildApprovalReviews(data) {
  const reviews = [];

  addApprovalReview(reviews, data, {
    key: 'practice',
    label: 'Tutor de practicas',
    approvedKey: 'practiceTutorApproved',
    authorKeys: ['practiceReviewedBy', 'reviewedBy'],
    atKeys: ['practiceReviewedAt', 'reviewedAt'],
  });
  addApprovalReview(reviews, data, {
    key: 'institutional',
    label: 'Tutor institucional',
    approvedKey: 'institutionalTutorApproved',
    authorKeys: ['institutionalReviewedBy'],
    atKeys: ['institutionalReviewedAt'],
  });
  addApprovalReview(reviews, data, {
    key: 'director',
    label: 'Director de practicas',
    approvedKey: 'directorApproved',
    authorKeys: ['directorReviewedBy'],
    atKeys: ['directorReviewedAt'],
  });

  return reviews.filter((review) => review.visible);
}

function addApprovalReview(reviews, data, config) {
  const author = firstText(config.authorKeys.map((key) => data?.[key]));
  const at = firstText(config.atKeys.map((key) => data?.[key]));
  const approved = data?.[config.approvedKey];
  const hasExplicitApproval = typeof approved === 'boolean';
  const visible = hasExplicitApproval || Boolean(author || at);

  if (!visible) {
    return;
  }

  reviews.push({
    key: config.key,
    label: config.label,
    author,
    at,
    visible,
    ...approvalReviewState(data, approved, Boolean(author || at)),
  });
}

function approvalReviewState(data, approved, hasReviewTrace) {
  if (approved === true) {
    return {
      status: 'Aprobado',
      tone: 'approved',
    };
  }

  if (hasReviewTrace && String(data?.status || '').toUpperCase() === 'NEEDS_CORRECTION') {
    return {
      status: 'Correcciones',
      tone: 'observed',
    };
  }

  if (hasReviewTrace) {
    return {
      status: 'Revisado',
      tone: 'corrected',
    };
  }

  return {
    status: 'Pendiente',
    tone: 'idle',
  };
}

function documentApprovalTone(data) {
  const status = String(data?.status || '').toUpperCase();

  if (status === 'APPROVED') {
    return 'approved';
  }

  if (status === 'NEEDS_CORRECTION') {
    return 'observed';
  }

  if (status === 'SUBMITTED') {
    return 'corrected';
  }

  return 'idle';
}

function approvalToneClass(tone) {
  switch (tone) {
    case 'approved':
      return 'bg-accent-soft text-accent-strong dark:bg-accent-soft dark:text-accent-strong';
    case 'observed':
      return 'bg-warning-soft text-warning-strong dark:bg-warning-soft dark:text-warning-strong';
    case 'corrected':
      return 'bg-info-soft text-info-strong dark:bg-info-soft dark:text-info-strong';
    default:
      return 'bg-panel-soft text-body dark:bg-surface-soft dark:text-ink';
  }
}

function firstText(values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') || '';
}

function isActivityPlanSchedule(moduleId, collectionKey) {
  return moduleId === 'activity-plans' && collectionKey === 'scheduleWeeks';
}

function isActivityWeeksCollection(collectionKey) {
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

function timelineToneClass(tone) {
  switch (tone) {
    case 'approved':
      return 'border-success bg-success-soft dark:border-success/40 dark:bg-success-soft';
    case 'feedback':
      return 'border-warning bg-warning-soft dark:border-warning/40 dark:bg-warning-soft';
    case 'review':
      return 'border-info bg-info-soft dark:border-info/40 dark:bg-info-soft';
    case 'submitted':
      return 'border-info-soft bg-primary-soft dark:border-info/30 dark:bg-info-soft';
    case 'rejected':
      return 'border-danger bg-danger-soft dark:border-danger/40 dark:bg-danger-soft';
    default:
      return 'border-line bg-panel-soft dark:border-line dark:bg-surface-soft';
  }
}

function buildDocumentTimeline(data, moduleId) {
  const events = [];
  const cycle = Number(data.reviewCycle || 0);

  pushTimelineEvent(events, {
    id: 'created',
    at: data.createdAt,
    title: `${documentTimelineLabel(moduleId)} creado`,
    tone: 'neutral',
  });

  pushTimelineEvent(events, {
    id: 'submitted',
    at: data.submittedAt,
    title: cycle > 1 ? `Ciclo ${cycle} reenviado` : 'Documento enviado',
    description: 'El estudiante envio el documento para revision.',
    meta: cycle > 0 ? `Ciclo: ${cycle}` : null,
    tone: 'submitted',
  });

  timelineFeedbackEvents(data).forEach((event) => pushTimelineEvent(events, event));
  timelineReviewEvents(data).forEach((event) => pushTimelineEvent(events, event));

  pushTimelineEvent(events, {
    id: 'approved',
    at: data.approvedAt,
    title: 'Documento aprobado',
    meta: timelineMeta({ author: data.approvedBy, cycle }),
    tone: 'approved',
  });

  pushTimelineEvent(events, {
    id: 'rejected',
    at: data.rejectedAt,
    title: 'Documento rechazado',
    meta: timelineMeta({ author: data.rejectedBy, cycle }),
    tone: 'rejected',
  });

  return events
    .sort((first, second) => first.sortAt - second.sortAt || first.sortOrder - second.sortOrder)
    .map((event, index) => ({
      at: event.at,
      description: event.description,
      id: `${event.id}-${index}`,
      meta: event.meta,
      targetId: event.targetId,
      title: event.title,
      tone: event.tone,
    }));
}

function timelineCountLabel(count) {
  return `${count} ${count === 1 ? 'movimiento' : 'movimientos'}`;
}

function documentTimelineLabel(moduleId) {
  switch (moduleId) {
    case 'activity-plans':
      return 'L.2. Plan de Actividades';
    case 'practice-reports':
      return 'L.1. Informe de Actividades Cumplidas';
    case 'final-reports':
      return 'L.3. Informe Tutor Institucional';
    case 'completed-records':
      return 'L.6. Registro de Actividades Cumplidas';
    default:
      return 'Documento';
  }
}

function timelineFeedbackEvents(data) {
  const feedbackItems = hasItems(data.feedbackHistory)
    ? data.feedbackHistory
    : data.feedbackComments || [];

  return feedbackItems.map((feedback, index) => {
    const section = feedbackSectionLabel(feedback.sectionKey);
    const entryId = Number(feedback.entryId || 0);
    const title = entryId > 0
      ? `Retroalimentación en ${section} (registro especifico)`
      : `Retroalimentación en ${section}`;

    return {
      id: `feedback-${feedback.sectionKey || 'general'}-${entryId}-${feedback.createdAt || feedback.updatedAt || index}`,
      at: feedback.createdAt || feedback.updatedAt,
      title,
      description: feedback.message,
      meta: timelineMeta({
        role: feedback.authorRole,
        author: feedback.authorName || feedback.authorUsername,
        cycle: feedback.reviewCycle,
      }),
      targetId: detailSectionDomIdFromFeedbackKey(feedback.sectionKey),
      tone: 'feedback',
    };
  });
}

function timelineReviewEvents(data) {
  return [
    {
      id: 'practice-review',
      atKey: 'practiceReviewedAt',
      authorKey: 'practiceReviewedBy',
      role: 'Tutor de practicas',
    },
    {
      id: 'institutional-review',
      atKey: 'institutionalReviewedAt',
      authorKey: 'institutionalReviewedBy',
      role: 'Tutor institucional',
    },
    {
      id: 'tutor-review',
      atKey: 'reviewedAt',
      authorKey: 'reviewedBy',
      role: 'Tutor de practicas',
    },
    {
      id: 'director-review',
      atKey: 'directorReviewedAt',
      authorKey: 'directorReviewedBy',
      role: 'Director de practicas',
    },
  ].map((source) => ({
    id: source.id,
    at: data[source.atKey],
    title: `Revision de ${source.role}`,
    meta: timelineMeta({
      role: source.role,
      author: data[source.authorKey],
      cycle: data.reviewCycle,
    }),
    tone: 'review',
  }));
}

function pushTimelineEvent(events, event) {
  if (!event.at) {
    return;
  }

  const date = new Date(event.at);

  if (Number.isNaN(date.getTime())) {
    return;
  }

  events.push({
    ...event,
    sortAt: date.getTime(),
    sortOrder: events.length,
  });
}

function timelineMeta({ role, author, cycle }) {
  const authorLabel = [role, author].filter(Boolean).join(': ');
  const parts = [];

  if (authorLabel) {
    parts.push(`Por: ${authorLabel}`);
  }

  if (cycle) {
    parts.push(`Ciclo: ${cycle}`);
  }

  return parts.join(' | ');
}

function scrollToDetailSection(targetId) {
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.classList.add('detail-section-highlight');
  window.setTimeout(() => target.classList.remove('detail-section-highlight'), 1600);
}

function detailGroupDomId(group) {
  const primaryKey = group?.feedbackKeys?.[0] || group?.title || 'section';

  return detailSectionDomIdFromFeedbackKey(primaryKey);
}

function detailSectionDomIdFromFeedbackKey(key) {
  return `detail-section-${normalizeDomId(feedbackSectionLabel(key))}`;
}

function normalizeDomId(value) {
  return String(value || 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function feedbackSectionLabel(key) {
  if (!key) {
    return 'Documento';
  }

  const baseKey = key
    .replace(/Feedback$/i, '')
    .replace(/Suggestions$/i, 'Suggestions')
    .replace(/^(practice|institutional|director)/i, '');
  const normalizedKey = baseKey
    ? baseKey.charAt(0).toLowerCase() + baseKey.slice(1)
    : key;
  const labels = {
    accreditation: 'Acreditacion',
    activities: 'Actividades',
    activity: 'Actividad',
    approval: 'Aprobacion',
    antecedents: 'Antecedentes',
    conclusions: 'Conclusiones',
    feedback: 'Actividad',
    generalInfo: 'Datos generales',
    methodology: 'Metodologia',
    objective: 'Objetivo',
    objectives: 'Objetivos',
    presentation: 'Presentacion',
    recommendations: 'Recomendaciones',
    resources: 'Recursos',
    schedule: 'Cronograma',
    suggestions: 'Sugerencias',
  };

  return labels[normalizedKey] || labelFromKey(normalizedKey);
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function resolveSectionFeedbackStatus(data, group) {
  const keys = sectionFeedbackKeys(group);

  if (keys.size === 0) {
    return null;
  }

  if (sectionHasVisibleFeedback(group) || feedbackItemsMatch(data.feedbackComments, keys)) {
    return {
      label: 'Observado',
      tone: 'observed',
    };
  }

  if (isApprovedDocument(data)) {
    return {
      label: 'Aprobado',
      tone: 'approved',
    };
  }

  if (feedbackItemsMatch(data.feedbackHistory, keys) && Number(data.reviewCycle || 0) > 1) {
    return {
      label: 'Corregido',
      tone: 'corrected',
    };
  }

  return {
    label: 'Sin retroalimentación',
    tone: 'idle',
  };
}

function sectionFeedbackKeys(group) {
  const keys = new Set(group.feedbackKeys || []);

  (group.items || []).forEach((item) => {
    if (item.feedback) {
      keys.add(item.key);
    }
  });

  (group.collections || []).forEach((collection) => {
    (collection.rows || []).forEach((row) => {
      Object.keys(row || {})
        .filter(isFeedbackKey)
        .forEach((key) => keys.add(key));
    });
  });

  return keys;
}

function sectionHasVisibleFeedback(group) {
  return (group.items || []).some((item) => item.feedback && item.value);
}

function feedbackItemsMatch(items, keys) {
  return (items || []).some((item) => keys.has(item?.sectionKey));
}

function buildSectionFeedbackThread(data, group) {
  const keys = sectionFeedbackKeys(group);

  if (keys.size === 0) {
    return [];
  }

  const feedbackItems = hasItems(data.feedbackHistory)
    ? data.feedbackHistory
    : data.feedbackComments || [];

  return feedbackItems
    .filter((item) => keys.has(item?.sectionKey) && item?.message)
    .map((item, index) => {
      const entryId = Number(item.entryId || 0);
      const sentAt = item.createdAt || item.updatedAt;

      return {
        id: `section-feedback-${item.id || index}-${item.sectionKey || 'general'}-${entryId}`,
        entryLabel: entryId > 0 ? `Registro: ${entryId}` : '',
        message: item.message,
        meta: compactFeedbackMeta({
          authorRole: item.authorRole,
          author: item.authorName || item.authorUsername,
          sentAt,
          reviewCycle: item.reviewCycle,
        }),
        sortAt: feedbackSortTime(sentAt),
      };
    })
    .sort((first, second) => first.sortAt - second.sortAt)
    .map(({ sortAt, ...entry }) => entry);
}

function feedbackSortTime(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}

function isApprovedDocument(data) {
  return String(data.status || '').includes('APPROVED');
}

function sectionStatusClass(tone) {
  switch (tone) {
    case 'approved':
      return 'bg-success-soft text-success-strong dark:bg-success-soft dark:text-success-strong';
    case 'corrected':
      return 'bg-info-soft text-info-strong dark:bg-info-soft dark:text-info-strong';
    case 'observed':
      return 'bg-warning-soft text-warning-strong dark:bg-warning-soft dark:text-warning-strong';
    default:
      return 'bg-panel-soft text-body dark:bg-surface-soft dark:text-ink';
  }
}

function buildDetailGroups(data, moduleId, collections = []) {
  // Para agregar o quitar datos del detalle de documentos/reportes:
  // 1. isVisibleScalar decide si una propiedad se muestra u oculta globalmente.
  // 2. DETAIL_SECTIONS decide en qué bloque visual se agrupa cada propiedad.
  const scalarEntries = Object.entries(data)
    .filter(([key, value]) => isVisibleScalar(key, value))
    .map(([key, value]) => makeDetailItem(data, key, value, moduleId));
  const entriesByKey = new Map(scalarEntries.map((item) => [item.key, item]));
  const collectionsByKey = new Map(collections.map((collection) => [collection.key, collection]));
  const usedKeys = new Set();
  const sections = [];

  getModuleDetailSections(moduleId).forEach((section) => {
    const items = orderedSectionKeys(section)
      .map((key) => entriesByKey.get(key))
      .filter(Boolean);
    const sectionCollections = (section.collections || [])
      .map((key) => collectionsByKey.get(key))
      .filter(Boolean);
    items.forEach((item) => usedKeys.add(item.key));

    if (items.length > 0 || sectionCollections.length > 0) {
      sections.push({
        title: section.title,
        items,
        collections: sectionCollections,
        feedbackKeys: section.feedbackKeys || [],
      });
    }
  });

  DETAIL_SECTIONS.forEach((section) => {
    const items = scalarEntries.filter((item) => !usedKeys.has(item.key) && section.matches(item.key));
    items.forEach((item) => usedKeys.add(item.key));

    if (items.length > 0) {
      sections.push({
        title: section.title,
        items,
        feedbackKeys: items.filter((item) => item.feedback).map((item) => item.key),
      });
    }
  });

  const remainingItems = scalarEntries.filter((item) => !usedKeys.has(item.key));

  if (remainingItems.length > 0) {
    sections.push({
      title: 'Otros datos',
      items: remainingItems,
      feedbackKeys: remainingItems.filter((item) => item.feedback).map((item) => item.key),
    });
  }

  return sections;
}

function makeDetailItem(data, key, value, moduleId) {
  const feedback = isFeedbackKey(key);

  return {
    key,
    label: feedback ? feedbackLabel(key, moduleId) : labelFromKey(key),
    value: formatValue(value, key),
    feedback,
    feedbackMeta: feedback ? resolveFeedbackMeta(data, key, 0) : null,
  };
}

function orderedSectionKeys(section) {
  return [...(section.fields || []), ...(section.feedbackKeys || [])]
    .filter((key, index, keys) => keys.indexOf(key) === index);
}

// Agrega aquí nuevas reglas si un campo debe caer en una sección específica.
// Ejemplo: para mostrar "mission" en Institucion, la regla de Institucion incluye /mission/.
// Para quitar un campo de una sección, elimina su nombre o patrón de la expresión regular.
const DETAIL_SECTIONS = [
  {
    title: 'Identificacion',
    matches: (key) => /^(code|name|studentFullName|studentIdentification|studentEmail|studentPhone|email|phone)$/i.test(key),
  },
  {
    title: 'Paralelo y practica',
    matches: (key) => /course|subject|academicPeriod|practiceType|developmentMode|curricularOrganizationUnit|integrativeKnowledgeProject|group/i.test(key),
  },
  {
    title: 'Institucion',
    matches: (key) => /institution|educationalInstitution|teacherCount|studentCount|mission|vision|values|province|canton|parish|address/i.test(key),
  },
  {
    title: 'Retroalimentacion',
    matches: (key) => isFeedbackKey(key),
  },
  {
    title: 'Objetivos',
    matches: (key) => !isFeedbackKey(key) && /objective/i.test(key),
  },
  {
    title: 'Contenido del documento',
    matches: (key) => !isFeedbackKey(key) && /presentation|antecedents|methodology|activities|resources|evidence|conclusion|recommendation|observation|note|description|summary|result/i.test(key),
  },
  {
    title: 'Estado y fechas',
    matches: (key) => /status|active|locked|approved|submitted|reviewed|reviewCycle|created|updated|date|At$/i.test(key),
  },
  {
    title: 'Metricas',
    matches: (key) => /capacity|minutes|time|hours|percentage|score|size|count|weekNumber/i.test(key),
  },
];

const COMMON_GENERAL_FIELDS = [
  'courseName',
  'studentFullName',
  'studentIdentification',
  'studentEmail',
  'studentPhone',
  'educationalInstitutionName',
  'educationalInstitutionCode',
  'educationalInstitutionAddress',
  'educationalInstitutionPhone',
  'educationalInstitutionEmail',
  'practiceType',
  'academicPeriod',
  'developmentMode',
];

const FINAL_FEEDBACK_SOURCES = [
  {
    prefix: 'practice',
    role: 'Tutor de practicas',
    authorKey: 'practiceReviewedBy',
    atKey: 'practiceReviewedAt',
  },
  {
    prefix: 'institutional',
    role: 'Tutor institucional',
    authorKey: 'institutionalReviewedBy',
    atKey: 'institutionalReviewedAt',
  },
  {
    prefix: 'director',
    role: 'Director de practicas',
    authorKey: 'directorReviewedBy',
    atKey: 'directorReviewedAt',
  },
];

const MODULE_DETAIL_SECTIONS = {
  'activity-plans': [
    detailSection('Datos generales', [
      ...COMMON_GENERAL_FIELDS,
      'curricularOrganizationUnit',
      'subjectDenomination',
      'integrativeKnowledgeProject',
      'teacherCount',
      'studentCount',
      'mission',
      'vision',
      'institutionalValues',
    ], ['generalInfoFeedback']),
    detailSection('Presentacion', ['presentation'], ['presentationFeedback']),
    detailSection('Objetivos', ['generalObjective', 'specificObjective1', 'specificObjective2', 'specificObjective3'], ['objectivesFeedback']),
    detailSection('Actividades', [], ['activitiesFeedback'], ['activityWeeks']),
    detailSection('Cronograma', [], ['scheduleFeedback'], ['scheduleWeeks']),
    detailSection('Recursos', ['legalResources', 'humanResources', 'technologicalResources', 'physicalResources'], ['resourcesFeedback']),
    detailSection('Aprobacion', [], ['approvalFeedback']),
  ],
  'practice-reports': [
    detailSection('Datos generales', COMMON_GENERAL_FIELDS, ['generalInfoFeedback']),
    detailSection('Presentacion', ['presentation'], ['presentationFeedback']),
    detailSection('Objetivos', ['generalObjective', 'specificObjective1', 'specificObjective2', 'specificObjective3'], ['objectivesFeedback']),
    detailSection('Metodologia', ['methodology'], ['methodologyFeedback']),
    detailSection('Actividades', [], ['activitiesFeedback'], ['activityWeeks']),
    detailSection('Conclusiones', ['conclusion1', 'conclusion2', 'conclusion3'], ['conclusionsFeedback']),
    detailSection('Recomendaciones', ['recommendation1', 'recommendation2', 'recommendation3'], ['recommendationsFeedback']),
    detailSection('Aprobacion', [], ['approvalFeedback']),
  ],
  'final-reports': [
    detailSection('Datos generales', COMMON_GENERAL_FIELDS, finalFeedbackKeys('GeneralInfo')),
    detailSection('Antecedentes', ['antecedents'], finalFeedbackKeys('Antecedents')),
    detailSection('Objetivo', ['objective'], finalFeedbackKeys('Objective')),
    detailSection('Actividades', [], finalFeedbackKeys('Activities'), ['activityWeeks']),
    detailSection('Conclusiones', ['conclusion1', 'conclusion2', 'conclusion3'], finalFeedbackKeys('Conclusions')),
    detailSection('Recomendaciones', ['recommendation1', 'recommendation2', 'recommendation3'], finalFeedbackKeys('Recommendations')),
    detailSection('Aprobacion', [], finalFeedbackKeys('Approval')),
  ],
  'completed-records': [
    detailSection('Datos generales', [...COMMON_GENERAL_FIELDS, 'deliveryDate'], ['generalInfoFeedback']),
    detailSection('Actividades', [], ['activitiesFeedback'], ['entries']),
    detailSection('Acreditacion', ['totalMinutes', 'totalTime', 'deliveryDate'], ['accreditationFeedback']),
  ],
};

function detailSection(title, fields = [], feedbackKeys = [], collections = []) {
  return {
    title,
    fields,
    feedbackKeys,
    collections,
  };
}

function finalFeedbackKeys(sectionName) {
  return FINAL_FEEDBACK_SOURCES.map((source) => `${source.prefix}${sectionName}Feedback`);
}

function getModuleDetailSections(moduleId) {
  return MODULE_DETAIL_SECTIONS[moduleId] || [];
}

function isFeedbackKey(key) {
  return /feedback|suggestions/i.test(key);
}

function feedbackLabel(key) {
  if (/suggestions/i.test(key)) {
    return 'Sugerencias';
  }

  const source = finalFeedbackSource(key);

  if (source) {
    return `Retroalimentacion - ${source.role}`;
  }

  return 'Retroalimentacion';
}

function finalFeedbackSource(key) {
  return FINAL_FEEDBACK_SOURCES.find((source) =>
    key.startsWith(source.prefix) && key.endsWith('Feedback')
  );
}

function resolveFeedbackMeta(data, key, entryId = 0) {
  const comment = findFeedbackComment(data, key, entryId);

  if (comment) {
    return compactFeedbackMeta({
      authorRole: comment.authorRole,
      author: comment.authorName || comment.authorUsername,
      sentAt: comment.updatedAt || comment.createdAt,
      reviewCycle: comment.reviewCycle,
    });
  }

  const source = finalFeedbackSource(key);

  if (source) {
    return compactFeedbackMeta({
      authorRole: source.role,
      author: data[source.authorKey],
      sentAt: data[source.atKey],
      reviewCycle: data.reviewCycle,
    });
  }

  const genericSource = genericFeedbackSource(data);

  return compactFeedbackMeta({
    authorRole: genericSource.role,
    author: genericSource.author,
    sentAt: genericSource.sentAt,
    reviewCycle: data.reviewCycle,
  });
}

function findFeedbackComment(data, key, entryId = 0) {
  return (data.feedbackComments || []).find((comment) =>
    comment?.sectionKey === key && Number(comment?.entryId || 0) === Number(entryId || 0)
  );
}

function genericFeedbackSource(data) {
  const tutorAt = data.reviewedAt;
  const directorAt = data.directorReviewedAt;

  if (isAfter(directorAt, tutorAt)) {
    return {
      role: 'Director de practicas',
      author: data.directorReviewedBy,
      sentAt: directorAt,
    };
  }

  if (data.reviewedBy || tutorAt) {
    return {
      role: 'Tutor de practicas',
      author: data.reviewedBy,
      sentAt: tutorAt,
    };
  }

  if (data.directorReviewedBy || directorAt) {
    return {
      role: 'Director de practicas',
      author: data.directorReviewedBy,
      sentAt: directorAt,
    };
  }

  return {
    role: 'Revisor',
    author: null,
    sentAt: null,
  };
}

function isAfter(firstValue, secondValue) {
  if (!firstValue) {
    return false;
  }

  if (!secondValue) {
    return true;
  }

  const firstDate = new Date(firstValue);
  const secondDate = new Date(secondValue);

  if (Number.isNaN(firstDate.getTime()) || Number.isNaN(secondDate.getTime())) {
    return false;
  }

  return firstDate.getTime() > secondDate.getTime();
}

function compactFeedbackMeta(meta) {
  return meta.authorRole || meta.author || meta.sentAt || meta.reviewCycle ? meta : null;
}

function formatFeedbackMeta(meta) {
  const author = [meta.authorRole, meta.author].filter(Boolean).join(': ');
  const parts = [];

  if (author) {
    parts.push(`Por: ${author}`);
  }

  if (meta.sentAt) {
    parts.push(`Enviado: ${formatValue(meta.sentAt, 'reviewedAt')}`);
  }

  if (meta.reviewCycle) {
    parts.push(`Ciclo: ${meta.reviewCycle}`);
  }

  return parts.join(' | ');
}

function isVisibleScalar(key, value) {
  // Filtro global del detalle: si aquí devuelve false, el campo no aparece en ninguna sección.
  // Úsalo para ocultar datos técnicos como "deleted", ids internos o campos vacíos.
  // Cambio solicitado: los ids y usuarios técnicos no son relevantes para leer el documento.
  return !isTechnicalDocumentKey(key)
    && value !== undefined
    && value !== null
    && value !== ''
    && !Array.isArray(value)
    && typeof value !== 'object';
}

function isTechnicalDocumentKey(key) {
  return /^id$/i.test(key)
    || /Id$/i.test(key)
    || /^approval$/i.test(key)
    || /^(reviewedBy|directorReviewedBy|practiceReviewedBy|institutionalReviewedBy)$/i.test(key)
    || /username/i.test(key)
    || /deleted/i.test(key);
}

function makeColumns(rows, parent, moduleId, token) {
  const keys = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row || {}).filter((key) => !isTechnicalDocumentKey(key))))
  );
  const orderedKeys = orderCollectionKeys(keys);
  const feedbackKeys = orderedKeys.filter(isFeedbackKey);
  const regularKeys = orderedKeys.filter((key) => !isFeedbackKey(key));
  const regularLimit = feedbackKeys.length > 0 ? 5 : 6;
  const visibleKeys = [...regularKeys.slice(0, regularLimit), ...feedbackKeys]
    .filter((key, index, values) => values.indexOf(key) === index);

  return visibleKeys.map((key) => ({
    key,
    header: isFeedbackKey(key) ? feedbackLabel(key, moduleId) : labelFromKey(key),
    render: (row) => renderTableValue(row, key, parent, moduleId, token),
  }));
}

const COLLECTION_KEY_PRIORITY = [
  'weekNumber',
  'activityDate',
  'supervisionDate',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'totalTime',
  'developedActivities',
  'activities',
  'scheduledActivities',
  'supervisedActivities',
  'evidenceLink',
  'feedback',
  'suggestions',
];

function orderCollectionKeys(keys) {
  return [...keys].sort((firstKey, secondKey) => {
    const firstIndex = priorityIndex(firstKey, keys);
    const secondIndex = priorityIndex(secondKey, keys);

    return firstIndex - secondIndex;
  });
}

function priorityIndex(key, keys) {
  const index = COLLECTION_KEY_PRIORITY.indexOf(key);

  return index >= 0 ? index : COLLECTION_KEY_PRIORITY.length + keys.indexOf(key);
}

function renderTableValue(row, key, parent, moduleId, token) {
  const value = formatValue(row[key], key);

  if (key === 'evidenceLink' && row[key]) {
    return <EvidenceViewerLink url={row[key]} />;
  }

  if (!isFeedbackKey(key) || row[key] === undefined || row[key] === null || row[key] === '') {
    return value;
  }

  const meta = resolveFeedbackMeta(parent || {}, key, row?.id || 0);

  return (
    <div className="space-y-1">
      <div>{value}</div>
      {meta && <div className={feedbackMetaClass}>{formatFeedbackMeta(meta)}</div>}
    </div>
  );
}

function EvidenceViewerLink({ url }) {
  const viewerLink = evidenceDisplayLink(url);

  return (
    <a
      className="break-all text-sm font-semibold text-primary hover:underline dark:text-accent-strong"
      href={viewerLink}
      rel="noreferrer"
      target="_blank"
    >
      {viewerLink}
    </a>
  );
}

function evidenceDisplayLink(url) {
  if (!url) {
    return '';
  }

  if (isPublicEvidenceUrl(url)) {
    return publicEvidenceUrl(url);
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${window.location.origin}${window.location.pathname}#/evidence-viewer?src=${encodeURIComponent(url)}`;
}

function isPublicEvidenceUrl(url) {
  return String(url || '').includes('/api/public/practice-photos/');
}

function publicEvidenceUrl(path) {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiBase = getApiBaseUrl();

  if (/^https?:\/\//i.test(apiBase)) {
    return `${apiBase}${normalizedPath}`;
  }

  const { protocol, hostname, port, origin } = window.location;

  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000') {
    return `${protocol}//${hostname}:8080${normalizedPath}`;
  }

  return `${origin}${normalizedPath}`;
}
