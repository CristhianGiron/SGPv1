/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AgendaView.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Agenda View mediante pruebas de regresión.
 */

import { weeklyEntries } from './AgendaView';
test('weekly entries respect local dates, schedule bounds and weekdays across months',()=>{
 const week=weeklyEntries([{id:1,startDate:'2026-10-27',endDate:'2026-11-01',periods:[{dayOfWeek:'MONDAY'},{dayOfWeek:'FRIDAY'},{dayOfWeek:'SUNDAY'}]}],new Date(2026,9,26,12));
 expect(week[0].date).toBe('2026-10-26');expect(week[0].entries).toHaveLength(0);
 expect(week[4].date).toBe('2026-10-30');expect(week[4].entries).toHaveLength(1);
 expect(week[6].date).toBe('2026-11-01');expect(week[6].entries).toHaveLength(1);
});

test('attendance is associated only with its scheduled period and entries are sorted by time',()=>{
 const week=weeklyEntries([{id:1,periods:[{id:2,dayOfWeek:'MONDAY',startTime:'14:00:00'},{id:1,dayOfWeek:'MONDAY',startTime:'08:00:00'}],attendances:[{id:10,schedulePeriodId:1,attendanceDate:'2026-10-26',status:'PRESENT'}]}],new Date(2026,9,26,12));
 expect(week[0].entries.map(entry=>entry.id)).toEqual([1,2]);expect(week[0].entries[0].attendances).toHaveLength(1);expect(week[0].entries[1].attendances).toHaveLength(0);
});
