import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          bg:         "#070b14",
          surface:    "#0c1322",
          surface2:   "#111b2e",
          surface3:   "#182640",
          border:     "#1b2844",
          borderGlow: "#2b3e66",
          green:      "#22c55e",
          "green-bright": "#4ade80",
          "green-dim":"#082415",
          "green-bd": "#166534",
          blue:       "#38bdf8",
          "blue-dim": "#0b1d38",
          purple:     "#a855f7",
          "purple-dim":"#1e123d",
          amber:      "#f59e0b",
          "amber-dim":"#261804",
          teal:       "#2dd4bf",
          "teal-dim": "#052320",
          red:        "#f87171",
          text:       "#f1f5f9",
          muted:      "#64748b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
