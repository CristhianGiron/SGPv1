/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanContinuity.jsx
 * @fecha         2026-11-10 21:24:04
 * @nota          Implementa el componente DidacticPlanContinuity de la interfaz del SGP.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { apiRequest, apiBlob } from '../../../api/client';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { Field, Textarea } from '../../../components/ui/FormControls';
import { SecondaryButton } from '../../../components/ui/ActionBar';
import { Alert } from '../../../components/ui/Alert';
export function DidacticPlanContinuity({ plan, operational, onChanged, renderSnapshot }) {
 const { token,roles,profile }=useAuth();const confirm=useConfirm();
 const [reason,setReason]=useState(''),[history,setHistory]=useState([]),[snapshot,setSnapshot]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const base=`/api/didactic-plans/${plan.id}`;
 useEffect(()=>{let active=true;setHistory([]);setSnapshot(null);setReason('');setError('');apiRequest(`${base}/revisions`,{token}).then(rows=>{if(active)setHistory(Array.isArray(rows)?rows:[]);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[base,token,plan.status]);
 const canReturn=operational&&plan.authorType==='INSTITUTIONAL_TUTOR'&&plan.status==='SUBMITTED'&&String(profile?.id)!==String(plan.authorId)&&roles.some(r=>['ROLE_TUTOR_PRACTICAS','ROLE_DIRECTOR_PRACTICAS'].includes(r));
 async function returnPlan(){
  if(!reason.trim()||!await confirm({title:'Devolver planificación institucional',description:'Se conservará una copia de la versión enviada y el tutor institucional podrá corregirla.',confirmLabel:'Devolver para corrección',tone:'warning'}))return;
  setBusy(true);setError('');try{await apiRequest(`${base}/return`,{token,method:'PATCH',body:{reason:reason.trim()}});setReason('');await onChanged();}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function openRevision(id){setError('');try{setSnapshot({id,plan:await apiRequest(`${base}/revisions/${id}`,{token})});}catch(e){setError(e.message);}}
 async function downloadRevision(){setError('');try{const blob=await apiBlob(`${base}/revisions/${snapshot.id}/pdf`,token);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`planificacion-${plan.id}-version-${snapshot.id}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(e.message);}}
 return <section className="space-y-4" aria-label="Correcciones y versiones de la planificación">
  {error&&<Alert tone="error">{error}</Alert>}
  {canReturn&&<div className="rounded border border-warning p-3"><Field label="Motivo de devolución"><Textarea value={reason} maxLength={2000} onChange={e=>setReason(e.target.value)} /></Field><SecondaryButton disabled={busy||!reason.trim()} onClick={returnPlan}>Devolver para corrección</SecondaryButton></div>}
  <details><summary className="cursor-pointer text-sm font-medium text-primary">Versiones enviadas conservadas ({history.length})</summary>
   {!history.length&&<p className="mt-2 text-sm text-body">Las versiones se conservan al devolver una planificación institucional enviada.</p>}
   <ul>{history.map(revision=><li key={revision.id} className="space-y-2 border-b border-line py-3"><p className="text-sm text-heading">Versión {revision.revisionNumber} · Devuelta por {revision.returnedBy}</p><p className="text-sm text-body">{revision.reason}</p><p className="text-xs text-muted">{new Date(revision.returnedAt).toLocaleString('es-EC')}</p><SecondaryButton onClick={()=>openRevision(revision.id)}>Consultar versión {revision.revisionNumber}</SecondaryButton></li>)}</ul>
  </details>
  {snapshot&&<div className="space-y-3"><Alert tone="info">Consulta de una versión anterior. El contenido actual de la planificación se conserva por separado.</Alert><h3 className="text-lg font-semibold text-heading">{snapshot.plan.title || 'Versión enviada'}</h3>{renderSnapshot(snapshot.plan)}{snapshot.plan.hasUploadedPdf&&<SecondaryButton onClick={downloadRevision}>Descargar PDF de esta versión</SecondaryButton>}<SecondaryButton onClick={()=>setSnapshot(null)}>Cerrar versión anterior</SecondaryButton></div>}
 </section>;
}
