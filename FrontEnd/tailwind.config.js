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
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
        "primary-strong": "var(--color-primary-strong)",
        "primary-soft": "var(--color-primary-soft)",
        accent: "var(--color-accent)",
        "accent-strong": "var(--color-accent-strong)",
        "accent-soft": "var(--color-accent-soft)",
        unl: {
          blue: "var(--unl-blue)",
          green: "var(--unl-green)",
          gold: "var(--unl-gold)",
          red: "var(--unl-red)",
          graphite: "var(--unl-graphite)",
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
  plugins: [],
};

module.exports = config;