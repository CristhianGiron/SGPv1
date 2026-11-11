/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useDialogFocus.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona el estado y la integración de useDialogFocus en la interfaz React.
 */

import { useEffect, useRef } from 'react';
import { activeDialogs } from '../utils/dialogs';

let scrollLocks = 0;
let previousBodyOverflow = '', previousDocumentOverflow = '';
function topDialog() {
  return activeDialogs().at(-1);
}
function focusable(dialog) {
  return [...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[contenteditable="true"]')]
    .filter(node=>node.tabIndex>=0 && !node.matches(':disabled') && node.getAttribute('type')!=='hidden'
      && (!node.closest('details:not([open])') || Boolean(node.closest('summary')))
      && !node.closest('[hidden],[inert]') && getComputedStyle(node).display!=='none' && getComputedStyle(node).visibility!=='hidden');
}
// The close callback can change while typing without restarting focus or scroll locks.
export function useDialogFocus(open, dialogRef, onClose) {
  const closeRef = useRef(onClose);closeRef.current = onClose;
  useEffect(()=>{
    const dialog=dialogRef.current;
    if (!open || !dialog) return undefined;
    const previous=document.activeElement;
    if (scrollLocks===0) {
      previousBodyOverflow=document.body.style.overflow;previousDocumentOverflow=document.documentElement.style.overflow;
      document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
    }
    scrollLocks+=1;dialog.focus();
    function handleKey(event) {
      if (topDialog()!==dialog) return;
      if (event.key==='Escape') {event.preventDefault();event.stopPropagation();closeRef.current?.();}
      if (event.key!=='Tab') return;
      const items=focusable(dialog), first=items[0], last=items[items.length-1];
      if (!first) {event.preventDefault();dialog.focus();return;}
      if (event.shiftKey && (document.activeElement===first || document.activeElement===dialog || !dialog.contains(document.activeElement))) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && (document.activeElement===last || document.activeElement===dialog || !dialog.contains(document.activeElement))) {event.preventDefault();first.focus();}
    }
    document.addEventListener('keydown',handleKey);
    return ()=>{
      document.removeEventListener('keydown',handleKey);scrollLocks-=1;
      if (scrollLocks===0) {document.body.style.overflow=previousBodyOverflow;document.documentElement.style.overflow=previousDocumentOverflow;}
      if (previous instanceof HTMLElement && previous.isConnected && (!topDialog() || topDialog().contains(previous))) previous.focus();
    };
  },[open,dialogRef]);
}
