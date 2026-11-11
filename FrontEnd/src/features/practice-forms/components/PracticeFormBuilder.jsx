/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFormBuilder.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente PracticeFormBuilder de la interfaz del SGP.
 */

import { ActionBar, DangerButton, PrimaryButton, SecondaryButton } from "../../../components/ui/ActionBar";
import { ArrowDown, ArrowUp, Plus, Save, Send, Trash2 } from "lucide-react";
import { CHOICE_TYPES, QUESTION_TYPES, choiceLabelClass, questionEditorCardClass, questionEditorHeaderClass } from "../model/formConfig";
import { Field, Input, Select, Textarea } from "../../../components/ui/FormControls";
import { InfoLine } from "./FormInfo";
import { SectionCard } from "../../../components/ui/SectionCard";
import { formatEnum } from "../../../utils/format";
import { newQuestion, normalizeQuestion, questionTypeLabel, resolveDefaultEnrollment, targetOptionsForEnrollment } from "../model/formPayloads";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import { useEffect, useMemo } from "react";
import { usePracticeWorkspace } from "../../practices/context/PracticeWorkspaceContext";

export function PracticeFormBuilder({
  config,
  draft,
  editing,
  enrollments,
  loading,
  mode,
  saving,
  setDraft,
  onSaveDraft,
  onSend,
  onDraftChange,
}) {
  const confirm = useConfirm();
  const workspace = usePracticeWorkspace();
  const selectedEnrollment = enrollments.find((enrollment) => String(enrollment.id) === String(draft.enrollmentId));
  const defaultEnrollment = useMemo(() => resolveDefaultEnrollment(enrollments), [enrollments]);
  const targetOptions = useMemo(
    () => (mode === 'observations' ? [{ value: 'STUDENT_SELF', label: 'Estudiante', disabled: false }] : targetOptionsForEnrollment(selectedEnrollment)),
    [mode, selectedEnrollment],
  );

  useEffect(() => {
    if (!enrollments.length) return;

    setDraft((current) => {
      const selectedStillValid = enrollments.some((enrollment) => String(enrollment.id) === String(current.enrollmentId));
      const nextEnrollmentId = selectedStillValid ? current.enrollmentId : defaultEnrollment ? String(defaultEnrollment.id) : "";
      if (!nextEnrollmentId) return current.enrollmentId ? { ...current, enrollmentId: "" } : current;
      const nextEnrollment = enrollments.find((enrollment) => String(enrollment.id) === String(nextEnrollmentId)) || defaultEnrollment;
      const options = mode === 'observations'
        ? [{ value: 'STUDENT_SELF', label: 'Estudiante', disabled: false }]
        : targetOptionsForEnrollment(nextEnrollment);
      const nextTargetRole = options.some((option) => option.value === current.targetRole && !option.disabled)
        ? current.targetRole
        : options.find((option) => !option.disabled)?.value || current.targetRole;

      if (String(current.enrollmentId) === String(nextEnrollmentId) && current.targetRole === nextTargetRole) {
        return current;
      }

      return {
        ...current,
        enrollmentId: String(nextEnrollmentId),
        targetRole: nextTargetRole,
      };
    });
  }, [defaultEnrollment, enrollments, mode, setDraft, draft.enrollmentId]);

  function changeDraft(update) { const next = typeof update === 'function' ? update(draft) : update;setDraft(next);onDraftChange?.(next); }

  function updateDraft(field, value) {
    changeDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateQuestion(index, patch) {
    changeDraft((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? normalizeQuestion({ ...question, ...patch }) : question
      ),
    }));
  }

  function moveQuestion(index, direction) {
    changeDraft((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.questions.length) {
        return current;
      }

      const questions = [...current.questions];
      const [question] = questions.splice(index, 1);
      questions.splice(nextIndex, 0, question);

      return {
        ...current,
        questions,
      };
    });
  }

  async function removeQuestion(index) {
    const accepted = await confirm({
      title: 'Quitar pregunta',
      description: 'La pregunta se retirara de la entrevista en edición.',
      details: `Pregunta ${index + 1}`,
      confirmLabel: 'Quitar pregunta',
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    changeDraft((current) => ({
      ...current,
      questions:
        current.questions.length > 1
          ? current.questions.filter((_, questionIndex) => questionIndex !== index)
          : current.questions,
    }));
  }

  function addOption(questionIndex) {
    changeDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: [...question.options, `Opción ${question.options.length + 1}`],
            }
          : question
      ),
    }));
  }

  function updateOption(questionIndex, optionIndex, value) {
    changeDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? value : option
              ),
            }
          : question
      ),
    }));
  }

  async function removeOption(questionIndex, optionIndex) {
    const accepted = await confirm({
      title: 'Quitar opción',
      description: 'La opción se retirara de la pregunta en edición.',
      details: `Pregunta ${questionIndex + 1}`,
      confirmLabel: 'Quitar opción',
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    changeDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options:
                question.options.length > 2
                  ? question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex)
                  : question.options,
            }
          : question
      ),
    }));
  }

  return (
    <form className="space-y-5" onSubmit={onSaveDraft}>
      <fieldset disabled={saving || loading} className="min-w-0 space-y-5">
      <SectionCard
        title={`${editing ? 'Editar' : 'Datos de la'} ${config.singular}`}
        description="La pertenencia académica y de práctica se toma de tu inscripción aprobada."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {!workspace && enrollments.length > 1 && !editing && <Field label="Paralelo de práctica aprobado">
            <Select value={draft.enrollmentId} required disabled={loading} onChange={event => updateDraft('enrollmentId', event.target.value)}>
              <option value="">Selecciona la práctica que corresponde a este formulario</option>
              {enrollments.map(enrollment => <option key={enrollment.id} value={enrollment.id}>{[enrollment.practiceName, enrollment.courseName, enrollment.educationalInstitutionName].filter(Boolean).join(' · ')}</option>)}
            </Select>
          </Field>}
          {mode !== 'observations' && <Field label="Quién responderá">
            {targetOptions.filter(option => !option.disabled).length > 1 ? <Select disabled={!selectedEnrollment} required value={draft.targetRole} onChange={event => updateDraft('targetRole', event.target.value)}>
              {targetOptions.map(({ disabled, label, value }) => <option disabled={disabled} key={value} value={value}>{label}</option>)}
            </Select> : <p className="py-2 text-sm text-body">{targetOptions.find(option => !option.disabled)?.label || 'No hay una persona asignada para responder.'}</p>}
          </Field>}

          <Field className="lg:col-span-2" label="Título">
            <Input
              maxLength={160}
              required
              value={draft.title}
              onChange={(event) => updateDraft('title', event.target.value)}
            />
          </Field>

          <Field className="lg:col-span-2" label="Descripción">
            <Textarea
              maxLength={2000}
              value={draft.description}
              onChange={(event) => updateDraft('description', event.target.value)}
            />
          </Field>
        </div>

        {!workspace && selectedEnrollment && (
          <div className="mt-4 grid gap-3 rounded-lg border border-line bg-panel-soft p-3 text-sm text-body dark:border-line dark:bg-surface-soft dark:text-body md:grid-cols-2">
            <InfoLine label="Paralelo" value={selectedEnrollment.courseName} />
            <InfoLine label="Institución" value={selectedEnrollment.educationalInstitutionName} />
            <InfoLine label="Tutor institucional" value={selectedEnrollment.institutionalTutor} />
            <InfoLine
              fallback="Sin directora asignada"
              label="Directora de institución"
              value={selectedEnrollment.institutionDirector}
            />
            <InfoLine label="Estado" value={formatEnum(selectedEnrollment.status)} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Preguntas"
        action={
          <SecondaryButton
            icon={Plus}
            onClick={() =>
              changeDraft((current) => ({
                ...current,
                questions: [...current.questions, newQuestion()],
              }))
            }
            type="button"
          >
            Agregar pregunta
          </SecondaryButton>
        }
      >
        <div className="space-y-4">
          {draft.questions.map((question, index) => (
            <div className={questionEditorCardClass} key={question.key}>
              <div className={questionEditorHeaderClass}>
                <div>
                  <p className="font-semibold text-heading dark:text-heading">Pregunta {index + 1}</p>
                  <p className="text-xs font-medium uppercase text-body dark:text-ink">{questionTypeLabel(question.type)}</p>
                </div>
                <ActionBar>
                  <SecondaryButton
                    disabled={index === 0}
                    icon={ArrowUp}
                    onClick={() => moveQuestion(index, -1)}
                    title="Subir pregunta"
                    type="button"
                  />
                  <SecondaryButton
                    disabled={index === draft.questions.length - 1}
                    icon={ArrowDown}
                    onClick={() => moveQuestion(index, 1)}
                    title="Bajar pregunta"
                    type="button"
                  />
                  <DangerButton
                    disabled={draft.questions.length === 1}
                    icon={Trash2}
                    onClick={() => removeQuestion(index)}
                    type="button"
                  >
                    Quitar
                  </DangerButton>
                </ActionBar>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
                <Field label="Enunciado">
                  <Textarea
                    maxLength={1000}
                    required
                    value={question.prompt}
                    onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                  />
                </Field>

                <div className="space-y-4">
                  <Field label="Tipo">
                    <Select
                      value={question.type}
                      onChange={(event) => updateQuestion(index, { type: event.target.value })}
                    >
                      {QUESTION_TYPES.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <label className={choiceLabelClass}>
                    <input
                      checked={question.required}
                      type="checkbox"
                      onChange={(event) => updateQuestion(index, { required: event.target.checked })}
                    />
                    Obligatoria
                  </label>
                </div>

                {CHOICE_TYPES.has(question.type) && (
                  <div className="space-y-3 lg:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="mb-0 text-[0.82rem] font-semibold text-body dark:text-ink">Opciones</p>
                      <SecondaryButton icon={Plus} onClick={() => addOption(index)} type="button">
                        Agregar opción
                      </SecondaryButton>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <div className="flex gap-2" key={`${question.key}-${optionIndex}`}>
                          <Input
                            required
                            value={option}
                            onChange={(event) => updateOption(index, optionIndex, event.target.value)}
                          />
                          <DangerButton
                            disabled={question.options.length <= 2}
                            icon={Trash2}
                            onClick={() => removeOption(index, optionIndex)}
                            title="Quitar opción"
                            type="button"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === 'SCALE' && (
                  <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
                    <Field label="Mínimo">
                      <Input
                        max="100"
                        min="0"
                        required
                        type="number"
                        value={question.scaleMin}
                        onChange={(event) => updateQuestion(index, { scaleMin: event.target.value })}
                      />
                    </Field>
                    <Field label="Máximo">
                      <Input
                        max="100"
                        min="1"
                        required
                        type="number"
                        value={question.scaleMax}
                        onChange={(event) => updateQuestion(index, { scaleMax: event.target.value })}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <ActionBar>
        <SecondaryButton icon={Save} loading={saving} type="submit">
          Guardar borrador
        </SecondaryButton>
        <PrimaryButton icon={Send} loading={saving} type="button" onClick={onSend}>
          Enviar
        </PrimaryButton>
      </ActionBar>
    </fieldset>
    </form>
  );
}

