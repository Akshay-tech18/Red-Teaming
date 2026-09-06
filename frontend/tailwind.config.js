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
        app: {
          bg: '#0a0e17',
          sidebar: '#0d121c',
          panel: '#101623',
          card: '#131b28',
          cardHover: '#162234',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(255, 255, 255, 0.05)',
        },
        brand: {
          blue: '#3b82f6',
          lightBlue: '#93c5fd',
          darkBlue: '#1d4ed8',
        },
        verdict: {
          safe: '#22c55e',
          blocked: '#14b8a6',
          leak: '#f59e0b',
          policy: '#ea580c',
          critical: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'icon-glow': '0 0 10px rgba(59, 130, 246, 0.45)',
        'icon-glow-subtle': '0 0 8px rgba(59, 130, 246, 0.3)',
        'panel': '0 2px 8px rgba(0, 0, 0, 0.35)',
        'alert-critical': '0 0 18px rgba(239, 68, 68, 0.25), inset 0 0 12px rgba(239, 68, 68, 0.1)',
        'alert-safe': '0 0 14px rgba(34, 197, 94, 0.2), inset 0 0 10px rgba(34, 197, 94, 0.06)',
        'card-p0': '0 0 16px rgba(239, 68, 68, 0.12), 0 4px 12px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        verdictPulse: {
          '0%': { transform: 'scale(1)', opacity: '0.8', filter: 'brightness(1.5)' },
          '30%': { transform: 'scale(1.02)', opacity: '1', filter: 'brightness(1.3)' },
          '100%': { transform: 'scale(1)', opacity: '1', filter: 'brightness(1)' },
        },
        streamIn: {
          '0%': { opacity: '0', transform: 'translateX(-6px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      },
      animation: {
        'verdict-flash': 'verdictPulse 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1',
        'stream-in': 'streamIn 0.2s ease-out forwards',
      }
    },
  },
  plugins: [],
}
