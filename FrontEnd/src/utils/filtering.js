/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          filtering.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de filtering utilizadas por la interfaz del SGP.
 */

export function normalizeFilterText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .trim();
}

export function matchesOpenSearch(values, query) {
  const terms = normalizeFilterText(query).split(/\s+/).filter(Boolean);

  if (!terms.length) {
    return true;
  }

  const haystack = normalizeFilterText(values.filter(Boolean).join(' '));

  return terms.every((term) => haystack.includes(term));
}

export function buildSelectOptions(rows, getValue, format = (value) => value) {
  const options = new Map();

  rows.forEach((row) => {
    const rawValue = getValue(row);

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return;
    }

    const value = String(rawValue);

    if (!options.has(value)) {
      options.set(value, {
        value,
        label: format(rawValue) || value,
      });
    }
  });

  return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function booleanSelectValue(value) {
  if (value === true) {
    return 'true';
  }

  if (value === false) {
    return 'false';
  }

  return '';
}
