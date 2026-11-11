/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          LoginPage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Login Page mediante pruebas de regresión.
 */

import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { setHashRoute } from '../utils/routes';
const mockLogin=jest.fn();
jest.mock('../auth/AuthContext',()=>({useAuth:()=>({login:mockLogin})}));
jest.mock('../utils/routes',()=>({setHashRoute:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();mockLogin.mockResolvedValue({accessToken:'fixture'});});
function fill(){fireEvent.change(screen.getByLabelText('Usuario o correo'),{target:{value:'demo2026.camila.espinosa'}});fireEvent.change(screen.getByLabelText('Contraseña'),{target:{value:'Clave de prueba!'}});}
test('the institutional login submits the existing SGP credentials and keeps registration available',async()=>{
 render(<LoginPage/>);fill();fireEvent.click(screen.getByRole('button',{name:'Entrar al sistema'}));
 await waitFor(()=>expect(mockLogin).toHaveBeenCalledWith({username:'demo2026.camila.espinosa',password:'Clave de prueba!'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:/Registrar estudiante/})).toBeEnabled());
 fireEvent.click(screen.getByRole('button',{name:/Registrar estudiante/}));expect(setHashRoute).toHaveBeenCalledWith('register');
 expect(screen.getAllByText('Universidad Nacional de Loja').length).toBeGreaterThan(0);
});
test('authentication failures remain visible beside the form and allow retrying',async()=>{
 mockLogin.mockRejectedValue(new Error('Usuario o contraseña incorrectos'));render(<LoginPage/>);fill();fireEvent.click(screen.getByRole('button',{name:'Entrar al sistema'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos');
 expect(screen.getByLabelText('Usuario o correo')).toHaveValue('demo2026.camila.espinosa');
 expect(screen.getByRole('form',{name:'Acceso al sistema'})).toHaveAttribute('aria-describedby','login-error');
 mockLogin.mockResolvedValue({accessToken:'fixture'});fireEvent.click(screen.getByRole('button',{name:'Entrar al sistema'}));await waitFor(()=>expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
test('pending authentication prevents duplicate requests and credential edits',async()=>{
 let finish;mockLogin.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));render(<LoginPage/>);fill();
 const submit=screen.getByRole('button',{name:'Entrar al sistema'});fireEvent.click(submit);fireEvent.click(submit);
 expect(mockLogin).toHaveBeenCalledTimes(1);expect(screen.getByLabelText('Contraseña')).toBeDisabled();expect(screen.getByLabelText('Usuario o correo')).toBeDisabled();
 await act(async()=>finish({accessToken:'fixture'}));expect(screen.getByLabelText('Usuario o correo')).toBeEnabled();
});
test('password visibility, caps lock guidance, help and theme controls remain usable',()=>{
 render(<LoginPage/>);const password=screen.getByLabelText('Contraseña');expect(password).toHaveAttribute('type','password');
 fireEvent.click(screen.getByRole('button',{name:'Ver contraseña'}));expect(password).toHaveAttribute('type','text');
 const event=createEvent.keyUp(password,{key:'A'});Object.defineProperty(event,'getModifierState',{value:()=>true});fireEvent(password,event);
 expect(screen.getByRole('status')).toHaveTextContent('Bloq Mayús está activado.');fireEvent.blur(password);expect(screen.queryByText('Bloq Mayús está activado.')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Cambiar a modo oscuro'}));expect(document.documentElement).toHaveClass('dark');
 fireEvent.click(screen.getByRole('button',{name:'Información sobre Iniciar sesión'}));expect(screen.getByRole('dialog',{name:'Acerca de Iniciar sesión'})).toBeInTheDocument();
});
