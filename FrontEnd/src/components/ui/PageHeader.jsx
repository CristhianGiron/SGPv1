export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="sgp-page-header relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="relative min-w-0">
        {eyebrow && (
          <p className="inline-flex rounded-full border border-[color:var(--module-accent)] bg-[var(--module-accent-soft)] px-2.5 py-1 text-xs font-medium uppercase leading-tight tracking-normal text-[color:var(--module-accent-strong)] dark:border-[color:var(--module-accent)] dark:bg-[var(--module-accent-soft)] dark:text-[color:var(--module-accent-strong)]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-[clamp(1.3rem,1.7vw,1.75rem)] font-medium leading-tight tracking-normal text-heading dark:text-heading">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-body dark:text-ink">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
