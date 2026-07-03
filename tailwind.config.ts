import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Scroll-driven page surface (animated via CSS vars by BackgroundFX).
        page: {
          bg: "var(--page-bg)",
          fg: "var(--page-fg)",
        },
        // Kalani brand — deep "PS2 loading screen" blues (used by the 3D blocks).
        kalani: {
          50: "#eef3ff",
          100: "#dce6ff",
          200: "#b9ccff",
          300: "#7aa0ff",
          400: "#4d7bff",
          500: "#2a5bff",
          600: "#1b3a8f",
          700: "#11204a",
          800: "#0b1226",
          900: "#070b16",
          950: "#04060f",
        },
        // Text ramp — cool, desaturated slate (replaces the old blue-white text).
        ink: {
          100: "#dce2ec",
          200: "#c2cad6",
          300: "#a3adbd",
          400: "#828d9e",
          500: "#6a7383",
        },
        // Signature accent — terracotta / clay.
        clay: {
          DEFAULT: "#c96f4c",
          light: "#d98a6a",
          dark: "#b05a39",
        },
        cream: "#ede7dc",
        glow: "#5cc8ff",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      maxWidth: {
        container: "84rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
