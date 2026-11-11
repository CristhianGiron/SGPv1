/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFormsPage.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Gestiona los formularios de entrevistas y observación asociados a las prácticas.
 */

import { ActionBar, SecondaryButton } from "../../../components/ui/ActionBar";
import { Alert } from "../../../components/ui/Alert";
import { DataTable } from "../../../components/ui/DataTable";
import { DraftRecovery } from "../../../components/ui/DraftRecovery";
import { Eye, RefreshCw, Save } from "lucide-react";
import { FORM_MODES } from "../model/formConfig";
import { ModuleTab, ModuleTabs } from "../../../components/ui/ModuleTabs";
import { PageHeader } from "../../../components/ui/PageHeader";
import { PracticeFormBuilder } from "../components/PracticeFormBuilder";
import { PracticeFormDetail } from "../components/PracticeFormDetail";
import { SectionCard } from "../../../components/ui/SectionCard";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { buildCreatePayload, buildResponsePayload, emptyDraft, formToDraft, isApprovedEnrollment, responseDraftFromQuestions, targetRoleLabel } from "../model/formPayloads";
import { formatDateTime } from "../../../utils/format";
import { unwrapPage } from "../../../api/client";
import { useAuth } from "../../auth/context/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConfirm } from "../../../components/ui/ConfirmDialog";
import { usePracticeRequest, usePracticeWorkspace } from "../../practices/context/PracticeWorkspaceContext";
import { useRecoverableDraft } from "../../../hooks/useRecoverableDraft";
import { workflowCopy } from "../../../config/roleExperience";

export function PracticeFormsPage({ mode = 'interviews' }) {
  const apiRequest = usePracticeRequest();
  const workspace = usePracticeWorkspace();
  const { token, roles } = useAuth();
  const confirm = useConfirm();
  const operational = !workspace || (workspace.status === 'APPROVED' && !workspace.archived && workspace.courseActive !== false);
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
  const detailSectionRef = useRef(null);
  const shouldScrollToDetailRef = useRef(false);
  const [editingForm, setEditingForm] = useState(null);
  const [draft, setDraft] = useState(() => emptyDraft(mode));
  const recovery = useRecoverableDraft(`practice-forms:${mode}:${workspace?.id || 'global'}:${editingForm?.id || 'new'}`, setDraft, activeView==='create');
  const [responseDraft, setResponseDraft] = useState({});
  const [interpretationDrafts, setInterpretationDrafts] = useState({});
  const interpretationFormIdRef = useRef(null);
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
    [token, apiRequest]
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
  }, [canResolveAssigned, canReviewManaged, config.listEndpoint, config.managedEndpoint, isStudent, token, apiRequest]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (shouldScrollToDetailRef.current && selectedForm) {
      shouldScrollToDetailRef.current = false;
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      detailSectionRef.current?.focus({ preventScroll: true });
    }
  }, [selectedForm]);

  useEffect(() => {
    const questions = selectedForm?.questions || [];
    const changedForm = interpretationFormIdRef.current !== selectedForm?.id;
    const savedInterpretations = Object.fromEntries(
      questions.map((question) => [question.id, question.studentInterpretation || ''])
    );
    setInterpretationDrafts(current => changedForm ? savedInterpretations : { ...savedInterpretations, ...current });
    setResponseDraft(responseDraftFromQuestions(questions));
    if (changedForm) setDetailView('view');
    interpretationFormIdRef.current = selectedForm?.id;
  }, [selectedForm]);

  const [recipientView,setRecipientView]=useState('pending');
  const recipientForms=assignedForms.filter(form=>recipientView==='pending'?form.status==='SENT':form.status==='ANSWERED');
  const visibleForms = activeView === 'assigned' ? recipientForms : activeView === 'managed' ? managedForms : myForms;
  const selectedIsAssigned = assignedForms.some((form) => form.id === selectedForm?.id);
  const selectedIsManaged = managedForms.some((form) => form.id === selectedForm?.id);
  const selectedIsMine = myForms.some((form) => form.id === selectedForm?.id);
  const canRespondSelected =
    operational && selectedForm?.status === 'SENT' &&
    ((canResolveAssigned && selectedIsAssigned) ||
      (config.selfAnswered && isStudent && selectedIsMine));
  const canInterpretSelected = operational && isStudent && selectedIsMine && selectedForm?.status === 'ANSWERED';
  const canEditDraftSelected = operational && isStudent && selectedIsMine && selectedForm?.status === 'DRAFT';

  async function handleViewForm(id) {
    shouldScrollToDetailRef.current = true;

    try {
      await loadFormDetail(id);
    } catch (requestError) {
      shouldScrollToDetailRef.current = false;
      setError(requestError.message);
    }
  }

  const formColumns = [
    { key: 'title', header: config.singular[0].toUpperCase() + config.singular.slice(1) },
    { key: 'courseName', header: 'Paralelo' },
    activeView === 'assigned'
      ? { key: 'studentFullName', header: 'Estudiante', render: (row) => row.studentFullName || row.student || '-' }
      : activeView === 'managed'
        ? { key: 'studentFullName', header: 'Estudiante', render: (row) => row.studentFullName || row.student || '-' }
      : config.selfAnswered
        ? activeView === 'mine'
          ? null
          : { key: 'target', header: 'Respondida por', render: () => 'Estudiante' }
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
          <SecondaryButton icon={Eye} onClick={() => handleViewForm(row.id)} type="button">
            Ver
          </SecondaryButton>
          {operational && isStudent && activeView === 'mine' && row.status === 'DRAFT' && (
            <SecondaryButton icon={Save} onClick={() => handleEditDraft(row)} type="button">
              Editar
            </SecondaryButton>
          )}
        </ActionBar>
      ),
    },
  ].filter(Boolean);

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
      description: `La ${config.singular} quedará privada y podrás editarla antes de enviarla.`,
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
      recovery.markClean();
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
        ? 'La ficha quedará lista para registrar respuestas.'
        : 'La entrevista quedará disponible para la persona asignada.',
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
      recovery.markClean();
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

      setMessage('Interpretación guardada.');
      await loadFormDetail(selectedForm.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingInterpretationId(null);
    }
  }

  const listActions = (
          <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadData} type="button">
            Actualizar
          </SecondaryButton>
  );

  return (
    <>
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={workflowCopy(mode === 'observations' ? 'observations' : 'forms', roles)}
        helpText={workflowCopy(mode === 'observations' ? 'observations' : 'forms', roles)}
        action={activeView === 'create' ? listActions : undefined}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <SectionCard className="print:hidden">
        <ModuleTabs>
          {[
            isStudent && ['mine', config.mineTab],
            canResolveAssigned && ['assigned', 'Mis entrevistas'],
            canReviewManaged && ['managed', 'Respondidas'],
            isStudent && operational && ['create', config.createTab],
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
        <div className="space-y-4"><DraftRecovery draft={recovery} disabled={saving} />
          <PracticeFormBuilder
            draft={draft}
            editing={Boolean(editingForm)}
            enrollments={enrollments}
            mode={mode}
            loading={loading}
            saving={saving}
            setDraft={setDraft}
            onDraftChange={recovery.change}
            config={config}
            onSaveDraft={handleSaveDraft}
            onSend={handleSendForm}
          /></div>
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
                ? `Consulta tus entrevistas pendientes o el historial de respuestas enviadas.`
                : activeView === 'managed'
                  ? `Selecciona una ${config.singular} respondida para revisar sus respuestas.`
                : `Selecciona una ${config.singular} para ver respuestas e interpretaciones.`
            }
          >
            {activeView==='assigned'&&<div className="mb-4"><label className="text-sm text-body">Mostrar entrevistas<select aria-label="Estado de mis entrevistas" className="ml-3 rounded border border-line bg-panel p-2" value={recipientView} onChange={e=>setRecipientView(e.target.value)}><option value="pending">Pendientes de respuesta</option><option value="answered">Historial de respondidas</option></select></label></div>}
            <DataTable
              toolbarActions={listActions}
              columns={formColumns}
              ownRecords={activeView === 'mine'}
              emptyText={loading ? `Cargando ${config.plural}` : config.emptyText}
              loading={loading}
              rows={visibleForms}
            />
          </SectionCard>

          <div
            className="scroll-mt-24"
            ref={detailSectionRef}
            tabIndex={-1}
          >
            <PracticeFormDetail
              canInterpret={canInterpretSelected}
              canRespond={canRespondSelected}
              canDuplicate={operational && isStudent && selectedIsMine}
              canEditDraft={canEditDraftSelected}
              canReview={selectedIsManaged}
              hideOwnIdentity={isStudent && selectedIsMine}
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
        </div>
      )}
    </>
  );
}

export function ObservationFormsPage() {
  return <PracticeFormsPage mode="observations" />;
}
export { Tabulation } from "../components/Tabulation";
