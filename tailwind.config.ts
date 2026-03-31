import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm monochrome palette — editorial / luxury beauty
        bg: "#FAFAF8",
        fg: "#1A1A1A",
        muted: "#6B6B6B",
        subtle: "#A0A0A0",
        line: "#EBEBEB",
        surface: "#F5F3F0",
        accent: {
          DEFAULT: "#C4A882",
          dark: "#8B7355",
          light: "#E8DDD0",
        },
        danger: "#D14D41",
        warning: "#DA8B2D",
        success: "#4A9C6D",
      },
      fontFamily: {
        sans: ["var(--font-be-vietnam)", "system-ui", "sans-serif"],
        serif: ["Georgia", "'Times New Roman'", "serif"],
      },
      fontSize: {
        "display": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "headline": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "title": ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "body": ["0.875rem", { lineHeight: "1.6" }],
        "caption": ["0.75rem", { lineHeight: "1.5" }],
        "micro": ["0.625rem", { lineHeight: "1.4", letterSpacing: "0.05em" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        "soft": "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
      },
      transitionDuration: {
        "250": "250ms",
      },
    },
  },
  plugins: [],
}
export default config
