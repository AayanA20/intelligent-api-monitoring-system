/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      
      // Background colors - LIGHT THEME
      bg: {
        DEFAULT: '#f8fafc',
        soft: '#f1f5f9',
        card: '#ffffff',
        hover: '#f0f4f8',
        border: '#e2e8f0',
      },
      
      // Brand color - TEAL
      brand: {
        DEFAULT: '#0891b2',
        hover: '#0e7490',
        light: '#06b6d4',
        pale: '#cffafe',
        dark: '#164e63',
      },
      
      // Text colors
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
        muted: '#94a3b8',
      },
      
      // Status colors
      success: {
        DEFAULT: '#10b981',
        light: '#d1fae5',
        dark: '#047857',
      },
      
      warn: {
        DEFAULT: '#f59e0b',
        light: '#fef3c7',
        dark: '#d97706',
      },
      
      danger: {
        DEFAULT: '#ef4444',
        light: '#fee2e2',
        dark: '#dc2626',
      },
      
      info: {
        DEFAULT: '#3b82f6',
        light: '#dbeafe',
        dark: '#1d4ed8',
      },
      
      // Slate grays
      slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['Fira Code', 'Menlo', 'monospace'],
    },
    extend: {
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.08)',
        'sm': '0 2px 6px 0 rgb(0 0 0 / 0.08)',
        'base': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
        'md': '0 6px 16px 0 rgb(0 0 0 / 0.1)',
        'lg': '0 10px 24px 0 rgb(0 0 0 / 0.1)',
        'glow': '0 0 20px 0 rgb(6 182 212 / 0.3)',
      },
      animation: {
        'pulse-soft': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}