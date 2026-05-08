import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3b82f6",
          glow: "rgba(59, 130, 246, 0.5)",
        },
        secondary: {
          DEFAULT: "#818cf8",
          glow: "rgba(129, 140, 248, 0.5)",
        },
        background: "#030712",
        surface: {
          DEFAULT: "rgba(17, 24, 39, 0.7)",
          border: "rgba(255, 255, 255, 0.08)",
        },
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
        muted: "#9ca3af",
      },
    },
  },
  plugins: [],
};
export default config;
