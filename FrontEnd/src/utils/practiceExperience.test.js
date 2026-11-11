/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          practiceExperience.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo practice Experience mediante pruebas de regresión.
 */

import { attendedTime, documentSources, experienceEvents, nextPracticeStep, practiceRows } from './practiceExperience';
const practice={id:7,status:'APPROVED',courseActive:true};
const entry=(status,key='activity-plans') => ({key,label:'Plan',module:{createRoles:['ROLE_ESTUDIANTE']},rows:status ? [{id:1,status}] : []});
test('corrections take precedence over drafts and unavailable sections never appear as missing tasks',()=>{
 expect(nextPracticeStep(practice,['ROLE_ESTUDIANTE'],[entry('DRAFT'),entry('NEEDS_CORRECTION','practice-reports')]).section).toBe('documents/practice-reports');
 expect(nextPracticeStep(practice,['ROLE_ESTUDIANTE'],[entry(null)],['activity-plans']).title).toMatch(/información pendiente/);
 expect(nextPracticeStep({...practice,archived:true},['ROLE_ESTUDIANTE'],[entry('DRAFT')]).section).toBe('documents');
});
test('an already approved reviewer is not prompted to review the same submitted report',()=>{
 const doc=entry('SUBMITTED');doc.rows[0].practiceTutorApproved=true;
 expect(nextPracticeStep(practice,['ROLE_TUTOR_PRACTICAS'],[doc]).section).toBe('schedules');
 expect(nextPracticeStep(practice,['ROLE_DIRECTOR_PRACTICAS'],[doc]).section).toBe('documents/activity-plans');
});
test('authorized sources and results remain scoped to the selected role and practice',()=>{
 expect(documentSources(['ROLE_ESTUDIANTE']).every(source=>source.path.includes('/me'))).toBe(true);
 expect(documentSources(['ROLE_TUTOR_PRACTICAS']).every(source=>!source.path.includes('/me'))).toBe(true);
 expect(practiceRows({content:[{enrollmentId:7,id:1},{enrollmentId:8,id:2}]},7)).toEqual([{enrollmentId:7,id:1}]);
});
test('history uses real valid dates, deduplicates generic review timestamps and orders newest first',()=>{
 const dates=experienceEvents({enrolledAt:'2026-01-01T10:00:00'},[{key:'plans',label:'Plan',rows:[{id:1,createdAt:'bad',reviewedAt:'2026-02-01T10:00:00',practiceReviewedAt:'2026-02-01T10:00:00'}]}],[{id:4,action:'COMPLETE_PRACTICE',createdAt:'2026-03-01T10:00:00'}]);
 expect(dates.map(event=>event.title)).toEqual(['Práctica concluida','Revisión de tutoría','Práctica asignada']);
});
test('time indicators count actual presence and lateness, excluding justified absence',()=>{
 expect(attendedTime([{attendances:[{status:'PRESENT',totalMinutes:120},{status:'JUSTIFIED',totalMinutes:60},{status:'LATE',totalMinutes:30}]}]).assistedMinutes).toBe(150);
});
