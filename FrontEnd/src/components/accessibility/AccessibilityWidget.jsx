/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AccessibilityWidget.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente AccessibilityWidget de la interfaz del SGP.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Accessibility, Check, ChevronDown, Link, Minus, MoonStar, Pause, Play, Plus, RotateCcw, Square, Sun, Type, Volume2, X, Eye, Zap } from 'lucide-react';
import { useMovableLauncher } from '../../hooks/useMovableLauncher';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { activeDialogs } from '../../utils/dialogs';
import './AccessibilityWidget.css';

const STORAGE_KEY = 'accessibility-widget-settings';
const DEFAULT_RATE = 0.7;
const defaults = { grayscale:false, highContrast:false, negativeContrast:false, lightBackground:false, underlineLinks:false, readableFont:false, reducedMotion:false };
const classes = { grayscale:'aw-grayscale', highContrast:'aw-high-contrast', negativeContrast:'aw-negative-contrast', lightBackground:'aw-light-background', underlineLinks:'aw-underline-links', readableFont:'aw-readable-font', reducedMotion:'aw-reduced-motion' };
const clamp = (value,min,max,fallback) => Number.isFinite(Number(value)) ? Math.min(max,Math.max(min,Number(value))) : fallback;

function restore(value) {
  const settings = Object.fromEntries(Object.keys(defaults).map(key => [key,value?.settings?.[key] === true]));
  // Earlier versions allowed contradictory contrast modes at the same time.
  if (settings.highContrast) { settings.negativeContrast=false; settings.lightBackground=false; }
  else if (settings.negativeContrast) settings.lightBackground=false;
  return { settings, fontScale:clamp(value?.fontScale ?? 1,.8,2,1), speechRate:clamp(value?.speechRate ?? DEFAULT_RATE,.5,1.5,DEFAULT_RATE) };
}

function clearEffects() {
  document.documentElement.classList.remove(...Object.values(classes),'aw-font-scaled');
  document.documentElement.style.removeProperty('--aw-font-scale');
  document.getElementById('accessibility-widget-global-styles')?.remove();
}

function readingText(panel) {
  const selection=window.getSelection?.();
  if (selection?.toString().trim() && !panel?.contains(selection.anchorNode)) return selection.toString().trim();
  const dialogs=activeDialogs().filter(node=>node!==panel);
  const source=dialogs.at(-1) || document.getElementById('sgp-main-content') || document.querySelector('main') || document.body;
  const clone=source.cloneNode(true);
  const originals=[...source.querySelectorAll('*')], copies=[...clone.querySelectorAll('*')];
  originals.forEach((node,index)=>{const style=getComputedStyle(node);if(style.display==='none' || style.visibility==='hidden')copies[index]?.remove();});
  clone.querySelectorAll('script,style,noscript,[hidden],[inert],[aria-hidden="true"],[data-accessibility-widget],.sr-only').forEach(node=>node.remove());
  clone.querySelectorAll('details:not([open])').forEach(node=>node.replaceWith(node.querySelector('summary')?.cloneNode(true) || document.createTextNode('')));
  return (clone.innerText || clone.textContent || '').replace(/\s+/g,' ').trim();
}

export default function AccessibilityWidget() {
  const [portal,setPortal]=useState(null), [ready,setReady]=useState(false), [open,setOpen]=useState(false);
  const [settings,setSettings]=useState({...defaults}), [fontScale,setFontScale]=useState(1), [speechRate,setSpeechRate]=useState(DEFAULT_RATE);
  const [reading,setReading]=useState('idle'), [notice,setNotice]=useState(''), [storageNotice,setStorageNotice]=useState('');
  const dialog=useRef(null), trigger=useRef(null), utterance=useRef(null), generation=useRef({value:0}), wasOpen=useRef(false);
  const container=useRef(null);
  const movement=useMovableLauncher(trigger,container,ready,()=>setOpen(true));
  const id=useId(), panelId=`sgp-accessibility-${id}`, titleId=`${panelId}-title`;
  const speechSupported=typeof window!=='undefined' && typeof window.speechSynthesis?.speak==='function' && typeof window.speechSynthesis?.cancel==='function' && typeof window.SpeechSynthesisUtterance==='function';
  const pauseSupported=speechSupported && typeof window.speechSynthesis.pause==='function' && typeof window.speechSynthesis.resume==='function';
  const contrast=settings.highContrast ? 'high' : settings.negativeContrast ? 'negative' : settings.lightBackground ? 'light' : 'normal';
  const activeCount=Object.values(settings).filter(Boolean).length + Number(fontScale!==1) + Number(speechRate!==DEFAULT_RATE);
  useDialogFocus(open,dialog,()=>setOpen(false));

  useEffect(()=>{
    const lifecycle=generation.current;
    let root=document.getElementById('sgp-accessibility-root');
    const created=!root;
    if (!root) { root=document.createElement('div'); root.id='sgp-accessibility-root'; root.setAttribute('data-accessibility-portal','true'); document.body.appendChild(root); }
    setPortal(root);
    try {
      const raw=localStorage.getItem(STORAGE_KEY);
      if (raw) { const saved=restore(JSON.parse(raw));setSettings(saved.settings);setFontScale(saved.fontScale);setSpeechRate(saved.speechRate); }
    } catch { setStorageNotice('Tus ajustes se aplicarán durante esta sesión. No se pudo recuperar la preferencia guardada.'); }
    setReady(true);
    return ()=>{ lifecycle.value++; window.speechSynthesis?.cancel?.(); clearEffects(); if(created)root.remove(); };
  },[]);

  useEffect(()=>{
    if(!ready)return;
    Object.entries(classes).forEach(([key,name])=>document.documentElement.classList.toggle(name,settings[key]));
    document.documentElement.classList.toggle('aw-font-scaled',fontScale!==1);
    if(fontScale===1)document.documentElement.style.removeProperty('--aw-font-scale');
    else document.documentElement.style.setProperty('--aw-font-scale',`${Math.round(fontScale*100)}%`);
  },[ready,settings,fontScale]);

  useEffect(()=>{
    if(!ready)return;
    try {
      if(activeCount) localStorage.setItem(STORAGE_KEY,JSON.stringify({settings,fontScale,speechRate}));
      else localStorage.removeItem(STORAGE_KEY);
      setStorageNotice('');
    } catch { setStorageNotice('Los ajustes están aplicados, pero este navegador no permite guardarlos.'); }
  },[ready,settings,fontScale,speechRate,activeCount]);

  useEffect(()=>{
    if(wasOpen.current && !open && document.activeElement===document.body){
      const parent=activeDialogs().at(-1);
      if(parent){parent.focus();if(!parent.contains(document.activeElement))parent.querySelector('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')?.focus();}
      else trigger.current?.focus();
    }
    wasOpen.current=open;
  },[open]);

  function toggle(key) { setNotice('');setSettings(current=>({...current,[key]:!current[key]})); }
  function setContrast(mode) { setNotice('');setSettings(current=>({...current,highContrast:mode==='high',negativeContrast:mode==='negative',lightBackground:mode==='light'})); }
  function stop() { generation.current.value++;window.speechSynthesis?.cancel?.();utterance.current=null;setReading('idle'); }
  function read() {
    if(!speechSupported)return;
    const text=readingText(dialog.current);
    if(!text){setNotice('No hay contenido para leer en esta pantalla.');return;}
    stop();const version=generation.current.value;
    const voice=new window.SpeechSynthesisUtterance(text);
    voice.lang='es-EC';voice.rate=speechRate;voice.pitch=1;
    const voices=window.speechSynthesis.getVoices?.() || [];
    voice.voice=voices.find(item=>/^es[-_]EC$/i.test(item.lang)) || voices.find(item=>/^es/i.test(item.lang)) || null;
    voice.onend=()=>{if(generation.current.value===version){setReading('idle');utterance.current=null;}};
    voice.onerror=()=>{if(generation.current.value===version){setReading('idle');setNotice('No se pudo iniciar la lectura. Comprueba las voces disponibles en tu navegador.');}};
    utterance.current=voice;setNotice('');setReading('reading');
    try {window.speechSynthesis.speak(voice);} catch {setReading('idle');setNotice('La lectura no está disponible en este momento.');}
  }
  function pause() {
    if(!pauseSupported)return;
    if(reading==='paused'){window.speechSynthesis.resume();setReading('reading');}
    else {window.speechSynthesis.pause();setReading('paused');}
  }
  function reset() { stop();setSettings({...defaults});setFontScale(1);setSpeechRate(DEFAULT_RATE);setNotice('Ajustes restablecidos.'); }
  if(!ready || !portal)return null;
  const filters=[settings.grayscale && 'grayscale(1)',settings.negativeContrast && 'invert(1) hue-rotate(180deg)'].filter(Boolean).join(' ');

  return createPortal(<div ref={container} data-accessibility-widget data-custom-position={movement.positioned} data-auto-position={movement.automatic} data-dragging={movement.dragging} className="sgp-accessibility-widget" style={movement.style}>
    {filters && <div className="sgp-a11y-color-filter" aria-hidden="true" style={{backdropFilter:filters,WebkitBackdropFilter:filters}} />}
    <button ref={trigger} type="button" className="sgp-a11y-launcher" data-tooltip-left={movement.tooltipLeft} draggable={false} {...movement.handlers} hidden={open} aria-label="Abrir herramientas de accesibilidad" aria-expanded={open} aria-haspopup="dialog" aria-controls={panelId} aria-describedby={`${panelId}-state ${panelId}-move`} aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight" title="Accesibilidad · Arrastra para mover" onClick={event=>{if(movement.shouldOpen(event))setOpen(true);}}>
      <Accessibility size={25} strokeWidth={1.8} aria-hidden="true" />
      {(activeCount>0 || reading!=='idle') && <span className="sgp-a11y-count" aria-hidden="true">{reading!=='idle'?<Volume2 size={11} />:activeCount}</span>}
      <span className="sgp-a11y-tooltip" aria-hidden="true">{reading!=='idle'?'Lectura en voz alta':'Accesibilidad'}</span>
    </button>
    <span id={`${panelId}-move`} className="sr-only">Arrastra el botón para moverlo. Con el botón enfocado, usa las flechas; Con Mayús y las flechas puedes moverlo más rápido. Enter o espacio abre las herramientas.</span>
    <span id={`${panelId}-state`} className="sr-only">{reading==='reading'?'Lectura en curso':reading==='paused'?'Lectura en pausa':activeCount?`${activeCount} ${activeCount===1?'ajuste activo':'ajustes activos'}`:'Preferencias predeterminadas'}</span>
    {open && <>
      <div className="sgp-a11y-backdrop" aria-hidden="true" onClick={()=>setOpen(false)} />
      <div ref={dialog} id={panelId} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="sgp-a11y-dialog" style={{...movement.panelStyle,zIndex:1000101}}>
        <section className="sgp-a11y-panel">
          <header className="sgp-a11y-header"><span className="sgp-a11y-symbol"><Accessibility size={24} aria-hidden="true" /></span><div><h2 id={titleId}>Accesibilidad</h2><p>{activeCount ? `${activeCount} ${activeCount===1?'ajuste activo':'ajustes activos'}` : 'Personaliza tu experiencia'}</p></div><button type="button" className="sgp-a11y-icon-button" aria-label="Cerrar herramientas de accesibilidad" onClick={()=>setOpen(false)}><X size={20} aria-hidden="true" /></button></header>
          <div className="sgp-a11y-body">
            <section aria-labelledby={`${id}-text-title`}><h3 id={`${id}-text-title`}>Tamaño del contenido</h3><div className="sgp-a11y-size"><button type="button" className="sgp-a11y-icon-button" aria-label="Disminuir tamaño del texto" disabled={fontScale<=.8} onClick={()=>{setNotice('');setFontScale(value=>Math.max(.8,Number((value-.1).toFixed(1))));}}><Minus size={19} aria-hidden="true" /></button><output aria-live="polite" aria-label="Tamaño del texto">{Math.round(fontScale*100)}%</output><button type="button" className="sgp-a11y-icon-button" aria-label="Aumentar tamaño del texto" disabled={fontScale>=2} onClick={()=>{setNotice('');setFontScale(value=>Math.min(2,Number((value+.1).toFixed(1))));}}><Plus size={19} aria-hidden="true" /></button></div></section>
            <fieldset className="sgp-a11y-contrast"><legend>Contraste</legend><div>{[{value:'normal',label:'Original',Icon:Eye},{value:'high',label:'Alto contraste',Icon:MoonStar},{value:'light',label:'Fondo claro',Icon:Sun},{value:'negative',label:'Invertir colores',Icon:Eye}].map(({value,label,Icon})=><label key={value} className={contrast===value?'is-selected':''}><input className="sr-only" type="radio" name={`${id}-contrast`} value={value} checked={contrast===value} onChange={()=>setContrast(value)} /><Icon size={18} aria-hidden="true" /><span>{label}</span>{contrast===value && <Check size={15} aria-hidden="true" />}</label>)}</div></fieldset>
            <section aria-labelledby={`${id}-options-title`}><h3 id={`${id}-options-title`}>Lectura y navegación</h3><div className="sgp-a11y-options">{[{key:'readableFont',label:'Fuente legible',Icon:Type},{key:'underlineLinks',label:'Subrayar enlaces',Icon:Link},{key:'grayscale',label:'Escala de grises',Icon:Eye},{key:'reducedMotion',label:'Reducir movimiento',Icon:Zap}].map(({key,label,Icon})=><button key={key} type="button" role="switch" aria-checked={settings[key]} className="sgp-a11y-option" onClick={()=>toggle(key)}><Icon size={18} aria-hidden="true" /><span>{label}</span><span className="sgp-a11y-switch" aria-hidden="true"><span /></span></button>)}</div></section>
            <section className="sgp-a11y-position" aria-labelledby={`${id}-position-title`}><h3 id={`${id}-position-title`}>Posición del botón</h3><p>Arrástralo con el mouse o el dedo. También puedes enfocarlo y usar las flechas del teclado.</p><button type="button" className="sgp-a11y-position-reset" disabled={!movement.positioned} onClick={movement.resetPosition}><RotateCcw size={16} aria-hidden="true" />Restaurar posición del botón</button>{movement.storageNotice && <p role="status">{movement.storageNotice}</p>}</section>
            <details className="sgp-a11y-speech"><summary><Volume2 size={18} aria-hidden="true" /><span>Lectura en voz alta</span><ChevronDown size={16} aria-hidden="true" /></summary><div>{speechSupported ? <>
              <p>Lee el texto seleccionado o el contenido principal de la pantalla.</p><label htmlFor={`${id}-rate`}>Velocidad de lectura <output>{speechRate.toFixed(1)}×</output></label><input id={`${id}-rate`} type="range" min="0.5" max="1.5" step="0.1" value={speechRate} onChange={event=>{setSpeechRate(Number(event.target.value));if(utterance.current)stop();}} />
              <div className="sgp-a11y-reading-buttons"><button type="button" disabled={reading!=='idle'} onClick={read}><Play size={16} aria-hidden="true" />Leer contenido</button>{pauseSupported && <button type="button" disabled={reading==='idle'} onClick={pause}>{reading==='paused'?<Play size={16} aria-hidden="true" />:<Pause size={16} aria-hidden="true" />}{reading==='paused'?'Continuar':'Pausar'}</button>}<button type="button" disabled={reading==='idle'} onClick={stop}><Square size={16} aria-hidden="true" />Detener</button></div><p role="status">{reading==='reading'?'Lectura en curso':reading==='paused'?'Lectura en pausa':'Listo para leer'}</p>
            </> : <p>Tu navegador no ofrece lectura en voz alta. Las demás herramientas siguen disponibles.</p>}</div></details>
          </div>
          <footer className="sgp-a11y-footer"><button type="button" className="sgp-a11y-reset" onClick={reset}><RotateCcw size={17} aria-hidden="true" />Restablecer ajustes</button>{(notice || storageNotice) && <p role="status">{notice || storageNotice}</p>}<p className="sgp-a11y-save-note">{storageNotice?'Los ajustes estarán disponibles durante esta sesión.':'Las preferencias se guardan en este navegador.'}</p></footer>
        </section>
      </div>
    </>}
  </div>,portal);
}
