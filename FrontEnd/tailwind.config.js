const ACTIVE_COLOR_THEME = "unl"; // Cambia este valor a "unl", "academico", "claro", "bosque", "admision", "tecnologico", "contrasteVivo" o "vivo" para seleccionar el tema de color

const colorThemes = {
  unl: {
    label: "UNL institucional",
    light: {
      "--color_primary": "#04344c",
      "--color_secondary": "#074462",
      "--color_unl_green": "#529914",
      "--color_tutu_approx": "#04344c",
      "--unl-red": "#9f2933",
      "--unl-red-strong": "#7d1f28",
      "--unl-red-soft": "#f3e6e5",
      "--unl-green": "var(--color_unl_green)",
      "--unl-green-strong": "#3f760f",
      "--unl-green-soft": "#e4f0d8",
      "--unl-blue": "var(--color_primary)",
      "--unl-blue-soft": "#d7e4e9",
      "--unl-gold": "#ad852d",
      "--unl-gold-soft": "#f1eadb",
      "--unl-graphite": "#20282d",
      "--color-page": "#d1dde1",
      "--color-surface": "#eef2ed",
      "--color-surface-soft": "#dfe9e3",
      "--color-ink": "#10232c",
      "--color-muted": "#586c74",
      "--color-border": "#7fb35d",
      "--color-primary": "var(--color_primary)",
      "--color-primary-strong": "#03283a",
      "--color-primary-soft": "#d7e4e9",
      "--color-accent": "var(--color_unl_green)",
      "--color-accent-strong": "var(--unl-green-strong)",
      "--color-accent-soft": "var(--unl-green-soft)",
      "--color-warm": "var(--unl-gold)",
      "--color-warm-soft": "var(--unl-gold-soft)",
      "--shadow-soft": "0 22px 48px rgba(32, 40, 45, 0.1)",
      "--shadow-card": "0 12px 28px rgba(32, 40, 45, 0.075)",
    },
    dark: {
      "--unl-red": "#ff5a66",
      "--unl-red-strong": "#ff8b93",
      "--unl-red-soft": "rgba(255, 90, 102, 0.14)",
      "--unl-green": "#75c66a",
      "--unl-green-strong": "#a7e79f",
      "--unl-green-soft": "rgba(117, 198, 106, 0.14)",
      "--unl-blue": "#66bdf2",
      "--unl-blue-soft": "rgba(102, 189, 242, 0.14)",
      "--unl-gold": "#f4c84a",
      "--unl-gold-soft": "rgba(244, 200, 74, 0.16)",
      "--unl-graphite": "#f8fafc",
      "--color-page": "#0b1120",
      "--color-surface": "#111827",
      "--color-surface-soft": "#172033",
      "--color-ink": "#e5edf7",
      "--color-muted": "#a8b4c7",
      "--color-border": "#263449",
      "--color-primary": "#04344c",
      "--color-primary-strong": "#66bdf2",
      "--color-primary-soft": "rgba(102, 189, 242, 0.14)",
      "--color-accent": "#75c66a",
      "--color-accent-strong": "#a7e79f",
      "--color-accent-soft": "rgba(117, 198, 106, 0.14)",
      "--shadow-soft": "0 22px 48px rgba(0, 0, 0, 0.36)",
      "--shadow-card": "0 16px 34px rgba(0, 0, 0, 0.28)",
      semantic: {
        "--color-line": "#263449",
        "--color-line-soft": "rgba(168, 180, 199, 0.16)",
        "--color-line-strong": "#3a4a5c",
        "--color-field": "#0f172a",
        "--color-field-hover": "#182334",
        "--color-field-border": "#263449",
        "--color-table-border": "#475569",
        "--color-table-header": "#334155",
        "--color-focus": "#75c66a",
        "--color-focus-soft": "rgba(117, 198, 106, 0.22)",
        "--color-nav-text": "#c8d3df",
        "--color-nav-subtext": "#b7c4d1",
        "--color-hover-soft": "#203026",
      },
    },
  },
  academico: {
    label: "Academico sobrio",
    light: {
      "--color_primary": "#2b3a67",
      "--color_secondary": "#8a6f2a",
      "--color_unl_green": "#2f855a",
      "--color_tutu_approx": "#123c4a",
      "--unl-red": "#a43f3f",
      "--unl-red-strong": "#7f2f2f",
      "--unl-red-soft": "#f5e4e1",
      "--unl-green": "#2f855a",
      "--unl-green-strong": "#256b49",
      "--unl-green-soft": "#dcefe6",
      "--unl-blue": "#2b3a67",
      "--unl-blue-soft": "#e1e6f5",
      "--unl-gold": "#b0892f",
      "--unl-gold-soft": "#f4ead0",
      "--unl-graphite": "#20272c",
      "--color-page": "#d9e3e4",
      "--color-surface": "#f2f5f2",
      "--color-surface-soft": "#e5ece8",
      "--color-ink": "#12242b",
      "--color-muted": "#53676e",
      "--color-border": "#c8b06a",
      "--color-primary": "var(--color_primary)",
      "--color-primary-strong": "#1e2a4d",
      "--color-primary-soft": "#e1e6f5",
      "--color-accent": "var(--unl-gold)",
      "--color-accent-strong": "#7c5a17",
      "--color-accent-soft": "var(--unl-gold-soft)",
      "--color-warm": "var(--unl-gold)",
      "--color-warm-soft": "var(--unl-gold-soft)",
      "--shadow-soft": "0 22px 48px rgba(32, 39, 44, 0.09)",
      "--shadow-card": "0 12px 26px rgba(32, 39, 44, 0.07)",
    },
    dark: {
      "--unl-red": "#f08a8a",
      "--unl-red-strong": "#f5aaaa",
      "--unl-red-soft": "rgba(240, 138, 138, 0.14)",
      "--unl-green": "#78d19b",
      "--unl-green-strong": "#a6e7bd",
      "--unl-green-soft": "rgba(120, 209, 155, 0.14)",
      "--unl-blue": "#8bc6d6",
      "--unl-blue-soft": "rgba(139, 198, 214, 0.14)",
      "--unl-gold": "#e7bf69",
      "--unl-gold-soft": "rgba(231, 191, 105, 0.16)",
      "--unl-graphite": "#f8fafc",
      "--color-page": "#0d1518",
      "--color-surface": "#131d22",
      "--color-surface-soft": "#1b282e",
      "--color-ink": "#e6eef1",
      "--color-muted": "#a8b6bc",
      "--color-border": "#5a4b2a",
      "--color-primary": "#9aa8ff",
      "--color-primary-strong": "#d7ddff",
      "--color-primary-soft": "rgba(154, 168, 255, 0.14)",
      "--color-accent": "#e7bf69",
      "--color-accent-strong": "#f5d996",
      "--color-accent-soft": "rgba(231, 191, 105, 0.16)",
      "--shadow-soft": "0 22px 48px rgba(0, 0, 0, 0.34)",
      "--shadow-card": "0 16px 34px rgba(0, 0, 0, 0.25)",
    },
  },
  claro: {
    label: "Claro profesional",
    light: {
      "--color_primary": "#00a6c8",
      "--color_secondary": "#14b8a6",
      "--color_unl_green": "#22c55e",
      "--color_tutu_approx": "#164e63",
      "--unl-red": "#b33a3a",
      "--unl-red-strong": "#8f2e2e",
      "--unl-red-soft": "#f6e3df",
      "--unl-green": "#3b7f45",
      "--unl-green-strong": "#2f6b39",
      "--unl-green-soft": "#e0efdf",
      "--unl-blue": "#164e63",
      "--unl-blue-soft": "#d9eaee",
      "--unl-gold": "#f59e0b",
      "--unl-gold-soft": "#fef3c7",
      "--unl-graphite": "#1f2933",
      "--color-page": "#effcff",
      "--color-surface": "#ffffff",
      "--color-surface-soft": "#e6fffb",
      "--color-ink": "#14242b",
      "--color-muted": "#5a6b72",
      "--color-border": "#7ddce8",
      "--color-primary": "var(--color_primary)",
      "--color-primary-strong": "#007a91",
      "--color-primary-soft": "#cff7ff",
      "--color-accent": "#f59e0b",
      "--color-accent-strong": "#a35a00",
      "--color-accent-soft": "#fef3c7",
      "--color-warm": "var(--unl-gold)",
      "--color-warm-soft": "var(--unl-gold-soft)",
      "--shadow-soft": "0 22px 48px rgba(31, 41, 51, 0.08)",
      "--shadow-card": "0 10px 24px rgba(31, 41, 51, 0.06)",
    },
    dark: {
      "--unl-red": "#fb8f8f",
      "--unl-red-strong": "#fdb7b7",
      "--unl-red-soft": "rgba(251, 143, 143, 0.14)",
      "--unl-green": "#82d88b",
      "--unl-green-strong": "#b0edb6",
      "--unl-green-soft": "rgba(130, 216, 139, 0.14)",
      "--unl-blue": "#8bd3e6",
      "--unl-blue-soft": "rgba(139, 211, 230, 0.14)",
      "--unl-gold": "#e7c56f",
      "--unl-gold-soft": "rgba(231, 197, 111, 0.16)",
      "--unl-graphite": "#f8fafc",
      "--color-page": "#0a1114",
      "--color-surface": "#101a1f",
      "--color-surface-soft": "#17242a",
      "--color-ink": "#e7f0f3",
      "--color-muted": "#aab9be",
      "--color-border": "#1e6876",
      "--color-primary": "#67e8f9",
      "--color-primary-strong": "#cffafe",
      "--color-primary-soft": "rgba(103, 232, 249, 0.14)",
      "--color-accent": "#fbbf24",
      "--color-accent-strong": "#fde68a",
      "--color-accent-soft": "rgba(251, 191, 36, 0.16)",
      "--shadow-soft": "0 22px 48px rgba(0, 0, 0, 0.34)",
      "--shadow-card": "0 16px 34px rgba(0, 0, 0, 0.25)",
    },
  },
  bosque: {
    label: "Bosque institucional",
    light: {
      "--color_primary": "#1f6f3d",
      "--color_secondary": "#6b8e23",
      "--color_unl_green": "#4f8a3d",
      "--color_tutu_approx": "#174236",
      "--unl-red": "#a2413b",
      "--unl-red-strong": "#80322e",
      "--unl-red-soft": "#f3e4df",
      "--unl-green": "#4f8a3d",
      "--unl-green-strong": "#3d6f30",
      "--unl-green-soft": "#e3efd9",
      "--unl-blue": "#174236",
      "--unl-blue-soft": "#dce9e2",
      "--unl-gold": "#9f7d2b",
      "--unl-gold-soft": "#f0e8d4",
      "--unl-graphite": "#232923",
      "--color-page": "#dbe3db",
      "--color-surface": "#f2f5ef",
      "--color-surface-soft": "#e6ece2",
      "--color-ink": "#17261f",
      "--color-muted": "#59695f",
      "--color-border": "#8fbd62",
      "--color-primary": "var(--color_primary)",
      "--color-primary-strong": "#14532d",
      "--color-primary-soft": "#dff3df",
      "--color-accent": "#9f7d2b",
      "--color-accent-strong": "#6f551c",
      "--color-accent-soft": "var(--unl-gold-soft)",
      "--color-warm": "var(--unl-gold)",
      "--color-warm-soft": "var(--unl-gold-soft)",
      "--shadow-soft": "0 22px 48px rgba(35, 41, 35, 0.09)",
      "--shadow-card": "0 12px 26px rgba(35, 41, 35, 0.07)",
    },
    dark: {
      "--unl-red": "#ee8f86",
      "--unl-red-strong": "#f4b0aa",
      "--unl-red-soft": "rgba(238, 143, 134, 0.14)",
      "--unl-green": "#94d77a",
      "--unl-green-strong": "#bceaa8",
      "--unl-green-soft": "rgba(148, 215, 122, 0.14)",
      "--unl-blue": "#8ac9b0",
      "--unl-blue-soft": "rgba(138, 201, 176, 0.14)",
      "--unl-gold": "#e5c46b",
      "--unl-gold-soft": "rgba(229, 196, 107, 0.16)",
      "--unl-graphite": "#f8fafc",
      "--color-page": "#0d1511",
      "--color-surface": "#131d18",
      "--color-surface-soft": "#1a2921",
      "--color-ink": "#e6efe9",
      "--color-muted": "#a9b8ad",
      "--color-border": "#3f633f",
      "--color-primary": "#94d77a",
      "--color-primary-strong": "#bceaa8",
      "--color-primary-soft": "rgba(148, 215, 122, 0.14)",
      "--color-accent": "#e5c46b",
      "--color-accent-strong": "#f5df99",
      "--color-accent-soft": "rgba(229, 196, 107, 0.16)",
      "--shadow-soft": "0 22px 48px rgba(0, 0, 0, 0.34)",
      "--shadow-card": "0 16px 34px rgba(0, 0, 0, 0.25)",
    },
  },
  admision: {
    label: "Admisión UNL llamativo",
    light: {
      "--color_primary": "#062b49",
      "--color_secondary": "#0f8fa3",
      "--color_unl_green": "#22ad2e",
      "--color_tutu_approx": "#062b49",

      "--unl-red": "#e83b2f",
      "--unl-red-strong": "#c6281f",
      "--unl-red-soft": "#fde4df",

      "--unl-green": "#22ad2e",
      "--unl-green-strong": "#168a22",
      "--unl-green-soft": "#dff7df",

      "--unl-blue": "#062b49",
      "--unl-blue-soft": "#dcecf3",

      "--unl-gold": "#ffad14",
      "--unl-gold-soft": "#fff0cf",

      "--unl-orange": "#e65a00",
      "--unl-orange-soft": "#ffe4cc",

      "--unl-teal": "#14bfa5",
      "--unl-teal-soft": "#d8f7f1",

      "--unl-graphite": "#20282d",

      "--color-page": "#eef6f3",
      "--color-surface": "#ffffff",
      "--color-surface-soft": "#edf7f3",

      "--color-ink": "#102b3a",
      "--color-muted": "#536a72",
      "--color-border": "#bfd5d7",

      "--color-primary": "var(--color_unl_green)",
      "--color-primary-strong": "#168a22",
      "--color-primary-soft": "#dff7df",

      "--color-accent": "var(--unl-orange)",
      "--color-accent-strong": "#b44100",
      "--color-accent-soft": "var(--unl-orange-soft)",

      "--color-warm": "#ffad14",
      "--color-warm-soft": "#fff0cf",

      "--shadow-soft": "0 24px 55px rgba(6, 43, 73, 0.12)",
      "--shadow-card": "0 14px 32px rgba(6, 43, 73, 0.09)",
    },

    dark: {
      "--unl-red": "#ff766c",
      "--unl-red-strong": "#ffaaa3",
      "--unl-red-soft": "rgba(255, 118, 108, 0.15)",

      "--unl-green": "#5de76b",
      "--unl-green-strong": "#9ff3a8",
      "--unl-green-soft": "rgba(93, 231, 107, 0.14)",

      "--unl-blue": "#7fd4ef",
      "--unl-blue-soft": "rgba(127, 212, 239, 0.14)",

      "--unl-gold": "#ffc857",
      "--unl-gold-soft": "rgba(255, 200, 87, 0.16)",

      "--unl-orange": "#ff9345",
      "--unl-orange-soft": "rgba(255, 147, 69, 0.15)",

      "--unl-teal": "#4ee5d0",
      "--unl-teal-soft": "rgba(78, 229, 208, 0.14)",

      "--unl-graphite": "#f8fafc",

      "--color-page": "#07131c",
      "--color-surface": "#0e1e2a",
      "--color-surface-soft": "#142b38",

      "--color-ink": "#e8f4f7",
      "--color-muted": "#a9bdc6",
      "--color-border": "#2d6f4b",
      "--color-primary": "#5de76b",
      "--color-primary-strong": "#9ff3a8",
      "--color-primary-soft": "rgba(93, 231, 107, 0.14)",
      "--color-accent": "#ff9345",
      "--color-accent-strong": "#ffd2ad",
      "--color-accent-soft": "rgba(255, 147, 69, 0.15)",

      "--shadow-soft": "0 24px 55px rgba(0, 0, 0, 0.38)",
      "--shadow-card": "0 16px 34px rgba(0, 0, 0, 0.28)",
    },
  },
  tecnologico: {
    label: "Tecnológico institucional",
    light: {
      "--color_primary": "#06b6d4",
      "--color_secondary": "#6d5bd0",
      "--color_unl_green": "#16a34a",
      "--color_tutu_approx": "#073b5c",

      "--unl-red": "#dc3f3f",
      "--unl-red-strong": "#b52f2f",
      "--unl-red-soft": "#fde2e2",

      "--unl-green": "#16a34a",
      "--unl-green-strong": "#12833c",
      "--unl-green-soft": "#dcfce7",

      "--unl-blue": "#073b5c",
      "--unl-blue-soft": "#d9edf7",

      "--unl-gold": "#f5a524",
      "--unl-gold-soft": "#fff1d6",

      "--unl-cyan": "#06b6d4",
      "--unl-cyan-soft": "#cffafe",

      "--unl-purple": "#6d5bd0",
      "--unl-purple-soft": "#ebe8ff",

      "--unl-graphite": "#1f2933",

      "--color-page": "#edf7f8",
      "--color-surface": "#ffffff",
      "--color-surface-soft": "#eef8f6",

      "--color-ink": "#102a3a",
      "--color-muted": "#526b76",
      "--color-border": "#93c5fd",

      "--color-primary": "var(--color_primary)",
      "--color-primary-strong": "#06748c",
      "--color-primary-soft": "var(--unl-cyan-soft)",

      "--color-accent": "var(--unl-purple)",
      "--color-accent-strong": "#4c3ab0",
      "--color-accent-soft": "var(--unl-purple-soft)",

      "--color-warm": "var(--unl-gold)",
      "--color-warm-soft": "var(--unl-gold-soft)",

      "--shadow-soft": "0 24px 55px rgba(7, 59, 92, 0.12)",
      "--shadow-card": "0 14px 32px rgba(7, 59, 92, 0.09)",
    },

    dark: {
      "--unl-red": "#ff7b7b",
      "--unl-red-strong": "#ffb0b0",
      "--unl-red-soft": "rgba(255, 123, 123, 0.14)",

      "--unl-green": "#6ee787",
      "--unl-green-strong": "#a7f3ba",
      "--unl-green-soft": "rgba(110, 231, 135, 0.14)",

      "--unl-blue": "#80d8ff",
      "--unl-blue-soft": "rgba(128, 216, 255, 0.14)",

      "--unl-gold": "#ffd166",
      "--unl-gold-soft": "rgba(255, 209, 102, 0.16)",

      "--unl-cyan": "#22d3ee",
      "--unl-cyan-soft": "rgba(34, 211, 238, 0.14)",

      "--unl-purple": "#a99cff",
      "--unl-purple-soft": "rgba(169, 156, 255, 0.14)",

      "--unl-graphite": "#f8fafc",

      "--color-page": "#06151f",
      "--color-surface": "#0d1f2b",
      "--color-surface-soft": "#132d3b",

      "--color-ink": "#e8f5f8",
      "--color-muted": "#a9bdc6",
      "--color-border": "#2f6f81",
      "--color-primary": "#22d3ee",
      "--color-primary-strong": "#a5f3fc",
      "--color-primary-soft": "rgba(34, 211, 238, 0.14)",
      "--color-accent": "#a99cff",
      "--color-accent-strong": "#ddd8ff",
      "--color-accent-soft": "rgba(169, 156, 255, 0.14)",

      "--shadow-soft": "0 24px 55px rgba(0, 0, 0, 0.38)",
      "--shadow-card": "0 16px 34px rgba(0, 0, 0, 0.28)",
    },
  },
  contrasteVivo: {
    label: "Contraste vivo institucional",
    light: {
      "--color_primary": "#031f35",
      "--color_secondary": "#005f73",
      "--color_unl_green": "#2dbb3f",
      "--color_tutu_approx": "#031f35",

      "--unl-red": "#e3342f",
      "--unl-red-strong": "#b91c1c",
      "--unl-red-soft": "#ffe1df",

      "--unl-green": "#2dbb3f",
      "--unl-green-strong": "#168227",
      "--unl-green-soft": "#dcfce2",

      "--unl-blue": "#031f35",
      "--unl-blue-soft": "#d9eaf2",

      "--unl-gold": "#ffb703",
      "--unl-gold-strong": "#b87500",
      "--unl-gold-soft": "#fff1c7",

      "--unl-orange": "#fb5607",
      "--unl-orange-soft": "#ffe2d1",

      "--unl-cyan": "#00a6c8",
      "--unl-cyan-soft": "#d8f6fb",

      "--unl-graphite": "#151f27",

      "--color-page": "#eef6f4",
      "--color-surface": "#ffffff",
      "--color-surface-soft": "#f0f7f4",

      "--color-ink": "#101820",
      "--color-muted": "#52666f",
      "--color-border": "#b9d0d4",

      "--color-primary": "var(--color_primary)",
      "--color-primary-strong": "#011727",
      "--color-primary-soft": "#d9eaf2",

      "--color-accent": "var(--unl-orange)",
      "--color-accent-strong": "#b43d00",
      "--color-accent-soft": "var(--unl-orange-soft)",

      "--color-warm": "var(--unl-gold)",
      "--color-warm-soft": "var(--unl-gold-soft)",

      "--shadow-soft": "0 26px 60px rgba(3, 31, 53, 0.16)",
      "--shadow-card": "0 16px 36px rgba(3, 31, 53, 0.11)",
    },

    dark: {
      "--unl-red": "#ff6b63",
      "--unl-red-strong": "#ffaaa5",
      "--unl-red-soft": "rgba(255, 107, 99, 0.15)",

      "--unl-green": "#64f27a",
      "--unl-green-strong": "#a4f7b0",
      "--unl-green-soft": "rgba(100, 242, 122, 0.15)",

      "--unl-blue": "#7dd3fc",
      "--unl-blue-soft": "rgba(125, 211, 252, 0.15)",

      "--unl-gold": "#ffd166",
      "--unl-gold-strong": "#ffe29a",
      "--unl-gold-soft": "rgba(255, 209, 102, 0.17)",

      "--unl-orange": "#ff8a3d",
      "--unl-orange-soft": "rgba(255, 138, 61, 0.15)",

      "--unl-cyan": "#22d3ee",
      "--unl-cyan-soft": "rgba(34, 211, 238, 0.15)",

      "--unl-graphite": "#f8fafc",

      "--color-page": "#050b12",
      "--color-surface": "#0b1620",
      "--color-surface-soft": "#102333",

      "--color-ink": "#f1f7fa",
      "--color-muted": "#b0c0c9",
      "--color-border": "#415a70",
      "--color-primary": "#7dd3fc",
      "--color-primary-strong": "#e0f2fe",
      "--color-primary-soft": "rgba(125, 211, 252, 0.15)",
      "--color-accent": "#ff8a3d",
      "--color-accent-strong": "#ffd2ad",
      "--color-accent-soft": "rgba(255, 138, 61, 0.15)",

      "--shadow-soft": "0 26px 60px rgba(0, 0, 0, 0.42)",
      "--shadow-card": "0 18px 38px rgba(0, 0, 0, 0.32)",
    },
  },
  vivo: {
    label: "Vivo académico",
    light: {
      "--color_primary": "#2dad29",
      "--color_secondary": "#13c0a0",
      "--color_unl_green": "#2dad29",
      "--color_tutu_approx": "#2dad29",

      "--unl-red": "#df5200",
      "--unl-red-strong": "#b44100",
      "--unl-red-soft": "#ffe3cc",

      "--unl-green": "#2dad29",
      "--unl-green-strong": "#22851f",
      "--unl-green-soft": "#dbf6d6",

      "--unl-blue": "#108f9b",
      "--unl-blue-soft": "#d8f3f5",

      "--unl-gold": "#ffb000",
      "--unl-gold-soft": "#fff0bf",

      "--unl-orange": "#df5200",
      "--unl-orange-soft": "#ffdfc2",

      "--unl-teal": "#13c0a0",
      "--unl-teal-soft": "#d5f7ef",

      "--unl-cyan": "#0f92a0",
      "--unl-cyan-soft": "#d8f4f7",

      "--unl-purple": "#4f46e5",
      "--unl-purple-soft": "#e5e7ff",

      "--unl-graphite": "#1f2a37",

      "--color-page": "#f3f8f4",
      "--color-surface": "#ffffff",
      "--color-surface-soft": "#e9f7ef",

      "--color-ink": "#173037",
      "--color-muted": "#567178",
      "--color-border": "#82d57b",

      "--color-primary": "var(--color_primary)",
      "--color-primary-strong": "#21831f",
      "--color-primary-soft": "#dbf6d6",

      "--color-accent": "var(--unl-gold)",
      "--color-accent-strong": "#b86f00",
      "--color-accent-soft": "var(--unl-gold-soft)",

      "--color-warm": "var(--unl-gold)",
      "--color-warm-soft": "var(--unl-gold-soft)",

      "--shadow-soft": "0 22px 50px color-mix(in srgb, var(--color-primary) 20%, transparent)",
      "--shadow-card": "0 12px 28px color-mix(in srgb, var(--color-primary) 14%, transparent)",
    },
    dark: {
      "--unl-red": "#ff8a3d",
      "--unl-red-strong": "#ffc29c",
      "--unl-red-soft": "rgba(255, 138, 61, 0.17)",

      "--unl-green": "#65e65f",
      "--unl-green-strong": "#b3f5af",
      "--unl-green-soft": "rgba(101, 230, 95, 0.15)",

      "--unl-blue": "#4dd7e5",
      "--unl-blue-soft": "rgba(77, 215, 229, 0.15)",

      "--unl-gold": "#ffc928",
      "--unl-gold-soft": "rgba(255, 201, 40, 0.17)",

      "--unl-orange": "#ff7a1a",
      "--unl-orange-soft": "rgba(255, 122, 26, 0.16)",

      "--unl-teal": "#3be0bf",
      "--unl-teal-soft": "rgba(59, 224, 191, 0.15)",

      "--unl-cyan": "#36c9d8",
      "--unl-cyan-soft": "rgba(54, 201, 216, 0.15)",

      "--unl-purple": "#b197fc",
      "--unl-purple-soft": "rgba(177, 151, 252, 0.14)",

      "--unl-graphite": "#f8fafc",

      "--color-page": "#07161a",
      "--color-surface": "#0d2026",
      "--color-surface-soft": "#123039",

      "--color-ink": "#eaf4fb",
      "--color-muted": "#adc0cc",
      "--color-border": "#326a45",

      "--color-primary": "var(--unl-green)",
      "--color-primary-strong": "var(--unl-green-strong)",
      "--color-primary-soft": "var(--unl-green-soft)",

      "--color-accent": "var(--unl-gold)",
      "--color-accent-strong": "#ffe08a",
      "--color-accent-soft": "var(--unl-gold-soft)",

      "--shadow-soft": "0 24px 54px rgba(0, 0, 0, 0.36)",
      "--shadow-card": "0 16px 36px rgba(0, 0, 0, 0.28)",
    },
  },
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
    "--color-line": isDark
      ? "color-mix(in srgb, var(--color-primary) 42%, var(--color-border))"
      : "color-mix(in srgb, var(--color-primary) 48%, var(--color-border))",
    "--color-line-soft": isDark
      ? "color-mix(in srgb, var(--color-accent) 22%, transparent)"
      : "color-mix(in srgb, var(--color-accent) 28%, transparent)",
    "--color-line-strong": isDark
      ? "color-mix(in srgb, var(--color-accent) 66%, var(--color-border))"
      : "color-mix(in srgb, var(--color-accent) 72%, var(--color-border))",
    "--color-panel": isDark ? "var(--color-surface)" : "var(--color-surface)",
    "--color-panel-soft": "var(--color-surface-soft)",
    "--color-field": isDark
      ? "color-mix(in srgb, var(--color-surface) 82%, var(--color-primary))"
      : "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))",
    "--color-field-hover": isDark
      ? "color-mix(in srgb, var(--color-surface-soft) 78%, var(--color-accent))"
      : "color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))",
    "--color-field-border": "var(--color-line)",
    "--color-table-border": isDark
      ? "color-mix(in srgb, var(--color-primary) 56%, var(--color-border))"
      : "color-mix(in srgb, var(--color-primary) 68%, var(--color-border))",
    "--color-table-header": isDark
      ? "color-mix(in srgb, var(--color-primary) 74%, var(--color-surface))"
      : "var(--color-primary)",
    "--color-table-ink": isDark ? "#e2e8f0" : "#111827",
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
      ? "color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-soft))"
      : "color-mix(in srgb, var(--color-accent) 22%, var(--color-surface))",
    "--color-success": "var(--unl-green)",
    "--color-success-strong": "var(--unl-green-strong)",
    "--color-success-soft": "var(--unl-green-soft)",
    "--color-warning": "var(--unl-gold)",
    "--color-warning-strong": isDark ? "#f6df8e" : "#7a4f00",
    "--color-warning-soft": "var(--unl-gold-soft)",
    "--color-danger": "var(--unl-red)",
    "--color-danger-strong": "var(--unl-red-strong)",
    "--color-danger-soft": "var(--unl-red-soft)",
    "--color-info": "var(--unl-blue)",
    "--color-info-strong": isDark ? "#cbeafe" : "var(--color-primary-strong)",
    "--color-info-soft": "var(--unl-blue-soft)",
    "--color-chart-1": "var(--unl-red)",
    "--color-chart-2": "var(--unl-gold)",
    "--color-chart-3": "var(--unl-blue)",
    "--color-chart-4": "var(--unl-green)",
    "--color-chart-5": "var(--color-primary-strong)",
    "--color-chart-6": "var(--color-accent-strong)",
    "--color-chart-7": isDark ? "#a78bfa" : "#7f6bb0",
    "--color-chart-8": isDark ? "#5eead4" : "#00a6a6",
    "--color-chart-9": isDark ? "#f1a85b" : "#8a6a20",
    "--color-chart-10": isDark ? "#b460a6" : "var(--unl-red-strong)",
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
      },
      keyframes: {
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
      addBase({
        ":root": withSemanticTokens(selectedColorTheme.light, "light"),
        "html.dark": withSemanticTokens(selectedColorTheme.dark, "dark"),
      });
    },
  ],
};

module.exports = config;
