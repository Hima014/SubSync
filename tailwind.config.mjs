/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#FAF8F2",
          50: "#FCFBF8",
          100: "#FAF8F2",
          200: "#F3EFE4",
          300: "#E9E3D3",
        },
        gold: {
          DEFAULT: "#C6A96B",
          50: "#FAF7F0",
          100: "#F4EEDB",
          200: "#E9DCB8",
          300: "#DEC995",
          400: "#D3B772",
          500: "#C6A96B",
          600: "#B39452",
          700: "#8F7641",
          800: "#6B5831",
          900: "#473B21",
        },
        charcoal: {
          DEFAULT: "#1A1A1A",
          muted: "#4A4A4A",
          soft: "#737373",
          light: "#A3A3A3",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F6F2",
          subtle: "#F0EFE9",
        },
        border: {
          DEFAULT: "#E5E2D9",
          dark: "#D1CDBF",
        },
        integrity: {
          passed: "#059669",
          "passed-bg": "#ECFDF5",
          "passed-border": "#A7F3D0",
          warning: "#D97706",
          "warning-bg": "#FFFBEB",
          "warning-border": "#FDE68A",
          critical: "#DC2626",
          "critical-bg": "#FEF2F2",
          "critical-border": "#FECACA",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        card: "0 4px 6px -1px rgba(26, 26, 26, 0.04), 0 2px 4px -2px rgba(26, 26, 26, 0.04)",
        dropdown: "0 10px 15px -3px rgba(26, 26, 26, 0.08), 0 4px 6px -4px rgba(26, 26, 26, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;

