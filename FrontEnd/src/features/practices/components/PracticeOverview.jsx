/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeOverview.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente PracticeOverview de la interfaz del SGP.
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, FileText, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../auth/context/AuthContext';
import { documentSources, practiceRows, nextPracticeStep, experienceEvents, attendedTime } from '../../../utils/practiceExperience';
import { workspaceRoute } from '../../../config/practiceWorkflow';
import { setHashRoute } from '../../../utils/routes';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/ActionBar';
import { SectionCard } from '../../../components/ui/SectionCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { AgendaView } from '../../schedules/components/AgendaView';

export function PracticeOverview({ practice }) {
 const { token, roles } = useAuth();
 const [data, setData] = useState(null), [retry, setRetry] = useState(0);
 const roleKey = roles.slice().sort().join(',');
 useEffect(() => {
  let active = true;setData(null);
  const currentRoles = roleKey.split(',');
  const sources = documentSources(currentRoles);
  const schedulePath = currentRoles.includes('ROLE_ESTUDIANTE') ? '/api/practice-schedules/me' : currentRoles.includes('ROLE_TUTOR_INSTITUCIONAL') ? '/api/practice-schedules/managed' : '/api/practice-schedules/review';
  const queries = [...sources, { key:'schedules',path:schedulePath }, { key:'history',path:`/api/enrollments/${practice.id}/history` }];
  Promise.allSettled(queries.map(query => apiRequest(query.path, { token }))).then(results => {
   if (!active) return;
   const values = {}, failed = [];
   results.forEach((result,index) => { const key = queries[index].key;if (result.status === 'rejected') failed.push(key);else values[key] = key === 'history' ? (Array.isArray(result.value) ? result.value : []) : practiceRows(result.value, practice.id); });
   setData({ documents:sources.map(source => ({ ...source, rows:values[source.key] || [] })), schedules:values.schedules || [], audits:values.history || [], failed });
  });
  return () => { active = false; };
 }, [practice.id, roleKey, token, retry]);
 if (!data) return <SectionCard title="Resumen de la práctica"><Skeleton lines={4} /></SectionCard>;
 const next = nextPracticeStep(practice, roles, data.documents, data.failed);
 const completeDocs = data.documents.filter(entry => entry.rows.length).length;
 const approved = data.documents.flatMap(entry => entry.rows).filter(row => row.status === 'APPROVED').length;
 const corrections = data.documents.flatMap(entry => entry.rows).filter(row => row.status === 'NEEDS_CORRECTION').length;
 const time = attendedTime(data.schedules);
 const failedDocuments = data.failed.some(key => !['schedules','history'].includes(key));
 const events = experienceEvents(practice, data.documents, data.audits);
 return <div className="space-y-5">
  <section className="rounded-xl border border-info/30 bg-info-soft p-5" aria-label="Tu siguiente paso">
   <p className="text-xs font-semibold uppercase tracking-wide text-info-strong">Tu siguiente paso</p><h2 className="mt-2 text-xl font-semibold text-heading">{next.title}</h2><p className="mt-2 text-sm text-body">{next.description}</p>
   <div className="mt-4 flex flex-wrap gap-2"><PrimaryButton onClick={() => setHashRoute(next.route || workspaceRoute(practice.id,next.section))}>{next.label}</PrimaryButton><SecondaryButton icon={RefreshCw} onClick={() => setRetry(value => value+1)}>Actualizar resumen</SecondaryButton></div>
  </section>
  {data.failed.length > 0 && <p role="status" className="text-sm text-warning-strong">Resumen parcial: no se pudieron consultar {data.failed.length} apartado(s). Los datos no disponibles se muestran con —.</p>}
  <div className="sgp-practice-metrics grid grid-cols-2 gap-3 xl:grid-cols-4">{[
   [FileText,'Apartados con documentos',failedDocuments ? '—' : `${completeDocs} / ${data.documents.length}`],
   [CheckCircle2,'Documentos aprobados',failedDocuments ? '—' : approved],
   [FileText,'Con observaciones',failedDocuments ? '—' : corrections],
   [Clock3,'Tiempo asistido',data.failed.includes('schedules') ? '—' : `${Math.floor(time.assistedMinutes/60)} h ${time.assistedMinutes%60} min`],
  ].map(([Icon,label,value]) => <div key={label} className="rounded-xl bg-panel p-4 shadow-card"><Icon size={20} className="text-primary" /><p className="mt-2 text-sm text-body">{label}</p><p className="mt-1 text-2xl font-semibold text-heading">{value}</p></div>)}</div>
  <SectionCard title="Documentos de la práctica" description="El avance muestra apartados con registros; no equivale a la aprobación completa de la práctica.">
   {!failedDocuments && <div role="progressbar" aria-label="Apartados con documentos registrados" aria-valuenow={completeDocs} aria-valuemin={0} aria-valuemax={data.documents.length || 1} className="mb-4 h-2 overflow-hidden rounded-full bg-info-soft"><div className="h-full rounded-full bg-info" style={{width:`${completeDocs/(data.documents.length || 1)*100}%`}} /></div>}
   <div className="grid gap-2 md:grid-cols-2">{data.documents.map(entry => <button key={entry.key} onClick={() => setHashRoute(workspaceRoute(practice.id,'documents/'+entry.key))} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-left hover:bg-panel-soft"><span className="text-sm text-heading">{entry.label}</span>{data.failed.includes(entry.key) ? <span className="text-xs text-muted">No disponible</span> : entry.rows.length ? (entry.rows[0].status ? <StatusBadge status={entry.rows[0].status} /> : <span className="text-xs text-body">Registrado</span>) : <span className="text-xs text-muted">Sin registros visibles</span>}</button>)}</div>
  </SectionCard>
  {!data.failed.includes('schedules') && <SectionCard title="Próximas jornadas" action={<SecondaryButton onClick={() => setHashRoute(workspaceRoute(practice.id,'schedules'))}>Ver agenda</SecondaryButton>}><AgendaView compact schedules={data.schedules} /></SectionCard>}
  <SectionCard title="Historial de actividad" description="Eventos registrados y fechas disponibles de los documentos visibles para tu rol.">
   {data.failed.includes('history') && <p className="mb-3 text-sm text-warning-strong">No se pudo consultar el historial de cambios de la práctica.</p>}
   {!events.length ? <p className="text-sm text-body">Todavía no hay eventos con fecha para mostrar. Aquí aparecerán tus envíos y revisiones.</p> : <><Timeline events={events.slice(0,5)} />{events.length>5 && <details className="mt-4"><summary className="cursor-pointer rounded-lg p-2 text-sm font-medium text-primary">Ver {events.length-5} eventos anteriores</summary><div className="mt-4"><Timeline events={events.slice(5)} /></div></details>}</>}
  </SectionCard>
 </div>;
}

function Timeline({ events }) {
 return <ol className="space-y-4 border-l border-line pl-5">{events.map(event => <li key={event.id} className="relative"><span aria-hidden="true" className="absolute -left-[1.55rem] top-1.5 h-2.5 w-2.5 rounded-full bg-info" /><p className="text-sm font-semibold text-heading">{event.title}</p>{event.description && <p className="mt-1 text-sm text-body">{event.description}</p>}<p className="mt-1 text-xs text-muted"><time dateTime={event.date}>{new Date(event.date).toLocaleString('es-EC')}</time>{event.actor ? ` · ${event.actor}` : ''}</p></li>)}</ol>;
}
