/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          notificationInbox.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las notificaciones mediante pruebas de regresión.
 */

import { groupInboxByDate, inboxNotifications } from './notificationInbox';
test('filters and sorts copied notifications without changing the source array',()=>{
 const items=[{id:1,title:'Revisión académica',read:true,createdAt:'2026-01-01'}, {id:2,title:'Revisión del tutor',read:false,createdAt:'2026-02-01'}];
 expect(inboxNotifications(items,'all','revision').map(item=>item.id)).toEqual([2,1]);expect(inboxNotifications(items,'read')).toEqual([items[0]]);expect(items.map(item=>item.id)).toEqual([1,2]);
});
test('date grouping supports year boundaries and invalid dates',()=>{
 const now=new Date(2027,0,1,12);
 expect(groupInboxByDate([{createdAt:'2027-01-01T10:00:00'},{createdAt:'2026-12-31T10:00:00'},{createdAt:'bad'}],now).map(group=>group.label)).toEqual(['Hoy','Ayer','Sin fecha']);
});
