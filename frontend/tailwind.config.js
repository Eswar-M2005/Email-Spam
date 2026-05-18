/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          900: '#070b14',
          800: '#0d1526',
          700: '#121e35',
          600: '#1a2a47',
          500: '#1e3355',
        },
        neon: {
          blue:   '#00d4ff',
          green:  '#00ff88',
          purple: '#b44fff',
          red:    '#ff4757',
          orange: '#ff9f43',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'slide-in':   'slideIn 0.4s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 5px #00d4ff40' },
          '100%': { boxShadow: '0 0 20px #00d4ff80, 0 0 40px #00d4ff30' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)',      opacity: 1 },
        },
        fadeIn: {
          '0%':   { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
