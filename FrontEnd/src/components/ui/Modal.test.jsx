/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Modal.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Modal mediante pruebas de regresión.
 */

import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Modal } from './Modal';
import { ConfirmProvider, useConfirm } from './ConfirmDialog';
function Example(){
 const [open,setOpen]=useState(false),[name,setName]=useState('');const confirm=useConfirm();
 return <><button onClick={()=>setOpen(true)}>Abrir formulario</button><Modal open={open} title="Formulario de prueba" onClose={()=>setOpen(false)}><label>Nombre<input value={name} onChange={event=>setName(event.target.value)}/></label><button onClick={()=>confirm({title:'Confirmación anidada'})}>Confirmar ahora</button></Modal></>;
}
function setup(){render(<ConfirmProvider><Example/></ConfirmProvider>);const opener=screen.getByRole('button',{name:'Abrir formulario'});opener.focus();fireEvent.click(opener);}
test('typing does not reset focus when the close callback changes',()=>{
 setup();const input=screen.getByLabelText('Nombre');input.focus();fireEvent.change(input,{target:{value:'Ana Torres'}});expect(input).toHaveFocus();expect(input).toHaveValue('Ana Torres');
});
test('keyboard focus loops within the dialog and returns to the opener on close',()=>{
 setup();const dialog=screen.getByRole('dialog',{name:'Formulario de prueba'});const buttons=within(dialog).getAllByRole('button');
 buttons[buttons.length-1].focus();fireEvent.keyDown(document,{key:'Tab'});expect(buttons[0]).toHaveFocus();
 fireEvent.keyDown(document,{key:'Tab',shiftKey:true});expect(buttons[buttons.length-1]).toHaveFocus();
 fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Abrir formulario'})).toHaveFocus();
});
test('Escape closes only the top confirmation and preserves the parent scroll lock',()=>{
 document.body.style.overflow='auto';setup();fireEvent.click(screen.getByRole('button',{name:'Confirmar ahora'}));
 expect(screen.getAllByRole('dialog')).toHaveLength(2);fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.queryByRole('dialog',{name:'Confirmación anidada'})).not.toBeInTheDocument();expect(screen.getByRole('dialog',{name:'Formulario de prueba'})).toBeInTheDocument();expect(document.body.style.overflow).toBe('hidden');
 fireEvent.keyDown(document,{key:'Escape'});expect(document.body.style.overflow).toBe('auto');document.body.style.overflow='';
});
