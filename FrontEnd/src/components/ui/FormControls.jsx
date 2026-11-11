/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FormControls.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente FormControls de la interfaz del SGP.
 */

import { Children, cloneElement, isValidElement, useId, useState } from 'react';
import { useFormFeedback } from './FormFeedback';
import { Eye, EyeOff } from 'lucide-react';

const labelClass =
  'mb-2 block text-sm font-medium text-heading';

const fieldClass =
  'sgp-form-control min-h-11 w-full rounded-lg border border-field-border bg-field px-3 py-2 text-sm text-heading outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted hover:border-line-strong focus:border-primary-strong focus:ring-4 focus:ring-focus-soft disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-muted dark:border-line dark:bg-page dark:text-heading dark:placeholder:text-muted dark:hover:border-line-strong dark:focus:border-info dark:focus:ring-focus-soft';

const fileInputClass =
  'w-full rounded-lg border border-dashed border-line bg-field-hover px-3 py-2 text-sm text-body outline-none transition-colors file:mr-3 file:rounded-lg file:border file:border-accent file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:border-line-strong focus:border-primary-strong focus:ring-4 focus:ring-focus-soft dark:border-line dark:bg-page dark:text-heading dark:file:border-accent dark:file:text-accent-strong dark:hover:border-line-strong dark:focus:border-info dark:focus:ring-focus-soft';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function Field({ label, children, className = '', name, error, hint }) {
  const generated = useId();
  const feedback = useFormFeedback();
  const items = Children.toArray(children);
  const single = items.length === 1 && isValidElement(items[0]) ? items[0] : null;
  const fieldName = name || single?.props.name;
  const message = error || feedback?.errors?.[fieldName];
  const id = single?.props.id || (fieldName && feedback ? feedback.idFor(fieldName) : `sgp-control-${generated}`);
  const labelId = `${id}-label`, errorId = `${id}-error`, hintId = `${id}-hint`;
  const associated = canUseImplicitLabel(children) || Boolean(single?.type?.fieldControl);
  const described = [single?.props['aria-describedby'], hint && hintId, message && errorId].filter(Boolean).join(' ') || undefined;
  return <div className={`block ${className}`} data-field-name={fieldName}>
    {associated ? <label id={labelId} htmlFor={id} className={`block ${labelClass}`}>{label}</label> : <span id={labelId} className={`block ${labelClass}`}>{label}</span>}
    {hint && <p id={hintId} className="mb-2 text-sm text-muted">{hint}</p>}
    {associated ? cloneElement(single, {id,name:fieldName,'aria-labelledby':labelId,'aria-describedby':described,'aria-invalid':message ? true : single.props['aria-invalid']}) : children}
    {message && <p id={errorId} className="mt-2 text-sm text-danger-strong">{message}</p>}
  </div>;
}

export function Input({ className = '', ...props }) {
  return <input className={cx(fieldClass, className)} {...props} />;
}

export function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <input
        className={cx(fieldClass, 'pr-12', className)}
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <button
        aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-body transition-colors hover:bg-hover-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-soft"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <Icon size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={cx(fieldClass, className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={cx(fieldClass, 'min-h-28 resize-y', className)} {...props} />;
}

export function FileInput({ className = '', type = 'file', ...props }) {
  return <input className={cx(fileInputClass, className)} type={type} {...props} />;
}

function canUseImplicitLabel(children) {
  const childArray = Children.toArray(children).filter((child) => child !== null && child !== undefined);

  return childArray.length === 1
    && isValidElement(childArray[0])
    && [Input, PasswordInput, Select, Textarea, FileInput].includes(childArray[0].type);
}
