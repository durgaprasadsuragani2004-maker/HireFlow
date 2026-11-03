/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/providers/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          app: '#0B1120',      // main background
          sidebar: '#080D19',  // sidebar & top navbar
          card: '#151F32',     // cards, panels, table headers
          elevated: '#1C2940', // dialogs, popovers, dropdowns
          input: '#101726',    // inputs
          border: '#2B3950',   // borders
          hover: '#1B273F',    // hover state on cards/rows
          text: '#F1F5F9',     // main text
          muted: '#A1AEC2',    // secondary text
          dim: '#64748B',      // tertiary/placeholder
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // vivid indigo
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.35), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 4px 10px -2px rgba(99, 102, 241, 0.15)',
        'dropdown': '0 16px 36px -6px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(43, 57, 80, 0.8)',
        'glow-primary': '0 0 20px -3px rgba(99, 102, 241, 0.35)',
        'glow-teal': '0 0 20px -3px rgba(20, 184, 166, 0.35)',
      },
    },
  },
  plugins: [],
};
