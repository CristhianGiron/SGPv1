/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EndpointModule.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente EndpointModule de la interfaz del SGP.
 */

import { ActionBar, PrimaryButton, SecondaryButton } from "../../../../components/ui/ActionBar";
import { ActionMenu } from "../../../../components/ui/ActionMenu";
import { Alert } from "../../../../components/ui/Alert";
import { CheckCircle2, Download, Eye, List, Pencil, Plus, RefreshCw, Save, Send } from "lucide-react";
import { DataInspector, DocumentApprovalStatus } from "../DataInspector";
import { DataTable } from "../../../../components/ui/DataTable";
import { DocumentDraftStatus, getDocumentReadiness } from "./DocumentReadiness";
import { DraftRecovery } from "../../../../components/ui/DraftRecovery";
import { EditorActions } from "../../../../components/ui/EditorActions";
import { EntitySelect } from "../../../../components/ui/EntitySelect";
import { Field } from "../../../../components/ui/FormControls";
import { FormFeedback } from "../../../../components/ui/FormFeedback";
import { GuidedForm } from "../../../../components/forms/GuidedForm";
import { ListFilters } from "./ListFilters";
import { ListToolbar } from "../../../../components/ui/ListToolbar";
import { ModuleTab, ModuleTabs } from "../../../../components/ui/ModuleTabs";
import { PdfPreviewDialog } from "../../../../components/ui/PdfPreviewDialog";
import { ReviewFeedbackForm, ReviewWorkspace } from "./DocumentReview";
import { SectionCard } from "../../../../components/ui/SectionCard";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { StructuredForm } from "../../../../components/forms/StructuredForm";
import { isFeedbackReviewBody, normalizeReviewBody } from "./reviewModel";
import { hasActiveFilters } from "./listFiltering";
import { canEditRecord, canExportPdfRecord, canReviewRecord, canRunExtraAction, canSubmitRecord } from "./documentPolicies";
import { enrollmentLabel, fillEnrollmentInstitutionFields, getOperationTitle, importantActionConfirmation, reviewDecisionConfirmation, secondaryLabel } from "./workspaceHelpers";
import { formatValue } from "../../../../utils/format";
import { useEndpointWorkspace } from "./useEndpointWorkspace";

export function EndpointModule({ module, roles, token, enableListFilters }) {
  const {
    workspace,
    confirm,
    confirmingSubmitId,
    isStudent,
    accessibleAltLists,
    visibleExtraActions,
    canCreate,
    canUpdate,
    canExportPdf,
    canSubmit,
    canReview,
    canListPrimary,
    studentDirectDocumentMode,
    rows,
    enrollmentRows,
    selected,
    id,
    secondaryId,
    setSecondaryId,
    letterheadFile,
    previewPath,
    setPreviewPath,
    letterheadPicker,
    body,
    setBody,
    reviewBody,
    setReviewBody,
    actionBodies,
    setActionBodies,
    loading,
    enrollmentLoading,
    message,
    error,
    fieldErrors,
    setFieldErrors,
    validationAttempt,
    operationTabs,
    activeOperation,
    setActiveOperation,
    draft,
    listFilters,
    setListFilters,
    secondaryRows,
    studentCreateNeedsEnrollment,
    studentEnrollmentResolved,
    formHiddenFields,
    formRelations,
    customFormFields,
    filteredRows,
    selectedExtraActions,
    listFilterOptions,
    isOwnList,
    updateListFilter,
    clearListFilters,
    load,
    submitStructured,
    submitReviewPatch,
    submitRecord,
    downloadPdf,
    submitNoBody,
    selectRecord,
    openRecord,
    startCreate
  } = useEndpointWorkspace({ module, roles, token });
  const columns = [
    { key: "record", header: module.id === 'practice-schedules' ? 'Jornada' : 'Documento', render: row => row.title || row.planningUnitTitle || [module.title, row.startDate ? formatValue(row.startDate, 'startDate') : row.createdAt ? formatValue(row.createdAt, 'createdAt') : null].filter(Boolean).join(' · ') },
    { key: 'createdAt', header: 'Creado', render: row => formatValue(row.createdAt, 'createdAt') },
    {
      key: "courseName",
      header: "Paralelo",
      render: (row) => row.courseName || row.name || "-",
    },
    !isOwnList && {
      key: "student",
      header: "Estudiante",
      render: (row) =>
        row.studentFullName || row.studentUsername || row.student || "-",
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => <StatusBadge status={row.status || row.active} />,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (row) => (
        <ActionMenu
          actions={[
            {
              key: "view",
              label: "Ver",
              icon: Eye,
              onClick: () => openRecord(row),
            },
            ...(canUpdate && canEditRecord(row)
              ? [
                  {
                    key: "edit",
                    label: "Editar",
                    icon: Pencil,
                    onClick: () => openRecord(row, "form"),
                  },
                ]
              : []),
            ...(canSubmit && canSubmitRecord(row)
              ? [
                  {
                    key: "submit",
                    label: "Enviar a revisión",
                    icon: Send,
                    onClick: () => {
                      window.setTimeout(() => {
                        submitRecord(row);
                      }, 0);
                    },
                  },
                ]
              : []),
            ...(canReview && canReviewRecord(row)
              ? [
                  {
                    key: "review",
                    label: "Revisar",
                    icon: CheckCircle2,
                    onClick: () => openRecord(row, "review"),
                  },
                ]
              : []),
            ...(canExportPdf && canExportPdfRecord(row)
              ? [
                  {
                    key: "pdf",
                    label: "Descargar PDF",
                    icon: Download,
                    onClick: () => downloadPdf(row),
                  },
                ]
              : []),
            ...(visibleExtraActions.some((action) =>
              canRunExtraAction(row, action),
            )
              ? [
                  {
                    key: "extra-actions",
                    label: "Acciones",
                    icon: CheckCircle2,
                    onClick: () => openRecord(row, "actions"),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ].filter(Boolean);

  const listActions = (
            <ActionBar>
              {canCreate && (
                <PrimaryButton icon={Plus} onClick={startCreate} type="button">
                  Crear
                </PrimaryButton>
              )}
              {canListPrimary && (
                <SecondaryButton
                  icon={List}
                  loading={loading}
                  onClick={() => load()}
                  type="button"
                >
                  Listar
                </SecondaryButton>
              )}
              {accessibleAltLists.map((item) => (
                <SecondaryButton
                  disabled={loading}
                  icon={RefreshCw}
                  key={item.label}
                  onClick={() => load(item.path)}
                  type="button"
                >
                  {item.label}
                </SecondaryButton>
              ))}
            </ActionBar>
  );

  const formActions = (
                <ActionBar>
                  {module.pdfPath && (id ? canUpdate : canCreate) && <SecondaryButton disabled={loading || !studentEnrollmentResolved} icon={Eye} onClick={async () => {
                    const saved = await submitStructured(id ? module.updatePath(id) : module.createPath,
                      id ? (module.updateMethod || 'PUT') : 'POST', body, 'Borrador guardado para la vista previa.');
                    if (saved?.id) { setActiveOperation('detail'); setPreviewPath(`${module.pdfPath(saved.id)}/preview`); }
                  }}>Guardar y ver PDF</SecondaryButton>}
                  {(id ? canUpdate : canCreate) && (
                    <PrimaryButton
                      disabled={
                        loading ||
                        !studentEnrollmentResolved ||
                        (!id && !canCreate) ||
                        (id && !canUpdate)
                      }
                      icon={Save}
                      loading={loading}
                      onClick={async () => {
                        let result = false;

                        if (id && canUpdate) {
                          result = await submitStructured(
                            module.updatePath(id),
                            module.updateMethod || "PUT",
                            body,
                            "Borrador guardado. Puedes seguir completandolo cuando tengas más información.",
                          );
                        } else if (!id && canCreate) {
                          result = await submitStructured(
                            module.createPath,
                            "POST",
                            body,
                            "Borrador creado. Puedes seguir completandolo cuando tengas más información.",
                          );
                        }

                        if (result) {
                          setActiveOperation("detail");
                        }
                      }}
                      type="button"
                    >
                      {id ? "Guardar borrador" : "Crear borrador"}
                    </PrimaryButton>
                  )}
                </ActionBar>
  );

  return (
    <div className="sgp-document-workspace space-y-4">
      <PdfPreviewDialog path={previewPath} onClose={() => setPreviewPath('')} />
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-line">
        <ModuleTabs className="min-w-0 flex-1">
          {operationTabs.map((tab) => (
            <ModuleTab
              active={activeOperation === tab.id}
              key={tab.id}
              onClick={() => setActiveOperation(tab.id)}
            >
              {tab.label}
            </ModuleTab>
          ))}
        </ModuleTabs>
        {selected?.status && <StatusBadge status={selected.status} />}
      </div>

      {activeOperation === "list" && (
        <SectionCard
          title={module.title}
        >
          <div className="min-w-0 max-w-full space-y-3">
            {error && <Alert tone="error">{error}</Alert>}
            {message && !["Datos cargados", "Registro cargado"].includes(message) && <Alert tone="success">{message}</Alert>}
            {enableListFilters && (
              <ListFilters
                viewKey={module.id}
                onRestore={setListFilters}
                action={listActions}
                filters={listFilters}
                options={listFilterOptions}
                showStudentFilter={!isOwnList && !workspace}
                showCourseFilter={!workspace}
                totalCount={rows.length}
                visibleCount={filteredRows.length}
                onChange={updateListFilter}
                onClear={clearListFilters}
              />
            )}
            {!enableListFilters && <ListToolbar actions={listActions} />}
            <DataTable
              columns={columns}
              ownRecords={isOwnList}
              emptyText={
                hasActiveFilters(listFilters)
                  ? "No se encontraron resultados con los filtros aplicados."
                  : "Aún no hay documentos para mostrar."
              }
              loading={loading}
              rows={enableListFilters ? filteredRows : rows}
            />
          </div>
        </SectionCard>
      )}

      {activeOperation !== "list" && (
        <SectionCard
          title={activeOperation === "form" ? undefined : getOperationTitle(activeOperation, selected)}
          action={
            !studentDirectDocumentMode && activeOperation !== "form" && (
              <SecondaryButton
                icon={List}
                onClick={() => setActiveOperation("list")}
                type="button"
              >
                Volver al listado
              </SecondaryButton>
            )
          }
        >
          <div className="min-w-0 max-w-full space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            {message && !["Datos cargados", "Registro cargado"].includes(message) && <Alert tone="success">{message}</Alert>}

            {activeOperation !== "detail" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {!(isStudent && activeOperation === "form") && (
                  <Field label="Registro">
                    <EntitySelect
                      rows={rows}
                      placeholder="Seleccionar registro"
                      value={id}
                      onChange={selectRecord}
                    />
                  </Field>
                )}
                {module.secondaryLabel && (
                  <Field label={module.secondaryLabel}>
                    <EntitySelect
                      disabled={!secondaryRows.length}
                      getOptionLabel={secondaryLabel}
                      rows={secondaryRows}
                      placeholder={
                        secondaryRows.length
                          ? `Seleccionar ${module.secondaryLabel.toLowerCase()}`
                          : "Selecciona primero un registro"
                      }
                      value={secondaryId}
                      onChange={setSecondaryId}
                    />
                  </Field>
                )}
              </div>
            )}

            {activeOperation === "detail" && (
              <div className="min-w-0 max-w-full space-y-4">
                <DataInspector data={selected} moduleId={module.id} token={token} />
                {canSubmit && canSubmitRecord(selected) && (
                  <DocumentDraftStatus
                    readiness={getDocumentReadiness(module.id, selected)}
                  />
                )}
                {((canUpdate && canEditRecord(selected)) ||
                  (canSubmit && canSubmitRecord(selected)) ||
                  canExportPdf) && (
                  <ActionBar>
                    {canExportPdf && selected?.id && <SecondaryButton disabled={loading} icon={Eye} onClick={() => setPreviewPath(`${module.pdfPath(selected.id)}/preview`)}>Vista previa del PDF</SecondaryButton>}
                    {canUpdate && canEditRecord(selected) && (
                      <SecondaryButton
                        disabled={
                          loading || confirmingSubmitId === selected?.id || !id
                        }
                        icon={Pencil}
                        onClick={() => setActiveOperation("form")}
                        type="button"
                      >
                        Editar
                      </SecondaryButton>
                    )}
                    {canSubmit && canSubmitRecord(selected) && (
                      <SecondaryButton
                        disabled={loading || !id}
                        icon={Send}
                        loading={loading}
                        onClick={() => submitRecord(selected)}
                        type="button"
                      >
                        Enviar a revisión
                      </SecondaryButton>
                    )}
                    {canExportPdf && canExportPdfRecord(selected) && (
                      <SecondaryButton
                        disabled={loading || !id}
                        icon={Download}
                        loading={loading}
                        onClick={() => downloadPdf(selected)}
                        type="button"
                      >
                        Descargar PDF
                      </SecondaryButton>
                    )}
                  </ActionBar>
                )}
              </div>
            )}

            {activeOperation === "form" && (
              <div className="space-y-4">
                {selected && selected.status !== "DRAFT" && <DocumentApprovalStatus data={selected} />}
                {studentCreateNeedsEnrollment && enrollmentLoading && (
                  <Alert tone="info">
                    Preparando los datos del paralelo activo...
                  </Alert>
                )}
                {studentCreateNeedsEnrollment &&
                  !enrollmentLoading &&
                  enrollmentRows.length === 0 && (
                    <Alert tone="info">
                      No tienes una inscripción aprobada en un paralelo activo para
                      completar este documento.
                    </Alert>
                  )}
                {studentCreateNeedsEnrollment &&
                  !enrollmentLoading &&
                  enrollmentRows.length > 1 && (
                    <Field label="Práctica">
                      <EntitySelect rows={enrollmentRows} value={body?.enrollmentId} placeholder="Selecciona la práctica" getOptionLabel={enrollmentLabel} onChange={enrollmentId => {
                        const next = { ...body, enrollmentId };
                        fillEnrollmentInstitutionFields(next, enrollmentRows.find(row => String(row.id) === String(enrollmentId)) || {});
                        setBody(next); draft.change(next);
                      }} />
                    </Field>
                  )}
                {studentEnrollmentResolved && (
                  <>
                    {module.submitPath && (
                      <>

                        <DocumentDraftStatus
                          editable
                          readiness={getDocumentReadiness(module.id, body)}
                        />
                      </>
                    )}
                    {module.id === 'final-reports' && letterheadPicker}
                    <DraftRecovery draft={draft} disabled={loading} showStatus={false} />
                    <FormFeedback errors={fieldErrors} attempt={validationAttempt}><fieldset disabled={loading}><GuidedForm
                      customFields={customFormFields}
                      hiddenFields={formHiddenFields}
                      readOnlyFields={module.readOnlyFields || []}
                      relations={formRelations}
                      value={body}
                      onChange={value => {
                        setFieldErrors(errors => Object.fromEntries(Object.entries(errors).filter(([path]) => {
                          const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
                          const read = object => keys.reduce((current,key) => current?.[key], object);
                          return JSON.stringify(read(body)) === JSON.stringify(read(value));
                        })));
                        setBody(value); draft.change(value);
                      }}
                    /></fieldset></FormFeedback>
                  </>
                )}


              </div>
            )}

            {activeOperation === "review" && canReview && (
              <ReviewWorkspace record={selected}>
                <ReviewFeedbackForm
                  module={module}
                  record={selected}
                  value={reviewBody}
                  onChange={setReviewBody}
                  onSendFeedback={submitReviewPatch}
                  onSubmitDecision={async (approved) => {
                    const accepted = await confirm(
                      reviewDecisionConfirmation(approved, module),
                    );

                    if (!accepted) {
                      return false;
                    }

                    return submitReviewPatch(
                      { approved },
                      approved
                        ? "Decision guardada: documento aprobado"
                        : "Decision guardada: se solicitaron correcciones",
                    );
                  }}
                />
              </ReviewWorkspace>
            )}

            {activeOperation === "actions" && (
              <div className="space-y-4">
                {selectedExtraActions.map((action) => (
                  <div
                    className="border-t border-line pt-4 first:border-t-0 first:pt-0 dark:border-line"
                    key={action.label}
                  >
                    {action.body ? (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-heading dark:text-heading">
                          {action.label}
                        </h3>
                        {isFeedbackReviewBody(actionBodies[action.label]) ? (
                         <ReviewWorkspace record={selected}>
                          <ReviewFeedbackForm
                            module={module}
                            record={selected}
                            value={actionBodies[action.label] || {}}
                            onChange={(nextValue) =>
                              setActionBodies((current) => ({
                                ...current,
                                [action.label]: nextValue,
                              }))
                            }
                            onSendFeedback={(
                              patch,
                              successMessage = "Retroalimentación enviada",
                            ) =>
                              submitStructured(
                                action.path(id, secondaryId, roles),
                                action.method || "PATCH",
                                normalizeReviewBody(patch),
                                successMessage,
                              )
                            }
                            onSubmitDecision={async (approved) => {
                              const accepted = await confirm(
                                reviewDecisionConfirmation(approved, module),
                              );

                              if (!accepted) {
                                return false;
                              }

                              return submitStructured(
                                action.path(id, secondaryId, roles),
                                action.method || "PATCH",
                                normalizeReviewBody({ approved }),
                                approved
                                  ? "Decision guardada: documento aprobado"
                                  : "Decision guardada: se solicitaron correcciones",
                              );
                            }}
                          />
                         </ReviewWorkspace>
                        ) : (
                          <StructuredForm
                            relations={formRelations}
                            value={actionBodies[action.label] || {}}
                            onChange={(nextValue) =>
                              setActionBodies((current) => ({
                                ...current,
                                [action.label]: nextValue,
                              }))
                            }
                          />
                        )}
                        {module.id === 'final-reports' && action.letterhead && letterheadPicker}
                        {!isFeedbackReviewBody(actionBodies[action.label]) && (
                          <SecondaryButton
                            disabled={
                              loading ||
                              (action.needsId && !id) ||
                              (action.letterhead && Object.keys(action.sample || {}).length === 0 && !letterheadFile) ||
                              (action.needsSecondaryId && !secondaryId)
                            }
                            icon={CheckCircle2}
                            onClick={async () => {
                              const accepted = await confirm(
                                importantActionConfirmation(
                                  action.label,
                                  module.title,
                                ),
                              );

                              if (!accepted) {
                                return;
                              }

                              return submitStructured(
                                action.path(id, secondaryId, roles),
                                action.method || "PATCH",
                                actionBodies[action.label] || {},
                                "Operacion completada",
                              );
                            }}
                            type="button"
                          >
                            {action.label}
                          </SecondaryButton>
                        )}
                      </div>
                    ) : (
                      <SecondaryButton
                        disabled={
                          loading ||
                          (action.needsId && !id) ||
                          (action.needsSecondaryId && !secondaryId)
                        }
                        icon={CheckCircle2}
                        onClick={async () => {
                          const accepted = await confirm(
                            importantActionConfirmation(
                              action.label,
                              module.title,
                            ),
                          );

                          if (!accepted) {
                            return;
                          }

                          submitNoBody(
                            action.path(id, secondaryId, roles),
                            action.method || "PATCH",
                          );
                        }}
                        type="button"
                      >
                        {action.label}
                      </SecondaryButton>
                    )}
                  </div>
                ))}
                {!selectedExtraActions.length && (
                  <Alert tone="info">
                    No hay acciones adicionales disponibles.
                  </Alert>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      )}
      {activeOperation === 'form' && studentEnrollmentResolved && <EditorActions>
        <div className="min-w-0 flex-1"><p role="status" aria-live="polite" className="break-words text-sm text-body">{draft.status ? `${draft.status}${draft.status === 'Guardado en el servidor' ? ' · Copia privada' : ''}` : 'Guarda el borrador para actualizar el documento.'}</p><details className="mt-1 text-sm text-muted"><summary className="w-fit cursor-pointer rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus">Ayuda con el guardado</summary><p className="mt-2 max-w-prose">El autoguardado conserva una copia privada. Guardar borrador actualiza el documento. Guardar y ver PDF permite revisar su formato; el envío a revisión se realiza desde el detalle.</p></details>{draft.retry && /No se pudo/.test(draft.status) && <SecondaryButton onClick={draft.retry} disabled={loading}>Reintentar autoguardado</SecondaryButton>}</div>
        {formActions}
      </EditorActions>}
    </div>
  );
}
