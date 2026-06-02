import { useEffect, useState } from 'react';
import {
  Activity,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  FileQuestion,
  FileText,
  Image,
  UsersRound,
} from 'lucide-react';
import { apiRequest, unwrapPage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DOCUMENT_MODULES } from '../config/endpointModules';
import { NAV_ITEMS, canAccess } from '../config/navigation';
import { formatValue } from '../utils/format';
import { setHashRoute } from '../utils/routes';

const statAccentClasses = [
  'bg-primary',
  'bg-[#529914]',
  'bg-[#ad852d]',
  'bg-[#9f2933]',
];

const statIconClasses = [
  'bg-[#d7e4e9] text-primary dark:bg-[#66bdf2]/15 dark:text-[#cbeafe]',
  'bg-[#e4f0d8] text-[#3f760f] dark:bg-[#75c66a]/15 dark:text-[#bbf7d0]',
  'bg-[#f1eadb] text-[#7a4f00] dark:bg-[#f4c84a]/15 dark:text-[#f6df8e]',
  'bg-[#f3e6e5] text-[#7d1f28] dark:bg-[#ff5a66]/15 dark:text-[#fecdd3]',
];

export function DashboardPage() {
  const { token, roles, profile } = useAuth();
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const quickActions = buildQuickActions(roles);
  const [stats, setStats] = useState([]);
  const [studentOverview, setStudentOverview] = useState(null);
  const [studentDocuments, setStudentDocuments] = useState([]);
  const [roleTasks, setRoleTasks] = useState([]);
  const [loading, setLoading] = useState(true);
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
              value: data.length,
            })),
            apiRequest('/api/practice-reports/review/summary', { token }).then((data) => ({
              label: 'Informes por revisar',
              value: data.length,
            }))
          );
        }

        if (requests.length === 0) {
          requests.push(Promise.resolve({ label: 'Sesion', value: 'activa' }));
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
          setStats(nextStats);
          setStudentOverview(nextStudentOverview);
          setStudentDocuments(nextStudentDocuments);
          setRoleTasks(nextRoleTasks);
          setError(hasPartialError ? 'No se pudo cargar todo el resumen. Los accesos principales siguen disponibles.' : '');
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

  return (
    <>
      <PageHeader
        eyebrow="Inicio"
        title={`Hola, ${profile?.names || profile?.username || 'usuario'}`}
        description="Tus accesos principales y tareas pendientes en un solo lugar."
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <SectionCard>
          <Skeleton lines={5} />
        </SectionCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item, index) => (
            <StatCard index={index} item={item} key={item.label} />
          ))}
        </div>
      )}

      <QuickActionsPanel actions={quickActions} />

      {isStudent && !loading && (
        <>
          <StudentPracticeFilePanel documents={studentDocuments} overview={studentOverview} />
          <StudentDocumentsPanel documents={studentDocuments} />
        </>
      )}
      {!isStudent && !loading && <RoleTasksPanel tasks={roleTasks} />}
    </>
  );
}

function StatCard({ index, item }) {
  const Icon = STAT_ICONS[item.label] || Activity;
  const accentClass = statAccentClasses[index % statAccentClasses.length];
  const iconClass = statIconClasses[index % statIconClasses.length];

  return (
    <section className="relative min-h-32 overflow-hidden rounded-lg border border-[#04344c]/15 bg-white p-4 shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#529914]/30 hover:shadow-[0_14px_28px_rgba(62,65,61,0.08)] dark:border-slate-700 dark:bg-surface">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${accentClass}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-normal text-muted">{item.label}</p>
          <p className="mt-3 text-3xl font-extrabold leading-none text-[#20282d] dark:text-slate-50">{item.value}</p>
        </div>
        <span className={`grid h-10 w-10 flex-none place-items-center rounded-lg ${iconClass}`}>
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>
    </section>
  );
}

function QuickActionsPanel({ actions }) {
  if (!actions.length) {
    return null;
  }

  return (
    <SectionCard title="Accesos principales">
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
        {actions.map((action) => {
          const Icon = action.Icon || Activity;

          return (
            <button
              className="group flex min-h-[4.2rem] w-full items-center gap-3 rounded-lg border border-[#529914] bg-transparent p-3 text-left text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-700 dark:bg-surface dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]"
              key={action.id}
              onClick={() => {
                setHashRoute(action.id);
              }}
              type="button"
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[#e4f0d8] text-[#3f760f] transition-colors group-hover:bg-[#04344c] group-hover:text-white dark:bg-white/10 dark:text-[#bbf7d0] dark:group-hover:bg-[#203026]">
                <Icon aria-hidden="true" size={19} />
              </span>
              <span className="min-w-0 text-sm font-[850] leading-tight">{action.label}</span>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

function StudentDocumentsPanel({ documents }) {
  const summary = buildStudentDocumentSummary(documents);

  return (
    <SectionCard
      description="Revisa el estado de tus documentos y la siguiente accion pendiente."
      title="Mis documentos"
    >
      {documents.length === 0 ? (
        <Alert dismissible={false} tone="info">Aun no tienes documentos creados para tu practica.</Alert>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <div className="rounded-lg border border-[#c8d2cd] bg-[#eef3f2] p-3 dark:border-slate-700 dark:bg-surface-soft" key={item.label}>
                <p className="text-xs font-extrabold uppercase text-muted">{item.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#20282d] dark:text-slate-50">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#c8d2cd] bg-white dark:border-slate-700 dark:bg-surface">
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
      description="Vista rapida de tu pertenencia, avances y registros principales."
      title="Expediente de practica"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
        <div className="rounded-lg border border-[#c8d2cd] bg-[#eef3f2] p-4 dark:border-slate-700 dark:bg-surface-soft">
          <p className="text-xs font-extrabold uppercase text-muted">Pertenencia actual</p>
          <h3 className="mt-2 text-lg font-extrabold leading-tight text-[#20282d] dark:text-slate-50">
            {enrollment?.studentFullName || enrollment?.student || 'Estudiante'}
          </h3>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-[#34443b] dark:text-slate-200">
            <PracticeFileLine label="Paralelo" value={enrollment?.courseName} />
            <PracticeFileLine label="Grupo" value={enrollment?.groupName} />
            <PracticeFileLine label="Institucion" value={enrollment?.educationalInstitutionName} />
            <PracticeFileLine label="Tutor de practicas" value={enrollment?.practiceTutor} />
            <PracticeFileLine label="Tutor institucional" value={enrollment?.institutionalTutor} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
      <span className="text-xs font-extrabold uppercase text-muted">{label}</span>
      <span className="min-w-0 break-words">{value || '-'}</span>
    </div>
  );
}

function PracticeFileMetric({ Icon, detail, label, route, value }) {
  return (
    <button
      className="group flex min-h-[6.2rem] items-start gap-3 rounded-lg border border-[#c8d2cd] bg-white p-4 text-left shadow-card transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-[#529914] hover:bg-[#f8fbf5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-700 dark:bg-surface dark:hover:bg-[#203026]"
      onClick={() => setHashRoute(route)}
      type="button"
    >
      <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-[#e4f0d8] text-[#3f760f] dark:bg-white/10 dark:text-[#bbf7d0]">
        <Icon aria-hidden="true" size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-extrabold uppercase text-muted">{label}</span>
        <span className="mt-1 block text-xl font-extrabold text-[#20282d] dark:text-slate-50">{value}</span>
        <span className="mt-1 block text-xs font-bold text-muted">{detail}</span>
      </span>
    </button>
  );
}

function RoleTasksPanel({ tasks }) {
  const importantTasks = tasks.filter((task) => task.count > 0);

  return (
    <SectionCard
      description="Atiende revisiones y seguimientos desde el documento o modulo correspondiente."
      title="Tareas pendientes"
    >
      {importantTasks.length === 0 ? (
        <Alert dismissible={false} tone="success">
          No tienes revisiones pendientes en este momento.
        </Alert>
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
      className="group grid min-h-[6rem] gap-3 rounded-lg border border-[#c8d2cd] bg-white p-4 text-left shadow-card transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-[#529914] hover:bg-[#f8fbf5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-700 dark:bg-surface dark:hover:bg-[#203026]"
      onClick={() => setHashRoute(`documents/${task.moduleId}`)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-[#e4f0d8] text-[#3f760f] dark:bg-white/10 dark:text-[#bbf7d0]">
          <Icon aria-hidden="true" size={20} />
        </span>
        <span className="rounded-full border border-[#529914]/30 bg-[#e4f0d8] px-2.5 py-1 text-xs font-extrabold text-[#3f760f] dark:border-[#75c66a]/35 dark:bg-[#75c66a]/10 dark:text-[#bbf7d0]">
          {task.count}
        </span>
      </div>
      <div>
        <p className="text-sm font-extrabold text-[#20282d] dark:text-slate-50">{task.title}</p>
        <p className="mt-1 text-xs font-bold text-muted">{task.label}</p>
      </div>
    </button>
  );
}

function buildQuickActions(roles) {
  return NAV_ITEMS
    .filter((item) => !['dashboard', 'notifications', 'profile'].includes(item.id))
    .filter((item) => canAccess(item, roles))
    .map((item) => {
      const firstChild = (item.children || []).find((child) => canAccess(child, roles));

      return {
        id: firstChild?.id || item.id,
        baseId: item.id,
        label: item.label,
        Icon: item.Icon,
      };
    })
    .slice(0, 6);
}

function StudentDocumentRow({ document }) {
  return (
    <div className="grid gap-3 border-b border-[#dbe3ed] p-3 last:border-b-0 dark:border-slate-700 lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1.2fr)_auto] lg:items-center">
      <div>
        <p className="text-sm font-extrabold text-[#20282d] dark:text-slate-50">{document.title}</p>
        <p className="mt-1 text-xs font-semibold text-muted">{document.context}</p>
      </div>

      <StatusBadge status={document.status} />

      <div>
        <p className="text-sm font-semibold text-[#34443b] dark:text-slate-200">{document.nextStep}</p>
        <p className="mt-1 text-xs font-semibold text-muted">
          Actualizado: {formatValue(document.updatedAt, 'updatedAt')}
        </p>
      </div>

      <button
        className="inline-flex min-h-[2.55rem] items-center justify-center rounded-lg border border-[#529914] bg-transparent px-4 py-2 text-sm font-extrabold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600 dark:bg-surface dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]"
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
      try {
        const response = await apiRequest(module.listPath, { token });
        return unwrapPage(response).map((row, index) => mapStudentDocument(module, row, index));
      } catch {
        return [];
      }
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
  try {
    return unwrapPage(await apiRequest(path, { token }));
  } catch {
    return [];
  }
}

async function loadRoleTasks(token, roles) {
  const requests = DOCUMENT_MODULES.flatMap((module) =>
    (module.altLists || [])
      .filter((list) => list.roles?.some((role) => roles.includes(role)))
      .map(async (list) => {
        try {
          const response = await apiRequest(list.path, { token });
          const rows = unwrapPage(response);

          return {
            count: rows.length,
            Icon: DOCUMENT_TASK_ICONS[module.id] || FileText,
            label: list.label,
            moduleId: module.id,
            path: list.path,
            title: module.title,
          };
        } catch {
          return null;
        }
      })
  );

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
  ].filter(Boolean).join(' | ') || 'Documento de practica';
}

function currentEnrollment(enrollments) {
  return enrollments.find((enrollment) => String(enrollment.status || '').toUpperCase() === 'APPROVED')
    || enrollments[0]
    || null;
}

function summarizeStudentAttendances(schedules) {
  return schedules.reduce(
    (summary, schedule) => {
      (schedule.attendances || []).forEach((attendance) => {
        summary.total += 1;

        if (['PRESENT', 'LATE', 'JUSTIFIED'].includes(attendance.status)) {
          summary.assistedMinutes += Number(attendance.totalMinutes || 0);
        }
      });

      return summary;
    },
    { assistedMinutes: 0, total: 0 },
  );
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
    return 'Espera la revision del responsable.';
  }

  if (status === 'APPROVED') {
    return 'Documento aprobado.';
  }

  return 'Completa el documento y envialo a revision.';
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
    { label: 'En revision', value: countByStatus(documents, 'SUBMITTED') },
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

const STAT_ICONS = {
  Inscripciones: ClipboardCheck,
  Fotos: Image,
  Usuarios: UsersRound,
  Evidencias: Image,
  Facultades: Building2,
  'Planes por revisar': CheckCircle2,
  'Informes por revisar': FileText,
};
