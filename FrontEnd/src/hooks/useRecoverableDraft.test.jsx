/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useRecoverableDraft.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo use Recoverable Draft mediante pruebas de regresión.
 */

import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRecoverableDraft } from './useRecoverableDraft';
import { DraftRecovery } from '../components/ui/DraftRecovery';
let mockOwner=1;
jest.mock('../auth/AuthContext',()=>({useAuth:()=>({profile:{id:mockOwner}})}));
function Example({scope='plans:7:new'}) { const [value,setValue]=useState({title:''});const draft=useRecoverableDraft(scope,setValue);return <><input aria-label="Título" value={value.title} onChange={event=>{const next={title:event.target.value};setValue(next);draft.change(next);}}/><DraftRecovery draft={draft}/><button onClick={draft.markClean}>Guardar en sistema</button></>; }
beforeEach(()=>{localStorage.clear();mockOwner=1;jest.useFakeTimers();});
afterEach(()=>{jest.runOnlyPendingTimers();jest.useRealTimers();jest.restoreAllMocks();});
test('recovers a local draft after remount without overwriting fields automatically and clears on server save',()=>{
 const first=render(<Example/>);fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Mi avance'}});act(()=>jest.advanceTimersByTime(750));
 expect(screen.getByRole('status')).toHaveTextContent('Guardado automáticamente en este navegador');first.unmount();
 render(<Example/>);expect(screen.getByLabelText('Título')).toHaveValue('');fireEvent.click(screen.getByRole('button',{name:'Recuperar borrador'}));expect(screen.getByLabelText('Título')).toHaveValue('Mi avance');
 fireEvent.click(screen.getByRole('button',{name:'Guardar en sistema'}));expect(localStorage.getItem('sgp:draft:v1:1:plans:7:new')).toBeNull();
});
test('drafts are isolated by account and practice, and declined navigation is cancelled',()=>{
 jest.spyOn(window,'confirm').mockReturnValue(false);
 const first=render(<Example/>);fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Privado'}});
 const event=new Event('sgp-before-navigate',{cancelable:true});act(()=>window.dispatchEvent(event));expect(event.defaultPrevented).toBe(true);first.unmount();
 mockOwner=2;const second=render(<Example/>);expect(screen.queryByText(/Hay una copia local/)).not.toBeInTheDocument();second.unmount();
 mockOwner=1;render(<Example scope="plans:8:new"/>);expect(screen.queryByText(/Hay una copia local/)).not.toBeInTheDocument();
});
test('storage failure reports that no local copy was saved',()=>{
 jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Quota');});
 render(<Example/>);fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Texto'}});act(()=>jest.advanceTimersByTime(750));
 expect(screen.getByRole('status')).toHaveTextContent('No se pudo guardar');
});
