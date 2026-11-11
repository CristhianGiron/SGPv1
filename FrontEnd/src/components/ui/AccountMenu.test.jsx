/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AccountMenu.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las cuentas de usuario mediante pruebas de regresión.
 */

import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AccountMenu } from './AccountMenu';

const profile={id:7,names:'María José',lastNames:'Muñoz Peñafiel',username:'maria',institutionalEmail:'maria@example.test'};
const visit=jest.fn(),logout=jest.fn();
function Example(){const [open,setOpen]=useState(false);return <AccountMenu profile={profile} roles={['ROLE_ESTUDIANTE']} open={open} onOpen={()=>setOpen(true)} onClose={()=>setOpen(false)} onProfile={visit} onLogout={logout}/>;}
beforeEach(()=>{localStorage.clear();visit.mockReset();logout.mockReset();});
test('account identity, profile, appearance and session actions have distinct sections',()=>{
 render(<Example/>);fireEvent.click(screen.getByRole('button',{name:'Menú de cuenta'}));
 const dialog=screen.getByRole('dialog',{name:'Cuenta y preferencias'});
 expect(within(dialog).getByText('María José Muñoz Peñafiel')).toBeInTheDocument();
 expect(within(dialog).getByText('maria@example.test')).toBeInTheDocument();
 expect(within(dialog).getByRole('radio',{name:'Sistema'})).toBeChecked();
 fireEvent.click(within(dialog).getByRole('radio',{name:'Oscuro'}));
 fireEvent.click(within(dialog).getByRole('radio',{name:'Verde pizarra'}));
 expect(document.documentElement).toHaveAttribute('data-theme','dark');
 expect(document.documentElement).toHaveAttribute('data-color-theme','bosque');
 expect(screen.getByRole('dialog')).toBeInTheDocument();
 fireEvent.click(within(dialog).getByRole('button',{name:/Mi perfil/}));
 expect(visit).toHaveBeenCalledTimes(1);expect(logout).not.toHaveBeenCalled();expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
test('Escape restores focus and signing out is a separate explicit action',()=>{
 render(<Example/>);const trigger=screen.getByRole('button',{name:'Menú de cuenta'});trigger.focus();fireEvent.click(trigger);
 fireEvent.keyDown(document,{key:'Escape'});expect(trigger).toHaveFocus();expect(logout).not.toHaveBeenCalled();
 fireEvent.click(trigger);fireEvent.click(screen.getByRole('button',{name:'Cerrar sesión'}));expect(logout).toHaveBeenCalledTimes(1);
});
test('clicking the outside surface closes the account panel',()=>{
 render(<Example/>);fireEvent.click(screen.getByRole('button',{name:'Menú de cuenta'}));
 fireEvent.mouseDown(screen.getByRole('dialog',{name:'Cuenta y preferencias'}));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
