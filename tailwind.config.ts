import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Placeholder brand palette — swap once CaseWhy branding is finalized.
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2a78d6",
          600: "#1d5fb0",
          700: "#164a8a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
