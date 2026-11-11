/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          moduleVisuals.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Define la configuración de moduleVisuals utilizada por la interfaz.
 */

const moduleVisuals = {
  dashboard: { tone: 'a', accent: 'b', table: 'a' },
  notifications: { tone: 'a', accent: 'd', table: 'a' },
  profile: { tone: 'c', accent: 'a', table: 'c' },
  photos: { tone: 'b', accent: 'a', table: 'b' },
  forms: { tone: 'c', accent: 'a', table: 'c' },
  'observation-forms': { tone: 'b', accent: 'c', table: 'b' },
  courses: { tone: 'a', accent: 'b', table: 'a' },
  'practice-archive': { tone: 'a', accent: 'c', table: 'a' },
  'didactic-plans': { tone: 'a', accent: 'd', table: 'a' },
  documents: { tone: 'b', accent: 'a', table: 'b' },
  schedules: { tone: 'c', accent: 'b', table: 'c' },
  institutions: { tone: 'b', accent: 'd', table: 'b' },
  universities: { tone: 'a', accent: 'd', table: 'a' },
  reports: { tone: 'c', accent: 'a', table: 'c' },
  accounts: { tone: 'a', accent: 'c', table: 'a' },
  locations: { tone: 'b', accent: 'c', table: 'b' },
};

const defaultVisual = { tone: 'a', accent: 'c', table: 'a' };

export function resolveModuleVisual(routeId = '') {
  const rootRoute = String(routeId || '').split('/')[0] || 'dashboard';
  return moduleVisuals[rootRoute] || defaultVisual;
}

export function getModuleVisualStyle(routeId = '') {
  const visual = resolveModuleVisual(routeId);
  const tone = visual.tone;

  return {
    '--module-color': `var(--color-card-${tone})`,
    '--module-strong': `var(--color-card-${tone}-strong)`,
    '--module-soft': `var(--color-card-${tone}-soft)`,
    '--module-accent': 'var(--color-primary)',
    '--module-accent-strong': 'var(--color-primary-strong)',
    '--module-accent-soft': 'var(--color-primary-soft)',
    '--module-table': 'var(--color-panel-soft)',
    '--module-table-border': 'var(--color-line)',
    '--module-table-soft': 'var(--color-panel-soft)',
    '--module-table-ink': 'var(--color-heading)',
  };
}
