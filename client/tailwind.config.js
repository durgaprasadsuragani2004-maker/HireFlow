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
        // Theme starting tokens (White & Violet Palette)
        canvas: {
          DEFAULT: '#F5F6FA',
          alt: '#F8F8FC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F0F1F8',
          elevated: '#FFFFFF',
        },
        violet: {
          50: '#F8F7FF',
          100: '#EAE7FF', // Soft violet
          200: '#D6D1FD',
          300: '#B4A9FB',
          400: '#8B7CF6', // Secondary violet
          500: '#6C5CE7', // Primary violet
          600: '#5B4BD8',
          700: '#4B3CC0',
          800: '#3D30A0',
          900: '#2F247E',
          950: '#1E1559',
        },
        content: {
          primary: '#202033',   // Primary text
          secondary: '#68677D', // Secondary text
          muted: '#9E9EB3',     // Tertiary/placeholder
        },
        border: {
          subtle: '#E4E3EF',
          accent: '#8B7CF6',
        },
        status: {
          success: '#16A878',
          warning: '#E9A23B',
          error: '#E05260',
        },

        // Backward compatibility mappings so existing components automatically receive the white & violet theme
        dark: {
          app: '#F5F6FA',        // Light canvas background
          sidebar: '#FFFFFF',    // Pure white sidebar
          card: '#FFFFFF',       // White cards
          cardTop: '#FFFFFF',    // Card top sheen
          cardBottom: '#F8F8FC', // Subtle card gradient base
          elevated: '#FFFFFF',   // Floating dialogs & panels
          input: '#F8F8FC',      // Inset form input fields
          border: '#E4E3EF',     // Clean light border
          borderLight: '#F0F1F8',// Subtler border
          hover: '#F0F1F8',      // Row & card hover state
          text: '#202033',       // Primary high-contrast dark text
          muted: '#68677D',      // Secondary text
          dim: '#9E9EB3',        // Tertiary text / placeholders
        },
        brand: {
          50: '#F8F7FF',
          100: '#EAE7FF', // Soft violet
          200: '#D6D1FD',
          300: '#B4A9FB',
          400: '#8B7CF6', // Secondary violet
          500: '#6C5CE7', // Primary violet
          600: '#5B4BD8',
          700: '#4B3CC0',
          800: '#3D30A0',
          900: '#2F247E',
          950: '#1E1559',
        },
        teal: {
          400: '#20C997',
          500: '#16A878', // Success token
          600: '#0F875F',
        },
      },
      boxShadow: {
        // Base light shadows
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        'card': '0 2px 10px -2px rgba(108, 92, 231, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 28px -4px rgba(108, 92, 231, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
        'dropdown': '0 16px 36px -6px rgba(32, 32, 51, 0.12), 0 0 0 1px #E4E3EF',
        'glow-primary': '0 0 20px -3px rgba(108, 92, 231, 0.35)',
        'glow-violet': '0 0 24px -2px rgba(108, 92, 231, 0.25)',

        // Neumorphism in White & Violet (Soft raised surface & inset press)
        'neu-raised': '-2px -2px 6px rgba(255, 255, 255, 0.9), 3px 4px 8px rgba(32, 32, 51, 0.06), inset 0 1px 0 #FFFFFF',
        'neu-raised-hover': '-2px -2px 8px rgba(255, 255, 255, 1), 4px 6px 12px rgba(108, 92, 231, 0.12), inset 0 1px 0 #FFFFFF',
        'neu-pressed': 'inset 2px 2px 5px rgba(32, 32, 51, 0.08), inset -1px -1px 3px rgba(255, 255, 255, 0.8)',
        'neu-primary': '0 4px 14px 0 rgba(108, 92, 231, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
        'neu-primary-hover': '0 6px 20px 0 rgba(108, 92, 231, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
        'neu-primary-pressed': 'inset 2px 3px 6px rgba(0, 0, 0, 0.25), inset -1px -1px 2px rgba(255, 255, 255, 0.2)',

        // Skeuomorphism in White & Violet (Clean physical cards, recessed inputs)
        'skeuo-card': '0 2px 12px -2px rgba(108, 92, 231, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03), inset 0 1px 0 #FFFFFF',
        'skeuo-card-hover': '0 12px 28px -4px rgba(108, 92, 231, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.03), inset 0 1px 0 #FFFFFF',
        'skeuo-inset': 'inset 1px 2px 4px rgba(0, 0, 0, 0.04), 0 1px 0 rgba(255, 255, 255, 0.8)',
        'skeuo-inset-focus': 'inset 1px 2px 4px rgba(0, 0, 0, 0.03), 0 0 0 3px rgba(108, 92, 231, 0.18)',

        // Glassmorphism in White & Violet (Clean translucent white overlays)
        'glass-nav': '0 4px 20px 0 rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'glass-dropdown': '0 18px 40px -6px rgba(32, 32, 51, 0.12), 0 0 0 1px #E4E3EF',
        'glass-modal': '0 24px 60px -12px rgba(32, 32, 51, 0.18), inset 0 1px 0 #FFFFFF',
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F8F8FC 100%)',
        'card-elevated-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F4F5FB 100%)',
        'btn-primary-gradient': 'linear-gradient(180deg, #7C6CF0 0%, #6C5CE7 100%)',
        'btn-primary-hover-gradient': 'linear-gradient(180deg, #8B7CF6 0%, #6C5CE7 100%)',
        'btn-secondary-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F8F8FC 100%)',
        'btn-danger-gradient': 'linear-gradient(180deg, #EA5B69 0%, #E05260 100%)',
        'glass-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 248, 252, 0.90) 100%)',
      },
    },
  },
  plugins: [],
};
