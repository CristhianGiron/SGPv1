/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          roleExperience.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo role Experience mediante pruebas de regresión.
 */

import { workflowCopy, navigationLabel } from './roleExperience';
import { DOCUMENT_MODULES } from './endpointModules';

test('readers receive consultation instructions and creators get their own workflow',()=>{
 expect(workflowCopy('photos',['ROLE_TUTOR_PRACTICAS'])).not.toMatch(/Sube|Añade/);
 expect(workflowCopy('archive',['ROLE_ESTUDIANTE'])).not.toMatch(/archiva|recupera|reabre/);
 expect(workflowCopy('schedules',['ROLE_DIRECTORA_INSTITUCION'])).not.toMatch(/registra|Organiza/);
 expect(workflowCopy('universities',['ROLE_DIRECTOR_PRACTICAS'])).not.toMatch(/Administra|incorporar/);
 const evaluation=DOCUMENT_MODULES.find(m=>m.id==='activity-evaluations');
 expect(workflowCopy('documents',['ROLE_ESTUDIANTE'],evaluation)).not.toMatch(/Completa|envía|Registra/);
 expect(workflowCopy('documents',['ROLE_TUTOR_PRACTICAS'],evaluation)).toMatch(/Registra y actualiza/);
});
test('labels identify personal and institutional work without introducing another role actions',()=>{
 expect(navigationLabel({id:'schedules'},['ROLE_ESTUDIANTE'])).toBe('Mis jornadas');
 expect(navigationLabel({id:'forms'},['ROLE_DIRECTORA_INSTITUCION'])).toBe('Entrevistas asignadas');
});
