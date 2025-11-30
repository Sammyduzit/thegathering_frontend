import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./tests/**/*.{js,ts,jsx,tsx}",
    "./docs/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        night: "var(--color-bg-night)",
        panel: "var(--color-bg-panel)",
        "panel-hover": "var(--color-bg-panel-hover)",
        "surface-soft": "var(--color-bg-surface-soft)",
        "surface-deep": "var(--color-bg-surface)",
        notice: "var(--color-bg-notice)",
        "rose-veil": "var(--color-bg-rose)",
        "aurora-haze": "var(--color-bg-aurora)",
        "ai-glow": "var(--color-bg-ai)",
        "text-primary": "var(--color-text-primary)",
        "text-muted": "var(--color-text-muted)",
        "text-subtle": "var(--color-text-subtle)",
        "text-faint": "var(--color-text-faint)",
        "text-aurora": "var(--color-text-aurora)",
        "text-soft": "var(--color-text-soft)",
        "text-rose": "var(--color-text-rose)",
        "border-panel": "var(--color-border-panel)",
        "border-panel-strong": "var(--color-border-panel-strong)",
        "border-aurora": "var(--color-border-aurora)",
        "border-ai": "var(--color-border-ai)",
        "border-rose": "var(--color-border-rose)",
        "border-mist": "var(--color-border-mist)",
        "border-mist-strong": "var(--color-border-mist-strong)",
        aurora: {
          start: "var(--color-accent-aurora-start)",
          mid: "var(--color-accent-aurora-mid)",
          end: "var(--color-accent-aurora-end)",
        },
        gold: {
          DEFAULT: "var(--color-accent-gold)",
          soft: "var(--color-accent-gold-soft)",
        },
        ai: "var(--color-accent-ai)",
      },
      boxShadow: {
        panel: "var(--panel-shadow)",
      },
      backdropBlur: {
        22: "22px",
      },
    },
  },
  plugins: [],
};

export default config;
