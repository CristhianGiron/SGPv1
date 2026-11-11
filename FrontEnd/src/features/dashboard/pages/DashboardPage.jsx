/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DashboardPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta el panel de entrada y la información disponible según el rol del usuario.
 */

import { summarizeAttendances, pendingReviewCount } from '../../../utils/practiceIndicators';
import { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  FileQuestion,
  FileText,
  Image,
  ImagePlus,
  Palette,
  Trash2,
} from 'lucide-react';
import { apiRequest, apiUrl, unwrapPage } from '../../../api/client';
import { useAuth } from '../../auth/context/AuthContext';
import { Alert } from '../../../components/ui/Alert';
import { ActionBar, DangerButton, PrimaryButton, SecondaryButton } from '../../../components/ui/ActionBar';
import { Field, FileInput, Input, Textarea } from '../../../components/ui/FormControls';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { DOCUMENT_MODULES } from '../../../config/endpointModules';
import { formatValue } from '../../../utils/format';
import { setHashRoute } from '../../../utils/routes';

export function DashboardPage() {
  const { token, roles, profile } = useAuth();
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const isAdmin = roles.includes('ROLE_ADMIN');
  const [stats, setStats] = useState([]);
  const [interfaceImages, setInterfaceImages] = useState([]);
  const [adminImages, setAdminImages] = useState([]);
  const [studentOverview, setStudentOverview] = useState(null);
  const [studentDocuments, setStudentDocuments] = useState([]);
  const [roleTasks, setRoleTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState({ overview: true, documents: true, tasks: true });
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      setError('');

      try {
        const requests = [];
        let studentOverviewRequest = Promise.resolve(null);
        let studentDocumentsRequest = Promise.resolve([]);
        let roleTasksRequest = Promise.resolve([]);

        if (isStudent) {
          studentOverviewRequest = loadStudentPracticeOverview(token);
          requests.push(
            studentOverviewRequest.then((overview) => ({
              label: 'Inscripciones',
              value: overview.enrollments.length,
            })),
            studentOverviewRequest.then((overview) => ({
              label: 'Evidencias',
              value: overview.photos.length,
            }))
          );
          studentDocumentsRequest = loadStudentDocuments(token);
        } else {
          setStudentOverview(null);
          setStudentDocuments([]);
          roleTasksRequest = loadRoleTasks(token, roles);
        }

        if (roles.includes('ROLE_ADMIN')) {
          requests.push(
            apiRequest('/api/account?page=0&size=1', { token }).then((data) => ({
              label: 'Usuarios',
              value: data.totalElements ?? data.content?.length ?? 0,
            })),
            apiRequest('/api/faculties', { token }).then((data) => ({
              label: 'Facultades',
              value: data.length,
            }))
          );
        }

        if (roles.includes('ROLE_TUTOR_PRACTICAS')) {
          requests.push(
            apiRequest('/api/activity-plans/review/summary', { token }).then((data) => ({
              label: 'Planes por revisar',
              value: pendingReviewCount(unwrapPage(data)),
            })),
            apiRequest('/api/practice-reports/review/summary', { token }).then((data) => ({
              label: 'Informes por revisar',
              value: pendingReviewCount(unwrapPage(data)),
            }))
          );
        }

        if (roles.some((role) => ['ROLE_TUTOR_INSTITUCIONAL', 'ROLE_DIRECTORA_INSTITUCION'].includes(role))) {
          requests.push(apiRequest('/api/practice-forms/assigned', { token }).then((payload) => ({ label: 'Entrevistas por responder', value: unwrapPage(payload).filter((form) => form.status === 'SENT').length })));
        }

        const [statResults, overviewResult, documentResult, roleTaskResult] = await Promise.all([
          Promise.allSettled(requests),
          studentOverviewRequest
            .then((value) => ({ status: 'fulfilled', value }))
            .catch((reason) => ({ status: 'rejected', reason })),
          studentDocumentsRequest
            .then((value) => ({ status: 'fulfilled', value }))
            .catch((reason) => ({ status: 'rejected', reason })),
          roleTasksRequest
            .then((value) => ({ status: 'fulfilled', value }))
            .catch((reason) => ({ status: 'rejected', reason })),
        ]);
        const nextStats = statResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);
        const nextStudentOverview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;
        const nextStudentDocuments = documentResult.status === 'fulfilled' ? documentResult.value : [];
        const nextRoleTasks = roleTaskResult.status === 'fulfilled' ? roleTaskResult.value : [];
        const hasPartialError =
          statResults.some((result) => result.status === 'rejected') ||
          overviewResult.status === 'rejected' ||
          documentResult.status === 'rejected' ||
          roleTaskResult.status === 'rejected';

        if (active) {
          setAvailability({ overview: overviewResult.status === 'fulfilled', documents: documentResult.status === 'fulfilled', tasks: roleTaskResult.status === 'fulfilled' });
          setStats(nextStats);
          setStudentOverview(nextStudentOverview);
          setStudentDocuments(nextStudentDocuments);
          setRoleTasks(nextRoleTasks);
          setError(
            hasPartialError
              ? 'No se pudo cargar todo el resumen. Puedes usar el menú para navegar por la plataforma.'
              : ''
          );
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [token, roles, isStudent]);

  async function loadInterfaceImages() {
    const activeImages = await apiRequest('/api/public/interface-images?placement=DASHBOARD');
    setInterfaceImages(activeImages);

    if (isAdmin) {
      const adminVisibleImages = await apiRequest('/api/admin/interface-images?placement=DASHBOARD', { token });
      setAdminImages(adminVisibleImages);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadVisuals() {
      try {
        const activeImages = await apiRequest('/api/public/interface-images?placement=DASHBOARD');
        const adminVisibleImages = isAdmin
          ? await apiRequest('/api/admin/interface-images?placement=DASHBOARD', { token })
          : [];

        if (active) {
          setInterfaceImages(activeImages);
          setAdminImages(adminVisibleImages);
        }
      } catch {
        if (active) {
          setInterfaceImages([]);
          setAdminImages([]);
        }
      }
    }

    loadVisuals();

    return () => {
      active = false;
    };
  }, [isAdmin, token]);

  return (
    <div className="dashboard-page grid gap-4">
      <PageHeader
        eyebrow="Inicio"
        title={`Hola, ${profile?.names || profile?.username || 'usuario'}`}
        description="Resumen de actividad y tareas pendientes."
      />

      {error && <p role="alert" className="rounded-lg border border-warning bg-warning-soft p-4 text-sm text-warning-strong">{error}</p>}

      {loading ? (
        <SectionCard>
          <Skeleton lines={5} />
        </SectionCard>
      ) : (
        <div className="dashboard-stats">
          {stats.map((item) => (
            <StatCard item={item} key={item.label} />
          ))}
        </div>
      )}

      {isStudent && !loading && (
        <>
          {availability.overview && availability.documents
            ? <StudentPracticeFilePanel documents={studentDocuments} overview={studentOverview} />
            : <SectionCard title="Tu práctica actual"><p className="text-sm text-body">Resumen no disponible. No se pudieron consultar todos los registros.</p></SectionCard>}
          {availability.documents ? <StudentDocumentsPanel documents={studentDocuments} />
            : <SectionCard title="Mis documentos"><p className="text-sm text-body">No se pudo consultar el estado de tus documentos.</p></SectionCard>}
        </>
      )}
      {!isStudent && !loading && (availability.tasks ? <RoleTasksPanel tasks={roleTasks} roles={roles} />
        : <SectionCard title="Tareas pendientes"><p className="text-sm text-body">No se pudieron consultar las tareas. Abre el módulo correspondiente para comprobar tus pendientes.</p></SectionCard>)}

      <DashboardVisualStrip images={interfaceImages} />

      {isAdmin && (
        <DashboardVisualAdminPanel
          images={adminImages}
          token={token}
          onChanged={loadInterfaceImages}
        />
      )}
    </div>
  );
}

function StatCard({ item }) {
  return (
    <section className="dashboard-stat">
      <p className="text-xs text-muted">{item.label}</p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight text-heading">{item.value}</p>
    </section>
  );
}

function DashboardVisualStrip({ images }) {
  const visualItems = images.filter((image) => image.contentUrl).slice(0, 1);

  if (!visualItems.length) {
    return null;
  }

  return (
    <section className="grid gap-3">
      {visualItems.map((item) => {
        return (
          <article className="flex items-center gap-4 rounded-lg border border-line bg-panel p-4" key={item.id || item.title}>
            <img alt="" className="h-16 w-24 flex-none rounded-md object-cover" src={apiUrl(item.contentUrl)} />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-heading">{item.title}</h2>
              {item.description && <p className="mt-1 text-sm text-body">{item.description}</p>}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function DashboardVisualAdminPanel({ images, token, onChanged }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [placement, setPlacement] = useState('PAGE_HEADER');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function uploadImage(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!file) {
      setError('Selecciona una imagen decorativa.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('placement', placement || 'PAGE_HEADER');
      formData.append('displayOrder', displayOrder || '0');
      formData.append('active', 'true');
      formData.append('file', file);

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      await apiRequest('/api/admin/interface-images', {
        method: 'POST',
        token,
        body: formData,
      });

      setTitle('');
      setDescription('');
      setDisplayOrder('0');
      setPlacement('PAGE_HEADER');
      setFile(null);
      form.reset();
      setMessage('Banner agregado con éxito.');
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleImage(image) {
    await updateImage(image, { active: !image.active });
  }

  async function updateImage(image, overrides = {}) {
    setError('');
    setMessage('');

    const params = new URLSearchParams({
      title: overrides.title ?? image.title ?? 'Imagen',
      description: overrides.description ?? image.description ?? '',
      placement: overrides.placement ?? image.placement ?? 'PAGE_HEADER',
      displayOrder: String(overrides.displayOrder ?? image.displayOrder ?? 0),
      active: String(overrides.active ?? image.active),
    });

    try {
      await apiRequest(`/api/admin/interface-images/${image.id}?${params.toString()}`, {
        method: 'PATCH',
        token,
      });
      setMessage('Imagen actualizada.');
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteImage(image) {
    setError('');
    setMessage('');

    try {
      await apiRequest(`/api/admin/interface-images/${image.id}`, {
        method: 'DELETE',
        token,
      });
      setMessage('Imagen eliminada.');
      await onChanged();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <SectionCard
      description="Sube imágenes ligeras para dar más vida visual al inicio de la plataforma."
      collapsible
      defaultCollapsed
      title="Personalización visual del inicio"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form className="sgp-color-card grid gap-3 rounded-lg border border-line bg-panel-soft p-3 dark:border-line dark:bg-surface-soft" onSubmit={uploadImage}>
          {message && <Alert tone="success">{message}</Alert>}
          {error && <Alert tone="error">{error}</Alert>}
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem]">
            <Field label="Título">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Orden">
              <Input min="0" type="number" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} />
            </Field>
          </div>
          <Field label="Ubicación del banner">
            <select
              className="min-h-[2.5rem] w-full rounded-lg border border-line bg-field px-3 py-2 text-sm text-heading outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted hover:border-line-strong focus:border-primary-strong focus:ring-4 focus:ring-focus-soft dark:border-line dark:bg-page dark:text-heading dark:placeholder:text-muted dark:hover:border-line-strong dark:focus:border-info dark:focus:ring-focus-soft"
              onChange={(event) => setPlacement(event.target.value)}
              value={placement}
            >
              <option value="PAGE_HEADER">Cabecera de página</option>
              <option value="SECTION_HEADER">Cabecera de sección</option>
              <option value="DASHBOARD">Inicio</option>
            </select>
          </Field>
          <Field label="Descripción corta">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Field label="Imagen">
            <FileInput accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </Field>
          <ActionBar>
            <PrimaryButton icon={ImagePlus} loading={saving} type="submit">
              Agregar imagen
            </PrimaryButton>
          </ActionBar>
        </form>

        <div className="grid gap-3">
          {images.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-panel-soft p-4 text-sm text-body dark:border-line dark:bg-surface-soft dark:text-ink">
              Aún no hay imágenes decorativas configuradas.
            </div>
          ) : (
            images.map((image) => (
              <article className="sgp-color-card overflow-hidden rounded-xl border border-line bg-panel p-3 shadow-card dark:border-line dark:bg-surface" key={image.id}>
                <div className="relative overflow-hidden rounded-lg border border-line bg-panel-soft dark:border-line dark:bg-surface-soft">
                  <img alt="" className="h-28 w-full object-cover" src={apiUrl(image.contentUrl)} />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,18,26,0.08),rgba(14,18,26,0.75))]" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-sm font-semibold text-white">{image.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/85">{image.description || image.originalFilename}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-body">Ubicación: {image.placement || 'PAGE_HEADER'} · Orden {image.displayOrder ?? 0} · {image.active ? 'Visible' : 'Oculta'}</p>
                  </div>
                  <ActionBar>
                    <SecondaryButton icon={Palette} onClick={() => toggleImage(image)}>
                      {image.active ? 'Ocultar' : 'Mostrar'}
                    </SecondaryButton>
                    <DangerButton icon={Trash2} onClick={() => deleteImage(image)}>
                      Eliminar
                    </DangerButton>
                  </ActionBar>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function StudentDocumentsPanel({ documents }) {
  const summary = buildStudentDocumentSummary(documents);

  return (
    <SectionCard
      description="Revisa el estado de tus documentos y la siguiente acción pendiente."
      title="Mis documentos"
    >
      {documents.length === 0 ? (
        <p className="py-3 text-sm text-muted">Aún no tienes documentos creados. Abre Documentos de práctica en el menú para comenzar.</p>
      ) : (
        <div className="space-y-4">
          <div className="dashboard-document-summary">
            {summary.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted">{item.label}</p>
                <p className="text-sm font-semibold text-heading">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-line bg-panel dark:border-line dark:bg-surface">
            {documents.map((document) => (
              <StudentDocumentRow document={document} key={document.key} />
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function StudentPracticeFilePanel({ documents, overview }) {
  const enrollment = currentEnrollment(overview?.enrollments || []);
  const documentSummary = buildStudentDocumentSummary(documents);
  const attendanceSummary = summarizeStudentAttendances(overview?.schedules || []);

  return (
    <SectionCard
      description="Tu institución, tus tutores y tus registros de práctica."
      title="Tu práctica actual"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
        <div className="dashboard-practice-details">
          <p className="text-xs font-semibold uppercase text-body">Información de la práctica</p>
          <div className="mt-3 grid gap-3 text-sm text-body">
            <PracticeFileLine label="Paralelo" value={enrollment?.courseName} />
            <PracticeFileLine label="Grupo" value={enrollment?.groupName} />
            <PracticeFileLine label="Institución" value={enrollment?.educationalInstitutionName} />
            <PracticeFileLine label="Tutor de prácticas" value={enrollment?.practiceTutor} />
            <PracticeFileLine label="Tutor institucional" value={enrollment?.institutionalTutor} />
          </div>
        </div>

        <div className="dashboard-shortcuts">
          <PracticeFileMetric
            Icon={FileText}
            label="Documentos"
            value={`${documentSummary.find((item) => item.label === 'Aprobados')?.value || 0} aprobados`}
            detail={`${documents.length} creados`}
            route="documents"
          />
          <PracticeFileMetric
            Icon={Image}
            label="Evidencias"
            value={overview?.photos?.length || 0}
            detail="fotografias registradas"
            route="photos"
          />
          <PracticeFileMetric
            Icon={FileQuestion}
            label="Entrevistas"
            value={overview?.forms?.length || 0}
            detail="creadas o aplicadas"
            route="forms"
          />
          <PracticeFileMetric
            Icon={CalendarClock}
            label="Jornadas"
            value={attendanceSummary.total}
            detail={`${formatMinutes(attendanceSummary.assistedMinutes)} asistidas`}
            route="schedules"
          />
        </div>
      </div>
    </SectionCard>
  );
}

function PracticeFileLine({ label, value }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <span className="text-xs text-muted">{label}</span>
      <span className="min-w-0 break-words">{value || '-'}</span>
    </div>
  );
}

function PracticeFileMetric({ Icon, detail, label, route, value }) {
  return (
    <button
      className="dashboard-shortcut group flex items-start gap-3 rounded-md text-left hover:bg-panel-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      onClick={() => setHashRoute(route)}
      type="button"
    >
      <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-panel-soft text-muted">
        <Icon aria-hidden="true" size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase text-body">{label}</span>
        <span className="mt-1 block text-xl font-semibold text-heading dark:text-heading">{value}</span>
        <span className="mt-1 block text-xs font-medium text-body">{detail}</span>
      </span>
    </button>
  );
}

function RoleTasksPanel({ tasks, roles }) {
  const importantTasks = tasks.filter((task) => task.count > 0);

  return (
    <SectionCard
      description={roles.includes('ROLE_ADMIN') ? 'Consulta los envíos que todavía esperan revisión.' : roles.includes('ROLE_DIRECTORA_INSTITUCION') ? 'Consulta las entrevistas pendientes de tu respuesta.' : 'Abre tus registros asignados para responder o revisar sus apartados.'}
      title={roles.includes('ROLE_ADMIN') ? 'Seguimiento de envíos' : 'Pendientes asignados'}
    >
      {roles.includes('ROLE_DIRECTORA_INSTITUCION') && <p className="mb-4 text-sm text-body">Responde tus entrevistas asignadas y consulta las jornadas de tu institución desde el menú.</p>}
      {importantTasks.length === 0 ? (
        <p className="py-3 text-sm text-muted">No hay pendientes en las bandejas consultadas.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {importantTasks.map((task) => (
            <RoleTaskCard key={`${task.moduleId}-${task.label}-${task.path}`} task={task} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function RoleTaskCard({ task }) {
  const Icon = task.Icon || Clock3;

  return (
    <button
      className="sgp-color-card group grid min-h-[6rem] gap-3 rounded-lg border border-line bg-panel p-4 text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface"
      onClick={() => setHashRoute(task.route || `documents/${task.moduleId}`)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-panel-soft text-muted">
          <Icon aria-hidden="true" size={20} />
        </span>
        <span className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong dark:border-accent/35 dark:bg-accent-soft dark:text-accent-strong">
          {task.count}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-heading dark:text-heading">{task.title}</p>
        <p className="mt-1 text-xs font-medium text-body">{task.label}</p>
      </div>
    </button>
  );
}

function StudentDocumentRow({ document }) {
  return (
    <div className="grid gap-3 border-b border-line p-3 last:border-b-0 dark:border-line lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1.2fr)_auto] lg:items-center">
      <div>
        <p className="text-sm font-semibold text-heading dark:text-heading">{document.title}</p>
        <p className="mt-1 text-xs text-muted">{document.context}</p>
      </div>

      <StatusBadge status={document.status} />

      <div>
        <p className="text-sm text-body">{document.nextStep}</p>
        <p className="mt-1 text-xs text-muted">
          Actualizado: {formatValue(document.updatedAt, 'updatedAt')}
        </p>
      </div>

      <button
        className="inline-flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus dark:text-info-strong"
        onClick={() => {
          setHashRoute(`documents/${document.moduleId}`);
        }}
        type="button"
      >
        <span className="inline-flex min-w-0 items-center justify-center gap-2">
          <Eye aria-hidden="true" size={16} />
          Abrir
        </span>
      </button>
    </div>
  );
}

async function loadStudentDocuments(token) {
  const requests = DOCUMENT_MODULES
    .filter((module) => REVIEWABLE_STUDENT_DOCUMENT_IDS.has(module.id))
    .map(async (module) => {
      const response = await apiRequest(module.listPath, { token });
      return unwrapPage(response).map((row, index) => mapStudentDocument(module, row, index));
    });

  const documents = (await Promise.all(requests)).flat();

  return documents.sort(compareStudentDocuments);
}

async function loadStudentPracticeOverview(token) {
  const [enrollments, photos, forms, schedules] = await Promise.all([
    loadOptionalList('/api/enrollments/me', token),
    loadOptionalList('/api/practice-photos/me', token),
    loadOptionalList('/api/practice-forms/me', token),
    loadOptionalList('/api/practice-schedules/me', token),
  ]);

  return {
    enrollments,
    forms,
    photos,
    schedules,
  };
}

async function loadOptionalList(path, token) {
  return unwrapPage(await apiRequest(path, { token }));
}

async function loadRoleTasks(token, roles) {
  const requests = DOCUMENT_MODULES.filter((module) => REVIEWABLE_STUDENT_DOCUMENT_IDS.has(module.id)).flatMap((module) =>
    (module.altLists || [])
      .filter((list) => list.roles?.some((role) => roles.includes(role)))
      .map(async (list) => {
          const response = await apiRequest(list.path, { token });
          const rows = unwrapPage(response);

          return {
            count: pendingReviewCount(rows, list.path.includes('institutional-review') ? 'institutional'
              : list.path.includes('/submitted') ? (roles.includes('ROLE_DIRECTOR_PRACTICAS') ? 'director' : 'all') : 'practice'),
            Icon: DOCUMENT_TASK_ICONS[module.id] || FileText,
            label: list.label,
            moduleId: module.id,
            path: list.path,
            title: module.title,
          };
      })
  );

  if (roles.some((role) => ['ROLE_TUTOR_INSTITUCIONAL', 'ROLE_DIRECTORA_INSTITUCION'].includes(role))) {
    requests.push(apiRequest('/api/practice-forms/assigned', { token }).then((payload) => ({
      count: unwrapPage(payload).filter((form) => form.status === 'SENT').length,
      Icon: FileQuestion, title: 'Entrevistas asignadas', label: 'Por responder', moduleId: 'interviews', route: 'forms', path: '/api/practice-forms/assigned',
    })));
  }
  const tasks = (await Promise.all(requests)).filter(Boolean);

  return tasks.sort(compareRoleTasks);
}

function mapStudentDocument(module, row, index = 0) {
  const status = String(row?.status || 'DRAFT').toUpperCase();
  const feedbackCount = countActiveFeedback(row);

  return {
    key: `${module.id}-${row?.id || row?.enrollmentId || row?.createdAt || index}`,
    moduleId: module.id,
    title: module.title,
    context: studentDocumentContext(row),
    status,
    feedbackCount,
    updatedAt: row?.updatedAt || row?.submittedAt || row?.createdAt,
    nextStep: nextStepForDocument(status, feedbackCount),
  };
}

function studentDocumentContext(row) {
  return [
    row?.courseName,
    row?.educationalInstitutionName,
    row?.academicPeriod,
  ].filter(Boolean).join(' | ') || 'Documento de práctica';
}

function currentEnrollment(enrollments) {
  return enrollments.find((enrollment) => String(enrollment.status || '').toUpperCase() === 'APPROVED')
    || enrollments[0]
    || null;
}

function summarizeStudentAttendances(schedules) {
  return summarizeAttendances(schedules.flatMap((schedule) => schedule.attendances || []));
}

function formatMinutes(totalMinutes) {
  const minutes = Number(totalMinutes || 0);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} min`;
  }

  return `${hours} h ${String(rest).padStart(2, '0')} min`;
}

function nextStepForDocument(status, feedbackCount) {
  if (status === 'NEEDS_CORRECTION') {
    return feedbackCount > 0
      ? `Corrige ${feedbackCountLabel(feedbackCount)} y reenvia.`
      : 'Revisa las correcciones y reenvia.';
  }

  if (status === 'SUBMITTED') {
    return 'Espera la revisión del responsable.';
  }

  if (status === 'APPROVED') {
    return 'Documento aprobado.';
  }

  return 'Completa el documento y envialo a revisión.';
}

function feedbackCountLabel(count) {
  return `${count} ${count === 1 ? 'observacion' : 'observaciones'}`;
}

function countActiveFeedback(row) {
  const comments = Array.isArray(row?.feedbackComments) ? row.feedbackComments.length : 0;

  if (comments > 0) {
    return comments;
  }

  const scalarFeedback = Object.entries(row || {}).filter(([key, value]) =>
    /feedback|suggestions/i.test(key)
      && value !== undefined
      && value !== null
      && value !== ''
      && !Array.isArray(value)
      && typeof value !== 'object'
  ).length;
  const entryFeedback = (row?.entries || []).reduce((count, entry) =>
    count + ['feedback', 'suggestions'].filter((key) => Boolean(entry?.[key])).length,
  0);

  return scalarFeedback + entryFeedback;
}

function buildStudentDocumentSummary(documents) {
  return [
    { label: 'Borradores', value: countByStatus(documents, 'DRAFT') },
    { label: 'En revisión', value: countByStatus(documents, 'SUBMITTED') },
    { label: 'Con correcciones', value: countByStatus(documents, 'NEEDS_CORRECTION') },
    { label: 'Aprobados', value: countByStatus(documents, 'APPROVED') },
  ];
}

function countByStatus(documents, status) {
  return documents.filter((document) => document.status === status).length;
}

function compareStudentDocuments(first, second) {
  const priority = {
    NEEDS_CORRECTION: 0,
    DRAFT: 1,
    SUBMITTED: 2,
    APPROVED: 3,
  };
  const firstPriority = priority[first.status] ?? 4;
  const secondPriority = priority[second.status] ?? 4;

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  return documentTime(second.updatedAt) - documentTime(first.updatedAt);
}

function documentTime(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

const REVIEWABLE_STUDENT_DOCUMENT_IDS = new Set([
  'activity-plans',
  'practice-reports',
  'final-reports',
  'completed-records',
]);

const DOCUMENT_TASK_ICONS = {
  'activity-plans': ClipboardCheck,
  'practice-reports': FileText,
  'final-reports': FileText,
  'activity-evaluations': CheckCircle2,
  'follow-up': ClipboardCheck,
  'completed-records': ClipboardCheck,
};

function compareRoleTasks(first, second) {
  if (first.count !== second.count) {
    return second.count - first.count;
  }

  return first.title.localeCompare(second.title, 'es');
}
