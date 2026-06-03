import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
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
  ['STUDENT_SELF', 'Estudiante'],
];

const FORM_MODES = {
  interviews: {
    eyebrow: 'Practicas',
    title: 'Entrevistas',
    description: 'Crea entrevistas para la institucion receptora, registra respuestas y guarda la interpretacion del estudiante.',
    singular: 'entrevista',
    plural: 'entrevistas',
    mineTab: 'Mis entrevistas',
    createTab: 'Crear entrevista',
    createdTitle: 'Entrevistas creadas',
    assignedTitle: 'Entrevistas por responder',
    emptyText: 'Aun no hay entrevistas registradas.',
    createEndpoint: '/api/practice-forms',
    listEndpoint: '/api/practice-forms/me',
    managedEndpoint: '/api/practice-forms/managed',
    showAssigned: true,
    selfAnswered: false,
  },
  observations: {
    eyebrow: 'Practicas',
    title: 'Fichas de observación',
    description: 'Crea y responde fichas de observación para registrar información directamente desde tu práctica.',
    singular: 'ficha de observación',
    plural: 'fichas de observación',
    mineTab: 'Mis fichas',
    createTab: 'Crear ficha',
    createdTitle: 'Fichas de observación creadas',
    assignedTitle: '',
    emptyText: 'Aun no hay fichas de observación registradas.',
    createEndpoint: '/api/practice-forms/observations',
    listEndpoint: '/api/practice-forms/observations/me',
    managedEndpoint: '/api/practice-forms/observations/managed',
    showAssigned: false,
    selfAnswered: true,
  },
};

const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE']);
const choiceLabelClass = 'inline-flex min-h-[2.45rem] cursor-pointer items-center gap-2 rounded-lg border border-field-border bg-panel px-3 py-2 text-sm font-[850] text-body transition-colors hover:bg-field-hover dark:border-line dark:bg-surface dark:text-ink dark:hover:bg-hover-soft';
const questionEditorCardClass = 'overflow-hidden rounded-lg border border-border bg-panel shadow-card dark:border-line dark:bg-surface';
const questionEditorHeaderClass = 'flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-field px-4 py-3 dark:border-line dark:bg-surface-soft';
const printableQuestionClass = 'rounded-lg border border-border bg-panel p-4 dark:border-line dark:bg-surface practice-form-print-question print:break-inside-avoid print:[page-break-inside:avoid] print:bg-panel print:shadow-none';

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

function emptyDraft(mode = 'interviews') {
  return {
    enrollmentId: '',
    targetRole: mode === 'observations' ? 'STUDENT_SELF' : 'INSTITUTIONAL_TUTOR',
    title: '',
    description: '',
    questions: [newQuestion()],
  };
}

function formToDraft(form, mode = 'interviews') {
  return {
    enrollmentId: form?.enrollmentId ? String(form.enrollmentId) : '',
    targetRole: form?.targetRole || (mode === 'observations' ? 'STUDENT_SELF' : 'INSTITUTIONAL_TUTOR'),
    title: form?.title || '',
    description: form?.description || '',
    questions: (form?.questions || []).map((question) =>
      normalizeQuestion({
        key: question.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: question.type || 'OPEN_TEXT',
        prompt: question.prompt || '',
        required: question.required !== false,
        scaleMin: question.scaleMin || 1,
        scaleMax: question.scaleMax || 5,
        options: (question.options || []).map((option) => option.label).filter(Boolean),
      })
    ),
  };
}

export function PracticeFormsPage({ mode = 'interviews' }) {
  const { token, roles } = useAuth();
  const confirm = useConfirm();
  const config = FORM_MODES[mode] || FORM_MODES.interviews;
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const canResolveAssigned =
    config.showAssigned &&
    (roles.includes('ROLE_TUTOR_INSTITUCIONAL') || roles.includes('ROLE_DIRECTORA_INSTITUCION'));
  const canReviewManaged =
    roles.includes('ROLE_TUTOR_PRACTICAS') ||
    roles.includes('ROLE_DIRECTOR_PRACTICAS') ||
    roles.includes('ROLE_ADMIN');
  const [activeView, setActiveView] = useState(
    isStudent ? 'mine' : canResolveAssigned ? 'assigned' : 'managed'
  );
  const [myForms, setMyForms] = useState([]);
  const [assignedForms, setAssignedForms] = useState([]);
  const [managedForms, setManagedForms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  const [draft, setDraft] = useState(() => emptyDraft(mode));
  const [responseDraft, setResponseDraft] = useState({});
  const [interpretationDrafts, setInterpretationDrafts] = useState({});
  const [detailView, setDetailView] = useState('view');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingDraft, setSendingDraft] = useState(false);
  const [responding, setResponding] = useState(false);
  const [savingResponseDraft, setSavingResponseDraft] = useState(false);
  const [savingInterpretationId, setSavingInterpretationId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeView === 'create' && !isStudent) {
      setActiveView(canResolveAssigned ? 'assigned' : canReviewManaged ? 'managed' : 'mine');
    }

    if (activeView === 'assigned' && !canResolveAssigned) {
      setActiveView(isStudent ? 'mine' : canReviewManaged ? 'managed' : 'mine');
    }

    if (activeView === 'managed' && !canReviewManaged) {
      setActiveView(isStudent ? 'mine' : canResolveAssigned ? 'assigned' : 'mine');
    }
  }, [activeView, canResolveAssigned, canReviewManaged, isStudent]);

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
          apiRequest(config.listEndpoint, { token }),
          apiRequest('/api/enrollments/me', { token }),
        ]);

        setMyForms(Array.isArray(formsPayload) ? formsPayload : []);
        setEnrollments(
          unwrapPage(enrollmentsPayload).filter(isApprovedEnrollment)
        );
      }

      if (canResolveAssigned) {
        const payload = await apiRequest('/api/practice-forms/assigned', { token });
        setAssignedForms(Array.isArray(payload) ? payload : []);
      }

      if (canReviewManaged) {
        const payload = await apiRequest(config.managedEndpoint, { token });
        setManagedForms(Array.isArray(payload) ? payload : []);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [canResolveAssigned, canReviewManaged, config.listEndpoint, config.managedEndpoint, isStudent, token]);

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
    setResponseDraft(responseDraftFromQuestions(questions));
    setDetailView('view');
  }, [selectedForm]);

  const visibleForms = activeView === 'assigned' ? assignedForms : activeView === 'managed' ? managedForms : myForms;
  const selectedIsAssigned = assignedForms.some((form) => form.id === selectedForm?.id);
  const selectedIsManaged = managedForms.some((form) => form.id === selectedForm?.id);
  const selectedIsMine = myForms.some((form) => form.id === selectedForm?.id);
  const canRespondSelected =
    selectedForm?.status === 'SENT' &&
    ((canResolveAssigned && selectedIsAssigned) ||
      (config.selfAnswered && isStudent && selectedIsMine));
  const canInterpretSelected = isStudent && selectedIsMine && selectedForm?.status === 'ANSWERED';
  const canEditDraftSelected = isStudent && selectedIsMine && selectedForm?.status === 'DRAFT';

  const formColumns = [
    { key: 'title', header: config.singular[0].toUpperCase() + config.singular.slice(1) },
    { key: 'courseName', header: 'Paralelo' },
    activeView === 'assigned'
      ? { key: 'studentFullName', header: 'Estudiante', render: (row) => row.studentFullName || row.student || '-' }
      : activeView === 'managed'
        ? { key: 'studentFullName', header: 'Estudiante', render: (row) => row.studentFullName || row.student || '-' }
      : config.selfAnswered
        ? { key: 'target', header: 'Respondida por', render: () => 'Estudiante' }
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
        <ActionBar>
          <SecondaryButton icon={Eye} onClick={() => loadFormDetail(row.id)} type="button">
            Ver
          </SecondaryButton>
          {isStudent && activeView === 'mine' && row.status === 'DRAFT' && (
            <SecondaryButton icon={Save} onClick={() => handleEditDraft(row)} type="button">
              Editar
            </SecondaryButton>
          )}
        </ActionBar>
      ),
    },
  ];

  async function persistDraft(nextDraft, asDraft) {
    const payload = {
      ...buildCreatePayload(nextDraft, config),
      draft: asDraft,
    };

    if (editingForm?.id) {
      const updated = await apiRequest(`/api/practice-forms/${editingForm.id}`, {
        method: 'PUT',
        token,
        body: { ...payload, draft: true },
      });

      if (!asDraft) {
        return apiRequest(`/api/practice-forms/${editingForm.id}/send`, {
          method: 'POST',
          token,
        });
      }

      return updated;
    }

    return apiRequest(config.createEndpoint, {
      method: 'POST',
      token,
      body: payload,
    });
  }

  async function handleSaveDraft(event) {
    event.preventDefault();

    const accepted = await confirm({
      title: `Guardar borrador`,
      description: `La ${config.singular} quedara privada y podras editarla antes de enviarla.`,
      details: draft.title || config.singular,
      confirmLabel: 'Guardar borrador',
      tone: 'warning',
    });

    if (!accepted) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const saved = await persistDraft(draft, true);

      setMessage('Borrador guardado correctamente.');
      setEditingForm(saved);
      setDraft(emptyDraft(mode));
      setActiveView('mine');
      await loadData();
      await loadFormDetail(saved.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendForm(event) {
    event.preventDefault();

    const accepted = await confirm({
      title: editingForm?.id ? `Enviar borrador` : `Crear y enviar ${config.singular}`,
      description: config.selfAnswered
        ? 'La ficha quedara lista para registrar respuestas.'
        : 'La entrevista quedara disponible para la persona asignada.',
      details: draft.title || config.singular,
      confirmLabel: 'Enviar',
      tone: 'warning',
    });

    if (!accepted) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const sent = await persistDraft(draft, false);

      setMessage(config.selfAnswered ? 'Ficha enviada correctamente.' : 'Entrevista enviada correctamente.');
      setEditingForm(null);
      setDraft(emptyDraft(mode));
      setActiveView('mine');
      await loadData();
      await loadFormDetail(sent.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditDraft(form) {
    if (!form?.id) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const detail = await loadFormDetail(form.id);
      setEditingForm(detail);
      setDraft(formToDraft(detail, mode));
      setActiveView('create');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleNewDraft() {
    setEditingForm(null);
    setDraft(emptyDraft(mode));
    setSelectedForm(null);
    setActiveView('create');
  }

  async function handleSendSelectedDraft() {
    if (!selectedForm?.id) return;

    const accepted = await confirm({
      title: 'Enviar borrador',
      description: `La ${config.singular} dejara de ser editable y pasara al flujo de respuesta.`,
      details: selectedForm.title,
      confirmLabel: 'Enviar',
      tone: 'warning',
    });

    if (!accepted) return;

    setSendingDraft(true);
    setError('');
    setMessage('');

    try {
      const sent = await apiRequest(`/api/practice-forms/${selectedForm.id}/send`, {
        method: 'POST',
        token,
      });

      setMessage(`${config.singular[0].toUpperCase() + config.singular.slice(1)} enviada correctamente.`);
      await loadData();
      setSelectedForm(sent);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSendingDraft(false);
    }
  }

  async function handleDuplicate(form) {
    if (!form?.id) return;

    const accepted = await confirm({
      title: `Duplicar ${config.singular}`,
      description: 'Se copiara la estructura de preguntas, sin copiar respuestas.',
      details: form.title,
      confirmLabel: 'Duplicar',
      tone: 'warning',
    });

    if (!accepted) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const duplicated = await apiRequest(`/api/practice-forms/${form.id}/duplicate`, {
        method: 'POST',
        token,
      });

      setMessage(`${config.singular[0].toUpperCase() + config.singular.slice(1)} duplicada correctamente.`);
      await loadData();
      await loadFormDetail(duplicated.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function persistResponseDraft(asDraft) {
    if (!selectedForm) {
      return null;
    }

    const payload = buildResponsePayload(selectedForm.questions || [], responseDraft, asDraft);

    return apiRequest(`/api/practice-forms/${selectedForm.id}/responses`, {
      method: 'POST',
      token,
      body: {
        ...payload,
        draft: asDraft,
      },
    });
  }

  async function handleSaveResponseDraft() {
    setSavingResponseDraft(true);
    setError('');
    setMessage('');

    try {
      const saved = await persistResponseDraft(true);

      setMessage('Borrador de respuestas guardado.');
      await loadData();
      if (saved?.id) {
        await loadFormDetail(saved.id);
        setDetailView('respond');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingResponseDraft(false);
    }
  }

  async function handleSubmitAnswers(event) {
    event.preventDefault();

    if (!selectedForm) {
      return;
    }

    const accepted = await confirm({
      title: 'Enviar respuestas',
      description: 'Tus respuestas quedaran registradas para la entrevista seleccionada.',
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
      await persistResponseDraft(false);

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
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
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
            isStudent && ['mine', config.mineTab],
            canResolveAssigned && ['assigned', 'Por responder'],
            canReviewManaged && ['managed', 'Respondidas'],
            isStudent && ['create', config.createTab],
          ]
            .filter(Boolean)
            .map(([id, label]) => (
              <ModuleTab
                active={activeView === id}
                key={id}
                onClick={() => (id === 'create' ? handleNewDraft() : setActiveView(id))}
              >
                {label}
              </ModuleTab>
            ))}
        </ModuleTabs>
      </SectionCard>

      {activeView === 'create' ? (
          <PracticeFormBuilder
            draft={draft}
            editing={Boolean(editingForm)}
            enrollments={enrollments}
            mode={mode}
            loading={loading}
            saving={saving}
            setDraft={setDraft}
            config={config}
            onSaveDraft={handleSaveDraft}
            onSend={handleSendForm}
          />
      ) : (
        <div className="grid grid-cols-1 gap-5">
          <SectionCard
            className="print:hidden"
            title={
              activeView === 'assigned'
                ? config.assignedTitle
                : activeView === 'managed'
                  ? `${config.plural[0].toUpperCase() + config.plural.slice(1)} respondidas`
                  : config.createdTitle
            }
            description={
              activeView === 'assigned'
                ? `Selecciona una ${config.singular} para revisar sus preguntas y responder.`
                : activeView === 'managed'
                  ? `Selecciona una ${config.singular} respondida para revisar sus respuestas.`
                : `Selecciona una ${config.singular} para ver respuestas e interpretaciones.`
            }
          >
            <DataTable
              columns={formColumns}
              emptyText={loading ? `Cargando ${config.plural}` : config.emptyText}
              loading={loading}
              rows={visibleForms}
            />
          </SectionCard>

          <PracticeFormDetail
            canInterpret={canInterpretSelected}
            canRespond={canRespondSelected}
            canDuplicate={isStudent && selectedIsMine}
            canEditDraft={canEditDraftSelected}
            canReview={selectedIsManaged}
            config={config}
            detailView={detailView}
            form={selectedForm}
            interpretationDrafts={interpretationDrafts}
            responseDraft={responseDraft}
            responding={responding}
            savingResponseDraft={savingResponseDraft}
            sendingDraft={sendingDraft}
            savingInterpretationId={savingInterpretationId}
            setInterpretationDrafts={setInterpretationDrafts}
            setDetailView={setDetailView}
            setResponseDraft={setResponseDraft}
            onEditDraft={handleEditDraft}
            onPrint={() => window.print()}
            onDuplicate={handleDuplicate}
            onSendDraft={handleSendSelectedDraft}
            onSaveResponseDraft={handleSaveResponseDraft}
            onSaveInterpretation={handleSaveInterpretation}
            onSubmitAnswers={handleSubmitAnswers}
          />
        </div>
      )}
    </>
  );
}

export function ObservationFormsPage() {
  return <PracticeFormsPage mode="observations" />;
}

function PracticeFormBuilder({
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
}) {
  const confirm = useConfirm();
  const selectedEnrollment = enrollments.find((enrollment) => String(enrollment.id) === String(draft.enrollmentId));
  const defaultEnrollment = useMemo(() => resolveDefaultEnrollment(enrollments), [enrollments]);
  const targetOptions = useMemo(
    () => (mode === 'observations' ? [{ value: 'STUDENT_SELF', label: 'Estudiante', disabled: false }] : targetOptionsForEnrollment(selectedEnrollment)),
    [mode, selectedEnrollment],
  );

  useEffect(() => {
    if (!defaultEnrollment) {
      return;
    }

    setDraft((current) => {
      const selectedStillValid = enrollments.some((enrollment) => String(enrollment.id) === String(current.enrollmentId));
      const nextEnrollmentId = selectedStillValid ? current.enrollmentId : String(defaultEnrollment.id);
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
  }, [defaultEnrollment, enrollments, mode, setDraft]);

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
      description: 'La pregunta se retirara de la entrevista en edicion.',
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
    <form className="space-y-5" onSubmit={onSaveDraft}>
      <SectionCard
        title={`${editing ? 'Editar' : 'Datos de la'} ${config.singular}`}
        description="La pertenencia academica y de practica se toma de tu inscripcion aprobada."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Paralelo de practica aprobado">
            <Input
              disabled
              value={
                selectedEnrollment
                  ? [selectedEnrollment.courseName, selectedEnrollment.educationalInstitutionName].filter(Boolean).join(' | ')
                  : loading
                    ? 'Cargando inscripcion aprobada'
                    : 'No se encontro una inscripcion aprobada'
              }
            />
          </Field>

          {mode === 'observations' ? (
            <Field label="Quien respondera">
              <Input disabled value="Estudiante" />
            </Field>
          ) : (
            <Field label="Quien respondera">
              <Select
                disabled={!selectedEnrollment}
                required
                value={draft.targetRole}
                onChange={(event) => updateDraft('targetRole', event.target.value)}
              >
                {targetOptions.map(({ disabled, label, value }) => (
                  <option disabled={disabled} key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

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
          <div className="mt-4 grid gap-3 rounded-lg border border-line bg-panel-soft p-3 text-sm text-body dark:border-line dark:bg-surface-soft dark:text-body md:grid-cols-2">
            <InfoLine label="Paralelo" value={selectedEnrollment.courseName} />
            <InfoLine label="Institucion" value={selectedEnrollment.educationalInstitutionName} />
            <InfoLine label="Tutor institucional" value={selectedEnrollment.institutionalTutor} />
            <InfoLine
              fallback="Sin directora asignada"
              label="Directora de institucion"
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
                  <p className="font-black text-heading dark:text-heading">Pregunta {index + 1}</p>
                  <p className="text-xs font-bold uppercase text-muted dark:text-muted">{questionTypeLabel(question.type)}</p>
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
                      <p className="mb-0 text-[0.82rem] font-extrabold text-body dark:text-muted">Opciones</p>
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
        <SecondaryButton icon={Save} loading={saving} type="submit">
          Guardar borrador
        </SecondaryButton>
        <PrimaryButton icon={Send} loading={saving} type="button" onClick={onSend}>
          Enviar
        </PrimaryButton>
      </ActionBar>
    </form>
  );
}

function PracticeFormDetail({
  canDuplicate,
  canEditDraft,
  canInterpret,
  canRespond,
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
  const hasInterpretationQuestions = questions.some((question) => question.type === 'OPEN_TEXT' && question.answer);
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
              <p className="text-xs font-extrabold uppercase leading-tight tracking-normal text-primary dark:text-info-strong print:text-[10pt] print:text-table-ink">
                {config.singular}
              </p>
              <h2 className="text-2xl font-black leading-tight text-heading dark:text-heading print:text-[18pt] print:uppercase print:text-table-ink">{form.title}</h2>
              {form.description && <p className="mt-2 text-sm leading-6 text-muted dark:text-muted">{form.description}</p>}
            </div>
            <span className="print:hidden">
              <StatusBadge status={form.status} />
            </span>
          </header>

          <div className="practice-form-print-meta grid gap-3 rounded-lg border border-line bg-panel-soft p-3 text-sm dark:border-line dark:bg-surface-soft md:grid-cols-2 print:grid-cols-2 print:gap-0 print:rounded-none print:border-black print:bg-panel print:p-0">
            <InfoLine label="Paralelo" value={form.courseName} />
            <InfoLine label="Estudiante" value={form.studentFullName || form.student} />
            <InfoLine label="Institucion" value={form.educationalInstitutionName} />
            <InfoLine label={config.selfAnswered ? 'Respondida por' : 'Asignado a'} value={form.target || targetRoleLabel(form.targetRole)} />
            <InfoLine label="Estado" value={formatEnum(form.status)} />
            <InfoLine label="Creado" value={formatDateTime(form.createdAt)} />
            <InfoLine label="Respondido" value={formatDateTime(form.answeredAt)} />
            {form.response?.respondent && <InfoLine label="Respondido por" value={form.response.respondent} />}
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
            <EmptyState text="No hay respuestas abiertas para interpretar." />
          ) : (
            <div className="space-y-4">
              {questions
                .filter((question) => activeDetailView !== 'interpretation' || (question.type === 'OPEN_TEXT' && question.answer))
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
                    showTabulation={activeDetailView === 'view'}
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
          <p className="text-xs font-black uppercase text-muted dark:text-muted">
            Pregunta {question.order} | {questionTypeLabel(question.type)}
          </p>
          <h3 className="mt-1 text-base font-black text-heading dark:text-heading">{question.prompt}</h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-line bg-panel-soft px-2.5 py-1 text-xs font-extrabold leading-none text-muted dark:border-line dark:bg-surface-soft dark:text-muted print:hidden">
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
          <p className="mb-1.5 text-[0.82rem] font-extrabold text-body dark:text-muted">Respuesta</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-heading dark:text-heading">{formatAnswer(question)}</p>
        </div>
      )}

      {showTabulation && question.tabulable && question.tabulation && <Tabulation question={question} />}

      {showInterpretation && question.type === 'OPEN_TEXT' && question.answer && (
        <div className="practice-form-print-answer mt-4 rounded-lg border border-line bg-panel-soft p-3 dark:border-line dark:bg-surface-soft">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="mb-0 text-[0.82rem] font-extrabold text-body dark:text-muted">Interpretacion del estudiante</p>
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
            <p className="whitespace-pre-wrap text-sm leading-6 text-body dark:text-body">
              {question.studentInterpretation || 'Sin interpretacion registrada'}
            </p>
          )}
          {canInterpret && (
            <p className="hidden whitespace-pre-wrap text-sm leading-6 text-body print:block">
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
    <div className="mt-4 rounded-lg border border-line bg-panel p-3 dark:border-line dark:bg-surface">
      <p className="mb-1.5 text-[0.82rem] font-extrabold text-body dark:text-muted">Tabulacion</p>
      {counts.length > 0 && (
        <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-line bg-panel shadow-card dark:border-line dark:bg-surface">
          <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
              <thead className="bg-primary-soft text-left text-xs font-extrabold uppercase text-muted dark:bg-surface-soft dark:text-muted">
                <tr>
                  <th className="border-b border-line px-4 py-3 dark:border-line">Valor</th>
                  <th className="border-b border-line px-4 py-3 dark:border-line">Frecuencia</th>
                </tr>
              </thead>
              <tbody>
                {counts.map(([label, count]) => (
                  <tr className="even:bg-panel-soft hover:bg-primary-soft dark:even:bg-page/40 dark:hover:bg-info-soft" key={label}>
                    <td className="border-b border-line-soft px-4 py-3 text-body dark:border-line dark:text-ink">{label}</td>
                    <td className="border-b border-line-soft px-4 py-3 text-body dark:border-line dark:text-ink">{count}</td>
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

function InfoLine({ fallback = '-', label, value }) {
  return (
    <div className="practice-form-print-info-line">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 font-semibold text-heading dark:text-heading">{value || fallback}</p>
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

function buildCreatePayload(draft, config = FORM_MODES.interviews) {
  if (!draft.enrollmentId) {
    throw new Error(`No se encontro una inscripcion aprobada para crear la ${config.singular}.`);
  }

  if (!draft.title.trim()) {
    throw new Error(`El titulo de la ${config.singular} es obligatorio.`);
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

function resolveDefaultEnrollment(enrollments) {
  const ranked = [...(enrollments || [])].sort((left, right) => enrollmentScore(right) - enrollmentScore(left));

  return ranked[0] || null;
}

function isApprovedEnrollment(enrollment) {
  const status = String(enrollment?.status || '').toUpperCase();

  return status === 'APPROVED' || status === 'APROBADA' || status === 'APROBADO';
}

function enrollmentScore(enrollment) {
  if (!enrollment) {
    return 0;
  }

  const completenessScore = [
    enrollment.groupName,
    enrollment.educationalInstitutionName,
    enrollment.institutionalTutor,
    enrollment.institutionDirector,
    enrollment.practiceTutor,
  ].filter(Boolean).length * 10;
  const dateScore = enrollment.enrolledAt ? new Date(enrollment.enrolledAt).getTime() / 1000000000000 : 0;

  return completenessScore + dateScore;
}

function targetOptionsForEnrollment(enrollment) {
  return [
    {
      value: 'INSTITUTIONAL_TUTOR',
      label: enrollment?.institutionalTutor
        ? `Tutor institucional: ${enrollment.institutionalTutor}`
        : 'Tutor institucional no asignado',
      disabled: !enrollment?.institutionalTutor,
    },
    {
      value: 'INSTITUTION_DIRECTOR',
      label: enrollment?.institutionDirector
        ? `Directora de la institucion: ${enrollment.institutionDirector}`
        : 'Directora de la institucion no asignada',
      disabled: !enrollment?.institutionDirector,
    },
  ];
}

function responseDraftFromQuestions(questions) {
  return Object.fromEntries(
    (questions || [])
      .filter((question) => question.answer)
      .map((question) => {
        const answer = question.answer || {};

        if (question.type === 'OPEN_TEXT') {
          return [question.id, { textAnswer: answer.textAnswer || '' }];
        }

        if (question.type === 'YES_NO') {
          return [
            question.id,
            {
              booleanAnswer:
                answer.booleanAnswer === true ? 'true' : answer.booleanAnswer === false ? 'false' : '',
            },
          ];
        }

        if (question.type === 'SCALE' || question.type === 'NUMBER') {
          return [question.id, { numberAnswer: answer.numberAnswer ?? '' }];
        }

        return [question.id, { selectedOptions: answer.selectedOptions || [] }];
      })
  );
}

function buildResponsePayload(questions, responseDraft, draft = false) {
  const answers = [];

  questions.forEach((question) => {
    const value = responseDraft[question.id] || {};

    if (question.type === 'OPEN_TEXT') {
      const textAnswer = (value.textAnswer || '').trim();
      if (textAnswer) {
        answers.push({ questionId: question.id, textAnswer });
      } else if (!draft && question.required) {
        throw new Error(`Responde la pregunta ${question.order}.`);
      }
      return;
    }

    if (question.type === 'YES_NO') {
      if (value.booleanAnswer === 'true' || value.booleanAnswer === 'false') {
        answers.push({ questionId: question.id, booleanAnswer: value.booleanAnswer === 'true' });
      } else if (!draft && question.required) {
        throw new Error(`Responde la pregunta ${question.order}.`);
      }
      return;
    }

    if (question.type === 'SCALE' || question.type === 'NUMBER') {
      if (value.numberAnswer !== undefined && value.numberAnswer !== null && value.numberAnswer !== '') {
        answers.push({ questionId: question.id, numberAnswer: Number(value.numberAnswer) });
      } else if (!draft && question.required) {
        throw new Error(`Responde la pregunta ${question.order}.`);
      }
      return;
    }

    const selectedOptions = value.selectedOptions || [];
    if (selectedOptions.length) {
      answers.push({ questionId: question.id, selectedOptions });
    } else if (!draft && question.required) {
      throw new Error(`Responde la pregunta ${question.order}.`);
    }
  });

  if (!draft && !answers.length) {
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
