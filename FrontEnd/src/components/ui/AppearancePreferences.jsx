/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AppearancePreferences.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente AppearancePreferences de la interfaz del SGP.
 */

import { useEffect, useId, useState } from 'react';
import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { useThemeMode } from '../../hooks/useThemeMode';
import options from '../../config/colorThemeOptions.json';

const colors={unl:['#152b48','#edf3fb','#284f78'],claro:['#29272f','#f0eff2','#55545e'],bosque:['#153d2e','#eaf3ec','#276b52']};
const adjusted=()=>document.documentElement.matches('.aw-high-contrast,.aw-light-background,.aw-negative-contrast,.aw-grayscale');
export function AppearancePreferences(){
  const {theme,themePreference,colorTheme,setTheme,setColorTheme,storageStatus}=useThemeMode();
  const id=useId();const [accessibility,setAccessibility]=useState(adjusted);
  useEffect(()=>{const observer=new MutationObserver(()=>setAccessibility(adjusted()));observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});return ()=>observer.disconnect();},[]);
  return <section className="sgp-appearance" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>Apariencia</h3>
    <fieldset><legend>Modo de pantalla</legend><div className="sgp-appearance-modes">{[{value:'light',label:'Claro',Icon:Sun},{value:'dark',label:'Oscuro',Icon:Moon},{value:'system',label:'Sistema',Icon:Monitor}].map(({value,label,Icon})=><label key={value} className={themePreference===value?'is-selected':''}><input type="radio" name={`${id}-mode`} checked={themePreference===value} value={value} onChange={()=>setTheme(value)} /><Icon size={19} aria-hidden="true" /><span>{label}</span></label>)}</div><p className="sgp-appearance-caption">{themePreference==='system'?`Según tu dispositivo · ahora ${theme==='dark'?'oscuro':'claro'}`:`Modo ${theme==='dark'?'oscuro':'claro'} seleccionado`}</p></fieldset>
    <fieldset><legend>Paleta de colores</legend><div className="sgp-appearance-palettes">{options.map(({id:color,label})=><label key={color} className={colorTheme===color?'is-selected':''}><input type="radio" name={`${id}-palette`} checked={colorTheme===color} value={color} onChange={()=>setColorTheme(color)} /><span className="sgp-palette-preview" aria-hidden="true">{colors[color].map(shade=><span key={shade} style={{backgroundColor:shade}} />)}</span><span className="sgp-palette-label">{label}</span>{colorTheme===color&&<Check size={13} className="sgp-palette-check" aria-hidden="true" />}</label>)}</div></fieldset>
    {accessibility&&<p className="sgp-appearance-caption" role="status">Los ajustes de accesibilidad están modificando estos colores.</p>}
    <p className="sgp-appearance-storage" role={storageStatus==='session'?'status':undefined}>{storageStatus==='session'?'La apariencia se aplicó durante esta sesión; no se pudo guardar en el navegador.':'Los cambios se aplican al instante y se guardan en este navegador.'}</p>
  </section>;
}
