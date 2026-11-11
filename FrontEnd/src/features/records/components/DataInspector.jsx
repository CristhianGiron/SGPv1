/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DataInspector.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente DataInspector de la interfaz del SGP.
 */

import { ActivityPlanScheduleMatrix, ActivityWeeksAcademicTable, isActivityPlanSchedule, isActivityWeeksCollection } from "./details/AcademicTables";
import { DataTable } from "../../../components/ui/DataTable";
import { DocumentApprovalStatus } from "./details/DocumentApprovalStatus";
import { DocumentTimeline, buildDocumentTimeline } from "./details/DocumentTimeline";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SectionFeedbackThread, buildDetailGroups, buildSectionFeedbackThread, detailGroupDomId, feedbackInlineClass, feedbackMetaClass, formatFeedbackMeta, makeColumns, resolveSectionFeedbackStatus, sectionHasVisibleFeedback, sectionStatusClass } from "./details/detailPresentation";
import { extractNestedCollections } from "../../../utils/format";

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
export { DocumentApprovalStatus } from "./details/DocumentApprovalStatus";
export { ActivityPlanScheduleMatrix } from "./details/AcademicTables";
export { ActivityWeeksAcademicTable } from "./details/AcademicTables";
