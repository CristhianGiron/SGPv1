/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SessionControls.test.jsx
 * @fecha         2026-11-10 21:24:04
 * @nota          Comprueba el comportamiento de el módulo Session Controls mediante pruebas de regresión.
 */

import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import { SessionControls } from './SessionControls';
const mockLogoutAll=jest.fn(),mockConfirm=jest.fn();
jest.mock('../auth/AuthContext',()=>({useAuth:()=>({logoutAll:mockLogoutAll})}));
jest.mock('./ui/ConfirmDialog',()=>({useConfirm:()=>mockConfirm}));
beforeEach(()=>{mockLogoutAll.mockReset();mockConfirm.mockReset();});
test('all-session revocation needs confirmation and reports a failed server request',async()=>{
 mockConfirm.mockResolvedValue(true);mockLogoutAll.mockRejectedValue(new Error('No se pudo confirmar el cierre'));
 render(<SessionControls/>);fireEvent.click(screen.getByRole('button',{name:'Cerrar todas mis sesiones'}));
 expect(await screen.findByText('No se pudo confirmar el cierre')).toBeInTheDocument();expect(mockLogoutAll).toHaveBeenCalledTimes(1);
});
test('cancelling leaves the sessions open',async()=>{
 mockConfirm.mockResolvedValue(false);render(<SessionControls/>);fireEvent.click(screen.getByRole('button',{name:'Cerrar todas mis sesiones'}));
 await waitFor(()=>expect(mockConfirm).toHaveBeenCalled());expect(mockLogoutAll).not.toHaveBeenCalled();
});
