/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlansPage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las planificaciones didácticas mediante pruebas de regresión.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DidacticPlansPage } from './DidacticPlansPage';
import { apiRequest } from '../../../api/client';
let mockRoles=['ROLE_ESTUDIANTE'];
jest.mock('../../auth/context/AuthContext',()=>({useAuth:()=>({token:'test',roles:mockRoles,profile:{id:1}})}));
jest.mock('../../../api/client',()=>({apiRequest:jest.fn(),apiBlob:jest.fn(),isAccessDeniedMessage:()=>false}));
jest.mock('../../../components/ui/ConfirmDialog',()=>({useConfirm:()=>jest.fn().mockResolvedValue(true)}));
jest.mock('../../../components/ui/PageHeader',()=>({PageHeader:({title,action})=><header><h1>{title}</h1>{action}</header>}));
const initial={id:8,authorId:1,authorType:'STUDENT',enrollmentId:3,title:'Plan inicial',status:'DRAFT',learningObjectives:'Objetivo inicial',weekPlans:[]};

beforeEach(()=>{
 mockRoles=['ROLE_ESTUDIANTE'];
 apiRequest.mockReset();
 apiRequest.mockImplementation((path,options={})=>{
  if(path==='/api/didactic-plans/me')return Promise.resolve([initial]);
  if(path==='/api/enrollments/me')return Promise.resolve([{id:3,status:'APPROVED',courseName:'Paralelo A'}]);
  if(options.method==='PUT')return Promise.resolve({...initial,...options.body});
  return Promise.resolve([]);
 });
});

test('sending an edited existing draft persists the current values before submission',async()=>{
 render(<DidacticPlansPage/>);
 fireEvent.click(await screen.findByRole('button',{name:'Ver'}));
 fireEvent.click(screen.getByRole('tab',{name:'Formulario'}));
 fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Plan corregido sin guardar'}});
 fireEvent.click(screen.getByRole('button',{name:'Enviar'}));
 await waitFor(()=>expect(apiRequest).toHaveBeenCalledWith('/api/didactic-plans/8',expect.objectContaining({method:'PUT',body:expect.objectContaining({title:'Plan corregido sin guardar',draft:false})})));
 expect(apiRequest.mock.calls.some(([path,options])=>path==='/api/didactic-plans/8/submit'&&options?.method==='PATCH')).toBe(false);
});

test('a PDF failure retains the created draft so retry does not create a duplicate',async()=>{
 let createCount=0;
 const implementation=apiRequest.getMockImplementation();
 apiRequest.mockImplementation((path,options={})=>{
  if(path==='/api/didactic-plans'&&options.method==='POST'){createCount++;return Promise.resolve({...initial,id:12,...options.body});}
  if(path==='/api/didactic-plans/12/pdf')return Promise.reject(new Error('Falló el PDF'));
  return implementation(path,options);
 });
 render(<DidacticPlansPage/>);
 await screen.findByRole('button',{name:'Ver'});
 fireEvent.click(screen.getByRole('button',{name:'Nueva planificación'}));
 expect(screen.queryByLabelText('Inscripción')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Subir PDF de planificación'),{target:{files:[new File(['test'],'plan.pdf',{type:'application/pdf'})]}});
 fireEvent.click(screen.getByRole('button',{name:'Enviar'}));
 await screen.findByText('Falló el PDF');
 fireEvent.click(screen.getByRole('button',{name:'Enviar'}));
 await waitFor(()=>expect(apiRequest).toHaveBeenCalledWith('/api/didactic-plans/12',expect.objectContaining({method:'PUT'})));
 expect(createCount).toBe(1);
 expect(apiRequest.mock.calls.find(([path,options])=>path==='/api/didactic-plans'&&options?.method==='POST')[1].body.enrollmentId).toBe(3);
});

test('supervisors do not see a creation form or a new-plan action',async()=>{
 mockRoles=['ROLE_DIRECTOR_PRACTICAS'];
 apiRequest.mockResolvedValue([]);
 render(<DidacticPlansPage/>);
 await waitFor(()=>expect(apiRequest).toHaveBeenCalledWith('/api/didactic-plans/managed',expect.anything()));
 expect(screen.queryByRole('tab',{name:'Formulario'})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Nueva planificación'})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Enviar'})).not.toBeInTheDocument();
});
