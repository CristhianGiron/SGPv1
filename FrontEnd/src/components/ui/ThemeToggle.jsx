import { Moon, Sun } from 'lucide-react';
import { useThemeMode } from '../../hooks/useThemeMode';

export function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useThemeMode();
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  const thumbPosition = isDark ? 'translate-x-7' : 'translate-x-0';

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className={`inline-flex min-w-[4.35rem] flex-none items-center justify-center rounded-full border border-line/80 bg-panel/80 p-[0.18rem] shadow-card transition-colors hover:border-primary/30 hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line/70 dark:bg-surface/80 ${className}`}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      <span className="relative grid h-8 w-[3.8rem] grid-cols-2 items-center overflow-hidden rounded-full bg-primary-soft dark:bg-surface-soft">
        <span className="z-[1] grid place-items-center text-warning-strong">
          <Sun aria-hidden="true" size={15} />
        </span>
        <span className="z-[1] grid place-items-center text-info dark:text-info-strong">
          <Moon aria-hidden="true" size={15} />
        </span>
        <span
          className={`absolute left-[0.18rem] top-[0.18rem] z-[2] grid h-[1.64rem] w-[1.64rem] place-items-center rounded-full bg-panel text-unl-red shadow-card transition-[background-color,color,transform] duration-200 ease-out dark:bg-info-soft dark:text-info-strong ${thumbPosition}`}
        >
          {isDark ? (
            <Moon aria-hidden="true" size={16} />
          ) : (
            <Sun aria-hidden="true" size={16} />
          )}
        </span>
      </span>
    </button>
  );
}
