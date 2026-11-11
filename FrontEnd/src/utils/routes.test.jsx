/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          routes.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo routes mediante pruebas de regresión.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { setHashRoute, useHashRoute } from './routes';
function Router(){const route=useHashRoute();return <><output aria-label="Ruta">{route}</output><button onClick={()=>setHashRoute('courses')}>Cursos</button></>;}
test('application navigation and direct hash navigation can both be cancelled before changing the rendered route',()=>{
 window.history.replaceState(null,'','#/dashboard');render(<Router/>);
 const prevent=event=>event.preventDefault();window.addEventListener('sgp-before-navigate',prevent);
 fireEvent.click(screen.getByRole('button',{name:'Cursos'}));expect(window.location.hash).toBe('#/dashboard');
 act(()=>{window.history.replaceState(null,'','#/courses');window.dispatchEvent(new HashChangeEvent('hashchange'));});
 expect(screen.getByLabelText('Ruta')).toHaveTextContent('dashboard');expect(window.location.hash).toBe('#/dashboard');
 window.removeEventListener('sgp-before-navigate',prevent);
});
test('an accepted application navigation requests confirmation only once',()=>{
 window.history.replaceState(null,'','#/dashboard');render(<Router/>);
 const callback=jest.fn();window.addEventListener('sgp-before-navigate',callback);
 fireEvent.click(screen.getByRole('button',{name:'Cursos'}));act(()=>window.dispatchEvent(new HashChangeEvent('hashchange')));
 expect(screen.getByLabelText('Ruta')).toHaveTextContent('courses');expect(callback).toHaveBeenCalledTimes(1);
 window.removeEventListener('sgp-before-navigate',callback);
});
