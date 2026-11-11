/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          practiceIndicators.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo practice Indicators mediante pruebas de regresión.
 */

import { summarizeAttendances, pendingReviewCount } from './practiceIndicators';

test('attendance indicators count statuses separately and only add attended minutes', () => {
  expect(summarizeAttendances([
    {status:'PRESENT', totalMinutes:240}, {status:'LATE', totalMinutes:'180'},
    {status:'ABSENT', totalMinutes:240}, {status:'JUSTIFIED',totalMinutes:240},
    {status:'PRESENT', totalMinutes:'invalid'}, {status:'LATE', totalMinutes:-10},
  ])).toEqual({total:6, assistedMinutes:420,presentCount:2,lateCount:2,absentCount:1,justifiedCount:1});
  expect(summarizeAttendances().assistedMinutes).toBe(0);
});

test('review counters exclude completed records and approvals already performed by the current reviewer', () => {
  const rows=[{status:'DRAFT'}, {status:'APPROVED'}, {status:'NEEDS_CORRECTION'},
    {status:'SUBMITTED', practiceTutorApproved:true},
    {status:'SUBMITTED', directorApproved:true},
    {status:'SUBMITTED', institutionalTutorApproved:true}, {status:'SUBMITTED'}];
  expect(pendingReviewCount(rows)).toBe(3);
  expect(pendingReviewCount(rows,'director')).toBe(3);
  expect(pendingReviewCount(rows,'institutional')).toBe(3);
  expect(pendingReviewCount(rows,'all')).toBe(4);
  expect(pendingReviewCount([])).toBe(0);
});
