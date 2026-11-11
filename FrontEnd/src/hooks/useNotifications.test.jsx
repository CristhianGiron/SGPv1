/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useNotifications.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las notificaciones mediante pruebas de regresión.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from './useNotifications';
import { apiRequest } from '../api/client';
jest.mock('../auth/AuthContext',()=>({useAuth:()=>({token:'qa'})}));
jest.mock('../api/client',()=>({apiRequest:jest.fn(),getApiBaseUrl:()=>''}));
let sockets=[],items=[];
const original=global.WebSocket;
beforeEach(()=>{
 sockets=[];items=[];
 global.WebSocket=class {constructor(){sockets.push(this);}close(){}};
 apiRequest.mockImplementation((path,options={})=>{
  if(options.method==='PATCH')items=items.map(i=>({...i,read:true}));
  return Promise.resolve(path.endsWith('/count')?{count:items.filter(i=>!i.read).length}:[...items]);
 });
});
afterEach(()=>{global.WebSocket=original;});

test('duplicate websocket delivery does not inflate the unread indicator',async()=>{
 const {result}=renderHook(()=>useNotifications());
 await waitFor(()=>expect(result.current.loading).toBe(false));
 const event={data:JSON.stringify({id:1,read:false,title:'Aviso QA'})};
 act(()=>{sockets[0].onmessage(event);sockets[0].onmessage(event);});
 expect(result.current.notifications).toHaveLength(1);
 expect(result.current.unreadCount).toBe(1);
 act(()=>sockets[0].onmessage({data:JSON.stringify({id:1,read:true,title:'Aviso QA'})}));
 expect(result.current.unreadCount).toBe(0);
});

test('mark all read synchronizes the page and bell when both are mounted',async()=>{
 items=[{id:1,read:false}];
 const {result}=renderHook(()=>({page:useNotifications(),bell:useNotifications()}));
 await waitFor(()=>expect(result.current.bell.unreadCount).toBe(1));
 await act(async()=>{await result.current.page.markAllAsRead();});
 await waitFor(()=>expect(result.current.bell.unreadCount).toBe(0));
 expect(result.current.page.unreadCount).toBe(0);
 expect(result.current.bell.notifications[0].read).toBe(true);
});
