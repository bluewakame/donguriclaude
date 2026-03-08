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
        // どんぐりアプリのメインカラー
        primary: {
          DEFAULT: "#4CAF82",
          dark: "#2E5F4A",
          light: "#7DD4A8",
        },
        acorn: {
          brown: "#8B5E3C",
          gold: "#FFD700",
        },
      },
      fontFamily: {
        sans: [
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Noto Sans JP",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
