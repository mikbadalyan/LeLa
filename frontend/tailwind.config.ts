import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        shell: "rgb(var(--shell-rgb) / <alpha-value>)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        paper: "rgb(var(--paper-rgb) / <alpha-value>)",
        mist: "rgb(var(--mist-rgb) / <alpha-value>)",
        plum: "rgb(var(--plum-rgb) / <alpha-value>)",
        plumSoft: "rgb(var(--plum-soft-rgb) / <alpha-value>)",
        graphite: "rgb(var(--graphite-rgb) / <alpha-value>)",
        editorial: "rgb(var(--editorial-rgb) / <alpha-value>)",
        apricot: "rgb(var(--apricot-rgb) / <alpha-value>)",
        sand: "rgb(var(--sand-rgb) / <alpha-value>)",
        borderSoft: "rgb(var(--border-soft-rgb) / <alpha-value>)"
      },
      boxShadow: {
        card: "0 18px 40px rgba(34, 37, 43, 0.18)",
        float: "0 8px 24px rgba(138, 63, 252, 0.28)"
      },
      borderRadius: {
        shell: "32px"
      },
      fontFamily: {
        sans: ["Avenir Next", "Trebuchet MS", "ui-rounded", "sans-serif"],
        display: ["Avenir Next", "Trebuchet MS", "ui-rounded", "sans-serif"]
      },
      backgroundImage: {
        halo:
          "radial-gradient(circle at top, rgba(255,255,255,0.8), rgba(255,255,255,0) 40%), linear-gradient(180deg, #f2ece6 0%, #e9e1d9 100%)"
      }
    }
  },
  plugins: []
};

export default config;
