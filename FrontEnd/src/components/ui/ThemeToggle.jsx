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
      className={`inline-flex min-w-[4.35rem] flex-none items-center justify-center rounded-full border border-slate-300/80 bg-white/80 p-[0.18rem] shadow-[0_10px_20px_rgba(15,23,42,0.07)] transition-colors hover:border-[#04344c]/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600/70 dark:bg-slate-900/80 ${className}`}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      <span className="relative grid h-8 w-[3.8rem] grid-cols-2 items-center overflow-hidden rounded-full bg-primary-soft dark:bg-slate-800">
        <span className="z-[1] grid place-items-center text-[#a15c00]">
          <Sun aria-hidden="true" size={15} />
        </span>
        <span className="z-[1] grid place-items-center text-[#075985] dark:text-sky-200">
          <Moon aria-hidden="true" size={15} />
        </span>
        <span
          className={`absolute left-[0.18rem] top-[0.18rem] z-[2] grid h-[1.64rem] w-[1.64rem] place-items-center rounded-full bg-white text-unl-red shadow-[0_8px_18px_rgba(15,23,42,0.16)] transition-[background-color,color,transform] duration-200 ease-out dark:bg-blue-100 dark:text-blue-950 ${thumbPosition}`}
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
