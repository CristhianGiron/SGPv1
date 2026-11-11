/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AccessibilityWidget.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Accessibility Widget mediante pruebas de regresión.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import AccessibilityWidget from './AccessibilityWidget';

const key='accessibility-widget-settings';
beforeEach(()=>{localStorage.clear();delete window.speechSynthesis;delete window.SpeechSynthesisUtterance;});
afterEach(()=>{jest.restoreAllMocks();document.getElementById('sgp-main-content')?.remove();});
function open(){const trigger=screen.getByRole('button',{name:'Abrir herramientas de accesibilidad'});trigger.focus();fireEvent.click(trigger);return screen.getByRole('dialog',{name:'Accesibilidad'});}

test('keyboard focus stays in the panel and returns to the circular launcher on Escape',()=>{
 render(<><div aria-hidden="true"><div role="dialog" aria-modal="true">Menú cerrado</div></div><AccessibilityWidget/></>);const dialog=open();
 expect(dialog).toHaveFocus();
 const reset=within(dialog).getByRole('button',{name:'Restablecer ajustes'});reset.focus();
 fireEvent.keyDown(document,{key:'Tab'});
 expect(screen.getByRole('button',{name:'Cerrar herramientas de accesibilidad'})).toHaveFocus();
 fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Abrir herramientas de accesibilidad'})).toHaveFocus();
});

test('font size and switches persist across remount and reset without closing the panel',()=>{
 const first=render(<AccessibilityWidget/>);open();
 fireEvent.click(screen.getByRole('button',{name:'Aumentar tamaño del texto'}));
 fireEvent.click(screen.getByRole('switch',{name:'Subrayar enlaces'}));
 expect(document.documentElement).toHaveClass('aw-font-scaled','aw-underline-links');
 expect(JSON.parse(localStorage.getItem(key)).fontScale).toBe(1.1);
 first.unmount();expect(document.documentElement).not.toHaveClass('aw-font-scaled');
 render(<AccessibilityWidget/>);open();
 expect(screen.getByLabelText('Tamaño del texto')).toHaveTextContent('110%');
 expect(screen.getByRole('switch',{name:'Subrayar enlaces'})).toHaveAttribute('aria-checked','true');
 fireEvent.click(screen.getByRole('button',{name:'Restablecer ajustes'}));
 expect(screen.getByRole('dialog')).toBeInTheDocument();
 expect(screen.getByLabelText('Tamaño del texto')).toHaveTextContent('100%');
 expect(document.documentElement).not.toHaveClass('aw-underline-links','aw-font-scaled');
 expect(localStorage.getItem(key)).toBeNull();
});

test('contrast choices are mutually exclusive and grayscale uses a separate visual layer',()=>{
 render(<AccessibilityWidget/>);open();
 fireEvent.click(screen.getByRole('radio',{name:'Alto contraste'}));
 expect(document.documentElement).toHaveClass('aw-high-contrast');
 fireEvent.click(screen.getByRole('radio',{name:'Invertir colores'}));
 expect(document.documentElement).not.toHaveClass('aw-high-contrast');
 expect(document.documentElement).toHaveClass('aw-negative-contrast');
 expect(screen.getByRole('radio',{name:'Alto contraste'})).not.toBeChecked();
 fireEvent.click(screen.getByRole('switch',{name:'Escala de grises'}));
 expect(document.querySelector('.sgp-a11y-color-filter')).toHaveAttribute('aria-hidden','true');
 fireEvent.click(screen.getByRole('radio',{name:'Original'}));
 expect(document.documentElement).not.toHaveClass('aw-negative-contrast');
});

test('unavailable speech support is explained and does not prevent other adjustments',()=>{
 render(<AccessibilityWidget/>);open();
 fireEvent.click(screen.getByText('Lectura en voz alta'));
 expect(screen.getByText(/Tu navegador no ofrece lectura/)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Leer contenido'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('switch',{name:'Reducir movimiento'}));
 expect(document.documentElement).toHaveClass('aw-reduced-motion');
});

test('speech reads main content in Spanish and supports pause, continue and stop',()=>{
 window.speechSynthesis={speak:jest.fn(),cancel:jest.fn(),pause:jest.fn(),resume:jest.fn(),getVoices:()=>[]};
 window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
 const main=document.createElement('main');main.id='sgp-main-content';main.innerHTML='<p>Educación de María Muñoz</p><span hidden>NO LEER</span>';document.body.append(main);
 render(<AccessibilityWidget/>);open();fireEvent.click(screen.getByText('Lectura en voz alta'));
 fireEvent.click(screen.getByRole('button',{name:'Leer contenido'}));
 const voice=window.speechSynthesis.speak.mock.calls[0][0];
 expect(voice.text).toBe('Educación de María Muñoz');expect(voice.lang).toBe('es-EC');
 fireEvent.click(screen.getByRole('button',{name:'Pausar'}));expect(window.speechSynthesis.pause).toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Continuar'}));expect(window.speechSynthesis.resume).toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Detener'}));
 expect(screen.getByRole('button',{name:'Leer contenido'})).toBeEnabled();
 act(()=>voice.onend());expect(screen.getByText('Listo para leer')).toBeInTheDocument();
});

test('blocked storage keeps controls usable and reports that preferences cannot be saved',()=>{
 jest.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('Blocked');});
 jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Blocked');});
 render(<AccessibilityWidget/>);open();fireEvent.click(screen.getByRole('switch',{name:'Fuente legible'}));
 expect(screen.getByRole('switch',{name:'Fuente legible'})).toHaveAttribute('aria-checked','true');
 expect(screen.getByText(/este navegador no permite guardarlos/)).toBeInTheDocument();
});

test('older contradictory settings are normalized and invalid sizes are bounded',()=>{
 localStorage.setItem(key,JSON.stringify({settings:{highContrast:true,negativeContrast:true,lightBackground:true},fontScale:99,speechRate:-1}));
 render(<AccessibilityWidget/>);open();
 expect(screen.getByRole('radio',{name:'Alto contraste'})).toBeChecked();
 expect(screen.getByRole('radio',{name:'Invertir colores'})).not.toBeChecked();
 expect(screen.getByLabelText('Tamaño del texto')).toHaveTextContent('200%');
 expect(screen.getByRole('button',{name:'Aumentar tamaño del texto'})).toBeDisabled();
});

test('closing tools over an existing mobile menu returns focus to a menu control',()=>{
 render(<><div role="dialog" aria-modal="true" aria-label="Menú de prueba"><button>Cerrar menú</button></div><AccessibilityWidget/></>);
 open();fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.getByRole('button',{name:'Cerrar menú'})).toHaveFocus();
});

const positionKey='sgp-accessibility-position';
function pointer(node,type,x,y){fireEvent(node,new MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y}));}
function launcherRect(node){jest.spyOn(node,'getBoundingClientRect').mockImplementation(()=>{const style=node.closest('[data-accessibility-widget]').style,left=parseFloat(style.left)||16,top=parseFloat(style.top)||650;return {left,top,right:left+50,bottom:top+50,width:50,height:50};});}

test('drag moves and persists the launcher without opening tools, while a normal click still opens them',()=>{
 const view=render(<AccessibilityWidget/>);const button=screen.getByRole('button',{name:'Abrir herramientas de accesibilidad'});launcherRect(button);
 pointer(button,'pointerdown',36,670);pointer(button,'pointermove',236,370);pointer(button,'pointerup',236,370);
 fireEvent.click(button,{detail:1});
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(button.closest('[data-accessibility-widget]')).toHaveAttribute('data-custom-position','true');
 const position=JSON.parse(localStorage.getItem(positionKey));expect(position.version).toBe(1);expect(position.x).toBeGreaterThan(0);expect(position.y).toBeGreaterThan(0);
 view.unmount();render(<AccessibilityWidget/>);
 const restored=screen.getByRole('button',{name:'Abrir herramientas de accesibilidad'});
 expect(restored.closest('[data-accessibility-widget]')).toHaveAttribute('data-custom-position','true');
 fireEvent.click(restored);expect(screen.getByRole('dialog',{name:'Accesibilidad'})).toBeInTheDocument();
});

test('small pointer movements remain clicks and cancelled drags restore the original position',()=>{
 render(<AccessibilityWidget/>);const button=screen.getByRole('button',{name:'Abrir herramientas de accesibilidad'});launcherRect(button);
 pointer(button,'pointerdown',36,670);pointer(button,'pointermove',39,671);pointer(button,'pointerup',39,671);fireEvent.click(button,{detail:1});
 expect(screen.getByRole('dialog')).toBeInTheDocument();fireEvent.keyDown(document,{key:'Escape'});
 pointer(button,'pointerdown',36,670);pointer(button,'pointermove',236,370);pointer(button,'pointercancel',236,370);
 expect(button.closest('[data-accessibility-widget]')).toHaveAttribute('data-custom-position','false');
 expect(localStorage.getItem(positionKey)).toBeNull();
});

test('keyboard movement is bounded and resetting position preserves accessibility preferences',()=>{
 render(<AccessibilityWidget/>);const button=screen.getByRole('button',{name:'Abrir herramientas de accesibilidad'});launcherRect(button);button.focus();
 fireEvent.keyDown(button,{key:'ArrowLeft',shiftKey:true});fireEvent.keyDown(button,{key:'ArrowUp',shiftKey:true});
 const position=JSON.parse(localStorage.getItem(positionKey));expect(position.x).toBe(0);expect(position.y).toBeGreaterThanOrEqual(0);expect(position.y).toBeLessThanOrEqual(1);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();open();fireEvent.click(screen.getByRole('switch',{name:'Subrayar enlaces'}));
 fireEvent.click(screen.getByRole('button',{name:'Restaurar posición del botón'}));
 expect(localStorage.getItem(positionKey)).toBeNull();expect(document.documentElement).toHaveClass('aw-underline-links');
 expect(screen.getByRole('button',{name:'Restaurar posición del botón'})).toBeDisabled();
});

test('moving the launcher still works when its position cannot be persisted',()=>{
 jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Blocked');});
 render(<AccessibilityWidget/>);const button=screen.getByRole('button',{name:'Abrir herramientas de accesibilidad'});launcherRect(button);
 fireEvent.keyDown(button,{key:'ArrowRight'});open();
 expect(screen.getByText(/La posición se aplicó durante esta sesión/)).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Restaurar posición del botón'})).toBeEnabled();
});

test('a touch tap opens immediately after a drag without depending on a compatibility click',()=>{
 render(<AccessibilityWidget/>);const button=screen.getByRole('button',{name:'Abrir herramientas de accesibilidad'});launcherRect(button);
 const touch=(type,x,y)=>{const event=new MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y});Object.defineProperties(event,{pointerType:{value:'touch'},pointerId:{value:9},isPrimary:{value:true}});fireEvent(button,event);};
 touch('pointerdown',36,670);touch('pointermove',236,370);touch('pointerup',236,370);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 const rect=button.getBoundingClientRect();touch('pointerdown',rect.left+25,rect.top+25);touch('pointerup',rect.left+25,rect.top+25);
 expect(screen.getByRole('dialog',{name:'Accesibilidad'})).toBeInTheDocument();
 fireEvent.click(button,{detail:1});expect(screen.getByRole('dialog',{name:'Accesibilidad'})).toBeInTheDocument();
});
