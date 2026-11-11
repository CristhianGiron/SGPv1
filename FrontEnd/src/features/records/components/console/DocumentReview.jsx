/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DocumentReview.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente DocumentReview de la interfaz del SGP.
 */

import { ActivityPlanScheduleMatrix, DataInspector } from "../DataInspector";
import { Alert } from "../../../../components/ui/Alert";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { SecondaryButton } from "../../../../components/ui/ActionBar";
import { SectionCard } from "../../../../components/ui/SectionCard";
import { Textarea } from "../../../../components/ui/FormControls";
import { entryLabel } from "./workspaceHelpers";
import { formatValue, labelFromKey } from "../../../../utils/format";
import { getReviewSections } from "./reviewModel";
import { useEffect, useState } from "react";

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const reviewChoiceBaseClass =
  "inline-flex min-h-[2.45rem] items-center gap-2 rounded-lg border border-field-border bg-panel px-3 py-2 text-sm font-semibold text-body transition-colors hover:bg-field-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface dark:text-ink dark:hover:bg-hover-soft";

const reviewChoiceActiveClass =
  "border-accent bg-accent-soft text-primary-strong hover:bg-accent-soft dark:border-accent dark:bg-hover-soft dark:text-accent-strong dark:hover:bg-hover-soft";

const reviewSectionClass =
  "overflow-hidden rounded-lg border border-border bg-panel shadow-card dark:border-line dark:bg-surface dark:text-ink";

const reviewSectionHeaderClass =
  "border-b border-line-soft bg-field px-4 py-3 dark:border-line dark:bg-surface-soft";

const reviewFieldGridClass = "space-y-3";

const reviewFieldClass =
  "min-w-0 border-b border-line-soft pb-3 last:border-b-0 last:pb-0 dark:border-line";

const reviewValueClass =
  "m-0 whitespace-pre-wrap break-words text-sm leading-6 text-body dark:text-heading";

const reviewEmptyClass = "m-0 text-sm text-body";

const reviewArrayItemClass =
  "space-y-3 rounded-lg border border-line-soft bg-field-hover p-3 dark:border-line dark:bg-surface";

const reviewArrayIndexClass =
  "text-[0.82rem] font-semibold text-primary-strong dark:text-accent-strong";

const feedbackIconBaseClass =
  "relative grid h-[2.1rem] w-[2.1rem] flex-none place-items-center rounded-full border border-line bg-panel text-primary-strong transition-colors hover:border-primary hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface dark:text-accent-strong dark:hover:border-accent dark:hover:bg-hover-soft";

const feedbackIconActiveClass =
  "border-primary bg-accent-soft dark:border-accent dark:bg-hover-soft";

const feedbackIconNewClass =
  "after:absolute after:left-[1.4rem] after:top-[0.4rem] after:h-2 after:w-2 after:rounded-full after:bg-danger after:ring-2 after:ring-panel dark:after:ring-surface";

export function ReviewWorkspace({ record, children }) {
 return <div className="grid items-start gap-5 xl:grid-cols-2">
  <SectionCard title="Documento a revisar" description="Consulta el contenido mientras escribes tus observaciones."><DataInspector data={record} /></SectionCard>
  <div className="space-y-4 xl:sticky xl:top-20 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto xl:pr-1">{children}</div>
 </div>;
}

export function ReviewFeedbackForm({
  module,
  record,
  value,
  onChange,
  onSendFeedback,
  onSubmitDecision,
}) {
  if (!record) {
    return <Alert tone="info">Selecciona un registro para revisar.</Alert>;
  }

  const reviewValue = value || {};
  const sections = getReviewSections(module.id, record, reviewValue);
  const decisionState = reviewDecisionState(reviewValue.approved);
  const handledFeedbackKeys = new Set(
    sections.flatMap(
      (section) => section.feedbackKeys || [section.feedbackKey],
    ),
  );
  const fallbackFeedbackKeys = Object.keys(reviewValue).filter(
    (key) =>
      key !== "approved" &&
      /Feedback$/.test(key) &&
      !handledFeedbackKeys.has(key),
  );

  function setReviewField(key, nextValue) {
    onChange({
      ...reviewValue,
      [key]: nextValue,
    });
  }

  function submitDecision(approved) {
    setReviewField("approved", approved);
    onSubmitDecision?.(approved);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2" aria-label="Decision de revisión">
          <button
            aria-pressed={reviewValue.approved === true}
            data-intent="success"
            className={`sgp-action sgp-action-soft ${reviewChoiceBaseClass} ${reviewValue.approved === true ? reviewChoiceActiveClass : ""}`}
            onClick={() => submitDecision(true)}
            title="Aprobar documento"
            type="button"
          >
            <CheckCircle2 size={16} />
            Aprobar
          </button>
        </div>

        <div
          aria-live="polite"
          className={cx(
            "rounded-lg border px-3 py-2 text-sm leading-5",
            decisionState.tone === "success" &&
              "border-line bg-success-soft text-success-strong dark:border-accent/40 dark:bg-success-soft dark:text-success-strong",
            decisionState.tone === "warning" &&
              "border-warning bg-warning-soft text-warning-strong dark:border-warning/40 dark:bg-warning-soft dark:text-warning-strong",
            decisionState.tone === "info" &&
              "border-line bg-field text-body dark:border-line dark:bg-surface-soft dark:text-body",
          )}
          role="status"
        >
          <p className="font-semibold">{decisionState.title}</p>
          <p className="mt-0.5">{decisionState.description}</p>
        </div>
      </div>

      {sections.map((section) => (
        <ReviewSection
          key={section.feedbackKey || section.title}
          record={record}
          section={section}
          value={reviewValue}
          onChange={onChange}
          onFieldChange={setReviewField}
          onSendFeedback={onSendFeedback}
        />
      ))}

      {fallbackFeedbackKeys.map((key) => (
        <ReviewSection
          key={key}
          record={record}
          section={{
            title: labelFromKey(key.replace(/Feedback$/, "")),
            feedbackKey: key,
            fields: [],
          }}
          value={reviewValue}
          onChange={onChange}
          onFieldChange={setReviewField}
          onSendFeedback={onSendFeedback}
        />
      ))}
    </div>
  );
}

function reviewDecisionState(approved) {
  if (approved === true) {
    return {
      tone: "success",
      title: "Aprobación lista para confirmar",
      description: "La acción Aprobar abre la confirmacion y guarda la decision.",
    };
  }

  if (approved === false) {
    return {
      tone: "warning",
      title: "Correcciones solicitadas",
      description:
        "El documento fue devuelto mediante recomendaciones por apartado.",
    };
  }

  return {
    tone: "info",
    title: "Sin decision final",
    description:
      "Puedes enviar recomendaciones por apartado o aprobar el documento cuando este listo.",
  };
}

function ReviewSection({
  record,
  section,
  value,
  onChange,
  onFieldChange,
  onSendFeedback,
}) {
  return (
    <details className={reviewSectionClass}>
      <summary className={`${reviewSectionHeaderClass} cursor-pointer text-sm font-semibold text-heading`}>
        {section.title}<span className="ml-2 text-xs font-normal text-body">Abrir apartado</span>
      </summary>
      <div className="space-y-4 p-4">
        {section.fields?.length > 0 && (
          <div className={reviewFieldGridClass}>
            {section.fields.map((field) => (
              <ReviewValue
                field={field}
                key={field}
                label={labelFromKey(field)}
                value={record?.[field]}
              />
            ))}
          </div>
        )}

        {section.arrays?.map((arrayConfig) => (
          <ReviewArray
            config={arrayConfig}
            items={record?.[arrayConfig.key] || []}
            key={arrayConfig.key}
          />
        ))}

        {section.entryFeedback && (
          <EntryFeedbackList
            entries={record.entries || []}
            value={value}
            onChange={onChange}
            onSendFeedback={onSendFeedback}
          />
        )}

        {section.feedbackKey && (
          <FeedbackComposer
            label="Retroalimentación"
            value={value?.[section.feedbackKey] || ""}
            onChange={(nextValue) =>
              onFieldChange(section.feedbackKey, nextValue)
            }
            onSubmit={(nextValue) =>
              onSendFeedback?.(
                { [section.feedbackKey]: nextValue },
                `Retroalimentación enviada en ${section.title}`,
              )
            }
            sentAt={
              record?.reviewedAt || record?.updatedAt || record?.createdAt
            }
          />
        )}
      </div>
    </details>
  );
}

function ReviewValue({ field = "", label, value }) {
  const wide = isLongReviewField(field, value);

  return (
    <div className={`${reviewFieldClass} ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-[0.78rem] font-semibold uppercase text-body dark:text-ink">
        {label}
      </span>
      <p className={reviewValueClass}>{formatValue(value, field)}</p>
    </div>
  );
}

function isLongReviewField(field, value) {
  return (
    /activities|resources|feedback|antecedents|conclusion|recommendation|methodology|mission|vision|values|objective|presentation|evidence/i.test(
      field,
    ) || String(value || "").length > 90
  );
}

function ReviewArray({ config, items }) {
  if (!items.length) {
    return (
      <p className={reviewEmptyClass}>
        Aún no hay información en {config.label.toLowerCase()}.
      </p>
    );
  }

  if (config.key === "scheduleWeeks") {
    return (
      <div className="grid gap-2">
        <span className="text-[0.78rem] font-semibold uppercase text-body dark:text-ink">
          {config.label}
        </span>
        <ActivityPlanScheduleMatrix weeks={items} />
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <span className="text-[0.78rem] font-semibold uppercase text-body dark:text-ink">
        {config.label}
      </span>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            className={reviewArrayItemClass}
            key={item.id || `${config.key}-${index}`}
          >
            <span className={reviewArrayIndexClass}>
              {config.itemLabel
                ? config.itemLabel(item, index)
                : `${config.label} ${index + 1}`}
            </span>
            <div className={reviewFieldGridClass}>
              {(config.fields || Object.keys(item)).map((field) => (
                <ReviewValue
                  field={field}
                  key={field}
                  label={labelFromKey(field)}
                  value={item?.[field]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackComposer({ label, value, onChange, onSubmit, sentAt }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [sending, setSending] = useState(false);
  const hasValue = String(value || "").trim().length > 0;
  const highlightClass = hasValue ? feedbackIconNewClass : "";

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  function updateDraft(nextValue) {
    setDraft(nextValue);
    onChange(nextValue);
  }

  async function sendFeedback() {
    if (!onSubmit) {
      return;
    }

    setSending(true);

    try {
      const sent = await onSubmit(draft);

      if (sent !== false) {
        setOpen(false);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="relative flex items-start gap-3">
        <button
          aria-expanded={open}
          aria-label={
            open ? "Cerrar retroalimentación" : "Abrir retroalimentación"
          }
          className={`${feedbackIconBaseClass} ${open ? feedbackIconActiveClass : ""} ${highlightClass}`}
          onClick={() => setOpen((current) => !current)}
          title={open ? "Cerrar retroalimentación" : "Abrir retroalimentación"}
          type="button"
        >
          <MessageCircle size={16} />
        </button>
        <div className="min-w-0 flex-1 rounded-lg border border-danger bg-danger-soft p-3 dark:border-line dark:bg-surface">
          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[0.78rem] font-semibold uppercase text-body dark:text-ink">
              {label}
            </span>
            {hasValue && sentAt && (
              <span className="text-xs leading-5 text-danger-strong dark:text-ink">
                Enviado: {formatValue(sentAt, "reviewedAt")}
              </span>
            )}
          </div>
          {hasValue ? (
            <p className={reviewValueClass}>{value}</p>
          ) : (
            <p className={reviewEmptyClass}>Sin retroalimentación</p>
          )}
        </div>
      </div>
      {open && (
        <div className="ml-[2.65rem] grid gap-2 rounded-lg border border-line bg-panel p-2 dark:border-line dark:bg-surface">
          <Textarea
            value={draft}
            onChange={(event) => updateDraft(event.target.value)}
          />
          <div className="flex justify-end">
            <SecondaryButton
              disabled={sending || String(draft || "").trim().length === 0}
              icon={Send}
              loading={sending}
              onClick={sendFeedback}
              type="button"
            >
              Enviar retroalimentación
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

function EntryFeedbackList({ entries, value, onChange, onSendFeedback }) {
  if (!entries.length) {
    return <p className={reviewEmptyClass}>Sin actividades registradas.</p>;
  }

  return (
    <div className="grid gap-2">
      <span className="text-[0.78rem] font-semibold uppercase text-body dark:text-ink">
        Actividades registradas
      </span>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            className={reviewArrayItemClass}
            key={entry.id || `entry-${index}`}
          >
            <span className={reviewArrayIndexClass}>{entryLabel(entry)}</span>
            <div className={reviewFieldGridClass}>
              {[
                "activityDate",
                "startTime",
                "endTime",
                "totalTime",
                "developedActivities",
                "evidenceLink",
              ].map((field) => (
                <ReviewValue
                  field={field}
                  key={field}
                  label={labelFromKey(field)}
                  value={entry?.[field]}
                />
              ))}
            </div>
            {entry.id && (
              <div className="space-y-3">
                <FeedbackComposer
                  label="Retroalimentación"
                  value={entryFeedbackValue(value, entry.id, "feedback")}
                  onChange={(nextValue) =>
                    setEntryFeedbackValue(
                      value,
                      onChange,
                      entry.id,
                      "feedback",
                      nextValue,
                    )
                  }
                  onSubmit={(nextValue) =>
                    onSendFeedback?.(
                      {
                        entryFeedback: [
                          { entryId: entry.id, feedback: nextValue },
                        ],
                      },
                      `Retroalimentación enviada en ${entryLabel(entry)}`,
                    )
                  }
                  sentAt={entry.updatedAt || entry.createdAt}
                />
                <FeedbackComposer
                  label="Sugerencias"
                  value={entryFeedbackValue(value, entry.id, "suggestions")}
                  onChange={(nextValue) =>
                    setEntryFeedbackValue(
                      value,
                      onChange,
                      entry.id,
                      "suggestions",
                      nextValue,
                    )
                  }
                  onSubmit={(nextValue) =>
                    onSendFeedback?.(
                      {
                        entryFeedback: [
                          { entryId: entry.id, suggestions: nextValue },
                        ],
                      },
                      `Sugerencia enviada en ${entryLabel(entry)}`,
                    )
                  }
                  sentAt={entry.updatedAt || entry.createdAt}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function entryFeedbackValue(value, entryId, key) {
  const feedback = (value?.entryFeedback || []).find(
    (item) => String(item.entryId) === String(entryId),
  );
  return feedback?.[key] || "";
}

function setEntryFeedbackValue(value, onChange, entryId, key, nextValue) {
  const currentFeedback = (value?.entryFeedback || []).filter(
    (item) => item?.entryId,
  );
  const feedbackIndex = currentFeedback.findIndex(
    (item) => String(item.entryId) === String(entryId),
  );
  const nextFeedback =
    feedbackIndex >= 0
      ? [...currentFeedback]
      : [...currentFeedback, { entryId }];
  const targetIndex =
    feedbackIndex >= 0 ? feedbackIndex : nextFeedback.length - 1;

  nextFeedback[targetIndex] = {
    ...nextFeedback[targetIndex],
    entryId,
    [key]: nextValue,
  };

  onChange({
    ...(value || {}),
    entryFeedback: nextFeedback,
  });
}

