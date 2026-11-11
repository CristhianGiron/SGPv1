/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFormsInterpretation.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de los instrumentos de entrevista y observación mediante pruebas de regresión.
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PracticeFormsPage } from './PracticeFormsPage';
import { apiRequest } from '../../../api/client';

const mockAuth = { token: 'test', roles: ['ROLE_ESTUDIANTE'], profile: {id:1,username:'student'} };
jest.mock('../../auth/context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../../api/client', () => ({ apiRequest: jest.fn(), unwrapPage: value => value || [] }));
jest.mock('../../../components/ui/ConfirmDialog', () => ({ useConfirm: () => jest.fn() }));

const form = {
 id:10, title:'Entrevista de práctica',status:'ANSWERED',courseName:'Quinto ciclo',target:'Tutor',
 questions:[
  {id:1,order:1,type:'OPEN_TEXT',prompt:'¿Cómo se desarrollan las clases?',answer:{textAnswer:'Con actividades colaborativas'},studentInterpretation:'Análisis guardado'},
  {id:2,order:2,type:'YES_NO',prompt:'¿Dispone de laboratorio?',answer:{booleanAnswer:false},tabulable:true,tabulation:{counts:{Sí:0,No:1}},studentInterpretation:'Se necesita infraestructura'},
  {id:3,order:3,type:'NUMBER',prompt:'¿Cuántos equipos están disponibles?',answer:{numberAnswer:0},tabulable:true,tabulation:{counts:{0:1},numericCount:1,numericAverage:0,numericMin:0,numericMax:0}},
  {id:4,order:4,type:'SINGLE_CHOICE',prompt:'Pregunta sin responder',answer:null,tabulable:true,tabulation:{counts:{Uno:0,Dos:0}}},
 ],
};

beforeEach(() => {
 HTMLElement.prototype.scrollIntoView = jest.fn();
 mockAuth.roles = ['ROLE_ESTUDIANTE'];
 localStorage.clear();
 apiRequest.mockReset();
 apiRequest.mockImplementation(async path => path === '/api/practice-forms/10' ? { ...form, questions: form.questions.map(question => ({ ...question })) } : path === '/api/practice-forms/me' ? [form] : []);
});

test('interpretation shows quantitative charts beside answers and the students analysis, and keeps other drafts when saving', async () => {
 render(<PracticeFormsPage />);
 fireEvent.click(await screen.findByRole('button', {name:'Ver'}));
 fireEvent.click(await screen.findByRole('tab', {name:'Interpretación'}));
 expect(screen.getByRole('img', {name:/Gráfico circular.*1 respuesta/})).toBeInTheDocument();
 expect(screen.getByRole('img', {name:/Gráfico de barras/})).toBeInTheDocument();
 expect(screen.getByDisplayValue('Análisis guardado')).toBeInTheDocument();
 expect(screen.getByDisplayValue('Se necesita infraestructura')).toBeInTheDocument();
 expect(screen.queryByText('Pregunta sin responder')).not.toBeInTheDocument();
 const quantitative = screen.getByRole('textbox', {name:'Interpretación del estudiante de la pregunta 2'});
 const numeric = screen.getByRole('textbox', {name:'Interpretación del estudiante de la pregunta 3'});
 fireEvent.change(quantitative, {target:{value:'Se requiere equipar el laboratorio'}});
 fireEvent.change(numeric, {target:{value:'No se dispone de equipos operativos'}});
 const question = quantitative.closest('article');
 expect(within(question).getByText('Resumen cuantitativo')).toBeInTheDocument();
 fireEvent.click(within(question).getByRole('button', {name:'Guardar'}));
 await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/practice-forms/10/questions/2/interpretation',expect.objectContaining({method:'PATCH',body:{interpretation:'Se requiere equipar el laboratorio'}})));
 await screen.findByText('Interpretación guardada.');
 expect(screen.getByRole('tab', {name:'Interpretación'})).toHaveAttribute('aria-selected','true');
 expect(screen.getByRole('textbox', {name:'Interpretación del estudiante de la pregunta 3'})).toHaveValue('No se dispone de equipos operativos');
});


test('a reviewer can see the charts of a quantitative-only interview without editing the students interpretation', async () => {
 mockAuth.roles = ['ROLE_TUTOR_PRACTICAS'];
 const quantitativeForm = {...form, questions:form.questions.filter(question => question.type !== 'OPEN_TEXT')};
 apiRequest.mockImplementation(async path => path === '/api/practice-forms/10' ? quantitativeForm : path === '/api/practice-forms/managed' ? [quantitativeForm] : []);
 render(<PracticeFormsPage />);
 fireEvent.click(await screen.findByRole('button', {name:'Ver'}));
 fireEvent.click(await screen.findByRole('tab', {name:'Interpretación'}));
 expect(screen.getByRole('img', {name:/Gráfico circular/})).toBeInTheDocument();
 expect(screen.getByRole('img', {name:/Gráfico de barras/})).toBeInTheDocument();
 expect(screen.getByText('Se necesita infraestructura')).toBeInTheDocument();
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});
