import { useState } from 'react';
import { CheckCircle2, SlidersHorizontal, XCircle } from 'lucide-react';
import { ActionBar, PrimaryButton, SecondaryButton } from './ActionBar';
import { Modal } from './Modal';
import { SectionCard } from './SectionCard';

export function FilterPanel({
  activeCount = 0,
  children,
  hasActiveFilters,
  onClear,
  search,
  summary,
  title = 'Filtros',
}) {
  const [open, setOpen] = useState(false);
  const hasFilters = hasActiveFilters ?? activeCount > 0;

  return (
    <SectionCard title={title}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        {search}
        <div className="flex items-end gap-2">
          <SecondaryButton icon={SlidersHorizontal} onClick={() => setOpen(true)} type="button">
            {hasFilters ? `Filtros (${activeCount})` : 'Filtros'}
          </SecondaryButton>
          {onClear && (
            <SecondaryButton disabled={!hasFilters} icon={XCircle} onClick={onClear} type="button">
              Limpiar
            </SecondaryButton>
          )}
        </div>
      </div>
      {summary && <p className="mt-3 text-xs font-bold text-muted">{summary}</p>}

      <Modal maxWidth="max-w-4xl" onClose={() => setOpen(false)} open={open} title={title}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
          <ActionBar>
            {onClear && (
              <SecondaryButton disabled={!hasFilters} icon={XCircle} onClick={onClear} type="button">
                Limpiar
              </SecondaryButton>
            )}
            <PrimaryButton icon={CheckCircle2} onClick={() => setOpen(false)} type="button">
              Aplicar
            </PrimaryButton>
          </ActionBar>
        </div>
      </Modal>
    </SectionCard>
  );
}
