import { useCallback, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'sgp-theme-mode';
const THEME_CHANGE_EVENT = 'sgp-theme-mode-change';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

function normalizeThemeMode(theme) {
  return theme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

export function applyThemeMode(theme) {
  const mode = normalizeThemeMode(theme);
  const root = document.documentElement;
  const isDark = mode === DARK_THEME;

  root.classList.toggle('dark', isDark);
  root.classList.toggle('theme-dark', isDark);
  root.classList.toggle('theme-light', mode === LIGHT_THEME);
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}

export function getInitialThemeMode() {
  if (typeof window === 'undefined') {
    return LIGHT_THEME;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === DARK_THEME || storedTheme === LIGHT_THEME) {
    return storedTheme;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? DARK_THEME
    : LIGHT_THEME;
}

export function initializeThemeMode() {
  if (typeof document === 'undefined') {
    return;
  }

  applyThemeMode(getInitialThemeMode());
}

export function useThemeMode() {
  const [theme, setTheme] = useState(getInitialThemeMode);

  useEffect(() => {
    applyThemeMode(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: theme,
      }),
    );
  }, [theme]);

  useEffect(() => {
    function syncTheme(event) {
      const nextTheme = normalizeThemeMode(event.detail);
      setTheme((current) => (current === nextTheme ? current : nextTheme));
    }

    function syncStoredTheme(event) {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextTheme = normalizeThemeMode(event.newValue);
      setTheme((current) => (current === nextTheme ? current : nextTheme));
    }

    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    window.addEventListener('storage', syncStoredTheme);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
      window.removeEventListener('storage', syncStoredTheme);
    };
  }, []);

  const updateTheme = useCallback((nextTheme) => {
    setTheme((current) => {
      const resolvedTheme =
        typeof nextTheme === 'function' ? nextTheme(current) : nextTheme;

      return normalizeThemeMode(resolvedTheme);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    updateTheme((current) => (current === DARK_THEME ? LIGHT_THEME : DARK_THEME));
  }, [updateTheme]);

  return {
    isDark: theme === DARK_THEME,
    setTheme: updateTheme,
    theme,
    toggleTheme,
  };
}
