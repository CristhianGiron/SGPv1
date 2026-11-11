/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PdfPreviewDialog.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente PdfPreviewDialog de la interfaz del SGP.
 */

import { useEffect, useState } from 'react';
import { apiBlob } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Modal } from './Modal';
import { SecondaryButton } from './ActionBar';

export function PdfPreviewDialog({ path, onClose }) {
  const { token } = useAuth();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!path) return undefined;
    let active = true, objectUrl = '';
    setUrl(''); setError('');
    apiBlob(path, token).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(error => { if (active) setError(error.message || 'No se pudo cargar la vista previa.'); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path, token, attempt]);
  return <Modal open={Boolean(path)} title="Vista previa del PDF" onClose={onClose} maxWidth="max-w-6xl"
    footer={<SecondaryButton onClick={onClose}>Cerrar vista previa</SecondaryButton>}>
    <div className="space-y-3">
      <p className="rounded-lg border border-info/30 bg-info-soft p-3 text-sm text-info-strong">Revisa los datos, el membrete, las horas y los espacios de firma. Esta vista previa no envía ni aprueba el documento.</p>
      {error ? <div role="alert" className="space-y-3 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger-strong"><p>{error}</p><SecondaryButton onClick={() => setAttempt(value => value + 1)}>Reintentar vista previa</SecondaryButton></div>
        : !url ? <p role="status">Generando vista previa…</p>
        : <><div className="flex flex-wrap gap-3 text-sm"><a className="text-primary underline" href={url} target="_blank" rel="noreferrer">Abrir en otra pestaña</a><a className="text-primary underline" href={url} download="vista-previa.pdf">Descargar vista previa</a></div><iframe title="Documento PDF de vista previa" src={url} className="h-[60vh] min-h-80 w-full rounded-lg border border-line" /><p className="text-xs text-muted">Si tu navegador no muestra el documento, utiliza Abrir en otra pestaña o Descargar vista previa.</p></>}
    </div>
  </Modal>;
}
