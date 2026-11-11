/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          practiceExperience.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de practiceExperience utilizadas por la interfaz del SGP.
 */

import { DOCUMENT_MODULES } from '../config/endpointModules';
import { pendingReviewCount, summarizeAttendances } from './practiceIndicators';
const allowed = (roles, required = []) => required.some(role => roles.includes(role));
export function documentSources(roles) {
 return DOCUMENT_MODULES.filter(module => allowed(roles, module.roles)).flatMap(module => {
  const path = allowed(roles, module.listRoles) ? module.listPath : module.altLists?.find(list => allowed(roles, list.roles))?.path;
  return path ? [{ key: module.id, label: module.title, path, module }] : [];
 });
}
export function practiceRows(payload, id) {
 const rows = Array.isArray(payload) ? payload : payload?.content || [];
 return rows.filter(row => String(row.enrollmentId ?? row.enrollment?.id ?? '') === String(id));
}
export function nextPracticeStep(practice, roles, documents, failed = []) {
 if (practice.status === 'PENDING') return { title: 'Práctica pendiente de habilitación', description: 'El personal académico debe habilitar esta asignación antes de registrar actividades.', route: roles.includes('ROLE_ESTUDIANTE') ? 'practices' : 'courses', label: 'Consultar asignaciones' };
 if (practice.status !== 'APPROVED' || practice.archived || practice.courseActive === false) return { title: 'Consulta tu expediente', description: 'Esta práctica está disponible para revisar sus documentos e historial.', section: 'documents', label: 'Consultar documentos' };
 const student = roles.includes('ROLE_ESTUDIANTE');
 for (const entry of documents) {
  const corrections = entry.rows.find(row => row.status === 'NEEDS_CORRECTION');
  if (student && corrections) return { title: 'Atiende las observaciones recibidas', description: entry.label, section: 'documents/'+entry.key, label: 'Abrir documento' };
 }
 if (!student) {
  const reviewer = roles.includes('ROLE_DIRECTOR_PRACTICAS') ? 'director' : roles.includes('ROLE_TUTOR_INSTITUCIONAL') ? 'institutional' : 'practice';
  const queue = documents.find(entry => pendingReviewCount(entry.rows, reviewer) > 0);
  if (queue) return { title: 'Tienes documentos por revisar', description: queue.label, section: 'documents/'+queue.key, label: 'Revisar documento' };
 } else {
  const draft = documents.find(entry => entry.rows.some(row => row.status === 'DRAFT'));
  if (draft) return { title: 'Continúa tu borrador', description: draft.label, section: 'documents/'+draft.key, label: 'Continuar documento' };
  const missing = documents.find(entry => !entry.rows.length && entry.module.createRoles?.includes('ROLE_ESTUDIANTE') && !failed.includes(entry.key));
  if (missing) return { title: 'Prepara tu siguiente documento', description: missing.label, section: 'documents/'+missing.key, label: 'Comenzar' };
 }
 return { title: failed.length ? 'Hay información pendiente de consultar' : 'Continúa con tus actividades', description: failed.length ? 'No se pudo comprobar todo el expediente. Puedes actualizar el resumen o abrir los apartados disponibles.' : 'Consulta tus jornadas, documentos y registros para continuar el seguimiento de esta práctica.', section: 'schedules', label: 'Ver jornadas' };
}
export function experienceEvents(practice, documents, audits = []) {
 const events = [];
 if (practice.enrolledAt) events.push({ id: 'enrolled', date: practice.enrolledAt, title: practice.status === 'PENDING' ? 'Inscripción pendiente registrada' : 'Práctica asignada', actor: practice.studentFullName || practice.studentUsername });
 for (const entry of documents) for (const row of entry.rows) {
  for (const [field, title] of [['createdAt','Documento creado'],['submittedAt','Documento enviado'],['reviewedAt','Revisión registrada'],['practiceReviewedAt','Revisión de tutoría'],['institutionalReviewedAt','Revisión institucional'],['directorReviewedAt','Revisión de dirección']]) {
   if (!row[field]) continue;
   if (field === 'reviewedAt' && [row.practiceReviewedAt,row.institutionalReviewedAt,row.directorReviewedAt].includes(row[field])) continue;
   const actor = field === 'createdAt' || field === 'submittedAt' ? row.studentFullName || row.studentName : row[field.replace('At','ByName')] || row.reviewedByName;
   events.push({ id: `${entry.key}/${row.id}/${field}`, date: row[field], title, description: entry.label, actor });
  }
 }
 const labels = { INCIDENT_OPEN:'Incidencia registrada', INCIDENT_ASSIGNED:'Incidencia asignada', INCIDENT_UNDER_REVIEW:'Incidencia en evaluación', INCIDENT_RESOLVED:'Incidencia resuelta', INCIDENT_REJECTED:'Incidencia rechazada', DEADLINE_UPDATED:'Plazo académico actualizado', ASSIGN_STUDENT:'Práctica asignada por personal académico', COMPLETE_PRACTICE:'Práctica concluida', REOPEN_PRACTICE:'Práctica reabierta', ARCHIVE_PRACTICE:'Práctica archivada', UNARCHIVE_PRACTICE:'Práctica recuperada del archivo', ARCHIVE_ALL_COMPLETED:'Práctica archivada con su cohorte', ARCHIVE_BATCH:'Práctica archivada en lote', UNARCHIVE_BATCH:'Práctica recuperada del archivo en lote' };
 for (const row of audits) events.push({ id: 'audit/'+row.id, date: row.createdAt, title: labels[row.action] || 'Cambio registrado', actor: row.actorName, description: row.details });
 return events.filter(event => Number.isFinite(Date.parse(event.date))).sort((a,b) => Date.parse(b.date)-Date.parse(a.date));
}
export function attendedTime(schedules) { return summarizeAttendances(schedules.flatMap(schedule => schedule.attendances || [])); }
