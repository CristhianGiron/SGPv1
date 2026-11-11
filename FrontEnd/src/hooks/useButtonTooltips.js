/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useButtonTooltips.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona el estado y la integración de useButtonTooltips en la interfaz React.
 */

import { useEffect } from 'react';

function getButtonLabel(button) {
  const labelledBy = button.getAttribute('aria-labelledby');
  const labelledByText = labelledBy
    ? labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || '')
      .join(' ')
    : '';

  return (
    button.getAttribute('aria-label') ||
    button.getAttribute('data-tooltip') ||
    labelledByText ||
    button.innerText ||
    button.textContent ||
    ''
  ).replace(/\s+/g, ' ').trim();
}

function syncButtonTooltip(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  if (button.dataset.autoTooltip && button.title !== button.dataset.autoTooltip) {
    delete button.dataset.autoTooltip;
    return;
  }

  if (button.title && !button.dataset.autoTooltip) {
    return;
  }

  const label = getButtonLabel(button);
  if (!label || button.title === label) {
    return;
  }

  button.title = label;
  button.dataset.autoTooltip = label;
}

function syncButtonsIn(node) {
  if (!(node instanceof Element)) {
    return;
  }

  if (node.matches('button')) {
    syncButtonTooltip(node);
  }
  node.querySelectorAll('button').forEach(syncButtonTooltip);
  syncButtonTooltip(node.closest('button'));
}

export function useButtonTooltips() {
  useEffect(() => {
    document.querySelectorAll('button').forEach(syncButtonTooltip);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          syncButtonTooltip(mutation.target);
          return;
        }

        if (mutation.type === 'characterData') {
          syncButtonTooltip(mutation.target.parentElement?.closest('button'));
          return;
        }

        mutation.addedNodes.forEach(syncButtonsIn);
        syncButtonTooltip(mutation.target instanceof Element ? mutation.target.closest('button') : null);
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-label', 'data-tooltip', 'title'],
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);
}
