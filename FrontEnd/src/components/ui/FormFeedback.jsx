/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FormFeedback.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente FormFeedback de la interfaz del SGP.
 */

import { createContext, useContext, useEffect, useId, useRef } from 'react';
import { labelFromKey } from '../../utils/format';

export const FormFeedbackContext = createContext(null);

export function FormFeedback({ errors = {}, attempt = 0, children }) {
  const prefix = useId();
  const summary = useRef(null);
  const entries = Object.entries(errors).filter(([, message]) => typeof message === 'string');
  const idFor = name => `sgp-field-${prefix}-${name}`;
  useEffect(() => { if (attempt && summary.current) summary.current.focus(); }, [attempt]);
  return <FormFeedbackContext.Provider value={{ errors, idFor }}>
    {entries.length > 0 && <div ref={summary} tabIndex={-1} role="alert" aria-label="Revisa los datos del formulario" className="mb-4 rounded-lg border border-danger/40 bg-danger-soft p-4 text-sm text-danger-strong outline-none focus-visible:ring-2 focus-visible:ring-focus">
      <p className="font-semibold">Revisa {entries.length === 1 ? 'este dato' : 'estos datos'} antes de guardar</p>
      <ul className="mt-2 list-disc space-y-2 pl-5">{entries.map(([name, message]) => <li key={name}><a className="underline" href={`#${idFor(name)}`} onClick={event => {
        event.preventDefault(); const field = document.getElementById(idFor(name));
        if (field) { field.scrollIntoView?.({block:'center',behavior:'instant'}); field.focus({preventScroll:true}); }
      }}>{labelFromKey(name.split('.').at(-1))}: {message}</a></li>)}</ul>
    </div>}
    {children}
  </FormFeedbackContext.Provider>;
}

export function useFormFeedback() { return useContext(FormFeedbackContext); }
