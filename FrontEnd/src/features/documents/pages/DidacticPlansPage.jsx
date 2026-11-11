/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlansPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona las planificaciones didácticas y sus recomendaciones dentro del alcance del usuario.
 */

import { DidacticPlanContinuity } from '../components/DidacticPlanContinuity';
/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlansPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona las planificaciones didácticas y sus recomendaciones dentro del alcance del usuario.
 */

import { DraftRecovery } from '../../../components/ui/DraftRecovery';
import { useRecoverableDraft } from '../../../hooks/useRecoverableDraft';
import { usePracticeRequest, usePracticeWorkspace } from '../../practices/context/PracticeWorkspaceContext';
import { workflowCopy } from '../../../config/roleExperience';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileUp,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { apiBlob } from '../../../api/client';
import { useAuth } from '../../auth/context/AuthContext';
import { Alert } from '../../../components/ui/Alert';
import { ActionBar, DangerButton, PrimaryButton, SecondaryButton } from '../../../components/ui/ActionBar';
import { DataTable } from '../../../components/ui/DataTable';
import { Field, FileInput, Input, Select, Textarea } from '../../../components/ui/FormControls';
import { ModuleTab, ModuleTabs } from '../../../components/ui/ModuleTabs';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SectionCard } from '../../../components/ui/SectionCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

const EMPTY_WEEK = {
  weekNumber: 1,
  startDate: '',
  endDate: '',
  contents: '',
  skill: '',
  methodologyActivities: '',
  resources: '',
  evaluationIndicators: '',
  evaluationActivities: '',
};

const EMPTY_DRAFT = {
  enrollmentId: '',
  sourcePlanId: '',
  title: 'Plan de Unidad Didáctica',
  teacherName: '',
  areaSubject: '',
  periods: '',
  weeks: '',
  startWeek: '',
  endWeek: '',
  gradeCourse: '',
  parallel: '',
  planningUnitTitle: '',
  curricularInsertions: '',
  learningObjectives: '',
  evaluationCriteria: '',
  duaPrinciples:
    'Principio de implicación: opciones para captar el interés, sostener el esfuerzo y favorecer la participación.\nPrincipio de representación: información en soportes variados y formatos accesibles.\nPrincipio de expresión y acción: opciones para expresar, organizar y planificar el aprendizaje.',
  weekPlans: [EMPTY_WEEK],
};

export function DidacticPlansPage() {
  const apiRequest = usePracticeRequest();
  const workspace = usePracticeWorkspace();
  const { token, roles, profile } = useAuth();
  const confirm = useConfirm();
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const isInstitutionalTutor = roles.includes('ROLE_TUTOR_INSTITUCIONAL');
  const operational = !workspace || (workspace.status === 'APPROVED' && !workspace.archived && workspace.courseActive !== false);
  const canCreate = operational && (isStudent || isInstitutionalTutor);
  const canRecommend = operational && roles.some((role) =>
    ['ROLE_TUTOR_INSTITUCIONAL', 'ROLE_TUTOR_PRACTICAS', 'ROLE_DIRECTOR_PRACTICAS', 'ROLE_ADMIN'].includes(role),
  );

  const [plans, setPlans] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(() => ({ ...EMPTY_DRAFT, enrollmentId: workspace?.id || '' }));
  const [recommendations, setRecommendations] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const recovery = useRecoverableDraft(`didactic-plans:${workspace?.id || 'global'}:${selectedId || 'new'}`, setDraft, activeTab==='form');
  function changeDraft(update) { const next = typeof update==='function' ? update(draft) : update;setDraft(next);recovery.change(next); }

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === String(selectedId)) || null,
    [plans, selectedId],
  );
  const selectedAuthorIsMe = selectedPlan?.authorId && profile?.id
    ? String(selectedPlan.authorId) === String(profile.id)
    : false;
  const canEditSelected = selectedPlan
    ? operational && selectedAuthorIsMe && selectedPlan.status !== 'SUBMITTED'
    : canCreate;
  const tutorPlans = useMemo(
    () => plans.filter((plan) => plan.authorType === 'INSTITUTIONAL_TUTOR' && plan.status !== 'DRAFT'),
    [plans],
  );
  const planColumns = useMemo(
    () => [
      { key: 'title', header: 'Planificación', render: (row) => row.title || row.planningUnitTitle || 'Planificación' },
      { key: 'courseName', header: 'Paralelo' },
      { key: 'authorName', header: 'Autor', secondary: isStudent },
      !isStudent && { key: 'studentName', header: 'Estudiante' },
      { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
      {
        key: 'actions',
        header: 'Acciones',
        render: (row) => (
          <SecondaryButton onClick={() => {
            setSelectedId(row.id);
            setActiveTab('view');
          }}>
            Ver
          </SecondaryButton>
        ),
      },
    ].filter(Boolean),
    [isStudent],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [planPayload, enrollmentPayload] = await Promise.all([
        apiRequest(isStudent ? '/api/didactic-plans/me' : '/api/didactic-plans/managed', { token }),
        apiRequest(isStudent ? '/api/enrollments/me' : '/api/enrollments/managed', { token }),
      ]);

      setPlans(Array.isArray(planPayload) ? planPayload : []);
      setEnrollments((Array.isArray(enrollmentPayload) ? enrollmentPayload : [])
        .filter((enrollment) => enrollment.status === 'APPROVED'));
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar las planificaciones.');
    } finally {
      setLoading(false);
    }
  }, [isStudent, token, apiRequest]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedPlan) {
      setDraft(planToDraft(selectedPlan));
      setRecommendations(selectedPlan.recommendations || '');
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (activeTab !== 'form' || selectedId) return;
    const fixedId = workspace?.id ?? (enrollments.length === 1 ? enrollments[0].id : null);
    if (fixedId != null) setDraft(current => String(current.enrollmentId) === String(fixedId) ? current : { ...current, enrollmentId: fixedId });
  }, [activeTab, selectedId, workspace?.id, enrollments]);

  function startNewPlan() {
    setSelectedId(null);
    setDraft({ ...EMPTY_DRAFT, enrollmentId: workspace?.id || (enrollments.length === 1 ? enrollments[0].id : '') });
    setRecommendations('');
    setPdfFile(null);
    setMessage('');
    setError('');
    setActiveTab('form');
  }

  function updateDraft(field, value) {
    changeDraft((current) => ({ ...current, [field]: value }));
  }

  function updateWeek(index, field, value) {
    changeDraft((current) => ({
      ...current,
      weekPlans: current.weekPlans.map((week, weekIndex) =>
        weekIndex === index ? { ...week, [field]: value } : week,
      ),
    }));
  }

  function addWeek() {
    changeDraft((current) => ({
      ...current,
      weekPlans: [
        ...current.weekPlans,
        { ...EMPTY_WEEK, weekNumber: current.weekPlans.length + 1 },
      ],
    }));
  }

  function removeWeek(index) {
    changeDraft((current) => ({
      ...current,
      weekPlans: current.weekPlans.filter((_, weekIndex) => weekIndex !== index),
    }));
  }

  async function savePlan(asDraft = true) {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const shouldStagePdfBeforeSubmit = Boolean(pdfFile && !asDraft);
      const payload = buildPayload(draft, shouldStagePdfBeforeSubmit ? true : asDraft);
      const saved = await apiRequest(
        selectedPlan ? `/api/didactic-plans/${selectedPlan.id}` : '/api/didactic-plans',
        {
          method: selectedPlan ? 'PUT' : 'POST',
          token,
          body: payload,
        },
      );

      recovery.markClean();
      setPlans((current) => [...current.filter((plan) => String(plan.id) !== String(saved.id)), saved]);
      setSelectedId(saved.id);

      if (pdfFile) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        await apiRequest(`/api/didactic-plans/${saved.id}/pdf`, {
          method: 'POST',
          token,
          body: formData,
        });
      }

      if (shouldStagePdfBeforeSubmit) {
        await apiRequest(`/api/didactic-plans/${saved.id}/submit`, {
          method: 'PATCH',
          token,
        });
      }

      recovery.markClean();
      setMessage(asDraft ? 'Borrador guardado.' : 'Planificación enviada.');
      setSelectedId(saved.id);
      setPdfFile(null);
      await loadData();
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar la planificación.');
    } finally {
      setSaving(false);
    }
  }

  async function submitSelected() {
    await savePlan(false);
  }

  async function deleteSelected() {
    if (!selectedPlan) return;

    const accepted = await confirm({
      title: 'Eliminar planificación',
      description: 'Esta acción quitará la planificación del listado.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });

    if (!accepted) return;

    try {
      await apiRequest(`/api/didactic-plans/${selectedPlan.id}`, {
        method: 'DELETE',
        token,
      });
      startNewPlan();
      await loadData();
    } catch (requestError) {
      setError(requestError.message || 'No se pudo eliminar la planificación.');
    }
  }

  async function sendRecommendations() {
    if (!selectedPlan) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(`/api/didactic-plans/${selectedPlan.id}/recommendations`, {
        method: 'PATCH',
        token,
        body: { recommendations },
      });
      setMessage('Recomendaciones enviadas.');
      await loadData();
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron enviar las recomendaciones.');
    } finally {
      setSaving(false);
    }
  }

  async function downloadPdf() {
    if (!selectedPlan?.hasUploadedPdf) return;

    try {
      const blob = await apiBlob(`/api/didactic-plans/${selectedPlan.id}/pdf`, token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedPlan.uploadedPdfFilename || 'planificacion-didactica.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo descargar el PDF.');
    }
  }

  const listActions = (
          <ActionBar>
            <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadData}>
              Actualizar
            </SecondaryButton>
            {canCreate && (
              <PrimaryButton icon={Plus} onClick={startNewPlan}>
                Nueva planificación
              </PrimaryButton>
            )}
          </ActionBar>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planificación didáctica"
        title="Planificaciones didácticas"
        description={workflowCopy('plans', roles)}
        helpText={workflowCopy('plans', roles)}
        action={activeTab !== 'list' ? listActions : undefined}
      />

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <ModuleTabs>
        {canCreate && <ModuleTab active={activeTab === 'form'} onClick={() => setActiveTab('form')}>Formulario</ModuleTab>}
        <ModuleTab active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
          Tabla de planificaciones
        </ModuleTab>
        {selectedPlan && <ModuleTab active={activeTab === 'view'} onClick={() => setActiveTab('view')}>Vista de planificación</ModuleTab>}
      </ModuleTabs>

      {activeTab === 'list' && (
        <SectionCard title="Planificaciones" description={`${plans.length} registro(s)`}>
          <DataTable
            toolbarActions={listActions}
            columns={planColumns}
            emptyText="Aún no hay planificaciones registradas."
            loading={loading}
            rows={plans}
          />
        </SectionCard>
      )}

      {canCreate && activeTab === 'form' && (
        <SectionCard
          title={selectedPlan ? selectedPlan.title || 'Planificación' : 'Nueva planificación'}
          description={selectedPlan
            ? isStudent
              ? selectedAuthorIsMe ? 'Tu planificación' : 'Planificación de tu práctica'
              : `${selectedPlan.authorName} | ${selectedPlan.studentName}`
            : 'Basada en el formato del Plan de Unidad Didáctica'}
          action={selectedPlan && <StatusBadge status={selectedPlan.status} />}
        >
          <div className="space-y-4">
            <DraftRecovery draft={recovery} disabled={saving} />
            <p className="text-xs text-body">La copia local conserva los campos de texto; los archivos PDF deben seleccionarse de nuevo al recuperar un borrador.</p>
            {selectedPlan?.recommendations && (
              <Alert tone="warning">
                Recomendaciones de {selectedPlan.recommendedByName || 'revisor'}: {selectedPlan.recommendations}
              </Alert>
            )}

            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {!workspace && !(enrollments.length === 1 && String(draft.enrollmentId) === String(enrollments[0].id)) && <Field label="Inscripción">
                <Select
                  disabled={saving || !canEditSelected}
                  value={draft.enrollmentId}
                  onChange={(event) => updateDraft('enrollmentId', event.target.value)}
                >
                  <option value="">Selecciona una inscripción</option>
                  {enrollments.map((enrollment) => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {[enrollment.studentFullName, enrollment.practiceName, enrollment.courseName, enrollment.educationalInstitutionName]
                        .filter(Boolean)
                        .join(' | ')}
                    </option>
                  ))}
                </Select>
              </Field>}

              {isStudent && (
                <Field label="Planificación base de la tutora">
                  <Select
                    disabled={saving || !canEditSelected}
                    value={draft.sourcePlanId}
                    onChange={(event) => {
                      const source = tutorPlans.find((plan) => String(plan.id) === event.target.value);
                      changeDraft(source ? planToDraft({ ...source, sourcePlanId: source.id }) : { ...draft, sourcePlanId: '' });
                    }}
                  >
                    <option value="">Sin planificación base</option>
                    {tutorPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.title || plan.planningUnitTitle || 'Planificación de tutora'}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              <Field label="Título">
                <Input disabled={saving || !canEditSelected} value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
              </Field>
              <Field label="Docente">
                <Input disabled={saving || !canEditSelected} value={draft.teacherName} onChange={(event) => updateDraft('teacherName', event.target.value)} />
              </Field>
              <Field label="Área/asignatura">
                <Input disabled={saving || !canEditSelected} value={draft.areaSubject} onChange={(event) => updateDraft('areaSubject', event.target.value)} />
              </Field>
              <Field label="Períodos">
                <Input disabled={saving || !canEditSelected} type="number" min="0" value={draft.periods} onChange={(event) => updateDraft('periods', event.target.value)} />
              </Field>
              <Field label="Semanas">
                <Input disabled={saving || !canEditSelected} type="number" min="0" value={draft.weeks} onChange={(event) => updateDraft('weeks', event.target.value)} />
              </Field>
              <Field label="Semana de inicio">
                <Input disabled={saving || !canEditSelected} type="date" value={draft.startWeek} onChange={(event) => updateDraft('startWeek', event.target.value)} />
              </Field>
              <Field label="Semana de culminación">
                <Input disabled={saving || !canEditSelected} type="date" value={draft.endWeek} onChange={(event) => updateDraft('endWeek', event.target.value)} />
              </Field>
              <Field label="Curso/grado">
                <Input disabled={saving || !canEditSelected} value={draft.gradeCourse} onChange={(event) => updateDraft('gradeCourse', event.target.value)} />
              </Field>
              <Field label="Paralelo">
                <Input disabled={saving || !canEditSelected} value={draft.parallel} onChange={(event) => updateDraft('parallel', event.target.value)} />
              </Field>
            </div>

            <Field label="Título y número de unidad de planificación">
              <Input disabled={saving || !canEditSelected} value={draft.planningUnitTitle} onChange={(event) => updateDraft('planningUnitTitle', event.target.value)} />
            </Field>
            <Field label="Inserciones curriculares">
              <Textarea disabled={saving || !canEditSelected} value={draft.curricularInsertions} onChange={(event) => updateDraft('curricularInsertions', event.target.value)} />
            </Field>
            <Field label="Objetivos de aprendizaje">
              <Textarea disabled={saving || !canEditSelected} value={draft.learningObjectives} onChange={(event) => updateDraft('learningObjectives', event.target.value)} />
            </Field>
            <Field label="Criterios de evaluación">
              <Textarea disabled={saving || !canEditSelected} value={draft.evaluationCriteria} onChange={(event) => updateDraft('evaluationCriteria', event.target.value)} />
            </Field>
            <Field label="Principios del Diseño Universal de Aprendizaje - DUA">
              <Textarea disabled={saving || !canEditSelected} value={draft.duaPrinciples} onChange={(event) => updateDraft('duaPrinciples', event.target.value)} />
            </Field>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-heading dark:text-heading">Planificación por semanas</p>
                {canEditSelected && (
                  <SecondaryButton icon={Plus} onClick={addWeek}>
                    Agregar semana
                  </SecondaryButton>
                )}
              </div>
              {draft.weekPlans.map((week, index) => (
                <div key={`${index}-${week.id || 'new'}`} className="sgp-color-card rounded-lg border border-line bg-panel-soft p-3 dark:border-line dark:bg-surface-soft">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-heading dark:text-heading">Semana {index + 1}</p>
                    {canEditSelected && draft.weekPlans.length > 1 && (
                      <DangerButton icon={Trash2} onClick={() => removeWeek(index)}>
                        Quitar
                      </DangerButton>
                    )}
                  </div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    <Field label="Número">
                      <Input disabled={saving || !canEditSelected} type="number" value={week.weekNumber || ''} onChange={(event) => updateWeek(index, 'weekNumber', event.target.value)} />
                    </Field>
                    <Field label="Desde">
                      <Input disabled={saving || !canEditSelected} type="date" value={week.startDate || ''} onChange={(event) => updateWeek(index, 'startDate', event.target.value)} />
                    </Field>
                    <Field label="Hasta">
                      <Input disabled={saving || !canEditSelected} type="date" value={week.endDate || ''} onChange={(event) => updateWeek(index, 'endDate', event.target.value)} />
                    </Field>
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <Field label="Contenidos, habilidades o temas">
                      <Textarea disabled={saving || !canEditSelected} value={week.contents || ''} onChange={(event) => updateWeek(index, 'contents', event.target.value)} />
                    </Field>
                    <Field label="Destreza">
                      <Textarea disabled={saving || !canEditSelected} value={week.skill || ''} onChange={(event) => updateWeek(index, 'skill', event.target.value)} />
                    </Field>
                    <Field label="Actividades con estrategias metodológicas diversificadas con DUA">
                      <Textarea disabled={saving || !canEditSelected} value={week.methodologyActivities || ''} onChange={(event) => updateWeek(index, 'methodologyActivities', event.target.value)} />
                    </Field>
                    <Field label="Recursos">
                      <Textarea disabled={saving || !canEditSelected} value={week.resources || ''} onChange={(event) => updateWeek(index, 'resources', event.target.value)} />
                    </Field>
                    <Field label="Indicadores de logro">
                      <Textarea disabled={saving || !canEditSelected} value={week.evaluationIndicators || ''} onChange={(event) => updateWeek(index, 'evaluationIndicators', event.target.value)} />
                    </Field>
                    <Field label="Actividades evaluativas">
                      <Textarea disabled={saving || !canEditSelected} value={week.evaluationActivities || ''} onChange={(event) => updateWeek(index, 'evaluationActivities', event.target.value)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <div className="sgp-color-card rounded-lg border border-line bg-panel-soft p-3 dark:border-line dark:bg-surface-soft">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                <Field label="Subir PDF de planificación">
                  <FileInput disabled={saving || !canEditSelected} accept="application/pdf" onChange={(event) => setPdfFile(event.target.files?.[0] || null)} />
                </Field>
                <SecondaryButton disabled={!selectedPlan?.hasUploadedPdf} icon={Download} onClick={downloadPdf}>
                  Descargar PDF
                </SecondaryButton>
              </div>
              {selectedPlan?.hasUploadedPdf && (
                <p className="mt-2 text-xs font-medium text-body">
                  PDF cargado: {selectedPlan.uploadedPdfFilename || 'planificación.pdf'}
                </p>
              )}
            </div>

            <ActionBar>
              {canEditSelected && (
                <>
                  <SecondaryButton icon={Save} loading={saving} onClick={() => savePlan(true)}>
                    Guardar borrador
                  </SecondaryButton>
                  <PrimaryButton icon={Send} loading={saving} onClick={submitSelected}>
                    Enviar
                  </PrimaryButton>
                  {pdfFile && <span className="inline-flex items-center gap-2 text-sm font-medium text-body"><FileUp size={16} /> PDF listo para cargar</span>}
                </>
              )}
              {selectedPlan && selectedAuthorIsMe && selectedPlan.status !== 'SUBMITTED' && (
                <DangerButton icon={Trash2} onClick={deleteSelected}>
                  Eliminar
                </DangerButton>
              )}
            </ActionBar>
          </div>
        </SectionCard>
      )}

      {activeTab === 'view' && (
        <SectionCard
          title={selectedPlan ? selectedPlan.title || 'Planificación' : 'Vista de planificación'}
          description={selectedPlan
            ? isStudent
              ? selectedAuthorIsMe ? 'Tu planificación' : 'Planificación de tu práctica'
              : `${selectedPlan.authorName} | ${selectedPlan.studentName}`
            : 'Selecciona una planificación desde la tabla.'}
          action={selectedPlan && <StatusBadge status={selectedPlan.status} />}
        >
          {selectedPlan ? (
            <div className="space-y-4">
              <PlanDetail
                hideAuthor={isStudent && selectedAuthorIsMe}
                hideStudent={isStudent}
                plan={selectedPlan}
              />

              <DidacticPlanContinuity plan={selectedPlan} operational={operational} onChanged={loadData} renderSnapshot={historical=><PlanDetail plan={historical} hideAuthor={false} hideStudent={false} />} />
              <ActionBar>
                {selectedPlan.hasUploadedPdf && (
                  <SecondaryButton icon={Download} onClick={downloadPdf}>
                    Descargar PDF
                  </SecondaryButton>
                )}
                {canEditSelected && (
                  <PrimaryButton icon={Save} onClick={() => setActiveTab('form')}>
                    Editar
                  </PrimaryButton>
                )}
                <SecondaryButton onClick={() => setActiveTab('list')}>
                  Volver a la tabla
                </SecondaryButton>
              </ActionBar>

              {canRecommend && selectedPlan.authorType === 'STUDENT' && selectedPlan.status !== 'DRAFT' && !selectedAuthorIsMe && (
                <div className="rounded-lg border border-warning bg-warning-soft p-3 dark:border-warning/40 dark:bg-warning-soft">
                  <Field label="Recomendaciones para corrección">
                    <Textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} />
                  </Field>
                  <div className="mt-3 flex justify-end">
                    <SecondaryButton loading={saving} onClick={sendRecommendations}>
                      Enviar recomendaciones
                    </SecondaryButton>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert tone="info">Selecciona una planificación desde la tabla para visualizarla.</Alert>
          )}
        </SectionCard>
      )}
    </div>
  );
}

function planToDraft(plan) {
  return {
    enrollmentId: plan.enrollmentId || '',
    sourcePlanId: plan.sourcePlanId || '',
    title: plan.title || 'Plan de Unidad Didáctica',
    teacherName: plan.teacherName || '',
    areaSubject: plan.areaSubject || '',
    periods: plan.periods ?? '',
    weeks: plan.weeks ?? '',
    startWeek: plan.startWeek || '',
    endWeek: plan.endWeek || '',
    gradeCourse: plan.gradeCourse || '',
    parallel: plan.parallel || '',
    planningUnitTitle: plan.planningUnitTitle || '',
    curricularInsertions: plan.curricularInsertions || '',
    learningObjectives: plan.learningObjectives || '',
    evaluationCriteria: plan.evaluationCriteria || '',
    duaPrinciples: plan.duaPrinciples || EMPTY_DRAFT.duaPrinciples,
    weekPlans: plan.weekPlans?.length ? plan.weekPlans.map((week) => ({ ...week })) : [EMPTY_WEEK],
  };
}

function buildPayload(draft, asDraft) {
  return {
    ...draft,
    draft: asDraft,
    enrollmentId: draft.enrollmentId ? Number(draft.enrollmentId) : null,
    sourcePlanId: draft.sourcePlanId ? Number(draft.sourcePlanId) : null,
    periods: draft.periods === '' ? null : Number(draft.periods),
    weeks: draft.weeks === '' ? null : Number(draft.weeks),
    weekPlans: (draft.weekPlans || []).map((week, index) => ({
      ...week,
      weekNumber: week.weekNumber === '' ? index + 1 : Number(week.weekNumber),
    })),
  };
}

function PlanDetail({ plan, hideAuthor = false, hideStudent = false }) {
  return (
    <div className="space-y-5">
      {plan.recommendations && (
        <Alert tone="warning">
          Recomendaciones de {plan.recommendedByName || 'revisor'}: {plan.recommendations}
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {!hideAuthor && <DetailValue label="Autor" value={plan.authorName} />}
        {!hideStudent && <DetailValue label="Estudiante" value={plan.studentName} />}
        <DetailValue label="Paralelo" value={plan.courseName} />
        <DetailValue label="Institución" value={plan.educationalInstitutionName} />
        <DetailValue label="Docente" value={plan.teacherName} />
        <DetailValue label="Área/asignatura" value={plan.areaSubject} />
        <DetailValue label="Períodos" value={plan.periods} />
        <DetailValue label="Semanas" value={plan.weeks} />
        <DetailValue label="Inicio" value={plan.startWeek} />
        <DetailValue label="Culminación" value={plan.endWeek} />
        <DetailValue label="Curso/grado" value={plan.gradeCourse} />
        <DetailValue label="Paralelo aula" value={plan.parallel} />
      </div>

      <div className="grid gap-4">
        <LongValue label="Título y número de unidad de planificación" value={plan.planningUnitTitle} />
        <LongValue label="Inserciones curriculares" value={plan.curricularInsertions} />
        <LongValue label="Objetivos de aprendizaje" value={plan.learningObjectives} />
        <LongValue label="Criterios de evaluación" value={plan.evaluationCriteria} />
        <LongValue label="Principios DUA" value={plan.duaPrinciples} />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-heading dark:text-heading">Planificación por semanas</p>
        {plan.weekPlans?.length ? (
          plan.weekPlans.map((week, index) => (
            <div
              className="rounded-lg border border-line bg-panel-soft p-3 dark:border-line dark:bg-surface-soft"
              key={week.id || `${week.weekNumber}-${index}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-heading dark:text-heading">
                  Semana {week.weekNumber || index + 1}
                </p>
                <p className="text-xs font-medium text-body">
                  {[week.startDate, week.endDate].filter(Boolean).join(' - ') || 'Sin fechas'}
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <LongValue label="Contenidos, habilidades o temas" value={week.contents} />
                <LongValue label="Destreza" value={week.skill} />
                <LongValue label="Actividades con estrategias metodológicas diversificadas con DUA" value={week.methodologyActivities} />
                <LongValue label="Recursos" value={week.resources} />
                <LongValue label="Indicadores de logro" value={week.evaluationIndicators} />
                <LongValue label="Actividades evaluativas" value={week.evaluationActivities} />
              </div>
            </div>
          ))
        ) : (
          <Alert tone="info">Esta planificación no tiene semanas registradas.</Alert>
        )}
      </div>

      {plan.hasUploadedPdf && (
        <div className="sgp-color-card rounded-lg border border-line bg-panel-soft p-3 text-sm font-medium text-body dark:border-line dark:bg-surface-soft">
          PDF cargado: {plan.uploadedPdfFilename || 'planificación.pdf'}
        </div>
      )}
    </div>
  );
}

function DetailValue({ label, value }) {
  return (
    <div className="sgp-color-card rounded-lg border border-line bg-panel-soft p-3 dark:border-line dark:bg-surface-soft">
      <p className="text-xs font-medium uppercase text-body">{label}</p>
      <p className="mt-1 min-h-5 break-words text-sm font-medium text-heading dark:text-heading">
        {value || '-'}
      </p>
    </div>
  );
}

function LongValue({ label, value }) {
  return (
    <div className="sgp-color-card rounded-lg border border-line bg-panel p-3 dark:border-line dark:bg-surface">
      <p className="text-xs font-medium uppercase text-body">{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-heading dark:text-heading">
        {value || '-'}
      </p>
    </div>
  );
}
