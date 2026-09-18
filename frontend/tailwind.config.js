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
        cyber: {
          950: '#060a12',
          900: '#0a0f1d',
          850: '#0e1526',
          800: '#141d33',
          700: '#1e2b4c',
          600: '#2b3d68',
        },
        neon: {
          blue: '#00f0ff',
          amber: '#f59e0b',
          red: '#ef4444',
          green: '#10b981',
          purple: '#a855f7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-beacon': 'glowBeacon 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glowBeacon: {
          '0%': { filter: 'drop-shadow(0 0 4px #ef4444)' },
          '100%': { filter: 'drop-shadow(0 0 16px #ff0055)' }
        }
      }
    },
  },
  plugins: [],
}
