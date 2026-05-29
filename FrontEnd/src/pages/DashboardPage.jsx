import { useEffect, useState } from 'react';
import {
  Activity,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Eye,
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
  const [studentDocuments, setStudentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      setError('');

      try {
        const requests = [];
        let studentDocumentsRequest = Promise.resolve([]);

        if (isStudent) {
          requests.push(
            apiRequest('/api/enrollments/me', { token }).then((data) => ({
              label: 'Inscripciones',
              value: data.length,
            })),
            apiRequest('/api/practice-photos/me', { token }).then((data) => ({
              label: 'Evidencias',
              value: data.length,
            }))
          );
          studentDocumentsRequest = loadStudentDocuments(token);
        } else {
          setStudentDocuments([]);
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

        const [statResults, documentResult] = await Promise.all([
          Promise.allSettled(requests),
          studentDocumentsRequest
            .then((value) => ({ status: 'fulfilled', value }))
            .catch((reason) => ({ status: 'rejected', reason })),
        ]);
        const nextStats = statResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);
        const nextStudentDocuments = documentResult.status === 'fulfilled' ? documentResult.value : [];
        const hasPartialError =
          statResults.some((result) => result.status === 'rejected') ||
          documentResult.status === 'rejected';

        if (active) {
          setStats(nextStats);
          setStudentDocuments(nextStudentDocuments);
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

      {isStudent && !loading && <StudentDocumentsPanel documents={studentDocuments} />}
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
                window.location.hash = `#/${action.id}`;
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
          window.location.hash = `#/documents/${document.moduleId}`;
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

const STAT_ICONS = {
  Inscripciones: ClipboardCheck,
  Fotos: Image,
  Usuarios: UsersRound,
  Evidencias: Image,
  Facultades: Building2,
  'Planes por revisar': CheckCircle2,
  'Informes por revisar': FileText,
};
