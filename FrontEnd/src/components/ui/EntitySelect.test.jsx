/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EntitySelect.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Entity Select mediante pruebas de regresión.
 */

import {useState} from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {EntitySelect} from './EntitySelect';
jest.mock('../../auth/AuthContext',()=>({useAuth:()=>({roles:['ROLE_ADMIN'],token:'test'})}));
function Choice({rows,required=false,initial=''}){const [value,setValue]=useState(initial);return <><EntitySelect rows={rows} required={required} value={value} onChange={setValue} placeholder="Práctica"/><output aria-label="Valor enviado">{value}</output></>;}
const choices=[{id:7,name:'Práctica A'},{id:8,name:'Práctica B'}];
test('the sole required option is assigned while optional choices remain optional',async()=>{
 const view=render(<Choice rows={[choices[0]]} required/>);
 await waitFor(()=>expect(screen.getByLabelText('Valor enviado')).toHaveTextContent('7'));
 expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
 expect(screen.getByRole('textbox',{name:'Práctica'})).toHaveValue('Práctica A');
 view.unmount();render(<Choice rows={[choices[0]]}/>);
 expect(screen.getByRole('combobox',{name:'Práctica'})).toHaveValue('');
 expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
});
test('multiple options retain selection and only longer lists need a search input',()=>{
 const view=render(<Choice rows={choices} required/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Práctica'}),{target:{value:'8'}});
 expect(screen.getByLabelText('Valor enviado')).toHaveTextContent('8');
 view.rerender(<Choice rows={[...choices,...Array.from({length:5},(_,index)=>({id:index+10,name:`Otra ${index}`}))]} required/>);
 expect(screen.getByRole('searchbox')).toBeInTheDocument();
 expect(screen.getByRole('combobox',{name:'Práctica'})).toHaveValue('8');
});
