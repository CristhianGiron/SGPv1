/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AgendaView.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente AgendaView de la interfaz del SGP.
 */

import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, List, MapPin } from 'lucide-react';
import { SecondaryButton } from './ActionBar';
import { EmptyState } from './EmptyState';
import { Field, Input } from './FormControls';
import { StatusBadge } from './StatusBadge';

const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function agendaDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function weeklyEntries(schedules, start) {
  return Array.from({length:7}, (_,index) => {
    const date = new Date(start);date.setDate(date.getDate()+index);
    const iso = agendaDate(date);
    const entries = schedules.flatMap(schedule => (schedule.periods || [])
      .filter(period => period.dayOfWeek === days[date.getDay()]
        && (!schedule.startDate || iso >= schedule.startDate)
        && (!schedule.endDate || iso <= schedule.endDate))
      .map(period => ({...period, scheduleId:schedule.id, courseName:schedule.courseName, studentName:schedule.studentFullName,
        attendances:(schedule.attendances || []).filter(attendance => attendance.attendanceDate === iso
          && period.id != null && attendance.schedulePeriodId != null && String(attendance.schedulePeriodId) === String(period.id)),
      })));
    entries.sort((a,b) => String(a.startTime || '').localeCompare(String(b.startTime || '')) || String(a.studentName || '').localeCompare(String(b.studentName || '')));
    return {date:iso, label:date.toLocaleDateString('es-EC',{weekday:'short',day:'numeric',month:'short'}),
      day:date.toLocaleDateString('es-EC',{weekday:'long'}), number:date.getDate(), entries};
  });
}
export function upcomingJornadas(schedules, now = new Date()) {
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  return weeklyEntries(schedules, now).map((day,index) => ({...day,entries:day.entries.filter(entry => index!==0 || !entry.endTime || entry.endTime.slice(0,5)>time)})).filter(day=>day.entries.length).slice(0,3);
}

export function AgendaView({ schedules = [], compact = false }) {
  const [offset,setOffset] = useState(0);
  const [view,setView] = useState('week');
  const [search,setSearch] = useState('');
  const now = new Date(), today = agendaDate(now);
  const start = new Date(now);start.setHours(12,0,0,0);start.setDate(start.getDate()-((start.getDay()+6)%7)+offset*7);
  if (compact) {
    const upcoming = upcomingJornadas(schedules,now);
    return upcoming.length ? <div className="grid gap-3 md:grid-cols-3">{upcoming.map(day => <section key={day.date} className="rounded-xl bg-info-soft p-4 text-info-strong">
      <p className="text-xs font-semibold uppercase tracking-wide">{day.date===today ? 'Hoy' : day.label}</p>
      <div className="mt-3 space-y-3">{day.entries.slice(0,3).map((entry,index) => <div key={`${entry.scheduleId}/${entry.id || index}`}><p className="flex items-center gap-2 text-sm font-semibold"><Clock3 aria-hidden="true" size={15} />{entry.startTime?.slice(0,5)} – {entry.endTime?.slice(0,5)}</p><p className="mt-1 text-sm">{entry.studentName || entry.courseName || 'Jornada de prácticas'}</p>{entry.place && <p className="mt-1 text-xs">{entry.place}</p>}</div>)}</div>
      {day.entries.length>3 && <p className="mt-3 text-xs">Y {day.entries.length-3} jornada(s) más en la agenda</p>}
    </section>)}</div> : <p className="text-sm text-body">No hay jornadas próximas para los siguientes siete días. Puedes consultar otras semanas en la agenda.</p>;
  }
  const terms = normalize(search).split(/\s+/).filter(Boolean);
  const week = weeklyEntries(schedules,start).map(day => ({...day,entries:day.entries.filter(entry=>terms.every(term=>normalize(`${entry.courseName || ''} ${entry.studentName || ''} ${entry.place || ''}`).includes(term)))}));
  const yearLabel = week[6].date.slice(0,4) === String(start.getFullYear()) ? start.getFullYear() : `${start.getFullYear()} / ${week[6].date.slice(0,4)}`;
  const entriesCount = week.reduce((count,day)=>count+day.entries.length,0);
  const recordedCount = week.reduce((count,day)=>count+day.entries.filter(entry=>entry.attendances.length).length,0);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SecondaryButton className="!w-auto !px-3" icon={ChevronLeft} aria-label="Semana anterior" onClick={()=>setOffset(value=>value-1)} />
        <SecondaryButton className="!w-auto" onClick={()=>setOffset(0)}>Esta semana</SecondaryButton>
        <SecondaryButton className="!w-auto !px-3" icon={ChevronRight} aria-label="Semana siguiente" onClick={()=>setOffset(value=>value+1)} />
        <p className="text-sm font-semibold text-heading" aria-live="polite">{week[0].label} — {week[6].label} · {yearLabel}</p>
      </div>
      <div role="group" aria-label="Presentación de la agenda" className="flex rounded-lg bg-panel-soft p-1">
        {[["week","Semana",CalendarDays],["list","Lista",List]].map(([id,label,Icon])=><button key={id} aria-pressed={view===id} type="button" onClick={()=>setView(id)} className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${view===id ? 'bg-panel text-heading shadow-card' : 'text-body hover:bg-panel'}`}><Icon aria-hidden="true" size={16}/>{label}</button>)}
      </div>
    </div>
    {schedules.length>1 && <div className="max-w-sm"><Field label="Buscar en la agenda"><Input type="search" placeholder="Estudiante, paralelo o lugar" value={search} onChange={event=>setSearch(event.target.value)} /></Field></div>}
    <p className="text-xs text-body">{entriesCount} jornada(s) esta semana · {recordedCount} con asistencia registrada</p>
    {!entriesCount ? <EmptyState icon={CalendarDays} title={search ? 'No hay jornadas que coincidan' : 'Esta semana no tiene jornadas'} text={search ? 'Cambia la búsqueda para consultar otros estudiantes o lugares.' : !schedules.length ? 'Las jornadas aparecerán cuando tutoría institucional las programe.' : 'Consulta otra semana para ver la programación de esta práctica.'} action={search ? <SecondaryButton onClick={()=>setSearch('')}>Limpiar búsqueda</SecondaryButton> : offset!==0 ? <SecondaryButton onClick={()=>setOffset(0)}>Volver a esta semana</SecondaryButton> : null} />
      : <div className={view==='week' ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-7' : 'space-y-4'}>{week.filter(day=>view==='week' || day.entries.length).map(day=><section key={day.date} aria-label={day.label} className={`min-w-0 overflow-hidden rounded-xl border ${day.date===today ? 'border-info bg-info-soft/30' : 'border-line bg-panel'}`}>
        <header className={`flex items-center justify-between gap-2 border-b border-line-soft px-3 py-3 ${day.date===today ? 'bg-info-soft' : 'bg-panel-soft'}`}><div><p className="text-xs font-medium capitalize text-body">{day.day}</p><p className="mt-1 text-xl font-semibold text-heading"><time dateTime={day.date}>{day.number}</time></p></div>{day.date===today && <span className="rounded-full bg-primary px-2 py-1 text-[0.65rem] font-semibold text-inverse">Hoy</span>}</header>
        <div className={view==='list' ? 'grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3 p-2'}>{day.entries.length ? day.entries.map((entry,index)=><AgendaEntry key={`${entry.scheduleId}/${entry.id || index}`} entry={entry} past={day.date<today || (day.date===today && entry.endTime?.slice(0,5)<=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)} />) : <p className="px-1 py-3 text-xs text-muted">Sin jornadas</p>}</div>
      </section>)}</div>}
  </div>;
}
function AgendaEntry({entry,past}) {
  return <article className="min-w-0 rounded-lg border border-line-soft bg-panel p-3 shadow-card">
    <p className="text-xs font-semibold text-info-strong">{entry.startTime?.slice(0,5)} – {entry.endTime?.slice(0,5)}</p>
    <p className="mt-2 break-words text-sm font-semibold text-heading">{entry.studentName || entry.courseName || 'Jornada de prácticas'}</p>
    {entry.studentName && entry.courseName && <p className="mt-1 break-words text-xs text-body">{entry.courseName}</p>}
    {entry.place && <p className="mt-2 flex items-start gap-1 text-xs text-body"><MapPin aria-hidden="true" size={13} className="mt-0.5 shrink-0"/><span className="break-words">{entry.place}</span></p>}
    <div className="mt-3 flex flex-wrap gap-1">{entry.attendances.length ? entry.attendances.map((attendance,index)=><StatusBadge key={attendance.id || index} status={attendance.status}/>) : <span className="text-xs text-muted">{past ? 'Sin registro de asistencia' : 'Programada'}</span>}</div>
  </article>;
}
