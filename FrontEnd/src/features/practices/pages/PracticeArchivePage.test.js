/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeArchivePage.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Practice Archive Page mediante pruebas de regresión.
 */

import { buildPracticeGroups } from './PracticeArchivePage';

test('cohort totals count distinct course IDs even when the displayed names match',()=>{
 const rows=[
  {id:1,courseId:10,courseName:'Paralelo A',academicCycleId:1,academicCycleName:'Ciclo 7',careerId:1,careerName:'Educación',status:'COMPLETED',archived:true},
  {id:2,courseId:11,courseName:'Paralelo A',academicCycleId:1,academicCycleName:'Ciclo 7',careerId:1,careerName:'Educación',status:'COMPLETED',archived:false},
  {id:3,courseId:11,courseName:'Paralelo A',academicCycleId:1,academicCycleName:'Ciclo 7',careerId:1,careerName:'Educación',status:'APPROVED',archived:false},
 ];
 const groups=buildPracticeGroups(rows,'academicCycle');
 expect(groups).toHaveLength(1);
 expect(groups[0]).toMatchObject({total:3,courseCount:2,careerCount:1,academicCycleCount:1,completed:2,approved:1,archived:1,archivable:1});
});
