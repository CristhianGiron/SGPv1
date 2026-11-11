/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFormDetail.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente PracticeFormDetail de la interfaz del SGP.
 */

import { ActionBar, PrimaryButton, SecondaryButton } from "../../../components/ui/ActionBar";
import { Copy, Printer, Save, Send } from "lucide-react";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "../../../components/ui/FormControls";
import { InfoLine } from "./FormInfo";
import { ModuleTab, ModuleTabs } from "../../../components/ui/ModuleTabs";
import { SectionCard } from "../../../components/ui/SectionCard";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Tabulation } from "./Tabulation";
import { choiceLabelClass, printableQuestionClass } from "../model/formConfig";
import { formatAnswer, questionTypeLabel, scaleValues, targetRoleLabel } from "../model/formPayloads";
import { formatDateTime, formatEnum } from "../../../utils/format";

export function PracticeFormDetail({
  canDuplicate,
  canEditDraft,
  canInterpret,
  canRespond,
  hideOwnIdentity,
  config,
  detailView,
  form,
  interpretationDrafts,
  responseDraft,
  responding,
  savingResponseDraft,
  sendingDraft,
  savingInterpretationId,
  setInterpretationDrafts,
  setDetailView,
  setResponseDraft,
  onEditDraft,
  onPrint,
  onDuplicate,
  onSendDraft,
  onSaveResponseDraft,
  onSaveInterpretation,
  onSubmitAnswers,
}) {
  if (!form) {
    return (
      <SectionCard title="Detalle">
        <EmptyState text={`Selecciona una ${config.singular} para ver el detalle.`} />
      </SectionCard>
    );
  }

  const questions = form.questions || [];
  const hasResponseDraft = Boolean(form.response && !form.response.submittedAt);
  const hasInterpretationQuestions = questions.some((question) => question.answer);
  const availableViews = [
    ['view', 'Vista'],
    canRespond && ['respond', 'Responder'],
    (canInterpret || hasInterpretationQuestions) && ['interpretation', 'Interpretación'],
  ].filter(Boolean);
  const activeDetailView = availableViews.some(([id]) => id === detailView) ? detailView : 'view';

  function setAnswer(questionId, patch) {
    setResponseDraft((current) => ({
      ...current,
      [questionId]: {
        ...(current[questionId] || {}),
        ...patch,
      },
    }));
  }

  function toggleOption(questionId, optionLabel, checked) {
    setResponseDraft((current) => {
      const currentValues = current[questionId]?.selectedOptions || [];
      const selectedOptions = checked
        ? [...currentValues, optionLabel]
        : currentValues.filter((option) => option !== optionLabel);

      return {
        ...current,
        [questionId]: {
          ...(current[questionId] || {}),
          selectedOptions,
        },
      };
    });
  }

  return (
    <SectionCard
      className="practice-form-print-card print:border-0 print:bg-panel print:p-0 print:shadow-none"
      title={`Detalle de la ${config.singular}`}
      action={
        <ActionBar>
          {canDuplicate && (
            <SecondaryButton className="print:hidden" icon={Copy} onClick={() => onDuplicate(form)} type="button">
              Duplicar
            </SecondaryButton>
          )}
          {canEditDraft && (
            <>
              <SecondaryButton className="print:hidden" icon={Save} onClick={() => onEditDraft(form)} type="button">
                Editar borrador
              </SecondaryButton>
              <PrimaryButton className="print:hidden" icon={Send} loading={sendingDraft} onClick={onSendDraft} type="button">
                Enviar
              </PrimaryButton>
            </>
          )}
          <SecondaryButton className="print:hidden" icon={Printer} onClick={onPrint} type="button">
            Imprimir
          </SecondaryButton>
        </ActionBar>
      }
    >
      <form onSubmit={onSubmitAnswers}>
        <div className="practice-form-print-document space-y-5 print:text-[11pt] print:text-heading">
          <header className="practice-form-print-header flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs font-semibold uppercase leading-tight tracking-normal text-primary dark:text-info-strong print:text-[10pt] print:text-table-ink">
                {config.singular}
              </p>
              <h2 className="text-2xl font-semibold leading-tight text-heading dark:text-heading print:text-[18pt] print:uppercase print:text-table-ink">{form.title}</h2>
              {form.description && <p className="mt-2 text-sm leading-6 text-body dark:text-ink">{form.description}</p>}
            </div>
            <span className="print:hidden">
              <StatusBadge status={form.status} />
            </span>
          </header>

          <div className="practice-form-print-meta grid gap-3 rounded-lg border border-line bg-panel-soft p-3 text-sm dark:border-line dark:bg-surface-soft md:grid-cols-2 print:grid-cols-2 print:gap-0 print:rounded-none print:border-black print:bg-panel print:p-0">
            <InfoLine label="Paralelo" value={form.courseName} />
            {!hideOwnIdentity && <InfoLine label="Estudiante" value={form.studentFullName || form.student} />}
            <InfoLine label="Institución" value={form.educationalInstitutionName} />
            {!(hideOwnIdentity && config.selfAnswered) && (
              <InfoLine label={config.selfAnswered ? 'Respondida por' : 'Asignado a'} value={form.target || targetRoleLabel(form.targetRole)} />
            )}
            <InfoLine label="Estado" value={formatEnum(form.status)} />
            <InfoLine label="Creado" value={formatDateTime(form.createdAt)} />
            <InfoLine label="Respondido" value={formatDateTime(form.answeredAt)} />
            {form.response?.respondent && !(hideOwnIdentity && config.selfAnswered) && (
              <InfoLine label="Respondido por" value={form.response.respondent} />
            )}
            {hasResponseDraft && <InfoLine label="Respuesta" value="Borrador guardado" />}
          </div>

          <div className="print:hidden">
            <ModuleTabs>
              {availableViews.map(([id, label]) => (
                <ModuleTab active={activeDetailView === id} key={id} onClick={() => setDetailView(id)}>
                  {label}
                </ModuleTab>
              ))}
            </ModuleTabs>
          </div>

          {activeDetailView === 'interpretation' && !hasInterpretationQuestions ? (
            <EmptyState text="No hay respuestas registradas para interpretar." />
          ) : (
            <div className="space-y-4">
              {questions
                .filter((question) => activeDetailView !== 'interpretation' || question.answer)
                .map((question) => (
                  <QuestionDetail
                    canInterpret={canInterpret && activeDetailView === 'interpretation'}
                    canRespond={canRespond && activeDetailView === 'respond'}
                    interpretation={interpretationDrafts[question.id] || ''}
                    key={question.id}
                    question={question}
                    responseValue={responseDraft[question.id] || {}}
                    savingInterpretation={savingInterpretationId === question.id}
                    setAnswer={setAnswer}
                    setInterpretationDrafts={setInterpretationDrafts}
                    showAnswer={activeDetailView !== 'respond'}
                    showInterpretation={activeDetailView === 'interpretation'}
                    showTabulation={activeDetailView === 'view' || activeDetailView === 'interpretation'}
                    toggleOption={toggleOption}
                    onSaveInterpretation={onSaveInterpretation}
                  />
                ))}
            </div>
          )}
        </div>

        {canRespond && activeDetailView === 'respond' && (
          <ActionBar>
            <SecondaryButton className="print:hidden" icon={Save} loading={savingResponseDraft} type="button" onClick={onSaveResponseDraft}>
              Guardar borrador
            </SecondaryButton>
            <PrimaryButton className="print:hidden" icon={Send} loading={responding} type="submit">
              Enviar respuestas
            </PrimaryButton>
          </ActionBar>
        )}
      </form>
    </SectionCard>
  );
}

function QuestionDetail({
  canInterpret,
  canRespond,
  interpretation,
  question,
  responseValue,
  savingInterpretation,
  setAnswer,
  setInterpretationDrafts,
  showAnswer = true,
  showInterpretation = false,
  showTabulation = true,
  toggleOption,
  onSaveInterpretation,
}) {
  return (
    <article className={printableQuestionClass}>
      <div className="practice-form-print-question-header flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-body dark:text-ink">
            Pregunta {question.order} | {questionTypeLabel(question.type)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-heading dark:text-heading">{question.prompt}</h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-line bg-panel-soft px-2.5 py-1 text-xs font-semibold leading-none text-body dark:border-line dark:bg-surface-soft dark:text-ink print:hidden">
          {question.required ? 'Obligatoria' : 'Opcional'}
        </span>
      </div>

      {canRespond && (
        <div className="mt-4 print:hidden">
          <ResponseInput
            question={question}
            value={responseValue}
            setAnswer={setAnswer}
            toggleOption={toggleOption}
          />
        </div>
      )}

      {showAnswer && question.answer && (
        <div className="practice-form-print-answer mt-4 rounded-lg border border-line bg-panel p-3 dark:border-line dark:bg-surface">
          <p className="mb-1.5 text-[0.82rem] font-semibold text-body dark:text-ink">Respuesta</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-heading dark:text-heading">{formatAnswer(question)}</p>
        </div>
      )}

      {showTabulation && question.tabulable && question.tabulation && <Tabulation question={question} />}

      {showInterpretation && question.answer && (
        <div className="practice-form-print-answer mt-4 rounded-lg border border-line bg-panel-soft p-3 dark:border-line dark:bg-surface-soft">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="mb-0 text-[0.82rem] font-semibold text-body dark:text-ink">Interpretación del estudiante</p>
            {canInterpret && (
              <SecondaryButton
                className="print:hidden"
                icon={Save}
                loading={savingInterpretation}
                onClick={() => onSaveInterpretation(question.id)}
                type="button"
              >
                Guardar
              </SecondaryButton>
            )}
          </div>
          {canInterpret ? (
            <Textarea
              className="print:hidden"
              aria-label={`Interpretación del estudiante de la pregunta ${question.order}`}
              maxLength={5000}
              value={interpretation}
              onChange={(event) =>
                setInterpretationDrafts((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }))
              }
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6 text-body dark:text-body">
              {question.studentInterpretation || 'Sin interpretación registrada'}
            </p>
          )}
          {canInterpret && (
            <p className="hidden whitespace-pre-wrap text-sm leading-6 text-body print:block">
              {interpretation || 'Sin interpretación registrada'}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function ResponseInput({ question, value, setAnswer, toggleOption }) {
  if (question.type === 'OPEN_TEXT') {
    return (
      <Field label="Respuesta abierta">
        <Textarea
          required={question.required}
          value={value.textAnswer || ''}
          onChange={(event) => setAnswer(question.id, { textAnswer: event.target.value })}
        />
      </Field>
    );
  }

  if (question.type === 'SINGLE_CHOICE') {
    return (
      <div className="space-y-2">
        {(question.options || []).map((option) => (
          <label className={choiceLabelClass} key={option.id || option.label}>
            <input
              checked={(value.selectedOptions || [])[0] === option.label}
              name={`question-${question.id}`}
              required={question.required}
              type="radio"
              onChange={() => setAnswer(question.id, { selectedOptions: [option.label] })}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'MULTIPLE_CHOICE') {
    return (
      <div className="space-y-2">
        {(question.options || []).map((option) => (
          <label className={choiceLabelClass} key={option.id || option.label}>
            <input
              checked={(value.selectedOptions || []).includes(option.label)}
              type="checkbox"
              onChange={(event) => toggleOption(question.id, option.label, event.target.checked)}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'YES_NO') {
    return (
      <Field label="Respuesta">
        <Select
          required={question.required}
          value={value.booleanAnswer ?? ''}
          onChange={(event) => setAnswer(question.id, { booleanAnswer: event.target.value })}
        >
          <option value="">Selecciona</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </Select>
      </Field>
    );
  }

  if (question.type === 'SCALE') {
    return (
      <Field label={`Escala ${question.scaleMin} - ${question.scaleMax}`}>
        <Select
          required={question.required}
          value={value.numberAnswer ?? ''}
          onChange={(event) => setAnswer(question.id, { numberAnswer: event.target.value })}
        >
          <option value="">Selecciona</option>
          {scaleValues(question).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  return (
    <Field label="Respuesta numérica">
      <Input
        required={question.required}
        step="0.01"
        type="number"
        value={value.numberAnswer ?? ''}
        onChange={(event) => setAnswer(question.id, { numberAnswer: event.target.value })}
      />
    </Field>
  );
}

