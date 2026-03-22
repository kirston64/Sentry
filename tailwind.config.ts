import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#1e1e1e",
        surface: "#252526",
        "surface-hover": "#2a2d2e",
        border: "#3e3e42",
        "border-focus": "#007fd4",
        primary: "#007fd4",
        "primary-hover": "#1a8fe8",
        accent: "#4ec9b0",
        warning: "#dcdcaa",
        error: "#f44747",
        success: "#6a9955",
        "text-primary": "#d4d4d4",
        "text-secondary": "#808080",
        "text-muted": "#5a5a5a",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
