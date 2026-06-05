const moduleVisuals = {
  dashboard: { tone: 'a', accent: 'b', table: 'a' },
  notifications: { tone: 'e', accent: 'c', table: 'e' },
  profile: { tone: 'c', accent: 'e', table: 'c' },
  photos: { tone: 'e', accent: 'b', table: 'e' },
  forms: { tone: 'd', accent: 'c', table: 'd' },
  'observation-forms': { tone: 'c', accent: 'b', table: 'c' },
  courses: { tone: 'b', accent: 'a', table: 'b' },
  'practice-archive': { tone: 'a', accent: 'e', table: 'a' },
  'didactic-plans': { tone: 'b', accent: 'd', table: 'b' },
  documents: { tone: 'a', accent: 'c', table: 'a' },
  schedules: { tone: 'd', accent: 'b', table: 'd' },
  institutions: { tone: 'c', accent: 'd', table: 'c' },
  universities: { tone: 'b', accent: 'e', table: 'b' },
  reports: { tone: 'e', accent: 'a', table: 'e' },
  accounts: { tone: 'c', accent: 'a', table: 'c' },
  locations: { tone: 'd', accent: 'e', table: 'd' },
};

const defaultVisual = { tone: 'a', accent: 'c', table: 'a' };

export function resolveModuleVisual(routeId = '') {
  const rootRoute = String(routeId || '').split('/')[0] || 'dashboard';
  return moduleVisuals[rootRoute] || defaultVisual;
}

export function getModuleVisualStyle(routeId = '') {
  const visual = resolveModuleVisual(routeId);
  const tone = visual.tone;
  const accent = visual.accent;
  const table = visual.table || tone;

  return {
    '--module-color': `var(--color-card-${tone})`,
    '--module-strong': `var(--color-card-${tone}-strong)`,
    '--module-soft': `var(--color-card-${tone}-soft)`,
    '--module-accent': `var(--color-card-${accent})`,
    '--module-accent-strong': `var(--color-card-${accent}-strong)`,
    '--module-accent-soft': `var(--color-card-${accent}-soft)`,
    '--module-table': `color-mix(in srgb, var(--color-card-${table}) 22%, var(--color-panel))`,
    '--module-table-border': `color-mix(in srgb, var(--color-card-${table}) 48%, var(--color-line))`,
    '--module-table-soft': `var(--color-card-${table}-soft)`,
    '--module-table-ink': 'var(--color-heading)',
  };
}
