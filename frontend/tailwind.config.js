/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vektor: {
          bg: '#0d0d0d',
          sidebar: '#0a0a0a',
          surface: '#141414',
          panel: '#171717',
          card: '#1a1a1a',
          cardHover: '#202020',
          border: '#27272a',
          borderSubtle: '#1f1f22',
          borderFocus: '#3f3f46',
          textMuted: '#94a3b8',
          textDim: '#71717a',
          textPrimary: '#f4f4f5',
          textSecondary: '#d4d4d8',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          danger: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
