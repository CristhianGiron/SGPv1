import { Children, isValidElement } from 'react';

const labelClass =
  'mb-1.5 block text-[0.82rem] font-extrabold text-[#34443b] dark:text-slate-300';

const fieldClass =
  'min-h-[2.65rem] w-full rounded-lg border border-[#c8d2cd] bg-[#f5f4ed] px-3 py-2.5 text-sm text-[#20282d] outline-none transition-[background-color,border-color,box-shadow] placeholder:text-slate-400 hover:border-[#aebdb6] focus:border-[#074462] focus:ring-4 focus:ring-[#074462]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:focus:border-sky-300 dark:focus:ring-sky-300/20';

const fileInputClass =
  'w-full rounded-lg border border-dashed border-[#9fb5a7] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#34443b] outline-none transition-colors file:mr-3 file:rounded-lg file:border file:border-[#529914] file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-extrabold file:text-primary hover:border-[#aebdb6] focus:border-[#074462] focus:ring-4 focus:ring-[#074462]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:file:border-[#75c66a] dark:file:text-[#bbf7d0] dark:hover:border-slate-500 dark:focus:border-sky-300 dark:focus:ring-sky-300/20';

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
    && [Input, Select, Textarea, FileInput].includes(childArray[0].type);
}
