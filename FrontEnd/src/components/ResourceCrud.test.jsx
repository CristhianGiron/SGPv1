/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ResourceCrud.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Resource Crud mediante pruebas de regresión.
 */

import { render, screen } from '@testing-library/react';
import { ResourceCrud } from './ResourceCrud';
import { apiRequest } from '../api/client';
let mockRoles=['ROLE_DIRECTOR_PRACTICAS'];
jest.mock('../auth/AuthContext',()=>({useAuth:()=>({roles:mockRoles,token:'test'})}));
jest.mock('../api/client',()=>({apiRequest:jest.fn(),unwrapPage:value=>value}));
jest.mock('./ui/ConfirmDialog',()=>({useConfirm:()=>jest.fn()}));
const resource={id:'careers',title:'Carreras',listPath:'/api/careers',manageRoles:['ROLE_ADMIN'],columns:[{key:'name',header:'Carrera'}],fields:[],createPath:'/api/careers'};
beforeEach(()=>{apiRequest.mockResolvedValue([{id:1,name:'Mi carrera',active:true}]);mockRoles=['ROLE_DIRECTOR_PRACTICAS'];});
test('the director has a read-only catalog without create, edit or state actions',async()=>{
 render(<ResourceCrud resource={resource}/>);
 expect(await screen.findByText('Mi carrera')).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Agregar'})).not.toBeInTheDocument();
 expect(screen.queryByRole('columnheader',{name:'Acciones'})).not.toBeInTheDocument();
});
test('the administrator retains catalog management',async()=>{
 mockRoles=['ROLE_ADMIN'];render(<ResourceCrud resource={resource}/>);
 expect(await screen.findByRole('button',{name:'Agregar'})).toBeInTheDocument();
 expect(screen.getByRole('columnheader',{name:'Acciones'})).toBeInTheDocument();
});
