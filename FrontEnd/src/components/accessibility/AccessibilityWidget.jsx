import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Accessibility,
  Search,
  List,
  Circle,
  Lightbulb,
  Link,
  Type,
  Volume2,
  Square,
  RotateCcw,
  X,
} from "lucide-react";
import { getPortalRoot } from "../../utils/portal";

const STORAGE_KEY = "accessibility-widget-settings";
const DEFAULT_FONT_SCALE = 1;
const DEFAULT_SPEECH_RATE = 0.7;

const defaultSettings = {
  grayscale: false,
  highContrast: false,
  negativeContrast: false,
  lightBackground: false,
  underlineLinks: false,
  readableFont: false,
};

const ACCESSIBILITY_CLASSES = {
  grayscale: "aw-grayscale",
  highContrast: "aw-high-contrast",
  negativeContrast: "aw-negative-contrast",
  lightBackground: "aw-light-background",
  underlineLinks: "aw-underline-links",
  readableFont: "aw-readable-font",
};

const ALL_ACCESSIBILITY_CLASSES = [
  ...Object.values(ACCESSIBILITY_CLASSES),
  "aw-font-scaled",
];

export default function AccessibilityWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [fontScale, setFontScale] = useState(DEFAULT_FONT_SCALE);
  const [speechRate, setSpeechRate] = useState(DEFAULT_SPEECH_RATE);
  const [settings, setSettings] = useState({ ...defaultSettings });

  const styleId = useMemo(() => "accessibility-widget-global-styles", []);

  useEffect(() => {
    setMounted(true);

    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        setSettings({ ...defaultSettings, ...(parsed.settings || {}) });
        setFontScale(parsed.fontScale ?? DEFAULT_FONT_SCALE);
        setSpeechRate(parsed.speechRate ?? DEFAULT_SPEECH_RATE);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    applyAccessibilityEffects(styleId, settings, fontScale);

    if (hasStoredSettings(settings, fontScale, speechRate)) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          settings,
          fontScale,
          speechRate,
        }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [settings, fontScale, speechRate, mounted, styleId]);

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const increaseText = () => {
    setFontScale((prev) => Math.min(Number((prev + 0.1).toFixed(1)), 1.6));
  };

  const decreaseText = () => {
    setFontScale((prev) => Math.max(Number((prev - 0.1).toFixed(1)), 0.8));
  };

  const readPage = () => {
    window.speechSynthesis.cancel();

    const widget = document.querySelector("[data-accessibility-widget]");
    const widgetText = widget?.innerText || "";

    const pageText = document.body.innerText
      .replace(widgetText, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!pageText) return;

    const utterance = new SpeechSynthesisUtterance(pageText);
    utterance.lang = "es-ES";
    utterance.rate = speechRate;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
  };

  const resetChanges = () => {
    window.speechSynthesis.cancel();

    setSettings({ ...defaultSettings });
    setFontScale(DEFAULT_FONT_SCALE);
    setSpeechRate(DEFAULT_SPEECH_RATE);
    setOpen(false);

    cleanupAccessibilityEffects(styleId);
    localStorage.removeItem(STORAGE_KEY);
  };

  const options = [
    {
      label: "Escala de grises",
      icon: List,
      active: settings.grayscale,
      action: () => toggleSetting("grayscale"),
    },
    {
      label: "Alto contraste",
      icon: Circle,
      active: settings.highContrast,
      action: () => toggleSetting("highContrast"),
    },
    {
      label: "Contraste negativo",
      icon: Circle,
      active: settings.negativeContrast,
      action: () => toggleSetting("negativeContrast"),
    },
    {
      label: "Fondo claro",
      icon: Lightbulb,
      active: settings.lightBackground,
      action: () => toggleSetting("lightBackground"),
    },
    {
      label: "Enlaces subrayados",
      icon: Link,
      active: settings.underlineLinks,
      action: () => toggleSetting("underlineLinks"),
    },
    {
      label: "Fuente legible",
      icon: Type,
      active: settings.readableFont,
      action: () => toggleSetting("readableFont"),
    },
  ];

  const portalRoot = getPortalRoot();

  if (!mounted || !portalRoot) return null;

  /**
   * Esta línea es importante.
   * Marca el contenedor del portal para que los filtros visuales
   * no afecten al padre del widget.
   */
  portalRoot.setAttribute("data-accessibility-portal", "true");

  return createPortal(
    <div
      data-accessibility-widget
      className="fixed bottom-5 left-0 z-[999999] font-sans"
    >
      {open && (
        <aside
          aria-label="Herramientas de accesibilidad"
          className="
            absolute bottom-20 left-0
            rounded-2xl border border-line
            bg-panel p-5 text-heading
            shadow-soft
            animate-[awPanelIn_0.22s_ease-out]
            dark:border-line dark:bg-surface dark:text-heading
          "
        >
          <div className="flex flex-col gap-4">
            <div className="mb-4 flex items-start justify-between gap-3 ">
              <h2 className="text-[16px] font-medium leading-tight text-accent dark:text-heading">
                Herramientas de accesibilidad
              </h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar herramientas de accesibilidad"
                className="
                grid h-8 w-8 place-items-center rounded-full
                bg-panel-soft text-body transition
                hover:bg-panel-soft
                dark:bg-surface-soft dark:text-ink dark:hover:bg-line-strong
                focus-visible:outline focus-visible:outline-3
                focus-visible:outline-offset-2 focus-visible:outline-yellow-400
              "
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1  w-[250px] max-h-[calc(100vh-250px)] overflow-y-auto overflow-x-hidden">
            <button
              type="button"
              onClick={increaseText}
              className={optionClass(false)}
            >
              <Search size={17} />
              <span>Aumentar texto</span>
            </button>

            <button
              type="button"
              onClick={decreaseText}
              className={optionClass(false)}
            >
              <Search size={17} />
              <span>Disminuir texto</span>
            </button>

            {options.map(({ label, icon: Icon, active, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className={optionClass(active)}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}

            <div className="px-2 py-3">
              <div className="mb-2 flex items-center gap-2 text-[15px]">
                <Volume2 size={17} />
                <strong>Velocidad de lectura:</strong>
              </div>

              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="w-full cursor-pointer accent-accent  dark:accent-accent"
              />

              <span className="mt-1 block text-sm text-heading dark:text-body">
                {speechRate.toFixed(1)}x
              </span>
            </div>

            <button
              type="button"
              onClick={readPage}
              className={optionClass(false)}
            >
              <Volume2 size={17} />
              <span>Leer página</span>
            </button>

            <button
              type="button"
              onClick={stopReading}
              className={optionClass(false)}
            >
              <Square size={17} />
              <span>Detener lectura</span>
            </button>

            <button
              type="button"
              onClick={resetChanges}
              className="
                mt-1 flex min-h-9 w-full items-center gap-2 rounded-xl
                px-2 py-2 text-left text-[15px] font-semibold text-heading
                transition hover:translate-x-0.5 hover:bg-danger-soft hover:text-danger-strong
                dark:text-heading dark:hover:bg-danger-soft dark:hover:text-danger-strong
                focus-visible:outline focus-visible:outline-3
                focus-visible:outline-offset-2 focus-visible:outline-yellow-400
              "
            >
              <RotateCcw className="text-danger" size={17} />
              <span className="text-danger">Restablecer cambios</span>
            </button>
          </div>
        </aside>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Abrir herramientas de accesibilidad"
        aria-expanded={open}
        className="
          grid h-[40px] w-[40px] place-items-center
          border border-accent bg-primary text-inverse
          shadow-card
          transition hover:-translate-y-1 hover:scale-[1.03]
          hover:bg-primary-strong
          hover:shadow-soft
          focus-visible:outline focus-visible:outline-3
          focus-visible:outline-offset-2 focus-visible:outline-yellow-400
        "
      >
        <Accessibility size={28} />
      </button>
    </div>,
    portalRoot,
  );
}

function optionClass(active) {
  return `
    flex min-h-9 w-full items-center gap-2 rounded-xl px-2 py-2
    text-left text-[15px] transition
    focus-visible:outline focus-visible:outline-3
    focus-visible:outline-offset-2 focus-visible:outline-yellow-400
    ${
      active
        ? "bg-primary-soft font-medium text-primary dark:bg-hover-soft dark:text-accent-strong"
        : "text-heading hover:translate-x-0.5 hover:bg-accent-soft hover:text-primary dark:text-heading dark:hover:bg-hover-soft dark:hover:text-accent-strong"
    }
  `;
}

function hasVisualSettings(settings, fontScale) {
  return (
    Object.values(settings).some(Boolean) || fontScale !== DEFAULT_FONT_SCALE
  );
}

function hasStoredSettings(settings, fontScale, speechRate) {
  return (
    hasVisualSettings(settings, fontScale) || speechRate !== DEFAULT_SPEECH_RATE
  );
}

function applyAccessibilityEffects(styleId, settings, fontScale) {
  cleanupAccessibilityClasses();

  if (!hasVisualSettings(settings, fontScale)) {
    removeAccessibilityStyle(styleId);
    return;
  }

  injectAccessibilityStyles(styleId);

  const html = document.documentElement;

  Object.entries(ACCESSIBILITY_CLASSES).forEach(([key, className]) => {
    html.classList.toggle(className, Boolean(settings[key]));
  });

  if (fontScale !== DEFAULT_FONT_SCALE) {
    html.classList.add("aw-font-scaled");
    html.style.setProperty(
      "--aw-font-scale",
      `${Math.round(fontScale * 100)}%`,
    );
  }
}

function cleanupAccessibilityEffects(styleId) {
  cleanupAccessibilityClasses();
  removeAccessibilityStyle(styleId);
}

function cleanupAccessibilityClasses() {
  const html = document.documentElement;

  html.classList.remove(...ALL_ACCESSIBILITY_CLASSES);
  html.style.removeProperty("--aw-font-scale");
}

function removeAccessibilityStyle(styleId) {
  document.getElementById(styleId)?.remove();
}

function injectAccessibilityStyles(styleId) {
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;

  style.innerHTML = `
    @keyframes awPanelIn {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.96);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /*
      Importante:
      No aplicamos grayscale al portal del widget.
      Si el filtro toca al contenedor padre del widget,
      position: fixed puede comportarse raro y moverse.
    */
    html.aw-grayscale body > *:not([data-accessibility-portal]) {
      filter: grayscale(1);
    }

    html.aw-high-contrast body {
      background: var(--color-a11y-contrast-dark-bg) !important;
      color: var(--color-a11y-contrast-dark-ink) !important;
    }

    html.aw-high-contrast body *:not([data-accessibility-widget]):not([data-accessibility-widget] *) {
      background-color: var(--color-a11y-contrast-dark-bg) !important;
      color: var(--color-a11y-contrast-dark-ink) !important;
      border-color: var(--color-a11y-contrast-dark-ink) !important;
    }

    html.aw-high-contrast body a:not([data-accessibility-widget] a) {
      color: var(--color-a11y-contrast-link) !important;
    }

    /*
      Igual que con grayscale:
      evitamos tocar el portal para que el widget no cambie de posición.
    */
    html.aw-negative-contrast body > *:not([data-accessibility-portal]) {
      filter: invert(1) hue-rotate(180deg);
    }

    html.aw-negative-contrast img,
    html.aw-negative-contrast video,
    html.aw-negative-contrast iframe {
      filter: invert(1) hue-rotate(180deg);
    }

    html.aw-light-background body {
      background: var(--color-a11y-contrast-light-bg) !important;
      color: var(--color-a11y-contrast-light-ink) !important;
    }

    html.aw-light-background body *:not([data-accessibility-widget]):not([data-accessibility-widget] *) {
      background-color: var(--color-a11y-contrast-dark-ink) !important;
      color: var(--color-a11y-contrast-light-ink) !important;
    }

    html.aw-underline-links body a:not([data-accessibility-widget] a) {
      text-decoration: underline !important;
      text-underline-offset: 3px;
    }

    html.aw-readable-font body *:not([data-accessibility-widget]):not([data-accessibility-widget] *) {
      font-family: Arial, Verdana, Tahoma, sans-serif !important;
      letter-spacing: 0.02em;
      line-height: 1.7;
    }

    html.aw-font-scaled {
      font-size: var(--aw-font-scale, 100%);
    }

    /*
      Responsive corregido:
      Como el widget está a la izquierda con left-5,
      en móvil mantenemos left y anulamos right.
    */
    @media (max-width: 480px) {
      [data-accessibility-widget] {
        left: 14px !important;
        right: auto !important;
        bottom: 14px !important;
      }

      [data-accessibility-widget] aside {
        width: calc(100vw - 28px) !important;
        left: 0 !important;
        right: auto !important;
      }
    }
  `;

  document.head.appendChild(style);
}
