/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DataTable.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Data Table mediante pruebas de regresión.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { DataTable } from './DataTable';
let mockOwner=1;
jest.mock('../../auth/AuthContext',()=>({useAuth:()=>({profile:{id:mockOwner}})}));
const columns=[{key:'name',header:'Nombre'},{key:'status',header:'Estado'},{key:'actions',header:'Acciones',render:()=> <button>Ver registro</button>}];
const rows=Array.from({length:23},(_,i)=>({id:i+1,name:`Registro ${i+1}`,status:i%2?'DRAFT':'SUBMITTED'}));
beforeEach(()=>{localStorage.clear();mockOwner=1;});
test('paginates results and resets to the first page when searching',()=>{
 render(<DataTable rows={rows} columns={columns} enableFilters/>);
 expect(screen.getAllByRole('button',{name:'Ver registro'})).toHaveLength(10);
 fireEvent.click(screen.getByRole('button',{name:'Siguiente'}));expect(screen.getByText('Registro 11')).toBeInTheDocument();
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Registro 23'}});expect(screen.getByText('Registro 23')).toBeInTheDocument();expect(screen.queryByRole('navigation',{name:'Paginación de resultados'})).not.toBeInTheDocument();
});
test('hides only permitted display columns and restores a saved filter view',()=>{
 render(<DataTable rows={rows} columns={columns} enableFilters/>);
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Registro 23'}});
 fireEvent.click(screen.getByRole('button',{name:'Filtros'}));const modal=screen.getByRole('dialog');
 fireEvent.click(within(modal).getByRole('checkbox',{name:'Estado'}));
 expect(screen.queryByRole('columnheader',{name:'Estado'})).not.toBeInTheDocument();expect(screen.getByRole('columnheader',{name:'Acciones'})).toBeInTheDocument();
 fireEvent.change(within(modal).getByLabelText('Nombre de la vista'),{target:{value:'Mi filtro'}});fireEvent.click(within(modal).getByRole('button',{name:'Guardar vista'}));
 fireEvent.click(within(modal).getByRole('button',{name:'Aplicar'}));fireEvent.click(screen.getByRole('button',{name:'Limpiar'}));
 fireEvent.click(screen.getByRole('button',{name:'Filtros'}));fireEvent.change(screen.getByLabelText('Vistas guardadas'),{target:{value:'Mi filtro'}});fireEvent.click(screen.getByRole('button',{name:'Cargar vista'}));expect(screen.getByRole('searchbox')).toHaveValue('Registro 23');
});

test('saved filter views are isolated by account',()=>{
 const first=render(<DataTable rows={rows} columns={columns} enableFilters/>);
 fireEvent.click(screen.getByRole('button',{name:'Filtros'}));
 fireEvent.change(screen.getByLabelText('Nombre de la vista'),{target:{value:'Solo cuenta uno'}});
 fireEvent.click(screen.getByRole('button',{name:'Guardar vista'}));first.unmount();
 mockOwner=2;render(<DataTable rows={rows} columns={columns} enableFilters/>);
 fireEvent.click(screen.getByRole('button',{name:'Filtros'}));
 expect(screen.queryByLabelText('Vistas guardadas')).not.toBeInTheDocument();
});

test('mobile records retain filters and actions when resized back to a desktop table',()=>{
 const originalWidth=window.innerWidth;
 try {
  window.innerWidth=390;
  render(<DataTable rows={rows} columns={columns} enableFilters/>);
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.getByRole('list',{name:'Resultados del listado'})).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Registro 23'}});
  expect(screen.getAllByRole('button',{name:'Ver registro'})).toHaveLength(1);
  expect(screen.getByText('Registro 23')).toBeInTheDocument();
  window.innerWidth=1024;fireEvent(window,new Event('resize'));
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getByText('Registro 23')).toBeInTheDocument();
  expect(screen.getByRole('searchbox')).toHaveValue('Registro 23');
 } finally {window.innerWidth=originalWidth;}
});

test('practice context removes repeated identities while supplementary data stays accessible',()=>{
 const {PracticeWorkspaceContext}=require('../../contexts/PracticeWorkspaceContext');
 const entries=[{id:7,title:'Documento de la práctica',courseName:'Paralelo A',studentFullName:'Ana',status:'DRAFT',createdAt:'2026-11-07T08:00:00'}];
 const fields=[{key:'title',header:'Documento'},{key:'courseName',header:'Paralelo'},{key:'studentFullName',header:'Estudiante'},{key:'status',header:'Estado'},{key:'createdAt',header:'Creado'},columns.at(-1)];
 render(<PracticeWorkspaceContext.Provider value={{id:3}}><DataTable rows={entries} columns={fields} enableFilters/></PracticeWorkspaceContext.Provider>);
 expect(screen.queryByRole('columnheader',{name:'Paralelo'})).not.toBeInTheDocument();
 expect(screen.queryByRole('columnheader',{name:'Estudiante'})).not.toBeInTheDocument();
 expect(screen.queryByRole('columnheader',{name:'Creado'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Más datos'}));
 const dialog=screen.getByRole('dialog',{name:'Más datos del registro'});
 expect(within(dialog).getByText('Documento de la práctica')).toBeInTheDocument();
 expect(within(dialog).getByText('Creado')).toBeInTheDocument();
 fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.queryByRole('dialog',{name:'Más datos del registro'})).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Ver registro'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Filtros'}));
 const filters=screen.getByRole('dialog');
 expect(within(filters).queryByRole('checkbox',{name:'Estudiante'})).not.toBeInTheDocument();
 expect(within(filters).queryByRole('checkbox',{name:'Paralelo'})).not.toBeInTheDocument();
 fireEvent.click(within(filters).getByRole('checkbox',{name:'Creado'}));
 expect(screen.getByRole('columnheader',{name:'Creado'})).toBeInTheDocument();
});

test('a review list preserves student and parallel identities while own records suppress only the student',()=>{
 const entries=[{id:7,title:'Registro',studentFullName:'Ana',courseName:'Paralelo A',status:'DRAFT'}];
 const fields=[{key:'title',header:'Documento'},{key:'studentFullName',header:'Estudiante'},{key:'courseName',header:'Paralelo'},{key:'status',header:'Estado'}];
 const view=render(<DataTable rows={entries} columns={fields} ownRecords/>);
 expect(screen.queryByRole('columnheader',{name:'Estudiante'})).not.toBeInTheDocument();
 expect(screen.getByRole('columnheader',{name:'Paralelo'})).toBeInTheDocument();
 view.rerender(<DataTable rows={entries} columns={fields}/>);
 expect(screen.getByRole('columnheader',{name:'Estudiante'})).toBeInTheDocument();
 expect(screen.getByRole('columnheader',{name:'Paralelo'})).toBeInTheDocument();
});
