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
          50: '#f4f7f0',
          100: '#e8f1dc',
          200: '#d4e6c3',
          300: '#bfd9a9',
          400: '#a8cc8f',
          500: '#87AA6A', // Light forest green
          600: '#6d8a55',
          700: '#BC6A1B', // Light bark brown
          800: '#602718', // Dark bark brown
          900: '#3e1810',
        },
        forest: {
          50: '#f4f7f0',
          100: '#e8f1dc',
          200: '#d4e6c3',
          300: '#bfd9a9',
          400: '#a8cc8f',
          500: '#87AA6A', // Light forest green
          600: '#738555',
          700: '#66732C', // Medium forest green
          800: '#535925', // Dark forest green
          900: '#3e4219',
        },
        brown: {
          50: '#fef9f5',
          100: '#fdf4ed',
          200: '#fbe8d9',
          300: '#f7d4c0',
          400: '#f2b794',
          500: '#BC6A1B', // Light bark brown
          600: '#a55e18',
          700: '#8e5115',
          800: '#774413',
          900: '#602718', // Dark bark brown
        },
        cream: {
          50: '#fef9f5',
          100: '#fdf4ed',
          200: '#fbe8d9',
          300: '#f7d4c0',
          400: '#f2b794',
          500: '#ed9668',
          600: '#e8814c',
          700: '#d66e33',
          800: '#bc5d2b',
          900: '#9d4e25',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-crimson)', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        soft: '0 4px 20px rgba(188, 106, 27, 0.1)',
        warm: '0 8px 30px rgba(188, 106, 27, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
