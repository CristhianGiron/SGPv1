/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeIncidentsPage.jsx
 * @fecha         2026-11-10 22:13:37
 * @nota          Implementa el componente PracticeIncidentsPage de la interfaz del SGP.
 */

import { useCallback,useEffect,useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { usePracticeWorkspace } from '../context/PracticeWorkspaceContext';
import { apiRequest,unwrapPage } from '../../../api/client';
import { INCIDENT_TYPES,INCIDENT_STATES,canManagePractice } from '../../../config/practiceManagement';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Alert } from '../../../components/ui/Alert';
import { Field,Input,Select,Textarea } from '../../../components/ui/FormControls';
import { PrimaryButton,SecondaryButton } from '../../../components/ui/ActionBar';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

export function PracticeIncidentsPage({onPracticeChanged}){
 const {token,roles,profile}=useAuth(),practice=usePracticeWorkspace(),confirm=useConfirm();
 const [rows,setRows]=useState([]),[selectedId,setSelectedId]=useState(''),[responsibles,setResponsibles]=useState([]),[groups,setGroups]=useState([]);
 const [form,setForm]=useState({type:'OTHER',title:'',description:''}),[reason,setReason]=useState(''),[responsibleId,setResponsibleId]=useState(''),[groupId,setGroupId]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const manager=canManagePractice(roles),director=roles.includes('ROLE_DIRECTOR_PRACTICAS');
 const mutable=practice&&!practice.archived&&['APPROVED','SUSPENDED'].includes(practice.status),base=`/api/enrollments/${practice?.id}/incidents`;
 const selected=rows.find(r=>String(r.id)===String(selectedId));
 const load=useCallback(async()=>{
  const data=await apiRequest(base,{token});setRows(Array.isArray(data)?data:[]);
  if(manager){const [r,g]=await Promise.all([apiRequest(`${base}/responsibles`,{token}),apiRequest(`/api/courses/${practice.courseId}/groups`,{token})]);setResponsibles(unwrapPage(r));setGroups(unwrapPage(g).filter(g=>g.active&&!g.deleted));}
 },[base,token,manager,practice?.courseId]);
 useEffect(()=>{let active=true;setBusy(true);setError('');load().catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[load]);
 useEffect(()=>{setReason('');setResponsibleId('');setGroupId('');},[selectedId]);
 async function run(action,text){setBusy(true);setError('');setMessage('');try{await action();await load();setMessage(text);}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function create(event){event.preventDefault();await run(async()=>{const created=await apiRequest(base,{token,method:'POST',body:form});setSelectedId(String(created.id));setForm({type:'OTHER',title:'',description:''});},'Incidencia registrada. El personal académico recibirá el aviso.');}
 async function change(action,approved){
  if(!selected||!reason.trim())return;
  if(action==='decide'&&!await confirm({title:approved?'Resolver y aplicar decisión':'Rechazar incidencia',description:approved?'Se aplicará el cambio académico correspondiente. Los documentos y horas anteriores se conservarán.':'Se cerrará esta incidencia sin aplicar cambios académicos.',details:selected.title,confirmLabel:approved?'Resolver incidencia':'Rechazar incidencia',tone:'warning'}))return;
  await run(async()=>{
   const body=action==='assign'?{responsibleId:Number(responsibleId),reason}:action==='decide'?{approved,reason,targetGroupId:groupId?Number(groupId):null}:{reason};
   await apiRequest(`/api/incidents/${selected.id}/${action}`,{token,method:'PATCH',body});setReason('');
   if(action==='decide'&&onPracticeChanged)await onPracticeChanged();
  },'Seguimiento actualizado.');
 }
 if(!practice)return <Alert tone="info">Abre una práctica para consultar sus incidencias.</Alert>;
 const terminal=selected&&['RESOLVED','REJECTED'].includes(selected.status);
 return <div className="space-y-5">
  <SectionCard title="Incidencias y cambios de la práctica" description="Comunica una situación, consulta su seguimiento y conserva el motivo de las decisiones.">
   {error&&<Alert tone="error">{error}</Alert>}{message&&<Alert tone="success">{message}</Alert>}
   {!mutable&&<Alert tone="info">El historial se conserva para consulta. Esta práctica no admite nuevas gestiones de incidencias.</Alert>}
   {mutable&&<details><summary className="cursor-pointer py-3 text-primary">Registrar una incidencia</summary><form onSubmit={create} className="mt-3 grid gap-3">
    <Field label="Tipo de incidencia"><Select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{Object.entries(INCIDENT_TYPES).map(([v,l])=><option key={v} value={v}>{l}</option>)}</Select></Field>
    <Field label="Título de la incidencia"><Input required maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field>
    <Field label="Descripción de la situación"><Textarea required maxLength={4000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field>
    <PrimaryButton type="submit" disabled={busy||!form.title.trim()||!form.description.trim()}>Registrar incidencia</PrimaryButton>
   </form></details>}
   <div className="mt-4 space-y-2">{!rows.length&&!busy&&<p className="text-sm text-body">No hay incidencias registradas.</p>}{rows.map(row=><button key={row.id} type="button" className="w-full rounded border border-line p-3 text-left text-heading" onClick={()=>setSelectedId(String(row.id))}><span className="font-medium">{row.title}</span><span className="mt-1 block text-sm text-body">{INCIDENT_TYPES[row.type]} · {INCIDENT_STATES[row.status]} · {row.responsible||'Sin responsable asignado'}</span></button>)}</div>
  </SectionCard>
  {selected&&<SectionCard title={selected.title} description={`${INCIDENT_TYPES[selected.type]} · ${INCIDENT_STATES[selected.status]}`}>
   <p className="whitespace-pre-wrap break-words text-sm text-body">{selected.description}</p>
   <p className="mt-2 text-xs text-muted">Registrada por {selected.createdBy} · {new Date(selected.createdAt).toLocaleString('es-EC')}</p>
   {mutable&&!terminal&&<div className="mt-5 space-y-3">
    {(manager||String(selected.responsibleId)===String(profile?.id))&&<Field label="Motivo o evaluación"><Textarea required maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)}/></Field>}
    {manager&&<div className="flex flex-wrap items-end gap-3"><Field label="Responsable de la incidencia"><Select value={responsibleId} onChange={e=>setResponsibleId(e.target.value)}><option value="">Seleccionar responsable</option>{responsibles.map(a=><option key={a.id} value={a.id}>{a.name} ({a.username})</option>)}</Select></Field><SecondaryButton disabled={busy||!responsibleId||!reason.trim()} onClick={()=>change('assign')}>Asignar responsable</SecondaryButton></div>}
    {selected.status==='ASSIGNED'&&(director||String(selected.responsibleId)===String(profile?.id))&&<SecondaryButton disabled={busy||!reason.trim()} onClick={()=>change('evaluate')}>Iniciar evaluación</SecondaryButton>}
    {director&&selected.status==='UNDER_REVIEW'&&<>
     {['CHANGE_INSTITUTION','CHANGE_INSTITUTIONAL_TUTOR'].includes(selected.type)&&<Field label="Nuevo grupo receptor"><Select value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">Seleccionar grupo</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name} · {g.institutionalTutor||'Tutor pendiente'}</option>)}</Select></Field>}
     <div className="flex flex-wrap gap-3"><PrimaryButton disabled={busy||!reason.trim()||(['CHANGE_INSTITUTION','CHANGE_INSTITUTIONAL_TUTOR'].includes(selected.type)&&!groupId)} onClick={()=>change('decide',true)}>Resolver y aplicar cambio</PrimaryButton><SecondaryButton disabled={busy||!reason.trim()} onClick={()=>change('decide',false)}>Rechazar incidencia</SecondaryButton></div>
    </>}
   </div>}
   <h3 className="mt-6 font-semibold text-heading">Historial de seguimiento</h3><ol className="mt-3 space-y-3">{selected.events.map(event=><li key={event.id} className="border-l-2 border-line pl-3"><p className="text-sm font-medium text-heading">{INCIDENT_STATES[event.newStatus]} · {event.actor}</p><p className="whitespace-pre-wrap break-words text-sm text-body">{event.reason}</p>{event.effects&&<p className="text-sm text-body">{event.effects}</p>}<time className="text-xs text-muted">{new Date(event.createdAt).toLocaleString('es-EC')}</time></li>)}</ol>
  </SectionCard>}
 </div>;
}
