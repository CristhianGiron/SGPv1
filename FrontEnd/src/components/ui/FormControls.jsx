import { Children, isValidElement, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const labelClass =
  'mb-1 block text-[0.82rem] font-medium text-body dark:text-ink';

const fieldClass =
  'min-h-[2.5rem] w-full rounded-lg border border-line bg-field px-3 py-2 text-sm text-heading outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted hover:border-line-strong focus:border-primary-strong focus:ring-4 focus:ring-focus-soft disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-muted dark:border-line dark:bg-page dark:text-heading dark:placeholder:text-muted dark:hover:border-line-strong dark:focus:border-info dark:focus:ring-focus-soft';

const fileInputClass =
  'w-full rounded-lg border border-dashed border-line bg-field-hover px-3 py-2 text-sm text-body outline-none transition-colors file:mr-3 file:rounded-lg file:border file:border-accent file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:border-line-strong focus:border-primary-strong focus:ring-4 focus:ring-focus-soft dark:border-line dark:bg-page dark:text-heading dark:file:border-accent dark:file:text-accent-strong dark:hover:border-line-strong dark:focus:border-info dark:focus:ring-focus-soft';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function Field({ label, children, className = '' }) {
  if (canUseImplicitLabel(children)) {
    return (
      <label className={`block ${className}`}>
        <span className={labelClass}>{label}</span>
        {children}
      </label>
    );
  }

  return (
    <div className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
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
