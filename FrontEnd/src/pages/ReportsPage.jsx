import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { DataTable } from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { Skeleton } from '../components/ui/Skeleton';

const metricAccentClasses = [
  'bg-primary',
  'bg-[#529914]',
  'bg-[#ad852d]',
  'bg-[#9f2933]',
  'bg-[#074462]',
];

const metricIconClasses = [
  'bg-[#d7e4e9] text-primary dark:bg-[#66bdf2]/15 dark:text-[#cbeafe]',
  'bg-[#e4f0d8] text-[#3f760f] dark:bg-[#75c66a]/15 dark:text-[#bbf7d0]',
  'bg-[#f1eadb] text-[#7a4f00] dark:bg-[#f4c84a]/15 dark:text-[#f6df8e]',
  'bg-[#f3e6e5] text-[#7d1f28] dark:bg-[#ff5a66]/15 dark:text-[#fecdd3]',
  'bg-[#dce8ed] text-[#074462] dark:bg-[#2dd4bf]/15 dark:text-[#b5f4e8]',
];

export function ReportsPage() {
  const { token } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadReport() {
      setLoading(true);
      setError('');

      try {
        const data = await apiRequest('/api/reports/coordination', { token });

        if (active) {
          setReport(data);
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

    loadReport();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <>
      <PageHeader
        eyebrow="Coordinacion"
        title="Seguimiento general"
        description="Consulta pendientes, correcciones, aprobaciones y tiempos de revision del proceso de practicas."
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <SectionCard>
          <Skeleton lines={6} />
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {(report?.summary || []).map((metric, index) => (
              <section
                className="relative min-h-32 overflow-hidden rounded-lg border border-[#04344c]/15 bg-white p-4 shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#529914]/30 hover:shadow-[0_14px_28px_rgba(62,65,61,0.08)] dark:border-slate-700 dark:bg-surface"
                key={metric.key}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 w-1 ${metricAccentClasses[index % metricAccentClasses.length]}`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-normal text-muted">{metric.label}</p>
                    <p className="mt-3 text-3xl font-extrabold leading-none text-[#20282d] dark:text-slate-50">{metric.value}</p>
                  </div>
                  <span className={`grid h-10 w-10 flex-none place-items-center rounded-lg ${metricIconClasses[index % metricIconClasses.length]}`}>
                    <BarChart3 aria-hidden="true" size={20} />
                  </span>
                </div>
              </section>
            ))}
          </div>

          <SectionCard
            description="Cantidad de documentos en borrador, revision, correccion y aprobacion."
            title="Estado de documentos"
          >
            <DataTable
              columns={DOCUMENT_STATUS_COLUMNS}
              emptyText="Aun no hay documentos para mostrar."
              rows={report?.documentsByType || []}
            />
          </SectionCard>

          <SectionCard
            description="Pendientes, correcciones y aprobaciones organizadas por curso."
            title="Revision por curso"
          >
            <DataTable
              columns={COURSE_COLUMNS}
              emptyText="Aun no hay cursos con documentos revisables."
              rows={report?.approvalsByCourse || []}
            />
          </SectionCard>

          <SectionCard
            description="Tiempo promedio desde el envio del documento hasta su aprobacion."
            title="Tiempo de revision"
          >
            <DataTable
              columns={REVIEW_TIME_COLUMNS}
              emptyText="Aun no hay revisiones completadas."
              rows={report?.reviewTimes || []}
            />
          </SectionCard>
        </>
      )}
    </>
  );
}

const DOCUMENT_STATUS_COLUMNS = [
  { key: 'documentType', header: 'Documento' },
  { key: 'draft', header: 'Borrador' },
  { key: 'submitted', header: 'Pendiente' },
  { key: 'needsCorrection', header: 'Correcciones' },
  { key: 'approved', header: 'Aprobado' },
  { key: 'total', header: 'Total' },
];

const COURSE_COLUMNS = [
  { key: 'courseName', header: 'Curso' },
  { key: 'pending', header: 'Pendientes' },
  { key: 'needsCorrection', header: 'Correcciones' },
  { key: 'approved', header: 'Aprobados' },
  {
    key: 'averageReviewHours',
    header: 'Horas promedio',
    render: (row) => formatHours(row.averageReviewHours),
  },
];

const REVIEW_TIME_COLUMNS = [
  { key: 'documentType', header: 'Documento' },
  { key: 'reviewedDocuments', header: 'Revisados' },
  {
    key: 'averageReviewHours',
    header: 'Horas promedio',
    render: (row) => formatHours(row.averageReviewHours),
  },
];

function formatHours(value) {
  return value || value === 0 ? `${value} h` : '-';
}
