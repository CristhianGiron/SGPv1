/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDeadlinesPage.jsx
 * @fecha         2026-11-10 22:13:37
 * @nota          Implementa el componente PracticeDeadlinesPage de la interfaz del SGP.
 */

import { useCallback,useEffect,useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { usePracticeWorkspace } from '../context/PracticeWorkspaceContext';
import { apiRequest } from '../../../api/client';
import { DOCUMENT_LABELS,DEADLINE_STAGES,DEADLINE_STATES,canManagePractice } from '../../../config/practiceManagement';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Alert } from '../../../components/ui/Alert';
import { Field,Input,Select,Textarea } from '../../../components/ui/FormControls';
import { PrimaryButton } from '../../../components/ui/ActionBar';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
export function PracticeDeadlinesPage(){
 const {token,roles}=useAuth(),practice=usePracticeWorkspace(),confirm=useConfirm();const base=`/api/enrollments/${practice?.id}/deadlines`;
 const [rows,setRows]=useState([]),[form,setForm]=useState({kind:'L2',stage:'SUBMISSION',dueAt:'',reminderHours:48,reason:''}),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const manager=canManagePractice(roles),operational=practice?.status==='APPROVED'&&!practice?.archived&&practice?.courseActive!==false;
 const load=useCallback(async()=>{setRows(await apiRequest(base,{token}));},[base,token]);
 useEffect(()=>{let active=true;setBusy(true);load().catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[load]);
 const stages=Object.entries(DEADLINE_STAGES).filter(([key])=>form.kind==='L4'||form.kind==='L5'?key==='SUBMISSION':key!=='INSTITUTIONAL_REVIEW'||form.kind==='L3');
 async function save(event){event.preventDefault();if(!await confirm({title:'Establecer plazo académico',description:'Se actualizará el plazo de este documento y etapa. Los avisos se dirigirán a los responsables actuales. El vencimiento no cierra ni bloquea la práctica.',details:form.dueAt+' · Hora de Ecuador',confirmLabel:'Guardar plazo'}))return;
  setBusy(true);setError('');setMessage('');try{await apiRequest(base,{token,method:'PUT',body:{...form,reminderHours:Number(form.reminderHours)}});await load();setMessage('Plazo guardado. Los recordatorios se revisan periódicamente.');setForm({...form,reason:''});}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <SectionCard title="Plazos y responsables" description="Fechas de entrega y revisión de esta práctica. Todas las horas se interpretan en Ecuador (America/Guayaquil). Los vencimientos son avisos; el cierre sigue siendo manual.">
  {error&&<Alert tone="error">{error}</Alert>}{message&&<Alert tone="success">{message}</Alert>}
  {manager&&operational&&<details><summary className="cursor-pointer py-3 text-primary">Establecer o actualizar un plazo</summary><form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={save}>
   <Field label="Documento del plazo"><Select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value,stage:'SUBMISSION'})}>{Object.entries(DOCUMENT_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</Select></Field>
   <Field label="Etapa del plazo"><Select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}>{stages.map(([v,l])=><option key={v} value={v}>{l}</option>)}</Select></Field>
   <Field label="Fecha y hora límite (Ecuador)"><Input required type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})}/></Field>
   <Field label="Avisar con horas de anticipación"><Input required min={1} max={720} type="number" value={form.reminderHours} onChange={e=>setForm({...form,reminderHours:e.target.value})}/></Field>
   <Field label="Motivo del plazo o su modificación"><Textarea required maxLength={2000} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></Field><PrimaryButton type="submit" disabled={busy||!form.reason.trim()}>Guardar plazo</PrimaryButton>
  </form></details>}
  {busy&&<p role="status">Cargando plazos…</p>}{!busy&&!rows.length&&<p className="mt-4 text-sm text-body">El personal académico todavía no ha establecido plazos para esta práctica.</p>}
  <ul className="mt-4 divide-y divide-line">{rows.map(row=><li key={row.id} className="space-y-2 py-4"><h3 className="font-medium text-heading">{DOCUMENT_LABELS[row.kind]} · {DEADLINE_STAGES[row.stage]}</h3><p className="text-sm text-body">{row.dueAt.replace('T',' ')} · {DEADLINE_STATES[row.state]}</p><p className="text-sm text-body">Responsables: {row.responsibleUsers.join(', ')||'Sin cuenta habilitada asignada'}</p><p className="whitespace-pre-wrap break-words text-sm text-body">{row.reason}</p><p className="text-xs text-muted">Actualizado por {row.updatedBy}</p></li>)}</ul>
 </SectionCard>;
}
