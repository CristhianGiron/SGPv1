/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DocumentTimeline.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente DocumentTimeline de la interfaz del SGP.
 */

import { Clock3 } from "lucide-react";
import { Modal } from "../../../../components/ui/Modal";
import { detailSectionDomIdFromFeedbackKey, feedbackSectionLabel, hasItems } from "./detailPresentation";
import { formatValue } from "../../../../utils/format";
import { useState } from "react";

export function DocumentTimeline({ events }) {
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

export function buildDocumentTimeline(data, moduleId) {
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
    description: 'El estudiante envío el documento para revisión.',
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
      ? `Retroalimentación en ${section} (registro específico)`
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
      role: 'Tutor de prácticas',
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
      role: 'Tutor de prácticas',
    },
    {
      id: 'director-review',
      atKey: 'directorReviewedAt',
      authorKey: 'directorReviewedBy',
      role: 'Director de prácticas',
    },
  ].map((source) => ({
    id: source.id,
    at: data[source.atKey],
    title: `Revisión de ${source.role}`,
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

