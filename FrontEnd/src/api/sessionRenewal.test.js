/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          sessionRenewal.test.js
 * @fecha         2026-11-10 21:24:04
 * @nota          Comprueba el comportamiento de el módulo session Renewal mediante pruebas de regresión.
 */

import { apiRequest, apiBlob } from './client';
import { storeAuth, getStoredAuth, clearStoredAuth } from '../features/auth/authStorage';
const token = (sid,signature) => `header.${btoa(JSON.stringify({sid}))}.${signature}`;
const oldToken=token('session-one','old'),newToken=token('session-one','new');
const reply=(status,payload)=>({status,ok:status>=200&&status<300,headers:{get:()=> 'application/json'},json:async()=>payload,blob:async()=>new Blob(['file'])});
beforeEach(()=>{clearStoredAuth();global.fetch=jest.fn();storeAuth({username:'ana',accessToken:oldToken,refreshToken:'refresh-old'});});
afterEach(()=>{clearStoredAuth();});
test('parallel unauthorized requests share one refresh and retry with the rotated token',async()=>{
 let refreshes=0;
 fetch.mockImplementation(async(url,options)=>{
  if(url.endsWith('/api/auth/refresh')){refreshes++;return reply(200,{accessToken:newToken,refreshToken:'refresh-new',username:'ana'});}
  return options.headers.Authorization===`Bearer ${newToken}`?reply(200,{success:true}):reply(401,{});
 });
 const results=await Promise.all([apiRequest('/api/account/me',{token:oldToken}),apiRequest('/api/notifications',{token:oldToken})]);
 expect(results).toEqual([{success:true},{success:true}]);expect(refreshes).toBe(1);expect(getStoredAuth().refreshToken).toBe('refresh-new');
});
test('a rejected refresh clears the stored session',async()=>{
 fetch.mockResolvedValue(reply(401,{message:'Sesión revocada'}));
 await expect(apiRequest('/api/account/me',{token:oldToken})).rejects.toMatchObject({status:401});
 expect(getStoredAuth()).toBeNull();
});
test('network failure during renewal preserves authentication for a later retry',async()=>{
 fetch.mockImplementation(async url=>{if(url.endsWith('/api/auth/refresh'))throw new Error('Sin conexión');return reply(401,{});});
 await expect(apiRequest('/api/account/me',{token:oldToken})).rejects.toThrow('Sin conexión');
 expect(getStoredAuth().refreshToken).toBe('refresh-old');
});
test('a response from another signed-in account never retries its request with the new account',async()=>{
 fetch.mockImplementation(async()=>{storeAuth({username:'otro',accessToken:token('other-session','new'),refreshToken:'other-refresh'});return reply(401,{});});
 await expect(apiRequest('/api/account/me',{token:oldToken})).rejects.toMatchObject({status:401});
 expect(fetch).toHaveBeenCalledTimes(1);expect(getStoredAuth().username).toBe('otro');
});
test('file downloads use renewal without losing the binary response',async()=>{
 fetch.mockImplementation(async(url,options)=>url.endsWith('/api/auth/refresh')?reply(200,{accessToken:newToken,refreshToken:'refresh-new'}):options.headers.Authorization===`Bearer ${newToken}`?reply(200,{}):reply(401,{}));
 expect(await apiBlob('/api/files/example',oldToken)).toBeInstanceOf(Blob);
});
