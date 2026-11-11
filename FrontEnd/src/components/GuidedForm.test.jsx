/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          GuidedForm.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Guided Form mediante pruebas de regresión.
 */

import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { GuidedForm } from './GuidedForm';
jest.mock('./ui/ConfirmDialog',()=>({useConfirm:()=>jest.fn()}));
function Example(){const [value,setValue]=useState({title:'Plan',objectives:'Objetivo',activities:[{description:'Actividad'}],conclusions:'Cierre',enrollmentId:7});return <><GuidedForm value={value} hiddenFields={['enrollmentId']} onChange={setValue}/><output aria-label="Contenido">{JSON.stringify(value)}</output></>;}
test('changing steps preserves all fields and final review disables nested edits',()=>{
 render(<Example/>);
 fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Plan actualizado'}});
 fireEvent.click(screen.getByRole('button',{name:'Siguiente'}));
 expect(screen.getByLabelText('Objetivos')).toHaveValue('Objetivo');
 expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
 expect(screen.getByLabelText('Contenido')).toHaveTextContent('"title":"Plan actualizado"');
 expect(screen.getByLabelText('Contenido')).toHaveTextContent('"enrollmentId":7');
 fireEvent.click(screen.getByRole('button',{name:/5\. Revisión final|4\. Revisión final/}));
 expect(screen.getByLabelText('Objetivos')).toBeDisabled();
 expect(screen.getByRole('button',{name:/Agregar actividades de la semana/})).toBeDisabled();
});
