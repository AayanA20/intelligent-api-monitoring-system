/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Menlo', 'monospace'],
      },
      colors: {
        // ── Modern Light/Clean Palette ────────────────────────────────────
        bg: {
          DEFAULT: '#f8fafc',          // off-white
          soft:    '#f1f5f9',          // very light gray
          card:    '#ffffff',          // pure white cards
          hover:   '#f0f4f8',          // subtle hover
          border:  '#e2e8f0',          // light borders
        },
        brand: {
          DEFAULT: '#0891b2',          // cyan-600 (teal)
          hover:   '#0e7490',          // darker teal
          light:   '#06b6d4',          // bright cyan
          pale:    '#cffafe',          // very light cyan
          dark:    '#164e63',          // deep teal
        },
        // ── Semantic Colors ───────────────────────────────────────────────
        success: {
          DEFAULT: '#10b981',          // emerald
          light:   '#d1fae5',
          dark:    '#047857',
        },
        warn: {
          DEFAULT: '#f59e0b',          // amber
          light:   '#fef3c7',
          dark:    '#d97706',
        },
        danger: {
          DEFAULT: '#ef4444',          // red
          light:   '#fee2e2',
          dark:    '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',          // blue
          light:   '#dbeafe',
          dark:    '#1d4ed8',
        },
        // ── Text Colors ───────────────────────────────────────────────────
        text: {
          primary:   '#1e293b',        // dark slate
          secondary: '#64748b',        // medium slate
          muted:     '#94a3b8',        // light slate
        },
      },
      boxShadow: {
        'soft':     '0 1px 3px 0 rgb(0 0 0 / 0.08)',
        'sm':       '0 2px 6px 0 rgb(0 0 0 / 0.08)',
        'base':     '0 4px 12px 0 rgb(0 0 0 / 0.08)',
        'md':       '0 6px 16px 0 rgb(0 0 0 / 0.1)',
        'lg':       '0 10px 24px 0 rgb(0 0 0 / 0.1)',
        'glow':     '0 0 20px 0 rgb(6 182 212 / 0.3)',
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