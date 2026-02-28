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
        bg: {
          primary: '#0f0f1a',
          card: '#1a1a2e',
          'card-hover': '#22223a',
        },
        text: {
          primary: '#e8e6e3',
          secondary: '#9a9a9a',
        },
        timeline: {
          line: '#2a2a3e',
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
