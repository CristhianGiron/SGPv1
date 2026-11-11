/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FilterPanel.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente FilterPanel de la interfaz del SGP.
 */

import { SavedViews } from './SavedViews';
import { ListToolbar } from './ListToolbar';
import { useCallback, useState } from 'react';
import { CheckCircle2, SlidersHorizontal, XCircle } from 'lucide-react';
import { ActionBar, PrimaryButton, SecondaryButton } from './ActionBar';
import { Modal } from './Modal';

export function FilterPanel({
  activeCount = 0,
  action,
  children,
  hasActiveFilters,
  leading,
  onClear,
  search,
  summary,
  title = 'Filtros',
  showFilters = true,
  savedValue,
  onRestore,
  viewKey,
}) {
  const [open, setOpen] = useState(false);
  const closeModal = useCallback(() => setOpen(false), []);
  const hasFilters = hasActiveFilters ?? activeCount > 0;

  return (
    <div className="sgp-filter-bar py-2">
      <ListToolbar search={search} leading={leading} summary={summary} actions={<>
          {showFilters && <SecondaryButton className="!w-auto" icon={SlidersHorizontal} onClick={() => setOpen(true)} type="button">
            {activeCount > 0 ? `Filtros (${activeCount})` : 'Filtros'}
          </SecondaryButton>}
          {onClear && <SecondaryButton className="!w-auto" disabled={!hasFilters} icon={XCircle} onClick={onClear} type="button">Limpiar</SecondaryButton>}
          {action}
      </>} />

      <Modal maxWidth="max-w-4xl" onClose={closeModal} open={open} title={title}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
          {onRestore && <SavedViews scope={viewKey || window.location.hash} value={savedValue} onRestore={onRestore} />}
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
    </div>
  );
}
