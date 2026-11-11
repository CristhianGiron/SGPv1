/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          detailPresentation.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente detailPresentation de la interfaz del SGP.
 */

import { formatValue, labelFromKey } from "../../../../utils/format";
import { getApiBaseUrl } from "../../../../api/client";

export const feedbackInlineClass = 'rounded-lg border-l-[3px] border-accent bg-accent-soft p-3 dark:border-accent dark:bg-accent-soft';

export const feedbackMetaClass = 'mt-2 text-xs leading-5 text-accent-strong dark:text-accent-strong';

export function SectionFeedbackThread({ entries }) {
  return (
    <div className="mt-4 rounded-lg border-l-[3px] border-accent bg-success-soft p-3 dark:border-accent dark:bg-accent-soft">
      <h4 className="m-0 mb-2 text-xs font-semibold uppercase text-accent-strong dark:text-accent-strong">Retroalimentación de la seccion</h4>
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

export function detailGroupDomId(group) {
  const primaryKey = group?.feedbackKeys?.[0] || group?.title || 'section';

  return detailSectionDomIdFromFeedbackKey(primaryKey);
}

export function detailSectionDomIdFromFeedbackKey(key) {
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

export function feedbackSectionLabel(key) {
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
    approval: 'Aprobación',
    antecedents: 'Antecedentes',
    conclusions: 'Conclusiones',
    feedback: 'Actividad',
    generalInfo: 'Datos generales',
    methodology: 'Metodología',
    objective: 'Objetivo',
    objectives: 'Objetivos',
    presentation: 'Presentación',
    recommendations: 'Recomendaciones',
    resources: 'Recursos',
    schedule: 'Cronograma',
    suggestions: 'Sugerencias',
  };

  return labels[normalizedKey] || labelFromKey(normalizedKey);
}

export function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

export function resolveSectionFeedbackStatus(data, group) {
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

export function sectionHasVisibleFeedback(group) {
  return (group.items || []).some((item) => item.feedback && item.value);
}

function feedbackItemsMatch(items, keys) {
  return (items || []).some((item) => keys.has(item?.sectionKey));
}

export function buildSectionFeedbackThread(data, group) {
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

export function sectionStatusClass(tone) {
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

export function buildDetailGroups(data, moduleId, collections = []) {
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

const DETAIL_SECTIONS = [
  {
    title: 'Identificacion',
    matches: (key) => /^(code|name|studentFullName|studentIdentification|studentEmail|studentPhone|email|phone)$/i.test(key),
  },
  {
    title: 'Paralelo y práctica',
    matches: (key) => /course|subject|academicPeriod|practiceType|developmentMode|curricularOrganizationUnit|integrativeKnowledgeProject|group/i.test(key),
  },
  {
    title: 'Institución',
    matches: (key) => /institution|educationalInstitution|teacherCount|studentCount|mission|vision|values|province|canton|parish|address/i.test(key),
  },
  {
    title: 'Retroalimentación',
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
    role: 'Tutor de prácticas',
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
    role: 'Director de prácticas',
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
    detailSection('Presentación', ['presentation'], ['presentationFeedback']),
    detailSection('Objetivos', ['generalObjective', 'specificObjective1', 'specificObjective2', 'specificObjective3'], ['objectivesFeedback']),
    detailSection('Actividades', [], ['activitiesFeedback'], ['activityWeeks']),
    detailSection('Cronograma', [], ['scheduleFeedback'], ['scheduleWeeks']),
    detailSection('Recursos', ['legalResources', 'humanResources', 'technologicalResources', 'physicalResources'], ['resourcesFeedback']),
    detailSection('Aprobación', [], ['approvalFeedback']),
  ],
  'practice-reports': [
    detailSection('Datos generales', COMMON_GENERAL_FIELDS, ['generalInfoFeedback']),
    detailSection('Presentación', ['presentation'], ['presentationFeedback']),
    detailSection('Objetivos', ['generalObjective', 'specificObjective1', 'specificObjective2', 'specificObjective3'], ['objectivesFeedback']),
    detailSection('Metodología', ['methodology'], ['methodologyFeedback']),
    detailSection('Actividades', [], ['activitiesFeedback'], ['activityWeeks']),
    detailSection('Conclusiones', ['conclusion1', 'conclusion2', 'conclusion3'], ['conclusionsFeedback']),
    detailSection('Recomendaciones', ['recommendation1', 'recommendation2', 'recommendation3'], ['recommendationsFeedback']),
    detailSection('Aprobación', [], ['approvalFeedback']),
  ],
  'final-reports': [
    detailSection('Datos generales', COMMON_GENERAL_FIELDS, finalFeedbackKeys('GeneralInfo')),
    detailSection('Antecedentes', ['antecedents'], finalFeedbackKeys('Antecedents')),
    detailSection('Objetivo', ['objective'], finalFeedbackKeys('Objective')),
    detailSection('Actividades', [], finalFeedbackKeys('Activities'), ['activityWeeks']),
    detailSection('Conclusiones', ['conclusion1', 'conclusion2', 'conclusion3'], finalFeedbackKeys('Conclusions')),
    detailSection('Recomendaciones', ['recommendation1', 'recommendation2', 'recommendation3'], finalFeedbackKeys('Recommendations')),
    detailSection('Aprobación', [], finalFeedbackKeys('Approval')),
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
    return `Retroalimentación - ${source.role}`;
  }

  return 'Retroalimentación';
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
      role: 'Director de prácticas',
      author: data.directorReviewedBy,
      sentAt: directorAt,
    };
  }

  if (data.reviewedBy || tutorAt) {
    return {
      role: 'Tutor de prácticas',
      author: data.reviewedBy,
      sentAt: tutorAt,
    };
  }

  if (data.directorReviewedBy || directorAt) {
    return {
      role: 'Director de prácticas',
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

export function formatFeedbackMeta(meta) {
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

export function makeColumns(rows, parent, moduleId, token) {
  const keys = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row || {}).filter((key) => !isTechnicalDocumentKey(key))))
  );
  const orderedKeys = orderCollectionKeys(keys);
  const feedbackKeys = orderedKeys.filter(isFeedbackKey);
  const regularKeys = orderedKeys.filter((key) => !isFeedbackKey(key));
  const regularLimit = feedbackKeys.length > 0 ? 5 : 6;
  const visibleKeys = [...regularKeys, ...feedbackKeys]
    .filter((key, index, values) => values.indexOf(key) === index);

  return visibleKeys.map((key) => ({
    key,
    secondary: !isFeedbackKey(key) && regularKeys.indexOf(key) >= regularLimit,
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

