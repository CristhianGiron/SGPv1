/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Alert.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Alert mediante pruebas de regresión.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { Alert } from './Alert';

beforeEach(()=>jest.useFakeTimers());
afterEach(()=>jest.useRealTimers());

test('authorization errors remain visible until the user closes them',()=>{
 render(<Alert tone="error">No tienes permisos para guardar este registro.</Alert>);
 act(()=>jest.advanceTimersByTime(10000));
 expect(screen.getByRole('alert')).toHaveTextContent('No tienes permisos');
 fireEvent.click(screen.getByRole('button',{name:'Cerrar alerta'}));
 expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('persistent notices remain visible and ordinary success notices auto-hide',()=>{
 const {rerender}=render(<Alert dismissible={false}>Información necesaria para continuar</Alert>);
 act(()=>jest.advanceTimersByTime(10000));
 expect(screen.getByRole('status')).toBeInTheDocument();
 rerender(<Alert tone="success">Guardado</Alert>);
 act(()=>jest.advanceTimersByTime(3001));
 expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('contextual information and warning actions remain available until dismissed',()=>{
 const {rerender}=render(<Alert>Solicitud pendiente. <button>Gestionar mi solicitud</button></Alert>);
 act(()=>jest.advanceTimersByTime(10000));
 expect(screen.getByRole('button',{name:'Gestionar mi solicitud'})).toBeInTheDocument();
 rerender(<Alert tone="warning">Completa los datos institucionales.</Alert>);
 act(()=>jest.advanceTimersByTime(10000));
 expect(screen.getByRole('status')).toHaveTextContent('Completa los datos');
 fireEvent.click(screen.getByRole('button',{name:'Cerrar alerta'}));
 expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('simultaneous notices retain their individual actions',()=>{
 render(<><Alert>Estado de la práctica</Alert><Alert tone="error">Error del documento</Alert></>);
 fireEvent.click(screen.getAllByRole('button',{name:'Cerrar alerta'})[0]);
 expect(screen.queryByRole('status')).not.toBeInTheDocument();
 expect(screen.getByRole('alert')).toHaveTextContent('Error del documento');
});
