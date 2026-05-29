import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { apiRequest, unwrapPage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { ActionBar, DangerButton, PrimaryButton, SecondaryButton } from '../components/ui/ActionBar';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { DataTable } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';
import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatDateTime, formatEnum } from '../utils/format';

const QUESTION_TYPES = [
  ['OPEN_TEXT', 'Respuesta abierta'],
  ['SINGLE_CHOICE', 'Opcion unica'],
  ['MULTIPLE_CHOICE', 'Seleccion multiple'],
  ['YES_NO', 'Si / No'],
  ['SCALE', 'Escala'],
  ['NUMBER', 'Numero'],
];

const TARGET_ROLES = [
  ['INSTITUTIONAL_TUTOR', 'Tutor institucional'],
  ['INSTITUTION_DIRECTOR', 'Directora de la institucion'],
];

const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE']);
const choiceLabelClass = 'inline-flex min-h-[2.45rem] cursor-pointer items-center gap-2 rounded-lg border border-[#cad8cf] bg-white px-3 py-2 text-sm font-[850] text-[#34443b] transition-colors hover:bg-[#f5faf7] dark:border-slate-600 dark:bg-surface dark:text-ink dark:hover:bg-[#203026]';
const questionEditorCardClass = 'overflow-hidden rounded-lg border border-border bg-white shadow-card dark:border-slate-700 dark:bg-surface';
const questionEditorHeaderClass = 'flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2ee] bg-[#f7f3ef] px-4 py-3 dark:border-slate-700 dark:bg-[#172033]';
const printableQuestionClass = 'rounded-lg border border-border bg-[#fbfaf7] p-4 dark:border-slate-700 dark:bg-surface print:break-inside-avoid print:[page-break-inside:avoid] print:bg-white print:shadow-none';

function newQuestion(type = 'OPEN_TEXT') {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    prompt: '',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    options: ['Opcion 1', 'Opcion 2'],
  };
}

function emptyDraft() {
  return {
    enrollmentId: '',
    targetRole: 'INSTITUTIONAL_TUTOR',
    title: '',
    description: '',
    questions: [newQuestion()],
  };
}

export function PracticeFormsPage() {
  const { token, roles } = useAuth();
  const confirm = useConfirm();
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const canResolveForms =
    roles.includes('ROLE_TUTOR_INSTITUCIONAL') || roles.includes('ROLE_DIRECTORA_INSTITUCION');
  const [activeView, setActiveView] = useState(isStudent ? 'mine' : 'assigned');
  const [myForms, setMyForms] = useState([]);
  const [assignedForms, setAssignedForms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [responseDraft, setResponseDraft] = useState({});
  const [interpretationDrafts, setInterpretationDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [responding, setResponding] = useState(false);
  const [savingInterpretationId, setSavingInterpretationId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeView === 'create' && !isStudent) {
      setActiveView(canResolveForms ? 'assigned' : 'mine');
    }

    if (activeView === 'assigned' && !canResolveForms) {
      setActiveView(isStudent ? 'mine' : 'assigned');
    }
  }, [activeView, canResolveForms, isStudent]);

  const loadFormDetail = useCallback(
    async (id) => {
      if (!id) {
        setSelectedForm(null);
        return null;
      }

      const payload = await apiRequest(`/api/practice-forms/${id}`, { token });
      setSelectedForm(payload);
      return payload;
    },
    [token]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (isStudent) {
        const [formsPayload, enrollmentsPayload] = await Promise.all([
          apiRequest('/api/practice-forms/me', { token }),
          apiRequest('/api/enrollments/me', { token }),
        ]);

        setMyForms(Array.isArray(formsPayload) ? formsPayload : []);
        setEnrollments(
          unwrapPage(enrollmentsPayload).filter(
            (enrollment) => enrollment.status === 'APPROVED' && enrollment.courseActive !== false
          )
        );
      }

      if (canResolveForms) {
        const payload = await apiRequest('/api/practice-forms/assigned', { token });
        setAssignedForms(Array.isArray(payload) ? payload : []);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [canResolveForms, isStudent, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const questions = selectedForm?.questions || [];
    setInterpretationDrafts(
      Object.fromEntries(
        questions
          .filter((question) => question.type === 'OPEN_TEXT')
          .map((question) => [question.id, question.studentInterpretation || ''])
      )
    );
    setResponseDraft({});
  }, [selectedForm]);

  const visibleForms = activeView === 'assigned' ? assignedForms : myForms;
  const selectedIsAssigned = assignedForms.some((form) => form.id === selectedForm?.id);
  const selectedIsMine = myForms.some((form) => form.id === selectedForm?.id);
  const canRespondSelected = canResolveForms && selectedIsAssigned && selectedForm?.status === 'SENT';
  const canInterpretSelected = isStudent && selectedIsMine && selectedForm?.status === 'ANSWERED';

  const formColumns = useMemo(
    () => [
      { key: 'title', header: 'Ficha' },
      { key: 'courseName', header: 'Curso' },
      activeView === 'assigned'
        ? { key: 'studentFullName', header: 'Estudiante', render: (row) => row.studentFullName || row.student || '-' }
        : { key: 'target', header: 'Asignado a', render: (row) => row.target || targetRoleLabel(row.targetRole) },
      {
        key: 'status',
        header: 'Estado',
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'createdAt',
        header: 'Creado',
        render: (row) => formatDateTime(row.createdAt),
      },
      {
        key: 'actions',
        header: '',
        render: (row) => (
          <SecondaryButton icon={Eye} onClick={() => loadFormDetail(row.id)} type="button">
            Ver
          </SecondaryButton>
        ),
      },
    ],
    [activeView, loadFormDetail]
  );

  async function handleCreate(event) {
    event.preventDefault();

    const accepted = await confirm({
      title: 'Crear y asignar ficha',
      description: 'La ficha quedara disponible para la institucion receptora seleccionada.',
      details: draft.title || 'Ficha de practica',
      confirmLabel: 'Crear ficha',
      tone: 'warning',
    });

    if (!accepted) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = buildCreatePayload(draft);
      const created = await apiRequest('/api/practice-forms', {
        method: 'POST',
        token,
        body: payload,
      });

      setMessage('Ficha creada y asignada correctamente.');
      setDraft(emptyDraft());
      setActiveView('mine');
      await loadData();
      await loadFormDetail(created.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitAnswers(event) {
    event.preventDefault();

    if (!selectedForm) {
      return;
    }

    const accepted = await confirm({
      title: 'Enviar respuestas',
      description: 'Tus respuestas quedaran registradas para la ficha seleccionada.',
      details: selectedForm.title,
      confirmLabel: 'Enviar respuestas',
      tone: 'warning',
    });

    if (!accepted) {
      return;
    }

    setResponding(true);
    setError('');
    setMessage('');

    try {
      const payload = buildResponsePayload(selectedForm.questions || [], responseDraft);
      await apiRequest(`/api/practice-forms/${selectedForm.id}/responses`, {
        method: 'POST',
        token,
        body: payload,
      });

      setMessage('Respuesta registrada correctamente.');
      await loadData();
      await loadFormDetail(selectedForm.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResponding(false);
    }
  }

  async function handleSaveInterpretation(questionId) {
    if (!selectedForm) {
      return;
    }

    setSavingInterpretationId(questionId);
    setError('');
    setMessage('');

    try {
      await apiRequest(`/api/practice-forms/${selectedForm.id}/questions/${questionId}/interpretation`, {
        method: 'PATCH',
        token,
        body: {
          interpretation: interpretationDrafts[questionId] || '',
        },
      });

      setMessage('Interpretacion guardada.');
      await loadFormDetail(selectedForm.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingInterpretationId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Practicas"
        title="Fichas de practica"
        description="Crea fichas para la institucion receptora, registra respuestas y guarda la interpretacion del estudiante."
        action={
          <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadData} type="button">
            Actualizar
          </SecondaryButton>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <SectionCard className="print:hidden">
        <ModuleTabs>
          {[
            isStudent && ['mine', 'Mis fichas'],
            canResolveForms && ['assigned', 'Por responder'],
            isStudent && ['create', 'Crear ficha'],
          ]
            .filter(Boolean)
            .map(([id, label]) => (
              <ModuleTab
                active={activeView === id}
                key={id}
                onClick={() => setActiveView(id)}
              >
                {label}
              </ModuleTab>
            ))}
        </ModuleTabs>
      </SectionCard>

      {activeView === 'create' ? (
        <PracticeFormBuilder
          draft={draft}
          enrollments={enrollments}
          loading={loading}
          saving={saving}
          setDraft={setDraft}
          onSubmit={handleCreate}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
          <SectionCard
            className="print:hidden"
            title={activeView === 'assigned' ? 'Fichas por responder' : 'Fichas creadas'}
            description={
              activeView === 'assigned'
                ? 'Selecciona una ficha para revisar sus preguntas y responder.'
                : 'Selecciona una ficha para ver respuestas e interpretaciones.'
            }
          >
            <DataTable
              columns={formColumns}
              emptyText={loading ? 'Cargando fichas' : 'Aun no hay fichas registradas.'}
              loading={loading}
              rows={visibleForms}
            />
          </SectionCard>

          <PracticeFormDetail
            canInterpret={canInterpretSelected}
            canRespond={canRespondSelected}
            form={selectedForm}
            interpretationDrafts={interpretationDrafts}
            responseDraft={responseDraft}
            responding={responding}
            savingInterpretationId={savingInterpretationId}
            setInterpretationDrafts={setInterpretationDrafts}
            setResponseDraft={setResponseDraft}
            onPrint={() => window.print()}
            onSaveInterpretation={handleSaveInterpretation}
            onSubmitAnswers={handleSubmitAnswers}
          />
        </div>
      )}
    </>
  );
}

function PracticeFormBuilder({ draft, enrollments, loading, saving, setDraft, onSubmit }) {
  const confirm = useConfirm();
  const selectedEnrollment = enrollments.find((enrollment) => String(enrollment.id) === String(draft.enrollmentId));

  function updateDraft(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateQuestion(index, patch) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? normalizeQuestion({ ...question, ...patch }) : question
      ),
    }));
  }

  function moveQuestion(index, direction) {
    setDraft((current) => {
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
      description: 'La pregunta se retirara de la ficha en edicion.',
      details: `Pregunta ${index + 1}`,
      confirmLabel: 'Quitar pregunta',
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    setDraft((current) => ({
      ...current,
      questions:
        current.questions.length > 1
          ? current.questions.filter((_, questionIndex) => questionIndex !== index)
          : current.questions,
    }));
  }

  function addOption(questionIndex) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: [...question.options, `Opcion ${question.options.length + 1}`],
            }
          : question
      ),
    }));
  }

  function updateOption(questionIndex, optionIndex, value) {
    setDraft((current) => ({
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
      title: 'Quitar opcion',
      description: 'La opcion se retirara de la pregunta en edicion.',
      details: `Pregunta ${questionIndex + 1}`,
      confirmLabel: 'Quitar opcion',
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    setDraft((current) => ({
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
    <form className="space-y-5" onSubmit={onSubmit}>
      <SectionCard
        title="Datos de la ficha"
        description="Selecciona el curso de practica para completar la informacion necesaria."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Curso de practica aprobado">
            <Select
              disabled={loading || !enrollments.length}
              required
              value={draft.enrollmentId}
              onChange={(event) => updateDraft('enrollmentId', event.target.value)}
            >
              <option value="">Selecciona un curso aprobado</option>
              {enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {[enrollment.courseName, enrollment.educationalInstitutionName].filter(Boolean).join(' | ')}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Quien respondera">
            <Select
              required
              value={draft.targetRole}
              onChange={(event) => updateDraft('targetRole', event.target.value)}
            >
              {TARGET_ROLES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field className="lg:col-span-2" label="Titulo">
            <Input
              maxLength={160}
              required
              value={draft.title}
              onChange={(event) => updateDraft('title', event.target.value)}
            />
          </Field>

          <Field className="lg:col-span-2" label="Descripcion">
            <Textarea
              maxLength={2000}
              value={draft.description}
              onChange={(event) => updateDraft('description', event.target.value)}
            />
          </Field>
        </div>

        {selectedEnrollment && (
          <div className="mt-4 grid gap-3 rounded-lg border border-[#c8d2cd] bg-[#eef3f2] p-3 text-sm text-[#34443b] dark:border-slate-700 dark:bg-surface-soft dark:text-slate-200 md:grid-cols-2">
            <InfoLine label="Curso" value={selectedEnrollment.courseName} />
            <InfoLine label="Institucion" value={selectedEnrollment.educationalInstitutionName} />
            <InfoLine label="Tutor institucional" value={selectedEnrollment.institutionalTutor} />
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
              setDraft((current) => ({
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
                  <p className="font-black text-zinc-900 dark:text-slate-50">Pregunta {index + 1}</p>
                  <p className="text-xs font-bold uppercase text-zinc-500 dark:text-slate-400">{questionTypeLabel(question.type)}</p>
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
                      <p className="mb-0 text-[0.82rem] font-extrabold text-[#34443b] dark:text-slate-300">Opciones</p>
                      <SecondaryButton icon={Plus} onClick={() => addOption(index)} type="button">
                        Agregar opcion
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
                            title="Quitar opcion"
                            type="button"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === 'SCALE' && (
                  <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
                    <Field label="Minimo">
                      <Input
                        max="100"
                        min="0"
                        required
                        type="number"
                        value={question.scaleMin}
                        onChange={(event) => updateQuestion(index, { scaleMin: event.target.value })}
                      />
                    </Field>
                    <Field label="Maximo">
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
        <PrimaryButton icon={Send} loading={saving} type="submit">
          Crear y asignar
        </PrimaryButton>
      </ActionBar>
    </form>
  );
}

function PracticeFormDetail({
  canInterpret,
  canRespond,
  form,
  interpretationDrafts,
  responseDraft,
  responding,
  savingInterpretationId,
  setInterpretationDrafts,
  setResponseDraft,
  onPrint,
  onSaveInterpretation,
  onSubmitAnswers,
}) {
  if (!form) {
    return (
      <SectionCard title="Detalle">
        <EmptyState text="Selecciona una ficha para ver el detalle." />
      </SectionCard>
    );
  }

  const questions = form.questions || [];

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
      title="Detalle de la ficha"
      action={
        <ActionBar>
          <SecondaryButton className="print:hidden" icon={Printer} onClick={onPrint} type="button">
            Imprimir
          </SecondaryButton>
        </ActionBar>
      }
    >
      <form onSubmit={onSubmitAnswers}>
        <div className="space-y-5 print:text-[11pt] print:text-[#111827]">
          <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs font-extrabold uppercase leading-tight tracking-normal text-primary dark:text-sky-200">Ficha de practica</p>
              <h2 className="text-2xl font-black leading-tight text-zinc-950 dark:text-slate-50">{form.title}</h2>
              {form.description && <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-slate-300">{form.description}</p>}
            </div>
            <StatusBadge status={form.status} />
          </header>

          <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-slate-700 dark:bg-surface-soft md:grid-cols-2">
            <InfoLine label="Curso" value={form.courseName} />
            <InfoLine label="Estudiante" value={form.studentFullName || form.student} />
            <InfoLine label="Institucion" value={form.educationalInstitutionName} />
            <InfoLine label="Asignado a" value={form.target || targetRoleLabel(form.targetRole)} />
            <InfoLine label="Creado" value={formatDateTime(form.createdAt)} />
            <InfoLine label="Respondido" value={formatDateTime(form.answeredAt)} />
            {form.response?.respondent && <InfoLine label="Respondido por" value={form.response.respondent} />}
          </div>

          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionDetail
                canInterpret={canInterpret}
                canRespond={canRespond}
                interpretation={interpretationDrafts[question.id] || ''}
                key={question.id}
                question={question}
                responseValue={responseDraft[question.id] || {}}
                savingInterpretation={savingInterpretationId === question.id}
                setAnswer={setAnswer}
                setInterpretationDrafts={setInterpretationDrafts}
                toggleOption={toggleOption}
                onSaveInterpretation={onSaveInterpretation}
              />
            ))}
          </div>
        </div>

        {canRespond && (
          <ActionBar>
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
  toggleOption,
  onSaveInterpretation,
}) {
  return (
    <article className={printableQuestionClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-zinc-500 dark:text-slate-400">
            Pregunta {question.order} | {questionTypeLabel(question.type)}
          </p>
          <h3 className="mt-1 text-base font-black text-zinc-950 dark:text-slate-50">{question.prompt}</h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-extrabold leading-none text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
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

      {question.answer && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3 dark:border-slate-700 dark:bg-[#111827]">
          <p className="mb-1.5 text-[0.82rem] font-extrabold text-[#34443b] dark:text-slate-300">Respuesta</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-slate-100">{formatAnswer(question)}</p>
        </div>
      )}

      {question.tabulable && question.tabulation && <Tabulation question={question} />}

      {question.type === 'OPEN_TEXT' && question.answer && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-slate-700 dark:bg-surface-soft">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="mb-0 text-[0.82rem] font-extrabold text-[#34443b] dark:text-slate-300">Interpretacion del estudiante</p>
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
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-slate-200">
              {question.studentInterpretation || 'Sin interpretacion registrada'}
            </p>
          )}
          {canInterpret && (
            <p className="hidden whitespace-pre-wrap text-sm leading-6 text-zinc-700 print:block">
              {interpretation || 'Sin interpretacion registrada'}
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
          <option value="true">Si</option>
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
    <Field label="Respuesta numerica">
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

function Tabulation({ question }) {
  const counts = Object.entries(question.tabulation?.counts || {});
  const numericCount = question.tabulation?.numericCount || 0;
  const hasNumericStats = ['SCALE', 'NUMBER'].includes(question.type) && numericCount > 0;

  if (!counts.length && !hasNumericStats) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-[#c8d2cd] bg-white p-3 dark:border-slate-700 dark:bg-surface">
      <p className="mb-1.5 text-[0.82rem] font-extrabold text-[#34443b] dark:text-slate-300">Tabulacion</p>
      {counts.length > 0 && (
        <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-[#dbe3ed] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.055)] dark:border-slate-700 dark:bg-surface">
          <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
              <thead className="bg-[#d7e4e9] text-left text-xs font-extrabold uppercase text-[#475569] dark:bg-[#172033] dark:text-slate-300">
                <tr>
                  <th className="border-b border-[#dbe3ed] px-4 py-3 dark:border-slate-700">Valor</th>
                  <th className="border-b border-[#dbe3ed] px-4 py-3 dark:border-slate-700">Frecuencia</th>
                </tr>
              </thead>
              <tbody>
                {counts.map(([label, count]) => (
                  <tr className="even:bg-[#e6efea] hover:bg-[#dbe8ed] dark:even:bg-slate-950/40 dark:hover:bg-sky-300/10" key={label}>
                    <td className="border-b border-[#edf2f7] px-4 py-3 text-[#263241] dark:border-slate-800 dark:text-ink">{label}</td>
                    <td className="border-b border-[#edf2f7] px-4 py-3 text-[#263241] dark:border-slate-800 dark:text-ink">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {hasNumericStats && (
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <InfoLine label="Respuestas" value={numericCount} />
          <InfoLine label="Promedio" value={question.tabulation.numericAverage} />
          <InfoLine label="Minimo" value={question.tabulation.numericMin} />
          <InfoLine label="Maximo" value={question.tabulation.numericMax} />
        </div>
      )}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 font-semibold text-[#20282d] dark:text-slate-50">{value || '-'}</p>
    </div>
  );
}

function normalizeQuestion(question) {
  if (CHOICE_TYPES.has(question.type) && (!question.options || question.options.length < 2)) {
    return {
      ...question,
      options: ['Opcion 1', 'Opcion 2'],
    };
  }

  if (question.type === 'SCALE') {
    return {
      ...question,
      scaleMin: question.scaleMin || 1,
      scaleMax: question.scaleMax || 5,
    };
  }

  return question;
}

function buildCreatePayload(draft) {
  if (!draft.enrollmentId) {
    throw new Error('Selecciona un curso de practica aprobado.');
  }

  if (!draft.title.trim()) {
    throw new Error('El titulo de la ficha es obligatorio.');
  }

  const questions = draft.questions.map((question, index) => {
    const prompt = question.prompt.trim();

    if (!prompt) {
      throw new Error(`La pregunta ${index + 1} no puede estar vacia.`);
    }

    if (CHOICE_TYPES.has(question.type)) {
      const options = question.options.map((option) => option.trim()).filter(Boolean);

      if (new Set(options).size !== options.length) {
        throw new Error(`La pregunta ${index + 1} tiene opciones repetidas.`);
      }

      if (options.length < 2) {
        throw new Error(`La pregunta ${index + 1} debe tener al menos dos opciones.`);
      }

      return {
        type: question.type,
        prompt,
        required: question.required,
        options: options.map((label) => ({ label })),
      };
    }

    if (question.type === 'SCALE') {
      const scaleMin = Number(question.scaleMin);
      const scaleMax = Number(question.scaleMax);

      if (!Number.isFinite(scaleMin) || !Number.isFinite(scaleMax) || scaleMin >= scaleMax) {
        throw new Error(`La escala de la pregunta ${index + 1} no es valida.`);
      }

      return {
        type: question.type,
        prompt,
        required: question.required,
        scaleMin,
        scaleMax,
      };
    }

    return {
      type: question.type,
      prompt,
      required: question.required,
    };
  });

  return {
    enrollmentId: Number(draft.enrollmentId),
    targetRole: draft.targetRole,
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    questions,
  };
}

function buildResponsePayload(questions, responseDraft) {
  const answers = [];

  questions.forEach((question) => {
    const value = responseDraft[question.id] || {};

    if (question.type === 'OPEN_TEXT') {
      const textAnswer = (value.textAnswer || '').trim();
      if (textAnswer) {
        answers.push({ questionId: question.id, textAnswer });
      } else if (question.required) {
        throw new Error(`Responde la pregunta ${question.order}.`);
      }
      return;
    }

    if (question.type === 'YES_NO') {
      if (value.booleanAnswer === 'true' || value.booleanAnswer === 'false') {
        answers.push({ questionId: question.id, booleanAnswer: value.booleanAnswer === 'true' });
      } else if (question.required) {
        throw new Error(`Responde la pregunta ${question.order}.`);
      }
      return;
    }

    if (question.type === 'SCALE' || question.type === 'NUMBER') {
      if (value.numberAnswer !== undefined && value.numberAnswer !== null && value.numberAnswer !== '') {
        answers.push({ questionId: question.id, numberAnswer: Number(value.numberAnswer) });
      } else if (question.required) {
        throw new Error(`Responde la pregunta ${question.order}.`);
      }
      return;
    }

    const selectedOptions = value.selectedOptions || [];
    if (selectedOptions.length) {
      answers.push({ questionId: question.id, selectedOptions });
    } else if (question.required) {
      throw new Error(`Responde la pregunta ${question.order}.`);
    }
  });

  if (!answers.length) {
    throw new Error('Debes responder al menos una pregunta.');
  }

  return { answers };
}

function formatAnswer(question) {
  const answer = question.answer || {};

  if (question.type === 'OPEN_TEXT') {
    return answer.textAnswer || '-';
  }

  if (question.type === 'YES_NO') {
    return answer.booleanAnswer ? 'Si' : 'No';
  }

  if (question.type === 'SCALE' || question.type === 'NUMBER') {
    return answer.numberAnswer ?? '-';
  }

  return (answer.selectedOptions || []).join(', ') || '-';
}

function scaleValues(question) {
  const min = Number(question.scaleMin);
  const max = Number(question.scaleMax);

  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    return [];
  }

  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

function questionTypeLabel(type) {
  return QUESTION_TYPES.find(([value]) => value === type)?.[1] || formatEnum(type);
}

function targetRoleLabel(role) {
  return TARGET_ROLES.find(([value]) => value === role)?.[1] || formatEnum(role);
}
