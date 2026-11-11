/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DocumentApprovalStatus.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente DocumentApprovalStatus de la interfaz del SGP.
 */

import { formatValue } from "../../../../utils/format";

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
        <h3 className="text-sm font-medium text-heading dark:text-heading">Estado de aprobación</h3>
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
          Aprobación final: {formatValue(data.approvedAt, 'approvedAt')}
        </p>
      )}
    </section>
  );
}

function buildApprovalReviews(data) {
  const reviews = [];

  addApprovalReview(reviews, data, {
    key: 'practice',
    label: 'Tutor de prácticas',
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
    label: 'Director de prácticas',
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

