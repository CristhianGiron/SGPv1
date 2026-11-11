/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FormFeedback.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Form Feedback mediante pruebas de regresión.
 */

import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormFeedback } from './FormFeedback';
import { Field } from './FormControls';
import { EntitySelect } from './EntitySelect';
import { GuidedForm } from '../forms/GuidedForm';
jest.mock('../../features/auth/context/AuthContext',()=>({useAuth:()=>({token:'test',roles:['ROLE_ESTUDIANTE']})}));
jest.mock('./ConfirmDialog',()=>({useConfirm:()=>jest.fn()}));

test('entity chooser and search have distinct accessible names and expose the validation message',()=>{
 render(<FormFeedback errors={{institutionId:'Selecciona la institución receptora'}} attempt={1}><Field label="Institución" name="institutionId"><EntitySelect rows={Array.from({length:7},(_,index)=>({id:index+1,name:`Escuela de educación ${index+1}`}))} value="" onChange={()=>{}} /></Field></FormFeedback>);
 const select=screen.getByRole('combobox',{name:'Institución'});
 expect(screen.getByRole('searchbox',{name:'Buscar Institución'})).toBeInTheDocument();
 expect(select).toHaveAttribute('aria-invalid','true');
 expect(select).toHaveAccessibleDescription('Selecciona la institución receptora');
 fireEvent.click(screen.getByRole('link',{name:/Selecciona la institución/}));expect(select).toHaveFocus();
});

function Example(){const [value,setValue]=useState({title:'Plan de María',objectives:'Trabajo conservado',activities:[{description:'Observación'}]});return <FormFeedback errors={{objectives:'Describe el objetivo de la práctica'}} attempt={1}><GuidedForm value={value} onChange={setValue} /></FormFeedback>;}
test('a validation error reveals a field on another step, preserves all text and moves focus on request',()=>{
 render(<Example/>);
 expect(screen.getByLabelText('Título')).toHaveValue('Plan de María');
 expect(screen.getByLabelText('Objetivos')).toHaveValue('Trabajo conservado');
 expect(screen.getByRole('alert',{name:'Revisa los datos del formulario'})).toHaveFocus();
 fireEvent.click(screen.getByRole('link',{name:/Describe el objetivo/}));
 expect(screen.getByLabelText('Objetivos')).toHaveFocus();
 fireEvent.change(screen.getByLabelText('Objetivos'),{target:{value:'Objetivo actualizado'}});
 expect(screen.getByLabelText('Título')).toHaveValue('Plan de María');
});
