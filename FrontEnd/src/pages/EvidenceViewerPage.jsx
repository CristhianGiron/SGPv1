import { useEffect, useMemo, useState } from 'react';
import { apiBlob } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { useHashRoute } from '../utils/routes';

function evidenceSourceFromRoute(route) {
  const query = String(route || '').split('?')[1] || '';
  const params = new URLSearchParams(query);
  return params.get('src') || '';
}

export function EvidenceViewerPage() {
  const route = useHashRoute();
  const { token } = useAuth();
  const sourceUrl = useMemo(() => evidenceSourceFromRoute(route), [route]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    setImageUrl('');
    setError('');

    if (!sourceUrl) {
      return undefined;
    }

    if (sourceUrl.startsWith('blob:')) {
      setImageUrl(sourceUrl);
      return undefined;
    }

    setLoading(true);
    apiBlob(sourceUrl, token)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setImageUrl(objectUrl);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'No se pudo cargar la evidencia.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sourceUrl, token]);

  return (
    <>
      <PageHeader
        eyebrow="Evidencia"
        title="Vista de imagen"
        description="Consulta la evidencia seleccionada desde el registro de actividades."
      />

      {error && <Alert tone="error">{error}</Alert>}

      <SectionCard>
        {!sourceUrl ? (
          <p className="text-sm text-muted">No se recibio un enlace de evidencia.</p>
        ) : loading ? (
          <p className="text-sm text-muted">Cargando imagen...</p>
        ) : imageUrl ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-[#c8d2cd] bg-[#eef3f2] dark:border-slate-700 dark:bg-surface-soft">
              <img
                alt="Evidencia de practica"
                className="max-h-[calc(100vh-15rem)] w-full object-contain"
                src={imageUrl}
              />
            </div>
            <p className="break-all text-xs text-muted">{sourceUrl}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">No hay imagen disponible.</p>
        )}
      </SectionCard>
    </>
  );
}
