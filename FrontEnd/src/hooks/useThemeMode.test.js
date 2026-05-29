import { applyThemeMode } from './useThemeMode';

describe('applyThemeMode', () => {
  afterEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  test('activa la clase dark que usa Tailwind', () => {
    applyThemeMode('dark');

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).toHaveClass('theme-dark');
    expect(document.documentElement).not.toHaveClass('theme-light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  test('retira la clase dark al volver a modo claro', () => {
    applyThemeMode('dark');
    applyThemeMode('light');

    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement).not.toHaveClass('theme-dark');
    expect(document.documentElement).toHaveClass('theme-light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});
