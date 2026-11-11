/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          GuidedForm.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente GuidedForm de la interfaz del SGP.
 */

import { useEffect, useState } from 'react';
import { useFormFeedback } from '../ui/FormFeedback';
import { StructuredForm } from './StructuredForm';
import { SecondaryButton } from '../ui/ActionBar';

export function formSteps(value, hidden = []) {
 const keys = Object.keys(value || {}).filter(key => !hidden.includes(key));
 const groups = [
  { label:'Datos generales', keys:[] },
  { label:'Desarrollo', keys:[] },
  { label:'Actividades y detalle', keys:[] },
  { label:'Resultados y cierre', keys:[] },
 ];
 keys.forEach(key => {
  const index = /conclusion|recommendation|result|suggestion|evaluation/i.test(key) ? 3
   : Array.isArray(value[key]) || /schedule|week|period|activit/i.test(key) ? 2
   : /presentation|objective|description|methodology|antecedent|resource/i.test(key) ? 1 : 0;
  groups[index].keys.push(key);
 });
 return groups.filter(group => group.keys.length);
}
export function GuidedForm(props) {
 const feedback = useFormFeedback();
 const errorSignature = JSON.stringify(feedback?.errors || {});
 const [step, setStep] = useState(0), [all, setAll] = useState(false);
 const groups = formSteps(props.value, props.hiddenFields);
 const signature = groups.map(group => group.label).join('|');
 useEffect(() => { setStep(0); }, [signature]);
 useEffect(() => { if (errorSignature !== "{}") setAll(true); }, [errorSignature]);
 const index = Math.min(step, groups.length);
 const review = index === groups.length;
 const hidden = all || review ? props.hiddenFields : [...(props.hiddenFields || []), ...Object.keys(props.value || {}).filter(key => !groups[index]?.keys.includes(key))];
 return <div className="min-w-0 space-y-4">
  <div className="rounded-xl bg-panel-soft p-4">
   <div className="flex items-start justify-between gap-3"><p aria-live="polite" className="min-w-0 flex-1 text-sm font-semibold text-heading">{all ? 'Formulario completo' : `Paso ${index+1} de ${groups.length+1}: ${review ? 'Revisión final' : groups[index]?.label}`}</p><SecondaryButton className="!w-auto max-w-[48%] !px-2" onClick={() => setAll(value => !value)}>{all ? 'Usar pasos guiados' : 'Ver formulario completo'}</SecondaryButton></div>
   {!all && <ol className="sgp-form-stepper mt-3 flex gap-2 overflow-x-auto" aria-label="Pasos del formulario">{[...groups,{label:'Revisión final'}].map((group,i) => <li className="flex-none" key={group.label}><button type="button" aria-current={index===i ? 'step' : undefined} onClick={() => setStep(i)} className={`min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium ${index===i ? 'bg-primary text-inverse' : 'bg-panel text-body'}`}>{i+1}. {group.label}</button></li>)}</ol>}
  </div>
  {!all && review && <p className="text-sm text-body">Comprueba el contenido antes de guardar. Puedes volver a cualquier paso para corregirlo. Guardar un borrador no lo envía a revisión.</p>}
  <fieldset className="min-w-0" disabled={!all && review}><StructuredForm {...props} hiddenFields={hidden} readOnlyFields={props.readOnlyFields} /></fieldset>
  {!all && <div className="flex justify-between gap-3"><SecondaryButton disabled={index===0} onClick={() => setStep(value => value-1)}>Anterior</SecondaryButton><SecondaryButton disabled={review} onClick={() => setStep(value => value+1)}>{index===groups.length-1 ? 'Revisar contenido' : 'Siguiente'}</SecondaryButton></div>}
 </div>;
}
