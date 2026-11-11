/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeOverview.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Practice Overview mediante pruebas de regresión.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { PracticeOverview } from './PracticeOverview';
import { DOCUMENT_MODULES } from '../config/endpointModules';
import { apiRequest } from '../api/client';
jest.mock('../auth/AuthContext',()=>({useAuth:()=>({token:'test',roles:['ROLE_ESTUDIANTE']})}));
jest.mock('../api/client',()=>({apiRequest:jest.fn()}));
const practice={id:7,status:'APPROVED',courseActive:true};
test('failed queries display an explicit partial summary and never recommend a supposedly missing failed document',async()=>{
 apiRequest.mockImplementation(async path=>{if(path.includes('activity-plans')) throw new Error('Sin conexión');return [];});
 render(<PracticeOverview practice={practice}/>);
 await screen.findByText(/Resumen parcial/);
 expect(screen.getByText('No disponible')).toBeInTheDocument();
 expect(screen.getAllByText('—')).toHaveLength(3);
 expect(screen.getByRole('button',{name:'Comenzar'})).toBeInTheDocument();
 expect(screen.getByText('Tu siguiente paso').parentElement.textContent).not.toContain(DOCUMENT_MODULES.find(module=>module.id==='activity-plans').title);
});
test('the summary and timeline exclude documents from other practices',async()=>{
 apiRequest.mockImplementation(async path=>path.includes('activity-plans') ? [{id:1,enrollmentId:7,status:'NEEDS_CORRECTION',createdAt:'2026-01-01T10:00:00'},{id:2,enrollmentId:8,status:'APPROVED',createdAt:'2026-01-02T10:00:00'}] : []);
 render(<PracticeOverview practice={practice}/>);
 await screen.findByText('Atiende las observaciones recibidas');
 await waitFor(()=>expect(screen.getAllByText('Documento creado')).toHaveLength(1));
});
