/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeGovernance.test.jsx
 * @fecha         2026-11-10 22:13:37
 * @nota          Comprueba el comportamiento de el módulo Practice Governance mediante pruebas de regresión.
 */

import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import { PracticeIncidentsPage } from './PracticeIncidentsPage';
import { PracticeDeadlinesPage } from './PracticeDeadlinesPage';
import { PracticeDocumentVersionsPage } from '../../documents/pages/PracticeDocumentVersionsPage';
import { apiRequest } from '../../../api/client';
let mockRoles=['ROLE_ESTUDIANTE'],mockPractice;
jest.mock('../../auth/context/AuthContext',()=>({useAuth:()=>({token:'test',roles:mockRoles,profile:{id:7}})}));
jest.mock('../context/PracticeWorkspaceContext',()=>({usePracticeWorkspace:()=>mockPractice}));
jest.mock('../../../api/client',()=>({apiRequest:jest.fn(),apiBlob:jest.fn(),unwrapPage:x=>Array.isArray(x)?x:x?.content||[]}));
const mockConfirm=jest.fn();jest.mock('../../../components/ui/ConfirmDialog',()=>({useConfirm:()=>mockConfirm}));
beforeEach(()=>{mockRoles=['ROLE_ESTUDIANTE'];mockPractice={id:20,courseId:10,status:'APPROVED',courseActive:true};apiRequest.mockReset();apiRequest.mockResolvedValue([]);mockConfirm.mockReset().mockResolvedValue(true);});
const incident={id:30,type:'SUSPENSION',status:'OPEN',title:'Interrupción temporal',description:'Cambio de disponibilidad del centro',createdBy:'ana',createdAt:'2026-11-10T10:00:00',events:[]};
test('students register an incident but have no assignment or decision controls',async()=>{
 apiRequest.mockImplementation(async(path,options)=>options?.method==='POST'?incident:path.endsWith('/incidents')?[incident]:[]);
 render(<PracticeIncidentsPage/>);await screen.findByRole('button',{name:/Interrupción temporal/});
 fireEvent.click(screen.getByText('Registrar una incidencia'));
 fireEvent.change(screen.getByLabelText('Título de la incidencia'),{target:{value:'Interrupción temporal'}});
 fireEvent.change(screen.getByLabelText('Descripción de la situación'),{target:{value:'La institución informa una interrupción'}});
 fireEvent.click(screen.getByRole('button',{name:'Registrar incidencia'}));
 await waitFor(()=>expect(apiRequest).toHaveBeenCalledWith('/api/enrollments/20/incidents',expect.objectContaining({method:'POST',body:expect.objectContaining({title:'Interrupción temporal'})})));
 expect(screen.queryByRole('button',{name:'Resolver y aplicar cambio'})).not.toBeInTheDocument();
 expect(screen.queryByLabelText('Responsable de la incidencia')).not.toBeInTheDocument();
});
test('a director confirms the motivated decision and refreshes the practice',async()=>{
 mockRoles=['ROLE_DIRECTOR_PRACTICAS'];const changed=jest.fn();
 apiRequest.mockImplementation(async path=>path.endsWith('/incidents')?[{...incident,status:'UNDER_REVIEW'}]:[]);
 render(<PracticeIncidentsPage onPracticeChanged={changed}/>);
 fireEvent.click(await screen.findByRole('button',{name:/Interrupción temporal/}));
 fireEvent.change(screen.getByLabelText('Motivo o evaluación'),{target:{value:'Suspensión justificada por dirección'}});
 fireEvent.click(screen.getByRole('button',{name:'Resolver y aplicar cambio'}));
 await waitFor(()=>expect(apiRequest).toHaveBeenCalledWith('/api/incidents/30/decide',expect.objectContaining({method:'PATCH',body:{approved:true,reason:'Suspensión justificada por dirección',targetGroupId:null}})));
 expect(changed).toHaveBeenCalledTimes(1);expect(mockConfirm).toHaveBeenCalled();
});
test('suspended practice allows a resumption incident while withdrawn practice remains read only',async()=>{
 mockPractice.status='SUSPENDED';const view=render(<PracticeIncidentsPage/>);expect(screen.getByText('Registrar una incidencia')).toBeInTheDocument();
 mockPractice.status='WITHDRAWN';view.rerender(<PracticeIncidentsPage/>);expect(screen.queryByText('Registrar una incidencia')).not.toBeInTheDocument();
});
test('deadline creation offers no approval stages for L4 and students only consult',async()=>{
 mockRoles=['ROLE_DIRECTOR_PRACTICAS'];render(<PracticeDeadlinesPage/>);await waitFor(()=>expect(apiRequest).toHaveBeenCalled());
 fireEvent.click(screen.getByText('Establecer o actualizar un plazo'));
 fireEvent.change(screen.getByLabelText('Documento del plazo'),{target:{value:'L4'}});
 expect(screen.getByLabelText('Etapa del plazo').options).toHaveLength(1);
 fireEvent.change(screen.getByLabelText('Fecha y hora límite (Ecuador)'),{target:{value:'2026-12-01T12:00'}});
 fireEvent.change(screen.getByLabelText('Motivo del plazo o su modificación'),{target:{value:'Calendario acordado'}});
 fireEvent.click(screen.getByRole('button',{name:'Guardar plazo'}));
 await waitFor(()=>expect(apiRequest).toHaveBeenCalledWith('/api/enrollments/20/deadlines',expect.objectContaining({method:'PUT',body:expect.objectContaining({kind:'L4',stage:'SUBMISSION',dueAt:'2026-12-01T12:00',reason:'Calendario acordado'})})));
});
test('student sees deadline state and responsible without configuration controls',async()=>{
 apiRequest.mockResolvedValue([{id:3,kind:'L2',stage:'SUBMISSION',dueAt:'2026-12-01T12:00:00',state:'OVERDUE',responsibleUsers:['ana'],reason:'Entrega final',updatedBy:'director'}]);
 render(<PracticeDeadlinesPage/>);expect(await screen.findByText(/Vencido/)).toBeInTheDocument();expect(screen.getByText('Responsables: ana')).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Guardar plazo'})).not.toBeInTheDocument();
});
test('historical document content is rendered separately and never opens an edit form',async()=>{
 apiRequest.mockImplementation(async path=>path.endsWith('/document-versions')?[{id:4,kind:'L2',revisionNumber:2,event:'REVIEWED',documentStatus:'APPROVED',actor:'director',createdAt:'2026-11-10T10:00:00',hasPdf:true}]:{id:3,presentation:'Contenido original aprobado',directorApproved:true});
 render(<PracticeDocumentVersionsPage/>);fireEvent.click(await screen.findByRole('button',{name:'Consultar versión 2'}));
 expect(await screen.findByText('Contenido original aprobado')).toBeInTheDocument();expect(screen.getByText('Sí')).toBeInTheDocument();
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Descargar PDF conservado'})).toBeInTheDocument();
});
