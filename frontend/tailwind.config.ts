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
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        paper: "rgb(var(--paper-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        elevated: "rgb(var(--elevated-rgb) / <alpha-value>)",
        mist: "rgb(var(--mist-rgb) / <alpha-value>)",
        plum: "rgb(var(--plum-rgb) / <alpha-value>)",
        plumSoft: "rgb(var(--plum-soft-rgb) / <alpha-value>)",
        blue: "rgb(var(--blue-rgb) / <alpha-value>)",
        blueSoft: "rgb(var(--blue-soft-rgb) / <alpha-value>)",
        graphite: "rgb(var(--graphite-rgb) / <alpha-value>)",
        editorial: "rgb(var(--editorial-rgb) / <alpha-value>)",
        apricot: "rgb(var(--apricot-rgb) / <alpha-value>)",
        sand: "rgb(var(--sand-rgb) / <alpha-value>)",
        borderSoft: "rgb(var(--border-soft-rgb) / <alpha-value>)",
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)"
      },
      boxShadow: {
        card: "0 18px 46px rgba(35, 37, 43, 0.12)",
        soft: "0 10px 28px rgba(35, 37, 43, 0.08)",
        float: "0 12px 30px rgba(118, 67, 166, 0.24)",
        blue: "0 12px 28px rgba(51, 101, 200, 0.24)"
      },
      borderRadius: {
        shell: "32px",
        card: "28px",
        control: "18px"
      },
      fontFamily: {
        sans: ["Avenir Next", "Trebuchet MS", "ui-rounded", "sans-serif"],
        display: ["Avenir Next", "Trebuchet MS", "ui-rounded", "sans-serif"]
      },
      backgroundImage: {
        halo:
          "radial-gradient(circle at top, rgba(255,255,255,0.72), rgba(255,255,255,0) 42%), linear-gradient(180deg, #E9E9E9 0%, #E9E9E9 100%)"
      }
    }
  },
  plugins: []
};

export default config;
