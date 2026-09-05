import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        foreground: "var(--foreground)",
        muted: "var(--muted-foreground)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        // CaseWhy's blue UI accent — kept deliberately distinct from the green logo, see CLOUD_CLAUDE.md.
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#5b9eed",
          500: "#2a78d6",
          600: "#1d5fb0",
          700: "#164a8a",
          800: "#123b6e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
