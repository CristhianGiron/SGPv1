/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanContinuity.test.jsx
 * @fecha         2026-11-10 21:24:04
 * @nota          Comprueba el comportamiento de las planificaciones didácticas mediante pruebas de regresión.
 */

import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import { DidacticPlanContinuity } from './DidacticPlanContinuity';
import { apiRequest } from '../api/client';
let mockRoles=['ROLE_TUTOR_PRACTICAS'];
jest.mock('../auth/AuthContext',()=>({useAuth:()=>({token:'test',roles:mockRoles,profile:{id:2}})}));
jest.mock('../api/client',()=>({apiRequest:jest.fn(),apiBlob:jest.fn()}));
const mockConfirm=jest.fn();
jest.mock('./ui/ConfirmDialog',()=>({useConfirm:()=>mockConfirm}));
const plan={id:10,authorId:3,authorType:'INSTITUTIONAL_TUTOR',status:'SUBMITTED'};
beforeEach(()=>{mockRoles=['ROLE_TUTOR_PRACTICAS'];mockConfirm.mockResolvedValue(true);apiRequest.mockReset();apiRequest.mockResolvedValue([]);});
test('a tutor must give a reason and confirm before returning a submitted institutional plan',async()=>{
 const changed=jest.fn();render(<DidacticPlanContinuity plan={plan} operational onChanged={changed} renderSnapshot={()=>null}/>);
 expect(screen.getByRole('button',{name:'Devolver para corrección'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Motivo de devolución'),{target:{value:'Precisar objetivos'}});
 fireEvent.click(screen.getByRole('button',{name:'Devolver para corrección'}));
 await waitFor(()=>expect(apiRequest).toHaveBeenCalledWith('/api/didactic-plans/10/return',expect.objectContaining({method:'PATCH',body:{reason:'Precisar objetivos'}})));
 expect(changed).toHaveBeenCalledTimes(1);
});
test('institutional authors cannot return their own submitted plan',()=>{
 mockRoles=['ROLE_TUTOR_INSTITUCIONAL'];render(<DidacticPlanContinuity plan={plan} operational onChanged={jest.fn()} renderSnapshot={()=>null}/>);
 expect(screen.queryByRole('button',{name:'Devolver para corrección'})).not.toBeInTheDocument();
});
test('a previous version opens independently of the editable current plan',async()=>{
 apiRequest.mockImplementation(async path=>path.endsWith('/revisions')?[{id:5,revisionNumber:1,returnedBy:'tutor',returnedAt:'2026-11-10T10:00:00',reason:'Corregir'}]:{id:10,title:'Versión enviada'});
 render(<DidacticPlanContinuity plan={plan} operational onChanged={jest.fn()} renderSnapshot={snapshot=><p>{snapshot.title}</p>}/>);
 fireEvent.click(screen.getByText(/Versiones enviadas conservadas/));
 fireEvent.click(await screen.findByRole('button',{name:'Consultar versión 1'}));
 expect(await screen.findByRole('heading',{name:'Versión enviada'})).toBeInTheDocument();
 expect(apiRequest).toHaveBeenCalledWith('/api/didactic-plans/10/revisions/5',expect.anything());
});
