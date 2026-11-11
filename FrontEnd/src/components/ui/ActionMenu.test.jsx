/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActionMenu.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Action Menu mediante pruebas de regresión.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { ActionMenu } from './ActionMenu';
import { Modal } from './Modal';

afterEach(()=>jest.restoreAllMocks());

test('a menu opened in a dialog remains in its focus boundary and its action is usable',()=>{
 jest.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({top:100,bottom:140,left:100,right:140,width:40,height:40});
 const action=jest.fn();
 render(<Modal open title="Documento" onClose={()=>{}}><ActionMenu label="Opciones del documento" actions={[{label:'Ver evidencia',onClick:action}]}/></Modal>);
 const dialog=screen.getByRole('dialog');
 fireEvent.click(within(dialog).getByRole('button',{name:'Opciones del documento'}));
 const menu=within(dialog).getByRole('menu',{name:'Opciones del documento'});
 fireEvent.click(within(menu).getByRole('button',{name:'Ver evidencia'}));
 expect(action).toHaveBeenCalledTimes(1);
 expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});
