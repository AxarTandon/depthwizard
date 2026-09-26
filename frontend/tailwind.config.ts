import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#080B0E",
        surface: {
          DEFAULT: "#0D1216",
          raised: "#111820",
          panel: "#0F151B",
        },
        line: {
          DEFAULT: "#1C2831",
          bright: "#2A3D49",
        },
        ink: {
          DEFAULT: "#DCE7ED",
          muted: "#8199A6",
          faint: "#4C6169",
        },
        signal: {
          cyan: "#48D3E6",
          deep: "#1C7A94",
          amber: "#E2A44E",
          green: "#4FCE93",
          red: "#E2634E",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-fine":
          "linear-gradient(to right, rgba(72,211,230,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(72,211,230,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        scan: "scan 6s linear infinite",
        fadeIn: "fadeIn 0.4s ease-out",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
