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
  'bg-accent',
  'bg-warning',
  'bg-danger',
  'bg-primary-strong',
];

const metricIconClasses = [
  'sgp-visual-card-icon',
  'sgp-visual-card-icon',
  'sgp-visual-card-icon',
  'sgp-visual-card-icon',
  'sgp-visual-card-icon',
];

const visualVariants = ['a', 'b', 'c', 'd', 'e'];

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
                className={`sgp-visual-card sgp-visual-card-${visualVariants[index % visualVariants.length]} min-h-32 rounded-lg border p-4 shadow-card`}
                key={metric.key}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 w-1 ${metricAccentClasses[index % metricAccentClasses.length]}`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="relative">
                    <p className="text-xs font-medium uppercase tracking-normal">{metric.label}</p>
                    <p className="mt-3 text-3xl font-medium leading-none text-heading dark:text-heading">{metric.value}</p>
                  </div>
                  <span className={`relative grid h-10 w-10 flex-none place-items-center rounded-full border-4 border-panel shadow-card ${metricIconClasses[index % metricIconClasses.length]}`}>
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
            description="Pendientes, correcciones y aprobaciones organizadas por paralelo."
            title="Revision por paralelo"
          >
            <DataTable
              columns={COURSE_COLUMNS}
              emptyText="Aun no hay paralelos con documentos revisables."
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
  { key: 'courseName', header: 'Paralelo' },
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
