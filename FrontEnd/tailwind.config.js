/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          tailwind.config.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente tailwind.config de la interfaz del SGP.
 */

const COLOR_THEME_OPTIONS = require("./src/config/colorThemeOptions.json");
const ACTIVE_COLOR_THEME = "unl";

// Each palette owns its surfaces and navigation; status colors retain their meaning.
function createColorTheme(label, primary, strong, soft, darkAccent, surfaces) {
  function tokens(isDark) {
    const skin = isDark ? surfaces.dark : surfaces.light;
    return {
      "--color-sidebar": surfaces.sidebar,
      "--color-sidebar-soft": surfaces.sidebarSoft,
      "--color-sidebar-active": surfaces.sidebarActive,
      "--color-sidebar-line": surfaces.sidebarLine,
      "--color-sidebar-accent": darkAccent,
      "--color_primary": primary,
      "--color_secondary": strong,
      "--color_unl_green": "#27805b",
      "--color_tutu_approx": strong,
      "--unl-red": isDark ? "#ed9195" : "#c1454d",
      "--unl-red-strong": isDark ? "#f5b1b5" : "#a32f38",
      "--unl-red-soft": isDark ? "#36252c" : "#fdf0f1",
      "--unl-green": isDark ? "#8bc5a9" : "#27805b",
      "--unl-green-strong": isDark ? "#b1dcc5" : "#216648",
      "--unl-green-soft": isDark ? "#20352e" : "#edf7f1",
      "--unl-blue": isDark ? darkAccent : primary,
      "--unl-blue-soft": isDark ? `color-mix(in srgb, ${darkAccent} 12%, #1b202a)` : soft,
      "--unl-gold": isDark ? "#dfbf80" : "#a5792c",
      "--unl-gold-soft": isDark ? "#352f23" : "#fbf5e9",
      "--unl-gold-strong": isDark ? "#e4c993" : "#785415",
      "--unl-orange": isDark ? "#dbac85" : "#a96835",
      "--unl-orange-soft": isDark ? "#332c26" : "#fbf1e9",
      "--unl-teal": isDark ? "#8bc9c4" : "#397d79",
      "--unl-teal-soft": isDark ? "#233735" : "#edf6f5",
      "--unl-cyan": isDark ? "#9fc8d7" : "#487789",
      "--unl-cyan-soft": isDark ? "#24343b" : "#eef5f8",
      "--unl-purple": isDark ? "#b8a8cf" : "#78648f",
      "--unl-purple-soft": isDark ? "#302b3b" : "#f3eff8",
      "--unl-graphite": isDark ? "#e8edf5" : "#1c2b40",
      "--color-page": skin.page,
      "--color-surface": skin.panel,
      "--color-surface-soft": skin.soft,
      "--color-ink": skin.ink,
      "--color-muted": skin.muted,
      "--color-border": skin.line,
      "--color-primary": isDark ? `color-mix(in srgb, ${primary} 45%, #1b202a)` : primary,
      "--color-primary-strong": isDark ? darkAccent : strong,
      "--color-primary-soft": isDark ? `color-mix(in srgb, ${darkAccent} 12%, #1b202a)` : soft,
      "--color-accent": isDark ? darkAccent : primary,
      "--color-accent-strong": isDark ? darkAccent : strong,
      "--color-accent-soft": isDark ? `color-mix(in srgb, ${darkAccent} 12%, #1b202a)` : soft,
      "--color-warm": "var(--unl-gold)",
      "--color-warm-soft": "var(--unl-gold-soft)",
      "--shadow-card": isDark ? "0 1px 3px rgba(0,0,0,.12)" : "0 1px 3px rgba(19,36,60,.035)",
      "--shadow-soft": isDark ? "0 12px 32px rgba(0,0,0,.28)" : "0 12px 32px rgba(16,24,40,.10)",
      semantic: {
        "--color-line": "var(--color-border)",
        "--color-line-soft": "color-mix(in srgb, var(--color-border) 65%, transparent)",
        "--color-line-strong": isDark ? "#64748b" : "#98a2b3",
        "--color-field": "var(--color-surface)",
        "--color-field-hover": "var(--color-surface-soft)",
        "--color-field-border": "color-mix(in srgb, var(--color-muted) 45%, var(--color-border))",
        "--color-table-header": "var(--color-surface-soft)",
        "--color-table-border": "var(--color-border)",
        "--color-focus": isDark ? darkAccent : primary,
        "--color-focus-soft": isDark ? "rgba(160,185,230,.22)" : "rgba(60,85,160,.14)",
        "--color-nav-text": "var(--color-ink)",
        "--color-nav-subtext": "var(--color-muted)",
        "--color-hover-soft": "var(--color-surface-soft)",
      },
    };
  }
  return { label, light: tokens(false), dark: tokens(true) };
}

const colorThemes = {
  unl: createColorTheme("Azul académico", "#284f78", "#1b3a5c", "#e3eefb", "#a7c9ec", {
    light: {page:"#edf3fb",panel:"#ffffff",soft:"#e7eff9",ink:"#1c2b40",muted:"#546780",line:"#ccd9e9"},
    dark: {page:"#0d1726",panel:"#17263a",soft:"#20344e",ink:"#e8edf5",muted:"#a4b7d0",line:"#334b68"},
    sidebar:"#152b48",sidebarSoft:"#203c5e",sidebarActive:"#315779",sidebarLine:"#355271",
  }),
  claro: createColorTheme("Grafito", "#55545e", "#37353e", "#e9e8ed", "#cfccd8", {
    light: {page:"#f0eff2",panel:"#ffffff",soft:"#e8e7ec",ink:"#29272f",muted:"#65616e",line:"#d5d2dc"},
    dark: {page:"#18171c",panel:"#25242b",soft:"#323039",ink:"#f0eef3",muted:"#b9b4c4",line:"#4a4654"},
    sidebar:"#29272f",sidebarSoft:"#39363f",sidebarActive:"#514b5c",sidebarLine:"#514b5c",
  }),
  bosque: createColorTheme("Verde pizarra", "#276b52", "#1b503c", "#daeee1", "#9cd9b7", {
    light: {page:"#eaf3ec",panel:"#fcfefa",soft:"#e0eee3",ink:"#213b2d",muted:"#526d5d",line:"#c5dacb"},
    dark: {page:"#0e2018",panel:"#1a3025",soft:"#264333",ink:"#e6f3e9",muted:"#a7c2b0",line:"#3c5e49"},
    sidebar:"#153d2e",sidebarSoft:"#20533e",sidebarActive:"#326c50",sidebarLine:"#39694f",
  }),
};

function withSemanticTokens(tokens, mode) {
  const isDark = mode === "dark";
  const { semantic = {}, ...themeTokens } = tokens;

  return {
    ...themeTokens,
    "--color-heading": "var(--color-ink)",
    "--color-body": isDark
      ? "color-mix(in srgb, var(--color-ink) 86%, var(--color-muted))"
      : "color-mix(in srgb, var(--color-ink) 82%, var(--color-muted))",
    "--color-secondary": "var(--color_secondary)",
    "--color-subtle": "var(--color-muted)",
    "--color-line": "var(--color-border)",
    "--color-line-soft": isDark
      ? "color-mix(in srgb, var(--color-border) 65%, transparent)"
      : "color-mix(in srgb, var(--color-border) 65%, transparent)",
    "--color-line-strong": isDark
      ? "color-mix(in srgb, var(--color-accent) 60%, var(--color-border))"
      : "color-mix(in srgb, var(--color-accent) 54%, var(--color-border))",
    "--color-panel": isDark ? "var(--color-surface)" : "var(--color-surface)",
    "--color-panel-soft": "var(--color-surface-soft)",
    "--color-field": isDark
      ? "color-mix(in srgb, var(--color-surface) 82%, var(--color-primary))"
      : "var(--color-surface)",
    "--color-field-hover": isDark
      ? "color-mix(in srgb, var(--color-surface-soft) 78%, var(--color-accent))"
      : "color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))",
    "--color-field-border": "var(--color-line)",
    "--color-table-border": isDark
      ? "color-mix(in srgb, var(--color-primary) 28%, var(--color-border))"
      : "color-mix(in srgb, var(--color-primary) 24%, var(--color-border))",
    "--color-table-header": isDark
      ? "color-mix(in srgb, var(--color-primary) 20%, var(--color-surface))"
      : "color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))",
    "--color-table-ink": "var(--color-heading)",
    "--color-inverse": "#ffffff",
    "--color-focus": "var(--color-accent)",
    "--color-focus-soft": isDark
      ? "color-mix(in srgb, var(--color-accent) 28%, transparent)"
      : "color-mix(in srgb, var(--color-accent) 24%, transparent)",
    "--color-nav-text": isDark
      ? "color-mix(in srgb, var(--color-ink) 90%, var(--color-primary))"
      : "color-mix(in srgb, var(--color-primary-strong) 78%, var(--color-ink))",
    "--color-nav-subtext": isDark
      ? "color-mix(in srgb, var(--color-muted) 80%, var(--color-primary))"
      : "color-mix(in srgb, var(--color-primary-strong) 60%, var(--color-muted))",
    "--color-hover-soft": isDark
      ? "color-mix(in srgb, var(--color-accent) 16%, var(--color-surface-soft))"
      : "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))",
    "--color-success": isDark ? "#6ee7b7" : "#059669",
    "--color-success-strong": isDark ? "#a7f3d0" : "#065f46",
    "--color-success-soft": isDark ? "#19382e" : "#ecfdf5",
    "--color-warning": isDark ? "#fcd34d" : "#d97706",
    "--color-warning-strong": isDark ? "#f6df8e" : "#7a4f00",
    "--color-warning-soft": isDark ? "#3b301b" : "#fffbeb",
    "--color-danger": "var(--unl-red)",
    "--color-danger-strong": "var(--unl-red-strong)",
    "--color-danger-soft": "var(--unl-red-soft)",
    "--color-info": isDark ? "#93c5fd" : "#2563eb",
    "--color-info-strong": isDark ? "#bfdbfe" : "#1e40af",
    "--color-info-soft": isDark ? "#1c2c47" : "#eff6ff",
    "--color-chart-1": "var(--unl-red)",
    "--color-chart-2": "var(--unl-gold)",
    "--color-chart-3": "var(--unl-blue)",
    "--color-chart-4": "var(--unl-green)",
    "--color-chart-5": "var(--color-primary-strong)",
    "--color-chart-6": "var(--color-accent-strong)",
    "--color-chart-7": isDark ? "#c4b5fd" : "#8b5cf6",
    "--color-chart-8": isDark ? "#5eead4" : "#06b6d4",
    "--color-chart-9": isDark ? "#fdba74" : "#f97316",
    "--color-chart-10": isDark ? "#f0abfc" : "#d946ef",
    "--color-card-a": isDark ? "#70b9d1" : "#347c96",
    "--color-card-a-strong": isDark ? "#b9e1eb" : "#15566d",
    "--color-card-a-soft": isDark ? "rgba(112, 185, 209, 0.16)" : "#e3f0f3",
    "--color-card-b": isDark ? "#86bf77" : "#579450",
    "--color-card-b-strong": isDark ? "#c1e3b5" : "#386f38",
    "--color-card-b-soft": isDark ? "rgba(134, 191, 119, 0.16)" : "#e8f2e3",
    "--color-card-c": isDark ? "#63b7aa" : "#438f84",
    "--color-card-c-strong": isDark ? "#b2e2d8" : "#28695f",
    "--color-card-c-soft": isDark ? "rgba(99, 183, 170, 0.16)" : "#e3f1ed",
    "--color-card-d": isDark ? "#d7b15d" : "#c39232",
    "--color-card-d-strong": isDark ? "#f0daa1" : "#805c1d",
    "--color-card-d-soft": isDark ? "rgba(215, 177, 93, 0.16)" : "#f5eedb",
    "--color-card-e": isDark ? "#a995c5" : "#8473a1",
    "--color-card-e-strong": isDark ? "#d8c9ed" : "#5d4b7b",
    "--color-card-e-soft": isDark ? "rgba(169, 149, 197, 0.16)" : "#eee9f4",
    "--color-print-page": "#ffffff",
    "--color-print-ink": "#111827",
    "--color-print-border": "#111827",
    "--color-print-header": "#e5e5e5",
    "--color-error-highlight-bg": "var(--color-danger-soft)",
    "--color-error-highlight-ink": "var(--color-danger-strong)",
    "--color-a11y-contrast-dark-bg": "#000000",
    "--color-a11y-contrast-dark-ink": "#ffffff",
    "--color-a11y-contrast-light-bg": "#ffffff",
    "--color-a11y-contrast-light-ink": "#111827",
    "--color-a11y-contrast-link": "#facc15",
    ...semantic,
  };
}

const selectedColorTheme = colorThemes[ACTIVE_COLOR_THEME] || colorThemes.unl;

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--color-page)",
        surface: "var(--color-surface)",
        "surface-soft": "var(--color-surface-soft)",
        panel: "var(--color-panel)",
        "panel-soft": "var(--color-panel-soft)",
        field: "var(--color-field)",
        "field-hover": "var(--color-field-hover)",
        "field-border": "var(--color-field-border)",
        ink: "var(--color-ink)",
        heading: "var(--color-heading)",
        body: "var(--color-body)",
        subtle: "var(--color-subtle)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        line: "var(--color-line)",
        "line-soft": "var(--color-line-soft)",
        "line-strong": "var(--color-line-strong)",
        "table-border": "var(--color-table-border)",
        "table-header": "var(--color-table-header)",
        "table-ink": "var(--color-table-ink)",
        inverse: "var(--color-inverse)",
        focus: "var(--color-focus)",
        "focus-soft": "var(--color-focus-soft)",
        "nav-text": "var(--color-nav-text)",
        "nav-subtext": "var(--color-nav-subtext)",
        "hover-soft": "var(--color-hover-soft)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        "primary-strong": "var(--color-primary-strong)",
        "primary-soft": "var(--color-primary-soft)",
        accent: "var(--color-accent)",
        "accent-strong": "var(--color-accent-strong)",
        "accent-soft": "var(--color-accent-soft)",
        success: "var(--color-success)",
        "success-strong": "var(--color-success-strong)",
        "success-soft": "var(--color-success-soft)",
        warning: "var(--color-warning)",
        "warning-strong": "var(--color-warning-strong)",
        "warning-soft": "var(--color-warning-soft)",
        danger: "var(--color-danger)",
        "danger-strong": "var(--color-danger-strong)",
        "danger-soft": "var(--color-danger-soft)",
        info: "var(--color-info)",
        "info-strong": "var(--color-info-strong)",
        "info-soft": "var(--color-info-soft)",
        chart: {
          1: "var(--color-chart-1)",
          2: "var(--color-chart-2)",
          3: "var(--color-chart-3)",
          4: "var(--color-chart-4)",
          5: "var(--color-chart-5)",
          6: "var(--color-chart-6)",
          7: "var(--color-chart-7)",
          8: "var(--color-chart-8)",
          9: "var(--color-chart-9)",
          10: "var(--color-chart-10)",
        },
        card: {
          a: "var(--color-card-a)",
          "a-strong": "var(--color-card-a-strong)",
          "a-soft": "var(--color-card-a-soft)",
          b: "var(--color-card-b)",
          "b-strong": "var(--color-card-b-strong)",
          "b-soft": "var(--color-card-b-soft)",
          c: "var(--color-card-c)",
          "c-strong": "var(--color-card-c-strong)",
          "c-soft": "var(--color-card-c-soft)",
          d: "var(--color-card-d)",
          "d-strong": "var(--color-card-d-strong)",
          "d-soft": "var(--color-card-d-soft)",
          e: "var(--color-card-e)",
          "e-strong": "var(--color-card-e-strong)",
          "e-soft": "var(--color-card-e-soft)",
        },
        unl: {
          blue: "var(--unl-blue)",
          green: "var(--unl-green)",
          gold: "var(--unl-gold)",
          red: "var(--unl-red)",
          graphite: "var(--unl-graphite)",
          orange: "var(--unl-orange)",
          teal: "var(--unl-teal)",
          cyan: "var(--unl-cyan)",
          purple: "var(--unl-purple)",
        },
      },
      boxShadow: {
        card: "var(--shadow-card)",
        soft: "var(--shadow-soft)",
      },
      animation: {
        "role-slide": "role-slide 280ms ease-out both",
        "vertical-slide": "vertical-slide 16s linear infinite",
        "soft-pop": "soft-pop 320ms ease-out both",
        "gentle-float": "gentle-float 5.5s ease-in-out infinite",
      },
      keyframes: {
        "soft-pop": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px) scale(0.98)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        "gentle-float": {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-5px)",
          },
        },
        "role-slide": {
          "0%": {
            opacity: "0",
            transform: "translateX(28px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "vertical-slide": {
          "0%": {
            transform: "translateY(0)",
          },
          "100%": {
            transform: "translateY(-248px)",
          },
        },
      },
    },
  },
  plugins: [
    ({ addBase }) => {
      const themeRules = COLOR_THEME_OPTIONS.flatMap(({ id }) => {
        const theme = colorThemes[id];
        if (!theme) return [];

        return [
          [`html[data-color-theme="${id}"]:not(.dark)`, withSemanticTokens(theme.light, "light")],
          [`html.dark[data-color-theme="${id}"]`, withSemanticTokens(theme.dark, "dark")],
        ];
      });

      addBase(Object.fromEntries([
        [":root", withSemanticTokens(selectedColorTheme.light, "light")],
        ["html.dark", withSemanticTokens(selectedColorTheme.dark, "dark")],
        ...themeRules,
      ]));
    },
  ],
};

module.exports = config;
