/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useThemeMode.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona el estado y la integración de useThemeMode en la interfaz React.
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import COLOR_THEME_OPTIONS from '../config/colorThemeOptions.json';

const MODE_KEY='sgp-theme-mode', COLOR_KEY='sgp-color-theme';
const MODE_EVENT='sgp-theme-mode-change', COLOR_EVENT='sgp-color-theme-change';
const SYSTEM_QUERY='(prefers-color-scheme: dark)';
// Retain choices for this session if storage is unavailable or full.
const sessionChoices=new Map();
const normalizeMode=value=>['light','dark','system'].includes(value)?value:'system';
const normalizeColor=value=>COLOR_THEME_OPTIONS.some(option=>option.id===value)?value:'unl';
function read(key) {
  if(sessionChoices.has(key))return sessionChoices.get(key);
  if(typeof window==='undefined')return null;
  try{return window.localStorage.getItem(key);}catch{return null;}
}
function write(key,value) {
  try{window.localStorage.setItem(key,value);sessionChoices.delete(key);}
  catch{sessionChoices.set(key,value);}
}
function systemDark(){return Boolean(typeof window!=='undefined'&&window.matchMedia?.(SYSTEM_QUERY)?.matches);}
function resolved(preference){return preference==='system'?(systemDark()?'dark':'light'):preference;}
export function getInitialThemePreference(){return normalizeMode(read(MODE_KEY));}
export function getInitialThemeMode(){return resolved(getInitialThemePreference());}
export function getInitialColorTheme(){return normalizeColor(read(COLOR_KEY));}

export function applyThemeMode(value) {
  const preference=normalizeMode(value),theme=resolved(preference),root=document.documentElement;
  root.classList.toggle('dark',theme==='dark');root.classList.toggle('theme-dark',theme==='dark');root.classList.toggle('theme-light',theme==='light');
  root.dataset.theme=theme;root.dataset.themePreference=preference;root.style.colorScheme=theme;
}
export function applyColorTheme(value){document.documentElement.dataset.colorTheme=normalizeColor(value);}
function applyPreferences(){applyThemeMode(getInitialThemePreference());applyColorTheme(getInitialColorTheme());}
export function initializeThemeMode(){
  if(typeof document==='undefined')return;
  const mode=read(MODE_KEY),color=read(COLOR_KEY);
  if(mode!==null&&mode!==normalizeMode(mode))write(MODE_KEY,normalizeMode(mode));
  if(color!==null&&color!==normalizeColor(color))write(COLOR_KEY,normalizeColor(color));
  applyPreferences();
}
function snapshot(){return `${getInitialThemePreference()}|${getInitialColorTheme()}|${getInitialThemeMode()}|${sessionChoices.size?'session':'saved'}`;}
function subscribe(notify){
  const update=()=>{applyPreferences();notify();};
  const stored=event=>{if(event.key===null)sessionChoices.clear();else if(event.key===MODE_KEY||event.key===COLOR_KEY)sessionChoices.delete(event.key);else return;update();};
  const media=window.matchMedia?.(SYSTEM_QUERY);
  window.addEventListener(MODE_EVENT,update);window.addEventListener(COLOR_EVENT,update);window.addEventListener('storage',stored);
  if(media?.addEventListener)media.addEventListener('change',update);else media?.addListener?.(update);
  return ()=>{window.removeEventListener(MODE_EVENT,update);window.removeEventListener(COLOR_EVENT,update);window.removeEventListener('storage',stored);if(media?.removeEventListener)media.removeEventListener('change',update);else media?.removeListener?.(update);};
}
function change(key,value,event){write(key,value);applyPreferences();window.dispatchEvent(new CustomEvent(event,{detail:value}));}
export function useThemeMode(){
  const state=useSyncExternalStore(subscribe,snapshot,()=> 'system|unl|light|saved');
  const [themePreference,colorTheme,theme,storageStatus]=state.split('|');
  useEffect(()=>{initializeThemeMode();},[]);
  const setTheme=useCallback(value=>change(MODE_KEY,normalizeMode(typeof value==='function'?value(getInitialThemeMode()):value),MODE_EVENT),[]);
  const setColorTheme=useCallback(value=>change(COLOR_KEY,normalizeColor(value),COLOR_EVENT),[]);
  const toggleTheme=useCallback(()=>setTheme(getInitialThemeMode()==='dark'?'light':'dark'),[setTheme]);
  return {theme,themePreference,isDark:theme==='dark',colorTheme,storageStatus,setTheme,setColorTheme,toggleTheme};
}
