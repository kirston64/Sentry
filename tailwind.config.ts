import type { Config } from "tailwindcss";

function withOpacity(varName: string) {
  return `rgb(var(${varName}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: withOpacity("--color-background"),
        bg: withOpacity("--color-background"),
        surface: withOpacity("--color-surface"),
        "surface-hover": withOpacity("--color-surface-hover"),
        border: withOpacity("--color-border"),
        "border-focus": withOpacity("--color-border-focus"),
        primary: withOpacity("--color-primary"),
        "primary-hover": withOpacity("--color-primary-hover"),
        accent: withOpacity("--color-accent"),
        warning: withOpacity("--color-warning"),
        error: withOpacity("--color-error"),
        success: withOpacity("--color-success"),
        "text-primary": withOpacity("--color-text-primary"),
        "text-secondary": withOpacity("--color-text-secondary"),
        "text-muted": withOpacity("--color-text-muted"),
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
