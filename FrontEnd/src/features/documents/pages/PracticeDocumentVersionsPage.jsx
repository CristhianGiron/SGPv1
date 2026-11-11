/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDocumentVersionsPage.jsx
 * @fecha         2026-11-10 22:13:37
 * @nota          Implementa el componente PracticeDocumentVersionsPage de la interfaz del SGP.
 */

import { useEffect,useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { usePracticeWorkspace } from '../../practices/context/PracticeWorkspaceContext';
import { apiRequest,apiBlob } from '../../../api/client';
import { DOCUMENT_LABELS } from '../../../config/practiceManagement';
import { labelFromKey,formatEnum } from '../../../utils/format';
import { SectionCard } from '../../../components/ui/SectionCard';
import { SecondaryButton } from '../../../components/ui/ActionBar';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { Alert } from '../../../components/ui/Alert';
const events={LEGACY_LETTERHEAD_ATTACHED:'Membrete anterior completado',BASELINE:'Contenido anterior conservado',SUBMITTED:'Entrega enviada',REVIEWED:'Decisión de revisión',SAVED:'Registro guardado',INSTITUTIONAL_SECTION:'Sección institucional actualizada'};
export function PracticeDocumentVersionsPage(){
 const {token,roles}=useAuth(),practice=usePracticeWorkspace();const [rows,setRows]=useState([]),[snapshot,setSnapshot]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[kind,setKind]=useState('');
 const confirm=useConfirm();const [message,setMessage]=useState('');
 const base=`/api/enrollments/${practice?.id}/document-versions`;
 useEffect(()=>{let active=true;setBusy(true);setSnapshot(null);apiRequest(base,{token}).then(rows=>{if(active)setRows(Array.isArray(rows)?rows:[]);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[base,token]);
 async function capture(){
  if(!await confirm({title:'Conservar documentos anteriores',description:'Se conservará una copia del estado actual de los documentos ya aprobados y de las evaluaciones o seguimientos anteriores. La fecha será la de esta captura; no reconstruye revisiones pasadas.',confirmLabel:'Conservar documentos anteriores'}))return;
  setBusy(true);setError('');try{const result=await apiRequest(`${base}/baseline`,{token,method:'POST'});setRows(await apiRequest(base,{token}));setMessage(`Se conservaron ${result.captured} documento(s) anteriores.`);}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function open(row){setError('');setBusy(true);try{setSnapshot({row,data:await apiRequest(`${base}/${row.id}`,{token})});}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function pdf(row){setError('');try{const blob=await apiBlob(`${base}/${row.id}/pdf`,token);const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${row.kind}-version-${row.revisionNumber}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(e.message);}}
 return <div className="space-y-5"><SectionCard title="Versiones de documentos" description="Consulta el contenido que se envió y las decisiones registradas sobre cada versión. Las versiones anteriores se conservan por separado.">
  {error&&<Alert tone="error">{error}</Alert>}{message&&<Alert tone="success">{message}</Alert>}
  {roles.some(r=>['ROLE_ADMIN','ROLE_DIRECTOR_PRACTICAS','ROLE_TUTOR_PRACTICAS','ROLE_TUTOR_INSTITUCIONAL'].includes(r))&&<div className="mb-4"><SecondaryButton disabled={busy} onClick={capture}>Conservar documentos anteriores</SecondaryButton></div>}<label className="block text-sm text-body">Documento<select aria-label="Filtrar versiones por documento" className="ml-3 rounded border border-line bg-panel p-2" value={kind} onChange={e=>setKind(e.target.value)}><option value="">Todos</option>{Object.entries(DOCUMENT_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
  {busy&&<p role="status">Cargando versiones…</p>}{!busy&&!rows.length&&<p className="mt-4 text-sm text-body">Todavía no hay versiones conservadas. Se registran al enviar o revisar documentos y al guardar evaluaciones o seguimientos.</p>}
  <ul className="mt-4 divide-y divide-line">{rows.filter(r=>!kind||r.kind===kind).map(row=><li key={row.id} className="space-y-2 py-4"><h3 className="font-medium text-heading">{DOCUMENT_LABELS[row.kind]} · Versión {row.revisionNumber}</h3><p className="text-sm text-body">{events[row.event]||row.event} · {row.documentStatus==='SAVED'?'Registrado':formatEnum(row.documentStatus)} · {row.actor}</p><p className="text-xs text-muted">{new Date(row.createdAt).toLocaleString('es-EC')}</p><div className="flex flex-wrap gap-3"><SecondaryButton disabled={busy} onClick={()=>open(row)}>Consultar versión {row.revisionNumber}</SecondaryButton>{row.hasPdf&&<SecondaryButton onClick={()=>pdf(row)}>Descargar PDF conservado</SecondaryButton>}</div></li>)}</ul>
 </SectionCard>{snapshot&&<SectionCard title={`${DOCUMENT_LABELS[snapshot.row.kind]} · Versión ${snapshot.row.revisionNumber}`}>
  <Alert tone="info">Contenido histórico de consulta. Las modificaciones del documento actual no alteran esta versión.</Alert><Snapshot data={snapshot.data}/><SecondaryButton onClick={()=>setSnapshot(null)}>Cerrar versión</SecondaryButton>
 </SectionCard>}</div>;
}
function Snapshot({data}){
 if(data==null)return null;if(Array.isArray(data))return <ol className="space-y-3">{data.map((row,index)=><li key={index} className="rounded border border-line p-3"><Snapshot data={row}/></li>)}</ol>;
 if(typeof data!=='object')return <span className="whitespace-pre-wrap break-words text-sm text-body">{typeof data==='boolean'?(data?'Sí':'No'):String(data)}</span>;
 return <dl className="my-4 space-y-3">{Object.entries(data).filter(([key,value])=>value!=null&&value!==''&&!/^(id|rowVersion)$|Id$|Url$|^coverImage|^institutionLogo/.test(key)).map(([key,value])=><div key={key}><dt className="text-sm font-medium text-heading">{labelFromKey(key)}</dt><dd className="mt-1"><Snapshot data={value}/></dd></div>)}</dl>;
}
