/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SavedViews.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente SavedViews de la interfaz del SGP.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { usePracticeWorkspace } from '../../contexts/PracticeWorkspaceContext';
import { Input, Select, Field } from './FormControls';
import { SecondaryButton } from './ActionBar';

export function SavedViews({ scope, value, onRestore }) {
 const { profile } = useAuth();
 const practice = usePracticeWorkspace();
 const owner = profile?.id ?? profile?.username;
 const storageKey = owner == null ? null : `sgp:views:v1:${owner}:${practice?.id || 'global'}:${scope}`;
 const [views,setViews] = useState([]), [name,setName] = useState(''), [selected,setSelected] = useState(''), [error,setError] = useState('');
 useEffect(() => {
  setViews([]); setSelected(''); setName(''); setError('');
  if (!storageKey) return;
  try { const saved = JSON.parse(localStorage.getItem(storageKey)); if (Array.isArray(saved)) setViews(saved.filter(view => typeof view.name === 'string' && view.value && typeof view.value === 'object').slice(0,15)); } catch { /* A saved view must never prevent opening filters. */ }
 },[storageKey]);
 function persist(next) {
  try { localStorage.setItem(storageKey,JSON.stringify(next));setViews(next);setError('');return true; } catch { setError('No se pudieron guardar las vistas en este navegador.');return false; }
 }
 if (!storageKey) return null;
 return <fieldset className="space-y-3 rounded-xl border border-line p-4"><legend className="px-1 text-sm font-semibold text-heading">Mis vistas de filtros</legend>
  <p className="text-xs text-body">Se guardan en este navegador para tu cuenta y esta sección.</p>
  <div className="flex flex-wrap items-end gap-2"><Field label="Nombre de la vista"><Input maxLength={60} placeholder="Por ejemplo: pendientes de revisión" value={name} onChange={event => setName(event.target.value)} /></Field><SecondaryButton disabled={!name.trim() || (views.length>=15 && !views.some(view => view.name===name.trim()))} onClick={() => { const label=name.trim();if (persist([...views.filter(view => view.name!==label),{name:label,value}])) {setSelected(label);setName('');} }}>Guardar vista</SecondaryButton></div>
  {views.length>0 && <div className="flex flex-wrap items-end gap-2"><Field label="Vistas guardadas"><Select value={selected} onChange={event => setSelected(event.target.value)}><option value="">Selecciona una vista</option>{views.map(view => <option key={view.name} value={view.name}>{view.name}</option>)}</Select></Field><SecondaryButton disabled={!selected} onClick={() => { const view=views.find(view => view.name===selected);if(view) onRestore(view.value); }}>Cargar vista</SecondaryButton><SecondaryButton disabled={!selected} onClick={() => { if(persist(views.filter(view => view.name!==selected))) setSelected(''); }}>Eliminar vista</SecondaryButton></div>}
  {error && <p role="alert" className="text-sm text-danger">{error}</p>}
 </fieldset>;
}
