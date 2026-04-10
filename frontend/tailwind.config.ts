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
        shell: "#ECE8E4",
        ink: "#28303C",
        paper: "#FFFFFF",
        mist: "#F6F2EE",
        plum: "#8A3FFC",
        plumSoft: "#A56DFF",
        graphite: "#434955",
        editorial: "#4B515D",
        apricot: "#F7A148",
        sand: "#F5E4CF",
        borderSoft: "rgba(40, 48, 60, 0.12)"
      },
      boxShadow: {
        card: "0 18px 40px rgba(34, 37, 43, 0.18)",
        float: "0 8px 24px rgba(138, 63, 252, 0.28)"
      },
      borderRadius: {
        shell: "32px"
      },
      fontFamily: {
        sans: ["Avenir Next", "Trebuchet MS", "ui-rounded", "sans-serif"]
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

