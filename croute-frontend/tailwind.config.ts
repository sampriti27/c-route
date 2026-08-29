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
        display: ["Syne", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          bg:         "#080c18",
          surface:    "#0f1520",
          surface2:   "#141c2e",
          border:     "#1e2a40",
          green:      "#4ade80",
          "green-dim":"#0a2016",
          "green-bd": "#165a30",
          blue:       "#60a5fa",
          "blue-dim": "#0b1838",
          purple:     "#a78bfa",
          "purple-dim":"#1a0f35",
          amber:      "#fbbf24",
          "amber-dim":"#1c1100",
          teal:       "#2dd4bf",
          "teal-dim": "#04201e",
          red:        "#f87171",
          text:       "#dde4f0",
          muted:      "#546070",
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
