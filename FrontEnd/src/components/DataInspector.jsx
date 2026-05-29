import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  extractNestedCollections,
  formatValue,
  labelFromKey,
} from '../utils/format';
import { DataTable } from './ui/DataTable';
import { EmptyState } from './ui/EmptyState';

const feedbackInlineClass = 'rounded-lg border-l-[3px] border-[#529914] bg-[#e4f0d8] p-3 dark:border-[#75c66a] dark:bg-[#75c66a]/10';
const feedbackMetaClass = 'mt-2 text-xs leading-5 text-[#3f760f] dark:text-[#bbf7d0]';

export function DataInspector({ data, moduleId }) {
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
                className="scroll-mt-24 min-w-0 max-w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-slate-700 dark:bg-surface-soft"
                id={detailGroupDomId(group)}
                key={group.title}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-slate-50">{group.title}</h3>
                  {feedbackStatus && (
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${sectionStatusClass(feedbackStatus.tone)}`}>
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
                        <dt className="min-w-0 break-words text-zinc-500 dark:text-slate-400">{item.label}</dt>
                        <dd className="min-w-0 whitespace-pre-wrap break-words font-medium text-zinc-900 dark:text-slate-100">
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
                    <h4 className="text-xs font-extrabold uppercase text-zinc-500 dark:text-slate-400">{collection.title}</h4>
                    <div className="mt-2 min-w-0 max-w-full">
                      {isActivityWeeksCollection(collection.key) ? (
                        <ActivityWeeksAcademicTable weeks={collection.rows} />
                      ) : isActivityPlanSchedule(moduleId, collection.key) ? (
                        <ActivityPlanScheduleMatrix weeks={collection.rows} />
                      ) : (
                        <DataTable
                          columns={makeColumns(collection.rows, data, moduleId)}
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
        <section className="min-w-0 max-w-full rounded-lg border border-zinc-200 bg-white p-3 dark:border-slate-700 dark:bg-surface" key={collection.key}>
          <h3 className="text-sm font-bold text-zinc-950 dark:text-slate-50">{collection.title}</h3>
          <div className="mt-3 min-w-0 max-w-full">
            {isActivityWeeksCollection(collection.key) ? (
              <ActivityWeeksAcademicTable weeks={collection.rows} />
            ) : isActivityPlanSchedule(moduleId, collection.key) ? (
              <ActivityPlanScheduleMatrix weeks={collection.rows} />
            ) : (
              <DataTable
                columns={makeColumns(collection.rows, data, moduleId)}
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
    <section className="rounded-lg border border-[#c8d2cd] bg-white p-3 dark:border-slate-700 dark:bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-zinc-950 dark:text-slate-50">Estado de aprobacion</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${approvalToneClass(documentApprovalTone(data))}`}>
          {formatValue(data.status || 'DRAFT', 'status')}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {reviews.map((review) => (
          <article
            className="rounded-lg border border-[#edf2ee] bg-[#fbfdfb] p-3 dark:border-slate-700 dark:bg-[#111827]"
            key={review.key}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 text-sm font-extrabold text-[#20282d] dark:text-slate-50">{review.label}</p>
              <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-extrabold ${approvalToneClass(review.tone)}`}>
                {review.status}
              </span>
            </div>
            <dl className="mt-2 grid gap-1 text-xs leading-5">
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                <dt className="font-bold text-muted">Por</dt>
                <dd className="min-w-0 break-words text-[#20282d] dark:text-slate-100">{review.author || '-'}</dd>
              </div>
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                <dt className="font-bold text-muted">Fecha</dt>
                <dd className="min-w-0 break-words text-[#20282d] dark:text-slate-100">{review.at ? formatValue(review.at, 'reviewedAt') : '-'}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      {data.approvedAt && (
        <p className="mt-3 text-xs font-bold text-[#3f760f] dark:text-[#bbf7d0]">
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
    <div className="min-w-0 max-w-full overflow-hidden rounded-sm border border-[#1f2933] bg-white dark:border-slate-600 dark:bg-surface">
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-collapse text-[11px] leading-tight text-black dark:text-slate-100">
          <colgroup>
            <col className="w-[52%]" />
            {schedule.weekColumns.map((week) => (
              <col key={week.key} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                className="border border-[#1f2933] bg-[#7f7f7c] px-2 py-2 text-center font-serif text-[12px] font-bold uppercase text-white dark:border-slate-600 dark:bg-slate-700"
                colSpan={schedule.weekColumns.length + 1}
              >
                CRONOGRAMA DE ACTIVIDADES PRACTICAS PARA EL DESARROLLO DEL PIS
              </th>
            </tr>
            <tr>
              <th className="border border-[#1f2933] bg-[#858582] px-2 py-1.5 text-center font-serif font-bold text-white dark:border-slate-600 dark:bg-slate-700">
                Actividades
              </th>
              {schedule.monthGroups.map((month) => (
                <th
                  className="border border-[#1f2933] bg-[#858582] px-2 py-1.5 text-center font-serif font-bold text-white dark:border-slate-600 dark:bg-slate-700"
                  colSpan={month.span}
                  key={month.key}
                >
                  {month.label}
                </th>
              ))}
            </tr>
            <tr>
              <th className="border border-[#1f2933] bg-[#858582] px-2 py-1.5 text-center font-serif font-bold text-white dark:border-slate-600 dark:bg-slate-700">
                Semanas
              </th>
              {schedule.weekColumns.map((week) => (
                <th
                  className="border border-[#1f2933] bg-[#858582] px-1 py-1.5 text-center font-serif font-bold text-white dark:border-slate-600 dark:bg-slate-700"
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
                <td className="break-words border border-[#1f2933] px-1.5 py-1 font-serif text-[10.5px] leading-snug text-black dark:border-slate-600 dark:text-slate-100">
                  {row.activity}
                </td>
                {schedule.weekColumns.map((week) => {
                  const active = week.key === row.weekKey;

                  return (
                    <td
                      aria-label={active ? `Semana ${week.weekNumber}: ${row.activity}` : `Semana ${week.weekNumber}`}
                      className="h-6 border border-[#1f2933] p-0 dark:border-slate-600"
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
    <div className="min-w-0 max-w-full overflow-hidden rounded-sm border border-[#1f2933] bg-white dark:border-slate-600 dark:bg-surface">
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-collapse font-serif text-[12px] leading-relaxed text-black dark:text-slate-100 lg:w-full">
          <colgroup>
            <col className="w-[7.5rem]" />
            <col />
          </colgroup>
          <tbody>
            {rows.map((week) => (
              <tr key={week.key}>
                <th className="border border-[#1f2933] bg-[#858582] px-2 py-4 text-center font-bold uppercase text-white dark:border-slate-600 dark:bg-slate-700">
                  SEMANA {week.weekNumber}
                </th>
                <th className="border border-[#1f2933] bg-[#858582] px-4 py-3 text-center font-bold uppercase text-white dark:border-slate-600 dark:bg-slate-700">
                  {week.dateRange}
                </th>
              </tr>
            )).flatMap((headerRow, index) => {
              const week = rows[index];

              return [
                headerRow,
                <tr key={`${week.key}-body`}>
                  <th className="border border-[#1f2933] px-2 py-8 text-center font-bold text-black dark:border-slate-600 dark:text-slate-100">
                    Actividad
                  </th>
                  <td className="border border-[#1f2933] px-6 py-4 align-top dark:border-slate-600">
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
    <div className="mt-4 rounded-lg border-l-[3px] border-[#529914] bg-[#f0fdf4] p-3 dark:border-[#75c66a] dark:bg-[#75c66a]/10">
      <h4 className="m-0 mb-2 text-xs font-black uppercase text-[#3f760f] dark:text-[#bbf7d0]">Retroalimentacion de la seccion</h4>
      <ol className="grid list-none gap-2 p-0 m-0">
        {entries.map((entry) => (
          <li className="border-t border-[#166534]/15 pt-2 first:border-t-0 first:pt-0 dark:border-[#75c66a]/20" key={entry.id}>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-extrabold leading-5 text-[#166534] dark:text-[#bbf7d0]">
              <span>{entry.meta ? formatFeedbackMeta(entry.meta) : 'Feedback registrado'}</span>
              {entry.entryLabel && <span>{entry.entryLabel}</span>}
            </div>
            <p className="m-0 mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#1f2f27] dark:text-slate-50">{entry.message}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DocumentTimeline({ events }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-slate-700 dark:bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-zinc-950 dark:text-slate-50">Linea de tiempo</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600 dark:bg-slate-800 dark:text-slate-300">
            {timelineCountLabel(events.length)}
          </span>
          <button
            aria-expanded={!collapsed}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[#c8d2cd] text-[#34443b] transition-colors hover:bg-[#eef3f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setCollapsed((current) => !current)}
            title={collapsed ? 'Expandir linea de tiempo' : 'Contraer linea de tiempo'}
            type="button"
          >
            <ChevronDown
              aria-hidden="true"
              className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}
              size={18}
            />
          </button>
        </div>
      </div>

      {!collapsed && (
        <ol className="mt-3 space-y-3">
          {events.map((event) => (
            <li className="grid gap-2 text-sm sm:grid-cols-[150px_1fr] sm:gap-3" key={event.id}>
              <time className="text-xs font-semibold text-muted sm:pt-3">
                {formatValue(event.at, 'createdAt')}
              </time>
              <div className={`rounded-md border p-3 ${timelineToneClass(event.tone)}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="font-bold text-[#20282d] dark:text-slate-50">{event.title}</div>
                  {event.targetId && (
                    <button
                      className="rounded-lg border border-[#529914] px-2.5 py-1 text-xs font-extrabold text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-[#75c66a] dark:text-[#bbf7d0] dark:hover:bg-[#203026]"
                      onClick={() => scrollToDetailSection(event.targetId)}
                      type="button"
                    >
                      Ver apartado
                    </button>
                  )}
                </div>
                {event.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-[#34443b] dark:text-slate-200">
                    {event.description}
                  </p>
                )}
                {event.meta && (
                  <div className="mt-2 text-xs font-bold uppercase tracking-wide text-muted">
                    {event.meta}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
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
      return 'bg-[#e4f0d8] text-[#3f760f] dark:bg-[#75c66a]/15 dark:text-[#bbf7d0]';
    case 'observed':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200';
    case 'corrected':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200';
    default:
      return 'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-slate-300';
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
  '#00f010',
  '#ffe26a',
  '#6aa9d8',
  '#7f6bb0',
  '#8fbd7b',
  '#dd6666',
  '#f1a85b',
  '#3d7f1f',
  '#8a4f08',
  '#f000df',
  '#00a6a6',
  '#b460a6',
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
      return 'border-emerald-200 bg-emerald-50 dark:border-green-400/40 dark:bg-green-950/30';
    case 'feedback':
      return 'border-amber-200 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-950/30';
    case 'review':
      return 'border-sky-200 bg-sky-50 dark:border-sky-400/40 dark:bg-sky-950/30';
    case 'submitted':
      return 'border-[#c4d8df] bg-[#d7e4e9] dark:border-sky-400/30 dark:bg-sky-950/25';
    case 'rejected':
      return 'border-rose-200 bg-rose-50 dark:border-rose-400/40 dark:bg-rose-950/30';
    default:
      return 'border-zinc-200 bg-zinc-50 dark:border-slate-700 dark:bg-surface-soft';
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
      return 'Plan de actividades';
    case 'practice-reports':
      return 'Informe de practica';
    case 'final-reports':
      return 'Informe final';
    case 'completed-records':
      return 'Registro de actividades';
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
      ? `Feedback en ${section} (registro especifico)`
      : `Feedback en ${section}`;

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
    label: 'Sin feedback',
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
      return 'bg-emerald-100 text-emerald-800 dark:bg-green-950/40 dark:text-green-200';
    case 'corrected':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200';
    case 'observed':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
    default:
      return 'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-slate-300';
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
    title: 'Curso y practica',
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

function makeColumns(rows, parent, moduleId) {
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
    render: (row) => renderTableValue(row, key, parent, moduleId),
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

function renderTableValue(row, key, parent, moduleId) {
  const value = formatValue(row[key], key);

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
