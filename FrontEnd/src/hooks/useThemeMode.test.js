/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useThemeMode.test.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo use Theme Mode mediante pruebas de regresión.
 */

import { applyThemeMode, useThemeMode } from './useThemeMode';
import { act, fireEvent, render, screen } from '@testing-library/react';

describe('applyThemeMode', () => {
  afterEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  test('activa la clase dark que usa Tailwind', () => {
    applyThemeMode('dark');

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).toHaveClass('theme-dark');
    expect(document.documentElement).not.toHaveClass('theme-light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  test('retira la clase dark al volver a modo claro', () => {
    applyThemeMode('dark');
    applyThemeMode('light');

    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement).not.toHaveClass('theme-dark');
    expect(document.documentElement).toHaveClass('theme-light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});

function Preferences({label='Preferencia'}) {
  const {theme,themePreference,colorTheme,setTheme,setColorTheme,storageStatus}=useThemeMode();
  return <><output aria-label={label}>{`${themePreference}/${theme}/${colorTheme}/${storageStatus}`}</output><button onClick={()=>setTheme('system')}>Sistema {label}</button><button onClick={()=>setTheme('light')}>Claro {label}</button><button onClick={()=>setTheme('dark')}>Oscuro {label}</button><button onClick={()=>setColorTheme('bosque')}>Verde {label}</button></>;
}

describe('theme preferences',()=>{
 let dark,listeners,originalMatchMedia;
 beforeEach(()=>{
  localStorage.clear();dark=false;listeners=new Set();originalMatchMedia=window.matchMedia;
  window.matchMedia=jest.fn(()=>({get matches(){return dark;},addEventListener:(_event,listener)=>listeners.add(listener),removeEventListener:(_event,listener)=>listeners.delete(listener)}));
 });
 afterEach(()=>{window.matchMedia=originalMatchMedia;localStorage.clear();document.documentElement.className='';jest.restoreAllMocks();});
 test('system preference follows device changes without replacing the saved choice',()=>{
  render(<Preferences/>);fireEvent.click(screen.getByText('Sistema Preferencia'));
  act(()=>{dark=true;listeners.forEach(listener=>listener({matches:true}));});
  expect(screen.getByLabelText('Preferencia')).toHaveTextContent('system/dark/unl');
  expect(document.documentElement).toHaveClass('dark');expect(localStorage.getItem('sgp-theme-mode')).toBe('system');
  fireEvent.click(screen.getByText('Claro Preferencia'));
  act(()=>{dark=false;listeners.forEach(listener=>listener({matches:false}));dark=true;listeners.forEach(listener=>listener({matches:true}));});
  expect(screen.getByLabelText('Preferencia')).toHaveTextContent('light/light/unl');
 });
 test('changes synchronize between controls and browser storage events',()=>{
  render(<><Preferences label="Primero"/><Preferences label="Segundo"/></>);
  fireEvent.click(screen.getByText('Verde Primero'));
  expect(screen.getByLabelText('Segundo')).toHaveTextContent('/bosque/');
  act(()=>{localStorage.setItem('sgp-theme-mode','dark');window.dispatchEvent(new StorageEvent('storage',{key:'sgp-theme-mode',newValue:'dark'}));});
  expect(screen.getByLabelText('Primero')).toHaveTextContent('dark/dark/bosque');expect(screen.getByLabelText('Segundo')).toHaveTextContent('dark/dark/bosque');
 });
 test('unavailable storage preserves a session choice and can recover persistence',()=>{
  localStorage.setItem('sgp-theme-mode','light');render(<Preferences/>);
  const blocked=jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Quota');});
  fireEvent.click(screen.getByText('Oscuro Preferencia'));
  expect(screen.getByLabelText('Preferencia')).toHaveTextContent('dark/dark/unl/session');expect(document.documentElement).toHaveClass('dark');
  blocked.mockRestore();fireEvent.click(screen.getByText('Claro Preferencia'));
  expect(screen.getByLabelText('Preferencia')).toHaveTextContent('light/light/unl/saved');
 });
});
