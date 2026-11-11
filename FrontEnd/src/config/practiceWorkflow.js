/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          practiceWorkflow.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Define la configuración de practiceWorkflow utilizada por la interfaz.
 */

import { AlertTriangle, History, CalendarClock } from 'lucide-react';
/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          practiceWorkflow.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Define la configuración de practiceWorkflow utilizada por la interfaz.
 */

import { NAV_ITEMS, canAccess } from './navigation';
import { DOCUMENT_MODULES } from './endpointModules';
export const PRACTICE_MODULE_IDS = ['photos', 'forms', 'observation-forms', 'didactic-plans', 'documents', 'schedules'];

export function practiceSections(roles) {
  const labels = { photos: 'Evidencias', forms: 'Entrevistas', 'observation-forms': 'Observaciones', 'didactic-plans': 'Planificaciones', schedules: 'Jornadas y asistencia' };
  const sections = NAV_ITEMS.filter(item => PRACTICE_MODULE_IDS.includes(item.id) && item.id !== 'documents' && canAccess(item, roles))
    .map(item => ({ id: item.id, label: labels[item.id], Icon: item.Icon }));
  const documents = DOCUMENT_MODULES.filter(module => module.roles.some(role => roles.includes(role)))
    .sort((a, b) => (a.documentOrder || 0) - (b.documentOrder || 0))
    .map(module => ({ id: `documents/${module.id}`, label: module.title, Icon: NAV_ITEMS.find(item => item.id === 'documents').Icon }));
  const management=roles.some(role=>['ROLE_ESTUDIANTE','ROLE_TUTOR_PRACTICAS','ROLE_TUTOR_INSTITUCIONAL','ROLE_DIRECTOR_PRACTICAS','ROLE_ADMIN'].includes(role))
    ? [{id:'incidents',label:'Incidencias y cambios',Icon:AlertTriangle},{id:'document-versions',label:'Versiones de documentos',Icon:History},{id:'deadlines',label:'Plazos y responsables',Icon:CalendarClock}]:[];
  return [...documents, ...sections, ...management];
}
export function workspaceRoute(id, section = '') {
  return `practices/${encodeURIComponent(id)}${section ? `/${section}` : ''}`;
}
export function groupPractices(rows) {
  const groups = new Map();
  rows.forEach(row => {
    const key = String(row.courseId ?? `practice-${row.id}`);
    if (!groups.has(key)) groups.set(key, { id: key, label: row.courseName || 'Prácticas asignadas', cycle: row.academicCycleName || row.courseAcademicCycle, rows: [] });
    groups.get(key).rows.push(row);
  });
  return [...groups.values()];
}
