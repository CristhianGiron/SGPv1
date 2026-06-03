export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="relative flex flex-col gap-3 border-b border-line-soft pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-line-soft">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-extrabold uppercase leading-tight tracking-normal text-primary dark:text-info-strong">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-[clamp(1.35rem,1.9vw,1.9rem)] font-extrabold leading-tight tracking-normal text-heading dark:text-heading">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted dark:text-muted">
            {description}
          </p>
        )}
      </div>
      {action}
      <span
        aria-hidden="true"
        className="absolute -bottom-px left-0 h-[3px] w-[min(12rem,44%)] rounded-full bg-accent"
      />
    </div>
  );
}
