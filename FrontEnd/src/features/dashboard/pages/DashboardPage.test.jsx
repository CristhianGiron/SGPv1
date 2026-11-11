/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DashboardPage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Dashboard Page mediante pruebas de regresión.
 */

import { render, screen, within } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { apiRequest } from '../../../api/client';
let mockRoles = ['ROLE_ESTUDIANTE'];
jest.mock('../../auth/context/AuthContext', () => ({ useAuth: () => ({token:'test',roles:mockRoles,profile:{id:1,names:'Ana'}}) }));
jest.mock('../../../api/client', () => ({apiRequest:jest.fn(), apiUrl:p=>p, unwrapPage:p=>Array.isArray(p)?p:p?.content||[]}));
jest.mock('../../../components/ui/PageHeader', () => ({PageHeader:({title})=><h1>{title}</h1>}));

beforeEach(()=>{mockRoles=['ROLE_ESTUDIANTE'];apiRequest.mockReset();apiRequest.mockResolvedValue([]);});

test('a failed service is shown as unavailable instead of a complete zero-valued practice file', async()=>{
 apiRequest.mockImplementation(path=>path==='/api/practice-photos/me'?Promise.reject(new Error('Service unavailable')):Promise.resolve([]));
 render(<DashboardPage/>);
 expect(await screen.findByText(/Resumen no disponible/)).toBeInTheDocument();
 expect(screen.getByRole('alert')).toHaveTextContent(/No se pudo cargar todo el resumen/);
 expect(screen.queryByText('0 aprobados')).not.toBeInTheDocument();
});

test('a failed document endpoint does not claim there are no documents', async()=>{
 apiRequest.mockImplementation(path=>path==='/api/activity-plans/me/summary'?Promise.reject(new Error('Unavailable')):Promise.resolve([]));
 render(<DashboardPage/>);
 expect(await screen.findByText('No se pudo consultar el estado de tus documentos.')).toBeInTheDocument();
 expect(screen.queryByText(/Aún no tienes documentos creados/)).not.toBeInTheDocument();
});

test('a failed reviewer queue does not claim the tutor has no pending work', async()=>{
 mockRoles=['ROLE_TUTOR_PRACTICAS'];
 apiRequest.mockImplementation(path=>path.includes('/practice-review/')?Promise.reject(new Error('Unavailable')):Promise.resolve([]));
 render(<DashboardPage/>);
 expect(await screen.findByText(/No se pudieron consultar las tareas/)).toBeInTheDocument();
 expect(screen.queryByText(/No tienes revisiones pendientes/)).not.toBeInTheDocument();
});

test('tutor pending cards count only submitted records awaiting this tutor',async()=>{
 mockRoles=['ROLE_TUTOR_PRACTICAS'];
 apiRequest.mockImplementation(path=>Promise.resolve(path==='/api/activity-plans/review/summary'?
 [{id:1,status:'APPROVED'},{id:2,status:'SUBMITTED',practiceTutorApproved:true},{id:3,status:'SUBMITTED'}]:[]));
 render(<DashboardPage/>);
 const label=await screen.findByText('Planes por revisar');
 expect(within(label.closest('section')).getByText('1')).toBeInTheDocument();
});
